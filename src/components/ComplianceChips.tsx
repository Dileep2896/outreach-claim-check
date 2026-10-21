import type { ComplianceChip } from "@/lib/types";
import styles from "./queue.module.css";

export function ComplianceChips({ chips }: { chips: ComplianceChip[] }) {
  return (
    <ul className={styles.chips} aria-label="Compliance checks">
      {chips.map((c) => {
        const state = c.pass === null ? "na" : c.pass ? "ok" : "bad";
        return (
          <li key={c.id} className={`${styles.chip} ${styles[`chip_${state}`]}`} title={c.detail}>
            <span aria-hidden>{state === "na" ? "–" : state === "ok" ? "✓" : "✕"}</span> {c.label}
            <span className="sr-only">: {state === "na" ? "not applicable" : state === "ok" ? "pass" : "fail"}. {c.detail}</span>
          </li>
        );
      })}
    </ul>
  );
}
