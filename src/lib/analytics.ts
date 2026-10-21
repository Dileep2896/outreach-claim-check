export type AnalyticsEvent = "draft_opened" | "claim_fixed" | "draft_approved" | "draft_skipped";

/**
 * PostHog-shaped `capture` wrapper. A no-op in this demo (no key, no network); logs in development so
 * the events are visible while clicking around.
 */
export function track(event: AnalyticsEvent, properties: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    console.debug("[track]", event, properties);
  }
  return { event, properties };
}
