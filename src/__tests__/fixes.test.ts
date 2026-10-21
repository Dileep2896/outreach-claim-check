import { business, cardFor, draftById, TODAY } from "./seed";
import { extractClaims } from "@/lib/claims";
import { runCheck } from "@/lib/check";
import { createHistory, pushHistory, remove, soften, swap, undo } from "@/lib/fixes";
import type { Draft } from "@/lib/types";

const recheck = (d: Draft) => runCheck(d, cardFor(d.leadId), business, TODAY);
const claimId = (d: Draft, i: number) => extractClaims(d)[i]!.id;

describe("fixes", () => {
  it("swap replaces Lakeshore's unsupported claim with the best unused verified fact and flips to ready", () => {
    const d = draftById("d-lakeshore");
    const next = swap(d, claimId(d, 0), cardFor(d.leadId), business);
    expect(next.body).toContain("Congrats on the new Alameda spot on Park Street.");
    expect(next.body).not.toContain("third café");
    const r = recheck(next);
    expect(r.counts.unsupported).toBe(0);
    expect(r.verdict).toBe("ready");
    expect(r.readiness).toBe(100);
  });

  it("swap does not reuse a fact already cited by another verified claim", () => {
    const d: Draft = { ...draftById("d-lakeshore"), body: "Congrats on the new Alameda spot on Park Street. Your 4.9 stars on Google say a lot. We bake wholesale pastries." };
    const next = swap(d, claimId(d, 1), cardFor(d.leadId), business);
    expect(next.body).toContain("your 4.7 stars on Google");
    expect(next.body.match(/Alameda/g)).toHaveLength(1);
  });

  it("swap falls back to removal when no verified fact is left", () => {
    const card = { ...cardFor("lead-lakeshore"), facts: cardFor("lead-lakeshore").facts.filter((f) => f.confidence === "guess") };
    const d = draftById("d-lakeshore");
    expect(swap(d, claimId(d, 0), card, business).body).not.toContain("Congrats");
  });

  it("soften turns Harborview's guess into a question and the verdict becomes ready", () => {
    const d = draftById("d-harborview");
    const next = soften(d, claimId(d, 1));
    expect(next.body).toContain("Are you hiring for a new events lead?");
    expect(recheck(next).verdict).toBe("ready");
  });

  it("soften rewrites 'you want' as 'Do you want ...?'", () => {
    const d = draftById("d-lakeshore");
    expect(soften(d, claimId(d, 1)).body).toContain("Do you want more local suppliers?");
  });

  it("soften rewrites a congrats claim as a hedged check", () => {
    const d = draftById("d-lakeshore");
    expect(soften(d, claimId(d, 0)).body).toContain("I heard you might be opening your third café in Berkeley, is that right?");
  });

  it("soften drops a claim that is only a clause", () => {
    const d: Draft = { ...draftById("d-lakeshore"), body: "Congrats on the Alameda opening — your Google rating hit 4.9 stars." };
    const next = soften(d, claimId(d, 1));
    expect(next.body).not.toContain("4.9");
    expect(next.body).toBe("Congrats on the Alameda opening.");
  });

  it("remove deletes the claim and tidies spacing", () => {
    const d = draftById("d-lakeshore");
    const next = remove(d, claimId(d, 0));
    expect(next.body).toContain("Hi Dana,\n\nWe bake wholesale croissants");
    expect(next.body).not.toMatch(/ {2}/);
  });

  it("leaves the draft unchanged for an unknown claim id", () => {
    const d = draftById("d-lakeshore");
    expect(remove(d, "nope").body).toBe(d.body);
  });

  it("is undoable through a per-draft history stack", () => {
    const d = draftById("d-lakeshore");
    let h = createHistory(d.body);
    const swapped = swap(d, claimId(d, 0), cardFor(d.leadId), business);
    h = pushHistory(h, swapped.body);
    expect(h.present).toBe(swapped.body);
    expect(h.past).toHaveLength(1);
    h = undo(h);
    expect(h.present).toBe(d.body);
    expect(undo(h)).toEqual(h);
  });
});
