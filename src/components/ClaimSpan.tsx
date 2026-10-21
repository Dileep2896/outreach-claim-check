import type { CheckedClaim, GroundingStatus } from "@/lib/types";
import styles from "./queue.module.css";

export const STATUS_LABEL: Record<GroundingStatus, string> = { verified: "Verified", guess: "Guess", unsupported: "Unsupported" };
export const STATUS_ICON: Record<GroundingStatus, string> = { verified: "✓", guess: "?", unsupported: "!" };

export function ClaimSpan({ claim, focused, onFocus }: { claim: CheckedClaim; focused: boolean; onFocus: (id: string) => void }) {
  const status = claim.grounding.status;
  return (
    <button
      type="button"
      className={`${styles.claim} ${styles[`claim_${status}`]} ${focused ? styles.claimFocused : ""}`}
      data-status={status}
      aria-pressed={focused}
      aria-label={`${STATUS_LABEL[status]} claim: ${claim.text}`}
      onClick={() => onFocus(claim.id)}
    >
      <span className={styles.claimIcon} aria-hidden>{STATUS_ICON[status]}</span>
      {claim.text}
    </button>
  );
}
