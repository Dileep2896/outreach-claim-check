import type { CheckedClaim } from "@/lib/types";
import styles from "./queue.module.css";

export type FixKind = "soften" | "swap" | "remove";

const FIXES: { kind: FixKind; key: string; label: string; hint: string }[] = [
  { kind: "soften", key: "1", label: "Soften", hint: "Ask instead of assert" },
  { kind: "swap", key: "2", label: "Swap", hint: "Use the strongest verified fact" },
  { kind: "remove", key: "3", label: "Remove", hint: "Drop the claim" },
];

export function FixMenu({ claim, onFix }: { claim: CheckedClaim | undefined; onFix: (kind: FixKind) => void }) {
  if (!claim) return null;
  return (
    <div className={styles.fixes} role="group" aria-label="Fix the focused claim">
      {FIXES.map((f) => (
        <button key={f.kind} type="button" className={styles.fixBtn} onClick={() => onFix(f.kind)} title={f.hint}>
          <kbd>{f.key}</kbd> {f.label}
        </button>
      ))}
    </div>
  );
}
