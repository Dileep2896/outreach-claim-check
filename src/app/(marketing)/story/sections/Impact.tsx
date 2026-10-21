"use client";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { motionTokens, springs } from "@/lib/motion-tokens";
import { CountUp, Reveal } from "./shared";
import styles from "../story.module.css";

export function Impact() {
  const reduce = useReducedMotion();
  return (
    <section className={`${styles.section} ${styles.dark}`} aria-labelledby="story-impact">
      <div className={styles.inner}>
        <Reveal>
          <p className={styles.eyebrow}>05 · Impact</p>
          <h2 id="story-impact" className={styles.h2}>Review in seconds. Then stop reviewing the safe ones.</h2>
        </Reveal>
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <p className={styles.metricLabel}>Review time per draft</p>
            <p className={styles.metricNum}><CountUp from={90} to={15} suffix="s" /></p>
            <p className={styles.metricNote}>from ~90s. Eyes go only to red and amber spans.</p>
          </div>
          <div className={styles.metric}>
            <p className={styles.metricLabel}>Unsupported claims sent</p>
            <p className={styles.metricNum}><CountUp from={8} to={0} /></p>
            <p className={styles.metricNote}>Blocked drafts can&apos;t slip through by accident.</p>
          </div>
          <div className={`${styles.metric} ${styles.metricWide}`}>
            <p className={styles.metricLabel}>Partner intro email · clean sends</p>
            <div className={styles.ledgerTrack}>
              <motion.div
                className={styles.ledgerFill}
                initial={{ scaleX: reduce ? 0.967 : 0 }}
                whileInView={{ scaleX: 0.967 }}
                viewport={{ once: true }}
                transition={{ duration: reduce ? 0 : motionTokens.duration.story * 1.5, ease: motionTokens.easing.smooth }}
              />
              <span className={styles.ledgerLine} aria-hidden><span>95%</span></span>
            </div>
            <div className={styles.ledgerFoot}>
              <span>58 of 60 sent clean</span>
              <motion.span
                className={styles.eligible}
                initial={{ opacity: 0, scale: reduce ? 1 : 0.4 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ ...springs.bouncy, delay: reduce ? 0 : 1.8 }}
              >
                Auto-send eligible
              </motion.span>
            </div>
          </div>
        </div>
        <p className={styles.metricLabel} style={{ marginTop: 40 }}>Measured: the engine run on the 8-draft demo queue</p>
        <div className={styles.measured}>
          <div className={styles.measuredCell}><strong>12</strong><span>claims extracted</span></div>
          <div className={styles.measuredCell}><strong>10 · 1 · 1</strong><span>verified · guess · unsupported</span></div>
          <div className={styles.measuredCell}><strong>5 · 2 · 1</strong><span>ready · review · blocked</span></div>
          <div className={styles.measuredCell}><strong>1 key</strong><span>to fix the blocked draft (Swap → Ready)</span></div>
        </div>
        <p className={styles.caveat}>Targets and estimates, not measured results: review time per draft and unsupported claims sent. The ledger and queue figures come from the demo&apos;s seed data.</p>
      </div>
    </section>
  );
}

export function Cta() {
  return (
    <section className={`${styles.section} ${styles.cta}`} aria-labelledby="story-cta">
      <div className={styles.inner}>
        <Reveal>
          <h2 id="story-cta" className={styles.h2}>Open the morning queue.</h2>
          <p className={styles.ctaSub}>8 drafts for Brightside Bakery. One is blocked. Fix it with one key.</p>
          <div className={styles.ctaRow}>
            <Link href="/today" className={styles.ctaBtn}>Try the queue →</Link>
            <Link href="/ledger" className={styles.ctaGhost}>See the ledger</Link>
            <a href="https://github.com/Dileep2896/outreach-claim-check" className={styles.ctaGhost}>GitHub repo</a>
          </div>
          <p className={styles.built}>Built with Claude Code · an independent open-source project</p>
        </Reveal>
      </div>
    </section>
  );
}
