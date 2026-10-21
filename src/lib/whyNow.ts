import type { Business, CheckedClaim, Draft, ResearchCard, WhyNow } from "./types";
import { daysBetween } from "./dates";
import { splitSentences, tokenize } from "./text";

export const WHY_NOW_WINDOW_DAYS = 45;

function mentionsOffer(sentence: string | undefined, business: Business): string | undefined {
  if (!sentence) return undefined;
  const tokens = new Set(tokenize(sentence));
  return business.offerKeywords.find((k) => tokenize(k).every((t) => tokens.has(t)));
}

/**
 * A common lead-quality rule: if you can't explain the connection in one sentence, the lead needs more research.
 * Passes when exactly one verified event claim points at a card fact from the last 45 days and that sentence
 * (or the next one) names the sender's offer.
 */
export function checkWhyNow(
  claims: CheckedClaim[],
  draft: Pick<Draft, "body">,
  card: ResearchCard,
  business: Business,
  today: string,
): WhyNow {
  const facts = new Map(card.facts.map((f) => [f.id, f]));
  const dated = claims
    .filter((c) => c.kind === "event" && c.grounding.status === "verified" && c.grounding.evidenceId)
    .map((c) => {
      const fact = facts.get(c.grounding.evidenceId as string)!;
      return { claim: c, fact, age: daysBetween(fact.observedAt, today) };
    });
  const recent = dated.filter((t) => t.age >= 0 && t.age <= WHY_NOW_WINDOW_DAYS);

  if (recent.length === 0) {
    if (dated.length > 0) {
      const freshest = dated.reduce((a, b) => (a.age < b.age ? a : b));
      return {
        pass: false,
        claimId: freshest.claim.id,
        factId: freshest.fact.id,
        reason: `The trigger is ${freshest.age} days old (limit ${WHY_NOW_WINDOW_DAYS}). Find a fresher reason to write today.`,
      };
    }
    return { pass: false, reason: "No dated, verified trigger. Say why you are writing now in one sentence." };
  }
  if (recent.length > 1) {
    return { pass: false, reason: `${recent.length} triggers compete for attention. Keep the strongest one.` };
  }
  const t = recent[0]!;
  const sentences = splitSentences(draft.body);
  const i = t.claim.sentenceIndex;
  const keyword = mentionsOffer(sentences[i]?.text, business) ?? mentionsOffer(sentences[i + 1]?.text, business);
  if (!keyword) {
    return {
      pass: false,
      claimId: t.claim.id,
      factId: t.fact.id,
      reason: "The trigger is not tied to the offer. Name what you sell in the same or the next sentence.",
    };
  }
  return {
    pass: true,
    claimId: t.claim.id,
    factId: t.fact.id,
    reason: `Trigger from ${t.age} days ago, tied to the offer ("${keyword}").`,
  };
}
