/**
 * Deterministic text utilities for Claim Check: normalisation, a light stemmer, number/ordinal/city
 * parsing, proper-noun spotting and an overlap score. Everything is pure so it can be unit tested and
 * run on the server or in the browser.
 */

export type Sentence = { text: string; start: number; end: number; line: number };
export type ParsedNumber = { value: number; raw: string };

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .toLowerCase();
}

export const STOPWORDS = new Set(
  (
    "a an the and or but if of in on at to for from by with into onto about as is are was were be been being am " +
    "it its it's this that these those there here than then so very just also really still already " +
    "you your yours you're youre we our us i me my i'm i've i'd he she they them their his her " +
    "re ve ll d s t m x " +
    "congrats congratulations saw see seen noticed notice heard hear read caught spotted loved " +
    "new say says said lot lots show shows people thing things some any more most much many " +
    "can could would should will may might do does did have has had get got make made " +
    "hi hello hey dear thanks best quick"
  ).split(/\s+/),
);

/** Domain synonyms collapsed before stemming, so "third café" and "second location" share a token. */
const SYNONYMS: Record<string, string> = {
  cafe: "location", cafes: "location", shop: "location", shops: "location", spot: "location", spots: "location",
  location: "location", locations: "location", store: "location", stores: "location", storefront: "location",
};

export function stem(word: string): string {
  let w = word.toLowerCase();
  const syn = SYNONYMS[w];
  if (syn) return syn;
  if (w.length > 4 && w.endsWith("ies")) w = w.slice(0, -3) + "i";
  else if (w.length > 4 && /(ches|shes|sses|xes)$/.test(w)) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us")) w = w.slice(0, -1);
  if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith("ed")) w = w.slice(0, -2);
  if (w.length > 3 && w.endsWith("e")) w = w.slice(0, -1);
  if (w.length > 3 && w.endsWith("y")) w = w.slice(0, -1) + "i";
  // collapse doubled final consonant left by -ing/-ed ("wedding" -> "wedd" -> "wed")
  if (w.length > 3 && /([b-df-hj-np-tv-z])\1$/.test(w) && !w.endsWith("ss") && !w.endsWith("ll")) w = w.slice(0, -1);
  return w;
}

const WORD_NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100,
};
const WORD_ORDINALS: Record<string, number> = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
};
const MONTHS = new Set([
  "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december",
  "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec",
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
]);

/** Bay Area cities. Neighbourhoods are deliberately excluded (they are checked as proper nouns). */
export const CITIES = [
  "san francisco", "walnut creek", "san leandro", "el cerrito", "san jose", "san mateo", "daly city",
  "oakland", "berkeley", "alameda", "emeryville", "piedmont", "richmond", "albany", "hayward", "fremont",
  "orinda", "lafayette", "concord", "palo alto", "sausalito",
];

const CITY_WORDS = new Set(CITIES.flatMap((c) => c.split(" ")));

const TOKEN_RE = /\d+(?:st|nd|rd|th)\b|\d+(?:\.\d+)?|[a-z]+(?:'[a-z]+)?/g;

function rawTokens(s: string): string[] {
  return normalize(s).match(TOKEN_RE) ?? [];
}

/** Content tokens: stemmed words plus typed `num:` and `ord:` tokens, with stopwords and cities kept as words. */
export function tokenize(s: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (t: string) => {
    if (!seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  };
  for (const raw of rawTokens(s)) {
    const ordSuffix = raw.match(/^(\d+)(?:st|nd|rd|th)$/);
    if (ordSuffix) { push(`ord:${Number(ordSuffix[1])}`); continue; }
    if (/^\d/.test(raw)) { push(`num:${Number(raw)}`); continue; }
    if (raw in WORD_ORDINALS) { push(`ord:${WORD_ORDINALS[raw]}`); continue; }
    if (raw in WORD_NUMBERS) { push(`num:${WORD_NUMBERS[raw]}`); continue; }
    if (STOPWORDS.has(raw)) continue;
    const base = raw.replace(/'s$/, "");
    if (STOPWORDS.has(base) || base.length < 2) continue;
    push(CITY_WORDS.has(base) ? base : stem(base));
  }
  return out;
}

export function extractNumbers(s: string): ParsedNumber[] {
  const out: ParsedNumber[] = [];
  for (const raw of rawTokens(s)) {
    if (/^\d+(?:st|nd|rd|th)$/.test(raw)) continue;
    if (/^\d/.test(raw)) out.push({ value: Number(raw), raw });
    else if (raw in WORD_NUMBERS) out.push({ value: WORD_NUMBERS[raw] as number, raw });
  }
  return dedupeBy(out, (n) => n.value);
}

export function extractOrdinals(s: string): ParsedNumber[] {
  const out: ParsedNumber[] = [];
  for (const raw of rawTokens(s)) {
    const m = raw.match(/^(\d+)(?:st|nd|rd|th)$/);
    if (m) out.push({ value: Number(m[1]), raw });
    else if (raw in WORD_ORDINALS) out.push({ value: WORD_ORDINALS[raw] as number, raw });
  }
  return dedupeBy(out, (n) => n.value);
}

export function extractCities(s: string): string[] {
  const text = ` ${normalize(s).replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ")} `;
  const found: { city: string; at: number }[] = [];
  for (const city of CITIES) {
    const at = text.indexOf(` ${city} `);
    if (at >= 0 && !found.some((f) => f.city.includes(city))) found.push({ city, at });
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.city);
}

/**
 * Capitalised words that are not the first word of a sentence/clause, not "I", not months/days and not
 * cities (cities are checked separately). Returned normalised.
 */
export function properNouns(s: string): string[] {
  const cities = new Set(extractCities(s).flatMap((c) => c.split(" ")));
  const out: string[] = [];
  const words = s.split(/\s+/);
  let clauseStart = true;
  for (const w of words) {
    const clean = w.replace(/^[^A-Za-z0-9À-ɏ]+|[^A-Za-z0-9À-ɏ]+$/g, "").replace(/['’]s$/, "");
    const isCap = /^[A-ZÀ-Þ][a-zA-ZÀ-ɏ'\-]*$/.test(clean);
    if (isCap && !clauseStart && clean !== "I") {
      const n = normalize(clean);
      if (!MONTHS.has(n) && !cities.has(n) && !STOPWORDS.has(n)) out.push(n);
    }
    if (clean.length > 0 || /[—–]/.test(w)) clauseStart = /[.!?:—–]$/.test(w) || /^[—–]$/.test(w);
  }
  return [...new Set(out)];
}

/** Share of claim tokens present in the evidence tokens (0..1). */
export function overlapScore(claimTokens: string[], evidenceTokens: string[]): number {
  if (claimTokens.length === 0) return 0;
  const ev = new Set(evidenceTokens);
  const hit = claimTokens.filter((t) => ev.has(t)).length;
  return hit / claimTokens.length;
}

/** Split text into sentences (line breaks are hard boundaries) with offsets into the original string. */
export function splitSentences(text: string): Sentence[] {
  const out: Sentence[] = [];
  let offset = 0;
  const lines = text.split("\n");
  lines.forEach((line, lineNo) => {
    const re = /.+?(?:[.!?]+(?=\s|$)|$)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      if (m[0].length === 0) { re.lastIndex++; continue; }
      const lead = m[0].length - m[0].trimStart().length;
      const t = m[0].trim();
      if (t) {
        const start = offset + m.index + lead;
        out.push({ text: t, start, end: start + t.length, line: lineNo });
      }
    }
    offset += line.length + 1;
  });
  return out;
}

function dedupeBy<T>(xs: T[], key: (x: T) => unknown): T[] {
  const seen = new Set<unknown>();
  return xs.filter((x) => {
    const k = key(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
