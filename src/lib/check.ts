import type { Business, CheckResult, CheckedClaim, Draft, ResearchCard } from "./types";
import { extractClaims } from "./claims";
import { groundClaim } from "./ground";
import { checkWhyNow } from "./whyNow";
import { checkCompliance } from "./compliance";
import { verdict } from "./verdict";

export type CheckableDraft = Pick<Draft, "id" | "body" | "subject" | "channel" | "firstTouch">;

/** Compose extraction, grounding, why-now, compliance and verdict into one result for the UI and API. */
export function runCheck(draft: CheckableDraft, card: ResearchCard, business: Business, today: string): CheckResult {
  const ignore = [business.city, business.name, ...business.name.split(" ")];
  const claims: CheckedClaim[] = extractClaims(draft).map((c) => ({ ...c, grounding: groundClaim(c, card, { ignore }) }));
  const whyNow = checkWhyNow(claims, draft, card, business, today);
  const compliance = checkCompliance(draft, business);
  const v = verdict({ claims, whyNow, compliance, channel: draft.channel });
  const counts = { verified: 0, guess: 0, unsupported: 0 };
  for (const c of claims) counts[c.grounding.status]++;
  return { draftId: draft.id, body: draft.body, claims, whyNow, compliance, ...v, counts };
}
