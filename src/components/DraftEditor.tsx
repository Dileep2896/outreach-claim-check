"use client";
import { useEffect, useRef, useState } from "react";
import type { CheckResult } from "@/lib/types";
import { ClaimSpan } from "./ClaimSpan";
import styles from "./queue.module.css";

export const RECHECK_DEBOUNCE_MS = 250;

/** Renders the draft with claims underlined, or a textarea that re-runs the check 250ms after typing stops. */
export function DraftEditor({
  check, editing, focusedClaimId, onFocusClaim, onCommit, onExitEdit,
}: {
  check: CheckResult;
  editing: boolean;
  focusedClaimId: string | undefined;
  onFocusClaim: (id: string) => void;
  onCommit: (body: string) => void;
  onExitEdit: () => void;
}) {
  const [text, setText] = useState(check.body);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (!editing) setText(check.body); }, [check.body, editing]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  useEffect(() => {
    if (!editing || text === check.body) return;
    const t = setTimeout(() => onCommit(text), RECHECK_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [text, editing, check.body, onCommit]);

  if (editing) {
    return (
      <textarea
        ref={ref}
        className={styles.textarea}
        value={text}
        aria-label="Edit draft"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") { onCommit(text); onExitEdit(); } }}
        rows={14}
      />
    );
  }

  const parts: React.ReactNode[] = [];
  let at = 0;
  for (const c of check.claims) {
    if (c.span[0] > at) parts.push(check.body.slice(at, c.span[0]));
    parts.push(<ClaimSpan key={c.id} claim={c} focused={c.id === focusedClaimId} onFocus={onFocusClaim} />);
    at = c.span[1];
  }
  parts.push(check.body.slice(at));
  return <div className={styles.body}>{parts}</div>;
}
