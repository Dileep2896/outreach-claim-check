"use client";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { motionTokens, springs } from "@/lib/motion-tokens";
import { Reveal } from "./shared";
import styles from "../story.module.css";

type Status = "verified" | "guess" | "unsupported";
const ROW_H = 76;
const ROWS: { claim: string; fixed?: string; status: Status; fact: string; source: string; to: number }[] = [
  { claim: "Congrats on opening your third café in Berkeley.", fixed: "Congrats on the new Alameda spot on Park Street.", status: "unsupported", fact: "Opened a second location in Alameda on Park Street", source: "Instagram · Oct 2", to: 0 },
  { claim: "I read in Oaklandside that you want more local suppliers.", status: "verified", fact: "Owner said she wants more local suppliers", source: "Oaklandside · Aug 14", to: 1 },
  { claim: "Looks like you buy from a central kitchen today.", status: "guess", fact: "Likely buys from a commissary kitchen", source: "Yelp photos · guess", to: 2 },
];
const LABEL: Record<Status, string> = { verified: "✓ Verified", guess: "? Guess", unsupported: "! Unsupported" };
const FINAL = 5;

/** Animated before → after: connectors draw, pills land, the Swap cursor clicks, the verdict flips. */
export function HowItWorks() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.45 });
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) { setStage(FINAL); return; }
    const timers = [1, 2, 3, 4, 5].map((s, i) => setTimeout(() => setStage(s), [200, 1300, 2300, 3200, 3800][i]));
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce]);

  const swapped = stage >= 4;
  const verdict = stage >= FINAL ? "ready" : "blocked";

  return (
    <section className={`${styles.section} ${styles.tint}`} aria-labelledby="story-how">
      <div className={styles.inner}>
        <Reveal>
          <p className={styles.eyebrow}>04 · How it works</p>
          <h2 id="story-how" className={styles.h2}>Every claim gets a source, or a red flag.</h2>
        </Reveal>
        <div ref={ref} className={styles.diagram}>
          <div className={styles.diagramCol}>
            <p className={styles.colTitle}>Draft</p>
            {ROWS.map((r, i) => {
              const status: Status = i === 0 && swapped ? "verified" : r.status;
              return (
                <div key={i} className={styles.dRow} style={{ height: ROW_H }}>
                  <motion.p layout className={`${styles.dClaim} ${stage >= 2 ? styles[`d_${status}`] : ""}`}>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={i === 0 && swapped ? "fixed" : "orig"}
                        initial={{ opacity: 0, y: reduce ? 0 : 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: reduce ? 0 : -6 }}
                        transition={{ duration: motionTokens.duration.normal }}
                      >
                        {i === 0 && swapped ? r.fixed : r.claim}
                      </motion.span>
                    </AnimatePresence>
                  </motion.p>
                  <AnimatePresence>
                    {stage >= 2 && (
                      <motion.span
                        key={status}
                        className={`${styles.dPill} ${styles[`p_${status}`]}`}
                        initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
                        transition={springs.bouncy}
                      >
                        {LABEL[status]}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <svg className={styles.connectors} viewBox={`0 0 120 ${ROW_H * ROWS.length}`} preserveAspectRatio="none" aria-hidden>
            {ROWS.map((r, i) => {
              const y1 = i * ROW_H + ROW_H / 2;
              const y2 = r.to * ROW_H + ROW_H / 2;
              const status: Status = i === 0 && swapped ? "verified" : r.status;
              return (
                <motion.path
                  key={i}
                  d={`M0 ${y1} C 60 ${y1}, 60 ${y2}, 120 ${y2}`}
                  className={`${styles.wire} ${styles[`w_${status}`]}`}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: stage >= 1 ? 1 : 0 }}
                  transition={{ duration: reduce ? 0 : 0.9, delay: reduce ? 0 : i * motionTokens.stagger.normal, ease: motionTokens.easing.smooth }}
                />
              );
            })}
          </svg>

          <div className={styles.diagramCol}>
            <p className={styles.colTitle}>Research card</p>
            {ROWS.map((r, i) => (
              <div key={i} className={styles.dRow} style={{ height: ROW_H }}>
                <div className={styles.dFact}>
                  <span>{r.fact}</span>
                  <small>{r.source}</small>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.diagramFoot}>
            <div className={styles.swapWrap}>
              <span className={`${styles.swapBtn} ${stage === 3 ? styles.swapPressed : ""}`}>2 · Swap</span>
              <AnimatePresence>
                {stage >= 3 && stage < FINAL && !reduce && (
                  <motion.span
                    key="cursor"
                    className={styles.cursor}
                    initial={{ opacity: 0, x: 80, y: 40 }}
                    animate={{ opacity: 1, x: 18, y: 10 }}
                    exit={{ opacity: 0 }}
                    transition={springs.gentle}
                    aria-hidden
                  >
                    ➤
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <p className={styles.mismatch}>
              {swapped ? "Now grounded in the Instagram post from Oct 2." : "third ≠ second · Berkeley ≠ Alameda"}
            </p>
            <AnimatePresence mode="wait">
              <motion.span
                key={verdict}
                className={`${styles.bigVerdict} ${styles[`v_${verdict}`]}`}
                initial={{ opacity: 0, scale: reduce ? 1 : 0.5, rotate: reduce ? 0 : -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: reduce ? 1 : 0.5 }}
                transition={springs.bouncy}
              >
                {verdict === "ready" ? "✓ Ready" : "! Blocked"}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
        <p className={styles.footnote}>
          Same engine as the demo: claims are extracted by rules, grounded by token overlap plus number, ordinal, city and
          name agreement. An invented &ldquo;4.9 stars&rdquo; against a card that says 4.6 is blocked the same way.
        </p>
      </div>
    </section>
  );
}
