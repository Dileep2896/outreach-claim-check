"use client";
import { motion, useReducedMotion } from "motion/react";
import { motionTokens, springs } from "@/lib/motion-tokens";
import { Reveal } from "./shared";
import styles from "../story.module.css";

const REASONS = ["Wrong personal details are the reason tools in this space keep a human in the loop", "Builds on the facts-vs-guesses research cards these tools already gather", "Earns auto-send per message type with a measurable safety record"];

export function Decision() {
  const reduce = useReducedMotion();
  return (
    <section className={styles.section} aria-labelledby="story-decision">
      <div className={styles.inner}>
        <Reveal>
          <p className={styles.eyebrow}>02 · The decision</p>
          <h2 id="story-decision" className={styles.h2}>Two ideas. One that fixes the real reason a human reviews every draft.</h2>
        </Reveal>
        <motion.div className={styles.options} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }}>
          <motion.article
            className={`${styles.option} ${styles.optionLoser}`}
            variants={{
              hidden: { opacity: 0, x: 0, scale: 1 },
              visible: {
                opacity: [0, 1, 0.45],
                x: [0, 0, reduce ? 0 : -24],
                scale: [1, 1, reduce ? 1 : 0.94],
                transition: { duration: reduce ? motionTokens.duration.normal : 1.8, times: [0, 0.35, 1], delay: 0.2 },
              },
            }}
          >
            <p className={styles.optionTag}>Option B</p>
            <h3>Compliance preflight</h3>
            <p>Opt-out line, postal address, honest subject, send caps.</p>
            <motion.p
              className={styles.verdictNote}
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 1.4 } } }}
            >
              Generic. Already solved by ESPs.
            </motion.p>
          </motion.article>
          <motion.article
            className={`${styles.option} ${styles.optionWinner}`}
            variants={{
              hidden: { opacity: 0, scale: reduce ? 1 : 0.96 },
              visible: { opacity: 1, scale: reduce ? 1 : 1.03, transition: { ...springs.gentle, delay: 1.0 } },
            }}
          >
            <p className={styles.optionTag}>Option A · chosen</p>
            <h3>Claim Check</h3>
            <p>Split each draft into claims, ground each one in the research card, give a verdict.</p>
            <motion.ul variants={{ hidden: {}, visible: { transition: { staggerChildren: motionTokens.stagger.normal, delayChildren: 1.5 } } }}>
              {REASONS.map((r) => (
                <motion.li key={r} variants={{ hidden: { opacity: 0, x: reduce ? 0 : 12 }, visible: { opacity: 1, x: 0 } }}>
                  <span aria-hidden>✓</span> {r}
                </motion.li>
              ))}
            </motion.ul>
          </motion.article>
        </motion.div>
        <Reveal className={styles.footnote}>The compliance checks still ship, as advisory chips inside the verdict.</Reveal>
      </div>
    </section>
  );
}
