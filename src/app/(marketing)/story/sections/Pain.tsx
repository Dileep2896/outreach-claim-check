"use client";
import { motion, useReducedMotion } from "motion/react";
import { motionTokens } from "@/lib/motion-tokens";
import { CountUp, Reveal } from "./shared";
import styles from "../story.module.css";

const QUOTE = "One invented personal detail turns a warm intro into spam, and costs the owner trust they cannot buy back.";

export function Pain() {
  const reduce = useReducedMotion();
  return (
    <section className={`${styles.section} ${styles.dark}`} aria-labelledby="story-pain">
      <div className={styles.inner}>
        <Reveal>
          <p className={styles.eyebrow}>01 · The pain point</p>
          <h2 id="story-pain" className={styles.h2}>The bottleneck is the morning review. So is the risk.</h2>
        </Reveal>
        <div className={styles.painGrid}>
          <motion.div
            className={styles.mail}
            initial={{ opacity: 0, scale: reduce ? 1 : 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth }}
          >
            <p className={styles.mailHead}>To: Dana · Lakeshore Coffee Co.</p>
            <p className={styles.mailBody}>
              Hi Dana, <span className={styles.badSentence}>
                congrats on opening your third café in Berkeley.
                <svg className={styles.underline} viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden>
                  <motion.path
                    d="M2 8 C 40 2, 70 12, 110 6 S 180 2, 220 8 S 280 4, 298 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true, amount: 0.8 }}
                    transition={{ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : 0.6, ease: motionTokens.easing.smooth }}
                  />
                </svg>
              </span>{" "}
              We bake wholesale croissants every morning…
            </p>
            <p className={styles.mailNote}>The research card says: a <em>second</em> location, in <em>Alameda</em>.</p>
          </motion.div>
          <div className={styles.painSide}>
            <motion.blockquote
              className={styles.quote}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.6 }}
              variants={{ hidden: {}, visible: { transition: { staggerChildren: reduce ? 0 : motionTokens.stagger.tight, delayChildren: 0.3 } } }}
              aria-label={QUOTE}
            >
              {QUOTE.split(" ").map((w, i) => (
                <motion.span key={i} aria-hidden variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>{w} </motion.span>
              ))}
              <footer>What users of popular AI outreach tools keep reporting</footer>
            </motion.blockquote>
            <div className={styles.clock}>
              <svg viewBox="0 0 64 64" className={styles.clockFace} aria-hidden>
                <circle cx="32" cy="32" r="28" className={styles.clockTrack} />
                <motion.circle
                  cx="32" cy="32" r="28" className={styles.clockArc}
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: reduce ? 0 : 1.8, ease: "linear" }}
                />
              </svg>
              <p>
                <span className={styles.clockNum}><CountUp from={0} to={90} suffix="s" duration={1.8} /></span>
                <span className={styles.clockText}>per draft, eyeballing every “personal detail” × 8 drafts × every morning</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
