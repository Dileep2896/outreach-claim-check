"use client";
import { motion, useReducedMotion } from "motion/react";
import { motionTokens } from "@/lib/motion-tokens";
import { Reveal } from "./shared";
import styles from "../story.module.css";

const STEPS = [
  { n: "1", title: "Extract", body: "Pulls every factual claim about the prospect out of the draft: names, numbers, dates, ordinals, ratings, cities, “congrats on…” cues. Greetings and the offer itself are skipped." },
  { n: "2", title: "Ground", body: "Matches each claim against the lead's research card. Verified = backed by a sourced fact. Guess = only an inference. Unsupported = no evidence or a hard conflict (“third” vs “second”)." },
  { n: "3", title: "Why now", body: "Checks that the draft names one recent, verified trigger and ties it to the offer, the one-sentence test for a good lead." },
  { n: "4", title: "Verdict", body: "Ready, Review or Blocked, plus advisory compliance chips (opt-out line, postal address, honest subject)." },
  { n: "5", title: "Fix in one key", body: "Soften turns a claim into a question, Swap replaces it with the closest verified fact, Remove drops it. All undoable." },
  { n: "6", title: "Safety ledger", body: "Tracks clean sends per message type. A type earns auto-send at 50+ sends with 95%+ sent clean." },
];

export function WhatItDoes() {
  const reduce = useReducedMotion();
  return (
    <section className={styles.section} aria-labelledby="story-what">
      <div className={styles.inner}>
        <Reveal>
          <p className={styles.eyebrow}>03 · What I built</p>
          <h2 id="story-what" className={styles.h2}>A fact-checker that sits between “drafted” and “sent”.</h2>
        </Reveal>
        <motion.ol
          className={styles.steps}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: reduce ? 0 : motionTokens.stagger.normal } } }}
        >
          {STEPS.map((s) => (
            <motion.li
              key={s.n}
              className={styles.step}
              variants={{ hidden: { opacity: 0, y: reduce ? 0 : motionTokens.distance.md }, visible: { opacity: 1, y: 0 } }}
            >
              <span className={styles.stepNum} aria-hidden>{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
