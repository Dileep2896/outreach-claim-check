"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { motionTokens, springs } from "@/lib/motion-tokens";
import styles from "./queue.module.css";

export type ToastItem = { id: number; text: string; tone: "ok" | "warn" | "info" };

export function Toasts({ toasts }: { toasts: ToastItem[] }) {
  const reduce = useReducedMotion();
  const offset = reduce ? 0 : motionTokens.distance.lg;
  return (
    <div className={styles.toasts} role="status" aria-live="polite">
      <AnimatePresence mode="sync">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            className={`${styles.toast} ${styles[`toast_${t.tone}`]}`}
            initial={{ opacity: 0, x: offset, scale: reduce ? 1 : motionTokens.scale.subtle }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: offset, scale: reduce ? 1 : motionTokens.scale.subtle }}
            transition={springs.snappy}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
