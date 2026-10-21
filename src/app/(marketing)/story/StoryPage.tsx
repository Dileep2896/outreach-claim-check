"use client";
import { motion, useScroll, useSpring } from "motion/react";
import { Hero } from "./sections/Hero";
import { Pain } from "./sections/Pain";
import { Decision } from "./sections/Decision";
import { HowItWorks } from "./sections/HowItWorks";
import { WhatItDoes } from "./sections/WhatItDoes";
import { Cta, Impact } from "./sections/Impact";
import styles from "./story.module.css";

export function StoryPage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <main className={styles.story}>
      <motion.div className={styles.progress} style={{ scaleX }} aria-hidden />
      <Hero />
      <Pain />
      <Decision />
      <WhatItDoes />
      <HowItWorks />
      <Impact />
      <Cta />
    </main>
  );
}
