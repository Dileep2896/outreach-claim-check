"use client";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { motionTokens, springs } from "@/lib/motion-tokens";

/** Entrance used across the story: rises + fades, or fades only when reduced motion is on. */
export function useReveal(distance: number = motionTokens.distance.lg) {
  const reduce = useReducedMotion();
  return {
    hidden: { opacity: 0, y: reduce ? 0 : distance },
    visible: { opacity: 1, y: 0, transition: reduce ? { duration: motionTokens.duration.normal } : springs.gentle },
  };
}

export const staggerParent = (stagger: number = motionTokens.stagger.normal, delay = 0.1) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : motionTokens.distance.lg }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Count-up driven by a motion value; jumps straight to the end value under reduced motion. */
export function CountUp({ from, to, suffix = "", decimals = 0, duration = 1.6 }: { from: number; to: number; suffix?: string; decimals?: number; duration?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const mv = useMotionValue(from);
  const text = useTransform(mv, (v) => `${v.toFixed(decimals)}${suffix}`);
  useEffect(() => {
    if (!inView) return;
    if (reduce) { mv.set(to); return; }
    const c = animate(mv, to, { duration, ease: motionTokens.easing.out });
    return () => c.stop();
  }, [inView, reduce, mv, to, duration]);
  return <motion.span ref={ref}>{text}</motion.span>;
}
