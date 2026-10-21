/** Motion tokens shared by every animation (motion-foundations convention: no inline magic numbers). */
export const motionTokens = {
  duration: { fast: 0.15, normal: 0.3, slow: 0.6, story: 1.2 },
  easing: { smooth: [0.22, 1, 0.36, 1] as [number, number, number, number], out: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  distance: { sm: 8, md: 16, lg: 32, xl: 64 },
  scale: { press: 0.97, subtle: 0.95, pop: 1.04 },
  stagger: { tight: 0.06, normal: 0.08 },
} as const;

export const springs = {
  snappy: { type: "spring", stiffness: 500, damping: 30 },
  gentle: { type: "spring", stiffness: 220, damping: 26 },
  bouncy: { type: "spring", stiffness: 380, damping: 14 },
} as const;
