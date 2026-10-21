"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Business, CheckedClaim, Decision, Draft, Lead, ResearchCard } from "@/lib/types";
import { MESSAGE_TYPE_LABELS } from "@/lib/types";
import { runCheck } from "@/lib/check";
import { createHistory, pushHistory, remove, soften, swap, undo, type FixHistory } from "@/lib/fixes";
import { ledger } from "@/lib/ledger";
import { track } from "@/lib/analytics";
import { QueueList, type Filter, type QueueEntry } from "./QueueList";
import { DraftEditor } from "./DraftEditor";
import { EvidencePanel } from "./EvidencePanel";
import { FixMenu, type FixKind } from "./FixMenu";
import { ComplianceChips } from "./ComplianceChips";
import { VerdictPill } from "./VerdictPill";
import { Toasts, type ToastItem } from "./Toast";
import { KeyboardHelp } from "./KeyboardHelp";
import styles from "./queue.module.css";

export const SESSION_KEY = "claimcheck.decisions";
const SEVERITY = { blocked: 0, review: 1, ready: 2 } as const;

type Props = { business: Business; leads: Lead[]; cards: ResearchCard[]; drafts: Draft[]; history: Decision[]; today: string };

function defaultClaim(claims: CheckedClaim[]): CheckedClaim | undefined {
  return claims.find((c) => c.grounding.status === "unsupported") ?? claims.find((c) => c.grounding.status === "guess") ?? claims[0];
}

export function TodayApp({ business, leads, cards, drafts, history, today }: Props) {
  const [bodies, setBodies] = useState<Record<string, FixHistory>>(() =>
    Object.fromEntries(drafts.map((d) => [d.id, createHistory(d.body)])),
  );
  const [states, setStates] = useState<Record<string, QueueEntry["state"]>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string>();
  const [focused, setFocused] = useState<Record<string, string | undefined>>({});
  const [editing, setEditing] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const toastId = useRef(0);

  const cardFor = useCallback((leadId: string) => cards.find((c) => c.leadId === leadId)!, [cards]);

  const entries: QueueEntry[] = useMemo(() => {
    const leadById = new Map(leads.map((l) => [l.id, l]));
    return drafts
      .map((draft) => {
        const d = { ...draft, body: bodies[draft.id]?.present ?? draft.body };
        return { draft: d, lead: leadById.get(d.leadId)!, check: runCheck(d, cardFor(d.leadId), business, today), state: states[d.id] ?? "queue" };
      })
      .map((e, i) => ({ e, i }))
      .sort((a, b) => SEVERITY[a.e.check.verdict] - SEVERITY[b.e.check.verdict] || a.i - b.i)
      .map(({ e }) => e);
  }, [drafts, leads, bodies, states, business, today, cardFor]);

  // Freeze queue order while working so items don't jump when a fix changes their verdict.
  const orderRef = useRef<string[] | null>(null);
  if (orderRef.current === null) orderRef.current = entries.map((e) => e.draft.id);
  const ordered = orderRef.current.map((id) => entries.find((e) => e.draft.id === id)!);

  const inQueue = ordered.filter((e) => e.state === "queue");
  const visible = inQueue.filter((e) => filter === "all" || e.check.verdict === filter);
  const sent = ordered.filter((e) => e.state !== "queue");
  const counts: Record<Filter, number> = {
    all: inQueue.length,
    blocked: inQueue.filter((e) => e.check.verdict === "blocked").length,
    review: inQueue.filter((e) => e.check.verdict === "review").length,
    ready: inQueue.filter((e) => e.check.verdict === "ready").length,
  };
  const current = visible.find((e) => e.draft.id === selectedId) ?? visible[0];
  const focusedClaim = current
    ? current.check.claims.find((c) => c.id === focused[current.draft.id]) ?? defaultClaim(current.check.claims)
    : undefined;

  const toast = useCallback((text: string, tone: ToastItem["tone"] = "info") => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  useEffect(() => {
    if (current) track("draft_opened", { draftId: current.draft.id, verdict: current.check.verdict });
  }, [current?.draft.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitBody = useCallback((draftId: string, body: string) => {
    setBodies((b) => ({ ...b, [draftId]: pushHistory(b[draftId] ?? createHistory(body), body) }));
    setFocused((f) => ({ ...f, [draftId]: undefined }));
  }, []);

  const applyFix = (kind: FixKind) => {
    if (!current || !focusedClaim) return;
    const card = cardFor(current.draft.leadId);
    const next =
      kind === "soften" ? soften(current.draft, focusedClaim.id)
      : kind === "swap" ? swap(current.draft, focusedClaim.id, card, business)
      : remove(current.draft, focusedClaim.id);
    if (next.body === current.draft.body) return;
    commitBody(current.draft.id, next.body);
    const after = runCheck(next, card, business, today);
    track("claim_fixed", { draftId: current.draft.id, kind, verdict: after.verdict });
    toast(`${kind[0]!.toUpperCase()}${kind.slice(1)} applied. Verdict: ${after.verdict}.`, after.verdict === "ready" ? "ok" : "info");
  };

  const undoFix = () => {
    if (!current) return;
    const h = bodies[current.draft.id];
    if (!h || h.past.length === 0) return;
    setBodies((b) => ({ ...b, [current.draft.id]: undo(h) }));
    setFocused((f) => ({ ...f, [current.draft.id]: undefined }));
  };

  const decide = (action: "approved" | "skipped") => {
    if (!current) return;
    const idx = visible.indexOf(current);
    const nextEntry = visible[idx + 1] ?? visible[idx - 1];
    const decision: Decision = {
      draftId: current.draft.id,
      messageType: current.draft.messageType,
      decidedAt: today,
      action,
      unsupportedAtSend: current.check.counts.unsupported,
    };
    const all = [...history, ...decisions];
    const before = ledger(all).find((r) => r.messageType === decision.messageType);
    const after = ledger([...all, decision]).find((r) => r.messageType === decision.messageType);
    const nextDecisions = [...decisions, decision];
    setDecisions(nextDecisions);
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextDecisions)); } catch { /* storage unavailable */ }
    setStates((s) => ({ ...s, [current.draft.id]: action }));
    setSelectedId(nextEntry?.draft.id);
    setEditing(false);
    if (action === "approved") {
      track("draft_approved", { draftId: current.draft.id, verdict: current.check.verdict });
      const pct = (r?: { cleanRate: number }) => `${((r?.cleanRate ?? 0) * 100).toFixed(1)}%`;
      const label = MESSAGE_TYPE_LABELS[decision.messageType];
      toast(
        decision.unsupportedAtSend > 0
          ? `Approved with ${decision.unsupportedAtSend} unsupported claim. ${label}: ${pct(before)} → ${pct(after)} clean.`
          : `Approved ${current.lead.company}. ${label}: ${pct(before)} → ${pct(after)} clean.`,
        decision.unsupportedAtSend > 0 ? "warn" : "ok",
      );
    } else {
      track("draft_skipped", { draftId: current.draft.id });
      toast(`Skipped ${current.lead.company}.`);
    }
  };

  const move = (delta: number) => {
    if (visible.length === 0) return;
    const idx = Math.max(0, current ? visible.indexOf(current) : 0);
    const next = visible[(idx + delta + visible.length) % visible.length]!;
    setSelectedId(next.draft.id);
    setEditing(false);
  };

  const nextClaim = () => {
    if (!current || current.check.claims.length === 0) return;
    const claims = current.check.claims;
    const i = focusedClaim ? claims.indexOf(focusedClaim) : -1;
    setFocused((f) => ({ ...f, [current.draft.id]: claims[(i + 1) % claims.length]!.id }));
  };

  const actions = useRef({ move, decide, applyFix, undoFix, nextClaim, setEditing });
  actions.current = { move, decide, applyFix, undoFix, nextClaim, setEditing };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const a = actions.current;
      const map: Record<string, () => void> = {
        j: () => a.move(1), k: () => a.move(-1),
        a: () => a.decide("approved"), s: () => a.decide("skipped"),
        e: () => a.setEditing((v) => !v), n: () => a.nextClaim(), z: () => a.undoFix(),
        "1": () => a.applyFix("soften"), "2": () => a.applyFix("swap"), "3": () => a.applyFix("remove"),
      };
      const fn = map[e.key];
      if (fn) { e.preventDefault(); fn(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const canUndo = !!current && (bodies[current.draft.id]?.past.length ?? 0) > 0;

  return (
    <div className={styles.shell}>
      <QueueList
        entries={visible}
        sent={sent}
        selectedId={current?.draft.id}
        filter={filter}
        counts={counts}
        onSelect={(id) => { setSelectedId(id); setEditing(false); }}
        onFilter={setFilter}
      />

      {current ? (
        <>
          <section className={styles.draft} aria-label="Draft">
            <header className={styles.draftHead}>
              <div>
                <p className={styles.eyebrow}>{MESSAGE_TYPE_LABELS[current.draft.messageType]} · {current.draft.channel === "email" ? "Email" : "LinkedIn"}</p>
                <h2 className={styles.draftTitle}>{current.lead.company}</h2>
                <p className={styles.muted}>{current.lead.contactName}, {current.lead.contactRole} · {current.lead.city}</p>
              </div>
              <VerdictPill verdict={current.check.verdict} readiness={current.check.readiness} />
            </header>
            <p className={styles.reason}><strong>Why this lead:</strong> {current.lead.reason}</p>
            {current.draft.subject && <p className={styles.subject}><span className={styles.muted}>Subject</span> {current.draft.subject}</p>}
            <ComplianceChips chips={current.check.compliance} />

            <DraftEditor
              check={current.check}
              editing={editing}
              focusedClaimId={focusedClaim?.id}
              onFocusClaim={(id) => setFocused((f) => ({ ...f, [current.draft.id]: id }))}
              onCommit={(body) => commitBody(current.draft.id, body)}
              onExitEdit={() => setEditing(false)}
            />

            <div className={styles.toolbar}>
              <FixMenu claim={focusedClaim} onFix={applyFix} />
              <div className={styles.toolbarRight}>
                <button type="button" className={styles.ghostBtn} onClick={() => setEditing((v) => !v)}><kbd>e</kbd> {editing ? "Done" : "Edit"}</button>
                <button type="button" className={styles.ghostBtn} onClick={undoFix} disabled={!canUndo}><kbd>z</kbd> Undo</button>
              </div>
            </div>
            <div className={styles.decide}>
              <button type="button" className={styles.skipBtn} onClick={() => decide("skipped")}><kbd>s</kbd> Skip</button>
              <button type="button" className={`${styles.approveBtn} ${current.check.verdict !== "ready" ? styles.approveRisky : ""}`} onClick={() => decide("approved")}>
                <kbd>a</kbd> Approve{current.check.verdict === "blocked" ? " anyway" : ""}
              </button>
            </div>
            <KeyboardHelp />
          </section>
          <EvidencePanel claim={focusedClaim} card={cardFor(current.draft.leadId)} whyNow={current.check.whyNow} />
        </>
      ) : (
        <section className={styles.draft} aria-label="Draft">
          <h2 className={styles.draftTitle}>Queue clear</h2>
          <p className={styles.muted}>Every draft in this view has been decided. Check the <a href="/ledger">ledger</a> to see what moved.</p>
        </section>
      )}
      <Toasts toasts={toasts} />
    </div>
  );
}
