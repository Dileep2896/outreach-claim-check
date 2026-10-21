import type { Claim, Grounding, Mismatch, ResearchCard, ResearchFact } from "./types";
import { extractCities, extractNumbers, extractOrdinals, normalize, overlapScore, properNouns, tokenize } from "./text";

export const VERIFIED_MIN = 0.55;
export const GUESS_MIN = 0.35;

export type GroundOptions = {
  /** Entities that belong to the sender (e.g. the business's own city) and must not count as prospect claims. */
  ignore?: string[];
};

function factTokens(f: ResearchFact): string[] {
  return tokenize(`${f.text} ${f.sourceLabel}`);
}

function cardVocabulary(card: ResearchCard): Set<string> {
  const text = [card.company, card.contactName, ...card.facts.flatMap((f) => [f.text, f.sourceLabel, f.mention ?? ""])].join(" ");
  return new Set(normalize(text).match(/[a-z0-9]+/g) ?? []);
}

/** Hard conflicts between a claim and one piece of evidence: numbers, ordinals and cities must agree. */
export function conflicts(claimText: string, fact: ResearchFact | undefined, ignore: Set<string>): Mismatch[] {
  const out: Mismatch[] = [];
  const evText = fact ? `${fact.text} ${fact.sourceLabel}` : "";
  const evOrd = extractOrdinals(evText);
  for (const o of extractOrdinals(claimText)) {
    if (!evOrd.some((e) => e.value === o.value)) {
      out.push({ field: "ordinal", draft: o.raw, evidence: evOrd.length ? evOrd.map((e) => e.raw).join(", ") : null });
    }
  }
  const evNum = extractNumbers(evText);
  for (const n of extractNumbers(claimText)) {
    if (!evNum.some((e) => e.value === n.value)) {
      out.push({ field: "number", draft: n.raw, evidence: evNum.length ? evNum.map((e) => e.raw).join(", ") : null });
    }
  }
  const evCity = extractCities(evText);
  for (const c of extractCities(claimText)) {
    if (ignore.has(c)) continue;
    if (!evCity.includes(c)) out.push({ field: "city", draft: c, evidence: evCity.length ? evCity.join(", ") : null });
  }
  return out;
}

/**
 * Ground one claim against the lead's research card.
 * verified: best match is a `fact`, score >= 0.55 and no hard conflicts.
 * guess: best match is a `guess`, or 0.35 <= score < 0.55.
 * unsupported: score < 0.35, or any conflicting number / ordinal / city / unknown proper noun.
 */
export function groundClaim(claim: Pick<Claim, "text">, card: ResearchCard, opts: GroundOptions = {}): Grounding {
  const ignore = new Set((opts.ignore ?? []).map(normalize));
  const claimTokens = tokenize(claim.text).filter((t) => !ignore.has(t));

  let best: { fact: ResearchFact; score: number } | undefined;
  for (const fact of card.facts) {
    const score = overlapScore(claimTokens, factTokens(fact));
    const better =
      !best || score > best.score || (score === best.score && fact.confidence === "fact" && best.fact.confidence === "guess");
    if (better) best = { fact, score };
  }
  const score = Math.round((best?.score ?? 0) * 100) / 100;
  const closest = best && best.score > 0 ? best.fact : undefined;

  const mismatches = conflicts(claim.text, closest, ignore);
  const vocab = cardVocabulary(card);
  for (const noun of properNouns(claim.text)) {
    if (ignore.has(noun)) continue;
    if (!vocab.has(noun)) mismatches.push({ field: "entity", draft: noun, evidence: null });
  }

  const base = { score, ...(closest ? { evidenceId: closest.id } : {}) };
  if (score < GUESS_MIN) {
    return { status: "unsupported", ...base, mismatches: [{ field: "evidence", draft: claim.text, evidence: null }, ...mismatches] };
  }
  if (mismatches.length > 0) return { status: "unsupported", ...base, mismatches };
  if (closest?.confidence === "guess" || score < VERIFIED_MIN) return { status: "guess", ...base, mismatches };
  return { status: "verified", ...base, mismatches };
}
