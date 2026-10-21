import expected from "./fixtures/expected-claims.json";
import { drafts, draftById } from "./seed";
import { RuleClaimExtractor, extractClaims } from "@/lib/claims";

const labelled = expected as Record<string, string[]>;

describe("extractClaims", () => {
  it("finds >= 90% of hand-labelled claims across the seed with <= 1 false positive per draft", () => {
    let found = 0;
    let total = 0;
    for (const d of drafts) {
      const want = labelled[d.id] ?? [];
      const got = extractClaims(d).map((c) => c.text);
      total += want.length;
      found += want.filter((w) => got.includes(w)).length;
      const falsePositives = got.filter((g) => !want.includes(g));
      expect(falsePositives.length, `${d.id}: ${falsePositives.join(" | ")}`).toBeLessThanOrEqual(1);
    }
    expect(found / total).toBeGreaterThanOrEqual(0.9);
  });

  it("returns spans that slice back to the claim text", () => {
    const d = draftById("d-lakeshore");
    for (const c of extractClaims(d)) expect(d.body.slice(c.span[0], c.span[1])).toBe(c.text);
  });

  it("skips greetings, offer sentences, questions and everything after the sign-off", () => {
    const body = "Hi Sam,\n\nWe bake 400 croissants a day in Oakland. Could I drop off a tray?\n\nBest,\nMaria Alvarez\nBrightside Bakery · 2150 Telegraph Ave, Oakland";
    expect(extractClaims({ id: "x", body })).toEqual([]);
  });

  it("keeps 'I saw/noticed' sentences because they are about the prospect", () => {
    const claims = extractClaims({ id: "x", body: "I noticed Sunfield added a bakery shelf." });
    expect(claims).toHaveLength(1);
  });

  it("classifies claim kinds", () => {
    const kinds = (body: string) => extractClaims({ id: "x", body }).map((c) => c.kind);
    expect(kinds("Congrats on opening your second café.")).toEqual(["event"]);
    expect(kinds("Congrats on 4.8 stars on Google.")).toEqual(["metric"]);
    expect(kinds("I read that you want more local suppliers.")).toEqual(["relationship"]);
    expect(kinds("Your Rockridge store looks amazing.")).toEqual(["opinion"]);
    expect(kinds("Your team is based on Hollis Street.")).toEqual(["attribute"]);
  });

  it("splits em-dash clauses into separate claims", () => {
    const claims = extractClaims({ id: "x", body: "Congrats on the Alameda opening — your Google rating hit 4.9 stars." });
    expect(claims.map((c) => c.text)).toEqual(["Congrats on the Alameda opening", "your Google rating hit 4.9 stars."]);
  });

  it("is exposed through the ClaimExtractor interface", async () => {
    const ex = new RuleClaimExtractor();
    expect(ex.name).toBe("rules");
    expect(await ex.extract({ id: "x", body: "Congrats on the move to Hollis Street." })).toHaveLength(1);
  });
});
