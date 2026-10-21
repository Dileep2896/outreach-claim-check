import type { Claim, ClaimKind, Draft } from "./types";
import { extractCities, extractNumbers, extractOrdinals, normalize, properNouns, splitSentences } from "./text";

export type ExtractableDraft = Pick<Draft, "id" | "body">;

/** Pluggable claim extraction. The rule-based extractor is the default; an LLM adapter can implement the same shape. */
export interface ClaimExtractor {
  readonly name: string;
  extract(draft: ExtractableDraft): Promise<Claim[]>;
}

const SIGN_OFF = /^(best|thanks|thank you|cheers|warmly|regards|kind regards|talk soon|all the best|sincerely)[,!.]?\s*$/i;
const GREETING = /^(hi|hello|hey|dear|good morning)\b[^.!?]*,$/i;
const FIRST_PERSON = /\b(we|our|ours|us|i|i'm|i've|i'd|i'll|we're|we've|we'd|my)\b/;
const CUE = /\b(congrats|congratulations|saw|noticed|heard|read|loved|caught|spotted)\b/;
const EVENT =
  /\b(open(ed|ing|s)?|launch(ed|ing|es)?|start(ed|ing|s)?|host(ed|ing|s)?|hir(e|ed|ing)|announc(e|ed|es|ing)|expand(ed|ing|s)?|mov(e|ed|es|ing)|featur(e|ed|ing)|won|celebrat(e|ed|es|ing)|reopen(ed|ing|s)?|new|just)\b/;
const METRIC_WORDS = /\b(stars?|rating|reviews?|percent)\b|%/;
const RELATIONSHIP = /\b(partners?|suppliers?|vendors?|works with|working with|carr(y|ies)|stocks?|sourc(e|es|ing))\b/;
const OPINION = /\b(love|loved|great|amazing|beautiful|delicious|gorgeous|fantastic|awesome)\b/;
const MONTH = /\b(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\b/;

export function classifyClaim(text: string): ClaimKind {
  const n = normalize(text);
  if (EVENT.test(n)) return "event";
  if (extractNumbers(text).length > 0 || METRIC_WORDS.test(n)) return "metric";
  if (RELATIONSHIP.test(n)) return "relationship";
  if (OPINION.test(n)) return "opinion";
  return "attribute";
}

function hasSignal(text: string): boolean {
  const n = normalize(text);
  return (
    CUE.test(n) ||
    extractNumbers(text).length > 0 ||
    extractOrdinals(text).length > 0 ||
    extractCities(text).length > 0 ||
    properNouns(text).length > 0 ||
    MONTH.test(n) ||
    METRIC_WORDS.test(n)
  );
}

/** Split a sentence into clauses on em/en dashes and semicolons, keeping absolute offsets. */
function clauses(text: string, start: number): { text: string; start: number; end: number }[] {
  const out: { text: string; start: number; end: number }[] = [];
  const re = /\s+[—–]\s+|\s+-\s+|;\s+/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const push = (from: number, to: number) => {
    const raw = text.slice(from, to);
    const lead = raw.length - raw.trimStart().length;
    const t = raw.trim();
    if (t) out.push({ text: t, start: start + from + lead, end: start + from + lead + t.length });
  };
  while ((m = re.exec(text)) !== null) {
    push(last, m.index);
    last = m.index + m[0].length;
  }
  push(last, text.length);
  return out;
}

/**
 * Rule-based claim extraction. A claim is a sentence/clause about the prospect that carries a checkable
 * signal (proper noun, number, ordinal, date, rating, city or a "congrats/saw/noticed" cue). Greetings,
 * the sign-off and footer, questions, and sentences about the sender ("we/our/I" without a cue) are skipped.
 */
export function extractClaims(draft: ExtractableDraft): Claim[] {
  const sentences = splitSentences(draft.body);
  const signOffAt = sentences.find((s) => SIGN_OFF.test(s.text));
  const claims: Claim[] = [];
  sentences.forEach((s, sentenceIndex) => {
    if (signOffAt && s.line >= signOffAt.line) return;
    if (GREETING.test(s.text)) return;
    for (const c of clauses(s.text, s.start)) {
      if (/\?\s*$/.test(c.text)) continue;
      const n = normalize(c.text);
      if (FIRST_PERSON.test(n) && !CUE.test(n)) continue;
      if (!hasSignal(c.text)) continue;
      claims.push({
        id: `${draft.id}:c${claims.length + 1}`,
        text: c.text,
        span: [c.start, c.end],
        kind: classifyClaim(c.text),
        sentenceIndex,
      });
    }
  });
  return claims;
}

export class RuleClaimExtractor implements ClaimExtractor {
  readonly name = "rules";
  async extract(draft: ExtractableDraft): Promise<Claim[]> {
    return extractClaims(draft);
  }
}
