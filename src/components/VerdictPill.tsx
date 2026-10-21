import type { Verdict } from "@/lib/types";
import styles from "./queue.module.css";

const LABEL: Record<Verdict, string> = { ready: "Ready", review: "Review", blocked: "Blocked" };
const ICON: Record<Verdict, string> = { ready: "✓", review: "?", blocked: "!" };

export function VerdictPill({ verdict, readiness, size = "md" }: { verdict: Verdict; readiness?: number; size?: "sm" | "md" }) {
  return (
    <span className={`${styles.pill} ${styles[`pill_${verdict}`]} ${size === "sm" ? styles.pillSm : ""}`} data-verdict={verdict}>
      <span aria-hidden className={styles.pillIcon}>{ICON[verdict]}</span>
      <span>{LABEL[verdict]}</span>
      {readiness !== undefined && <span className={styles.pillScore}>{readiness}%</span>}
    </span>
  );
}
