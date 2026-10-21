import { business, cardFor, draftById } from "./seed";
import { extractClaims } from "@/lib/claims";
import { groundClaim } from "@/lib/ground";
import type { Claim, ResearchCard } from "@/lib/types";

const claim = (text: string): Claim => ({ id: "c1", text, span: [0, text.length], kind: "event", sentenceIndex: 0 });
const ignore = [business.city];

describe("groundClaim", () => {
  const lakeshore = cardFor("lead-lakeshore");

  it("marks the Lakeshore 'third café in Berkeley' claim unsupported with ordinal + city mismatches", () => {
    const c = extractClaims(draftById("d-lakeshore"))[0]!;
    const g = groundClaim(c, lakeshore, { ignore });
    expect(g.status).toBe("unsupported");
    expect(g.evidenceId).toBe("f-lake-1");
    expect(g.mismatches).toContainEqual({ field: "ordinal", draft: "third", evidence: "second" });
    expect(g.mismatches).toContainEqual({ field: "city", draft: "berkeley", evidence: "alameda" });
  });

  it("verifies a claim that matches a fact with no conflicts", () => {
    const g = groundClaim(claim("Congrats on the new Alameda spot on Park Street."), lakeshore, { ignore });
    expect(g.status).toBe("verified");
    expect(g.evidenceId).toBe("f-lake-1");
    expect(g.score).toBeGreaterThanOrEqual(0.55);
    expect(g.mismatches).toEqual([]);
  });

  it("verifies a claim citing the source label (Oaklandside)", () => {
    const c = extractClaims(draftById("d-lakeshore"))[1]!;
    expect(groundClaim(c, lakeshore, { ignore }).status).toBe("verified");
  });

  it("flags an invented rating (4.9 vs 4.6) as a number conflict", () => {
    const g = groundClaim(claim("Your 4.9 stars on Google say a lot."), cardFor("lead-fernfield"), { ignore });
    expect(g.status).toBe("unsupported");
    expect(g.mismatches).toContainEqual({ field: "number", draft: "4.9", evidence: "4.6, 128" });
  });

  it("returns guess when the best match is guess-confidence research", () => {
    const c = extractClaims(draftById("d-harborview"))[1]!;
    const g = groundClaim(c, cardFor("lead-harborview"), { ignore });
    expect(g.status).toBe("guess");
    expect(g.evidenceId).toBe("f-harb-2");
  });

  it("returns guess for a partial match between 0.35 and 0.55", () => {
    const g = groundClaim(claim("Your weekend brunch menu feels cozy and bright."), cardFor("lead-fernfield"), { ignore });
    expect(g.score).toBeGreaterThanOrEqual(0.35);
    expect(g.score).toBeLessThan(0.55);
    expect(g.status).toBe("guess");
  });

  it("returns unsupported with an evidence mismatch when nothing matches", () => {
    const g = groundClaim(claim("Congrats on winning the Golden Spoon award."), lakeshore, { ignore });
    expect(g.status).toBe("unsupported");
    expect(g.mismatches.map((m) => m.field)).toContain("evidence");
  });

  it("flags a proper noun that appears nowhere on the card", () => {
    const g = groundClaim(claim("Saw that Harborview is hosting the Uptown Jazz Walk afterparty on Nov 7."), cardFor("lead-harborview"), { ignore });
    expect(g.status).toBe("unsupported");
    expect(g.mismatches).toContainEqual({ field: "entity", draft: "jazz", evidence: null });
  });

  it("ignores the sender's own city when checking prospect entities", () => {
    const card: ResearchCard = {
      leadId: "x", company: "Acme", contactName: "Jo",
      facts: [{ id: "f1", text: "Opened a new bakery counter", sourceUrl: "https://x.example.com", sourceLabel: "Instagram", observedAt: "2026-10-01", confidence: "fact" }],
    };
    expect(groundClaim(claim("Congrats on opening a bakery counter near Oakland."), card, { ignore: ["Oakland"] }).status).toBe("verified");
    expect(groundClaim(claim("Congrats on opening a bakery counter near Oakland."), card).status).toBe("unsupported");
  });

  it("grounds every seed claim except the planted errors as verified", () => {
    const statuses: Record<string, string[]> = {};
    for (const id of ["d-fernfield", "d-hive", "d-pinewood", "d-goldenhour", "d-sunfield", "d-ironclad"]) {
      const d = draftById(id);
      statuses[id] = extractClaims(d).map((c) => groundClaim(c, cardFor(d.leadId), { ignore }).status);
    }
    for (const [id, s] of Object.entries(statuses)) expect(s.every((x) => x === "verified"), `${id}: ${s}`).toBe(true);
  });
});
