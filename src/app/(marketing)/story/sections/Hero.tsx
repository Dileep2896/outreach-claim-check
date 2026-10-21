"use client";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { motionTokens, springs } from "@/lib/motion-tokens";
import styles from "../story.module.css";

const HEADLINE = "AI tools now write personalized sales outreach for small businesses, while they sleep.";
const CARDS = [
  { tag: "Lead", title: "Lakeshore Coffee Co.", note: "Opened a second location in Alameda" },
  { tag: "Draft", title: "Wholesale intro email", note: "“Congrats on the new spot…”" },
  { tag: "Post", title: "Instagram: Saturday croissants", note: "Branded, scheduled 9:00" },
  { tag: "Opportunity", title: "Art Walk afterparty, Nov 7", note: "150 guests need catering" },
];

export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const stackY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);
  const sunY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "30%"]);

  return (
    <section ref={ref} className={`${styles.section} ${styles.hero}`} aria-labelledby="story-hero">
      <motion.div
        className={styles.sunrise}
        aria-hidden
        style={{ y: sunY }}
        initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduce ? motionTokens.duration.normal : 2.2, ease: motionTokens.easing.smooth }}
      />
      <div className={styles.heroGrid}>
        <div>
          <motion.p className={styles.kicker} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: motionTokens.duration.slow }}>
            Fact-checking AI-personalized outreach · approve-before-send
          </motion.p>
          <h1 id="story-hero" className={styles.heroTitle} aria-label={HEADLINE}>
            {HEADLINE.split(" ").map((w, i) => (
              <motion.span
                key={i}
                aria-hidden
                className={styles.word}
                initial={{ opacity: 0, y: reduce ? 0 : "0.5em", filter: reduce ? "none" : "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.15 + i * motionTokens.stagger.normal, duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth }}
              >
                {w}{" "}
              </motion.span>
            ))}
          </h1>
          <motion.p
            className={styles.heroSub}
            initial={{ opacity: 0, y: reduce ? 0 : motionTokens.distance.md }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth }}
          >
            A typical AI sales assistant hands the owner one list each morning: leads, personalized drafts, posts and opportunities. The owner approves each one before anything is sent. This is the story of making that approval fast and safe.
          </motion.p>
        </div>
        <motion.ol className={styles.stack} style={{ y: stackY }} aria-label="This morning's list">
          {CARDS.map((c, i) => (
            <motion.li
              key={c.tag}
              className={styles.stackCard}
              style={{ zIndex: CARDS.length - i }}
              initial={{ opacity: 0, y: reduce ? 0 : 120, rotate: reduce ? 0 : -4 + i * 2 }}
              animate={{ opacity: 1, y: 0, rotate: reduce ? 0 : -3 + i * 2 }}
              transition={{ ...springs.gentle, delay: 0.5 + i * 0.1 }}
            >
              <span className={styles.stackTag}>{c.tag}</span>
              <strong>{c.title}</strong>
              <span className={styles.stackNote}>{c.note}</span>
            </motion.li>
          ))}
        </motion.ol>
      </div>
      <p className={styles.scrollHint} aria-hidden>Scroll ↓</p>
    </section>
  );
}
