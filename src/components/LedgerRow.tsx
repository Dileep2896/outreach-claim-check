"use client";
import { motion, useReducedMotion } from "motion/react";
import { AUTO_SEND_MIN_RATE, AUTO_SEND_MIN_SENT, type LedgerRow as Row } from "@/lib/ledger";
import { motionTokens } from "@/lib/motion-tokens";
import styles from "./ledger.module.css";

export function LedgerRow({ row }: { row: Row }) {
  const reduce = useReducedMotion();
  const pct = Math.round(row.cleanRate * 100);
  const tone = row.eligible ? styles.good : row.cleanRate >= 0.85 ? styles.close : styles.far;
  return (
    <li className={styles.row}>
      <div className={styles.rowHead}>
        <div>
          <h2 className={styles.rowTitle}>{row.label}</h2>
          <p className={styles.rowMeta}>
            {row.cleanSent} of {row.sent} sent with 0 unsupported claims · {row.skipped} skipped
          </p>
        </div>
        <div className={styles.rowRight}>
          <span className={styles.rate}>{pct}%</span>
          {row.eligible ? (
            <span className={styles.badge}>Auto-send eligible</span>
          ) : (
            <span className={styles.need}>
              {row.cleanSendsToEligible === Infinity ? "Not reachable" : `${row.cleanSendsToEligible} more clean sends`}
            </span>
          )}
        </div>
      </div>
      <div
        className={styles.track}
        role="meter"
        aria-label={`${row.label} clean rate`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <motion.div
          className={`${styles.fill} ${tone}`}
          initial={{ scaleX: reduce ? row.cleanRate : 0 }}
          animate={{ scaleX: row.cleanRate }}
          transition={{ duration: reduce ? 0 : motionTokens.duration.story, ease: motionTokens.easing.smooth }}
        />
        <span className={styles.threshold} style={{ left: `${AUTO_SEND_MIN_RATE * 100}%` }} aria-hidden>
          <span>{AUTO_SEND_MIN_RATE * 100}%</span>
        </span>
      </div>
      <p className={styles.volume}>
        Volume {Math.min(row.sent, AUTO_SEND_MIN_SENT)}/{AUTO_SEND_MIN_SENT} sends {row.sent >= AUTO_SEND_MIN_SENT ? "✓" : ""}
      </p>
    </li>
  );
}
