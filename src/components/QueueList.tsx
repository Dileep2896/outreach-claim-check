import type { CheckResult, Draft, Lead, Verdict } from "@/lib/types";
import { MESSAGE_TYPE_LABELS } from "@/lib/types";
import { VerdictPill } from "./VerdictPill";
import styles from "./queue.module.css";

export type Filter = "all" | Verdict;
export type QueueEntry = { draft: Draft; lead: Lead; check: CheckResult; state: "queue" | "approved" | "skipped" };

export function QueueList({
  entries, sent, selectedId, filter, counts, onSelect, onFilter,
}: {
  entries: QueueEntry[];
  sent: QueueEntry[];
  selectedId: string | undefined;
  filter: Filter;
  counts: Record<Filter, number>;
  onSelect: (id: string) => void;
  onFilter: (f: Filter) => void;
}) {
  const FILTERS: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "blocked", label: "Blocked" },
    { id: "review", label: "Review" },
    { id: "ready", label: "Ready" },
  ];
  return (
    <nav className={styles.queue} aria-label="Morning queue">
      <div className={styles.filters} role="group" aria-label="Filter queue">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" aria-pressed={filter === f.id} className={styles.filterBtn} onClick={() => onFilter(f.id)}>
            {f.label} <span className={styles.filterCount}>{counts[f.id]}</span>
          </button>
        ))}
      </div>
      <ul className={styles.queueList} aria-label="Queue">
        {entries.map((e) => (
          <li key={e.draft.id}>
            <button
              type="button"
              className={styles.queueItem}
              aria-current={e.draft.id === selectedId ? "true" : undefined}
              onClick={() => onSelect(e.draft.id)}
            >
              <span className={styles.queueTop}>
                <span className={styles.queueCompany}>{e.lead.company}</span>
                <VerdictPill verdict={e.check.verdict} size="sm" />
              </span>
              <span className={styles.queueMeta}>
                {MESSAGE_TYPE_LABELS[e.draft.messageType]} · {e.check.readiness}% grounded
              </span>
            </button>
          </li>
        ))}
        {entries.length === 0 && <li className={styles.muted}>Nothing here. Nice.</li>}
      </ul>
      <h3 className={styles.panelTitle}>Sent (simulated)</h3>
      <ul className={styles.sentList} aria-label="Sent (simulated)">
        {sent.map((e) => (
          <li key={e.draft.id} className={styles.sentItem}>
            <span>{e.lead.company}</span>
            <span className={styles.muted}>{e.state === "approved" ? "sent" : "skipped"}</span>
          </li>
        ))}
        {sent.length === 0 && <li className={styles.muted}>Approve a draft with <kbd>a</kbd>.</li>}
      </ul>
    </nav>
  );
}
