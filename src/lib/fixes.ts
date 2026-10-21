import type { Business, Claim, ClaimKind, ResearchCard } from "./types";
import { extractClaims } from "./claims";
import { groundClaim } from "./ground";
import { overlapScore, splitSentences, tokenize } from "./text";

/** Any draft-shaped object: fixes return the same shape with a new body. */
type Fixable = { id: string; body: string };

function findClaim(draft: Fixable, claimId: string): Claim | undefined {
  return extractClaims(draft).find((c) => c.id === claimId);
}

function isFullSentence(draft: Fixable, claim: Claim): boolean {
  return splitSentences(draft.body).some((s) => s.start === claim.span[0] && s.end === claim.span[1]) && /[.!]$/.test(claim.text);
}

function replaceSpan<T extends Fixable>(draft: T, [start, end]: [number, number], text: string): T {
  return { ...draft, body: draft.body.slice(0, start) + text + draft.body.slice(end) };
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Remove a claim and tidy the whitespace / dangling clause separators it leaves behind. */
export function remove<T extends Fixable>(draft: T, claimId: string): T {
  const claim = findClaim(draft, claimId);
  if (!claim) return draft;
  let before = draft.body.slice(0, claim.span[0]);
  let after = draft.body.slice(claim.span[1]);
  const dangling = /\s+[—–-]\s*$|;\s*$/;
  if (dangling.test(before)) {
    before = before.replace(dangling, "");
    if (!/^[.!?]/.test(after)) before += ".";
  } else if (/^\s*[—–-]\s+|^;\s+/.test(after)) {
    after = after.replace(/^\s*[—–-]\s+|^;\s+/, "");
    after = capitalize(after);
  } else if (/^[ \t]+/.test(after)) {
    after = after.replace(/^[ \t]+/, "");
  } else {
    before = before.replace(/[ \t]+$/, "");
  }
  return { ...draft, body: before + after };
}

const LEAD_IN = /^(?:i\s+(?:also\s+)?(?:saw|noticed|heard|read)(?:\s+in\s+\S+)?|(?:also\s+)?(?:saw|noticed|heard))(?:\s+that)?\s+/i;
const CONGRATS = /^congrat(?:s|ulations)\s+on\s+/i;

/** Rewrite a claim as a hedged question, so it asks instead of asserts. */
export function hedge(text: string): string {
  let core = text.replace(/[.!]+$/, "").trim();
  if (CONGRATS.test(core)) {
    core = core.replace(CONGRATS, "");
    return /^\w+ing\b/i.test(core) ? `I heard you might be ${core}, is that right?` : `Is ${core} happening, or did I get that wrong?`;
  }
  core = core.replace(LEAD_IN, "");
  let m: RegExpMatchArray | null;
  if ((m = core.match(/^you(?:'re|’re| are)\s+(.*)$/i))) return `Are you ${m[1]}?`;
  if ((m = core.match(/^you(?:'ve|’ve| have)\s+(.*)$/i))) return `Have you ${m[1]}?`;
  if ((m = core.match(/^you\s+(.*)$/i))) return `Do you ${m[1]}?`;
  return `Is it right that ${core.charAt(0).toLowerCase()}${core.slice(1)}?`;
}

/** Soften: turn a full-sentence claim into a question; drop a claim that is only a clause. */
export function soften<T extends Fixable>(draft: T, claimId: string): T {
  const claim = findClaim(draft, claimId);
  if (!claim) return draft;
  if (!isFullSentence(draft, claim)) return remove(draft, claimId);
  return replaceSpan(draft, claim.span, hedge(claim.text));
}

const TEMPLATES: Record<ClaimKind, (mention: string) => string> = {
  event: (m) => `Congrats on ${m}.`,
  metric: (m) => `Nice work on ${m}.`,
  attribute: (m) => `I noticed ${m}.`,
  relationship: (m) => `I noticed ${m}.`,
  opinion: (m) => `I noticed ${m}.`,
};

/** Swap: replace the claim with the closest verified fact that no other verified claim already cites. */
export function swap<T extends Fixable>(draft: T, claimId: string, card: ResearchCard, business: Pick<Business, "city" | "name">): T {
  const claims = extractClaims(draft);
  const claim = claims.find((c) => c.id === claimId);
  if (!claim) return draft;
  const ignore = [business.city, business.name];
  const used = new Set(
    claims
      .filter((c) => c.id !== claimId)
      .map((c) => groundClaim(c, card, { ignore }))
      .filter((g) => g.status === "verified" && g.evidenceId)
      .map((g) => g.evidenceId as string),
  );
  const claimTokens = tokenize(claim.text);
  const candidates = card.facts
    .filter((f) => f.confidence === "fact" && f.mention && !used.has(f.id))
    .map((f) => ({ f, score: overlapScore(claimTokens, tokenize(`${f.text} ${f.mention}`)) }))
    .sort((a, b) => b.score - a.score || b.f.observedAt.localeCompare(a.f.observedAt));
  const pick = candidates[0];
  if (!pick) return remove(draft, claimId);
  let text = TEMPLATES[claim.kind](pick.f.mention as string);
  if (!isFullSentence(draft, claim)) text = text.replace(/\.$/, "");
  return replaceSpan(draft, claim.span, text);
}

export type FixHistory = { past: string[]; present: string };

export const createHistory = (body: string): FixHistory => ({ past: [], present: body });

export function pushHistory(h: FixHistory, body: string): FixHistory {
  if (body === h.present) return h;
  return { past: [...h.past, h.present], present: body };
}

export function undo(h: FixHistory): FixHistory {
  if (h.past.length === 0) return h;
  return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1] as string };
}
