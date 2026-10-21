import { business, cardFor, draftById, drafts, TODAY } from "./seed";
import { checkWhyNow } from "@/lib/whyNow";
import { checkCompliance } from "@/lib/compliance";
import { verdict } from "@/lib/verdict";
import { runCheck } from "@/lib/check";
import type { CheckedClaim, ComplianceChip, Draft } from "@/lib/types";

const check = (id: string) => {
  const d = draftById(id);
  return runCheck(d, cardFor(d.leadId), business, TODAY);
};

describe("checkWhyNow", () => {
  it("passes when one recent verified trigger is followed by an offer keyword", () => {
    const r = checkWhyNow(check("d-sunfield").claims, draftById("d-sunfield"), cardFor("lead-sunfield"), business, TODAY);
    expect(r.pass).toBe(true);
    expect(r.factId).toBe("f-sun-1");
  });

  it("fails a stale trigger (90 days old)", () => {
    const r = check("d-ironclad").whyNow;
    expect(r.pass).toBe(false);
    expect(r.reason).toMatch(/90 days/);
  });

  it("fails when the trigger is not tied to the offer", () => {
    const d: Draft = { ...draftById("d-sunfield"), body: "Hi Tom,\n\nI noticed Sunfield just expanded its bakery shelf with a local-makers section. Hope the team is well." };
    const r = runCheck(d, cardFor("lead-sunfield"), business, TODAY).whyNow;
    expect(r.pass).toBe(false);
    expect(r.reason).toMatch(/offer/);
  });

  it("fails when there is no trigger at all", () => {
    const d: Draft = { ...draftById("d-sunfield"), body: "Hi Tom,\n\nWe sell wholesale pastries. Want a price sheet?" };
    expect(runCheck(d, cardFor("lead-sunfield"), business, TODAY).whyNow.pass).toBe(false);
  });

  it("fails with two competing triggers", () => {
    const d: Draft = { ...draftById("d-sunfield"), body: "I noticed Sunfield just expanded its bakery shelf with a local-makers section. We sell wholesale pastries. Congrats on expanding the bakery shelf with local makers." };
    const r = runCheck(d, cardFor("lead-sunfield"), business, TODAY).whyNow;
    expect(r.pass).toBe(false);
    expect(r.reason).toMatch(/2 triggers/);
  });

  it("uses the injected today for the 45-day window", () => {
    const d = draftById("d-sunfield");
    expect(runCheck(d, cardFor(d.leadId), business, "2027-02-01").whyNow.pass).toBe(false);
  });
});

describe("checkCompliance", () => {
  const chip = (chips: ComplianceChip[], id: string) => chips.find((c) => c.id === id)!;

  it("passes opt-out, address and subject for a seed email", () => {
    const chips = checkCompliance(draftById("d-sunfield"), business);
    expect(chips.map((c) => c.pass)).toEqual([true, true, true]);
  });

  it("fails a missing opt-out and address", () => {
    const d: Draft = { ...draftById("d-sunfield"), body: "Hi Tom,\n\nWe sell pastries.\n\nBest,\nMaria" };
    const chips = checkCompliance(d, business);
    expect(chip(chips, "optOut").pass).toBe(false);
    expect(chip(chips, "address").pass).toBe(false);
  });

  it("fails RE:/FWD: on a first touch and ALL CAPS subjects", () => {
    expect(chip(checkCompliance({ ...draftById("d-sunfield"), subject: "RE: pastries" }, business), "subject").pass).toBe(false);
    expect(chip(checkCompliance({ ...draftById("d-sunfield"), subject: "FREE PASTRIES NOW" }, business), "subject").pass).toBe(false);
    expect(chip(checkCompliance({ ...draftById("d-sunfield"), subject: "Re: pastries", firstTouch: false }, business), "subject").pass).toBe(true);
  });

  it("marks email-only chips as not applicable on LinkedIn", () => {
    const chips = checkCompliance(draftById("d-pinewood"), business);
    expect(chips.every((c) => c.pass === null)).toBe(true);
  });
});

describe("verdict", () => {
  const cc = (status: "verified" | "guess" | "unsupported"): CheckedClaim => ({
    id: status, text: status, span: [0, 1], kind: "event", sentenceIndex: 0, grounding: { status, score: 1, mismatches: [] },
  });
  const ok: ComplianceChip[] = [{ id: "optOut", label: "", pass: true, detail: "" }];
  const bad: ComplianceChip[] = [{ id: "optOut", label: "", pass: false, detail: "" }];
  const pass = { pass: true, reason: "" };

  it("is blocked on any unsupported claim", () => {
    expect(verdict({ claims: [cc("verified"), cc("unsupported")], whyNow: pass, compliance: ok, channel: "email" }).verdict).toBe("blocked");
  });
  it("is blocked on a failed compliance chip for email, not for LinkedIn", () => {
    expect(verdict({ claims: [cc("verified")], whyNow: pass, compliance: bad, channel: "email" }).verdict).toBe("blocked");
    expect(verdict({ claims: [cc("verified")], whyNow: pass, compliance: bad, channel: "linkedin" }).verdict).toBe("ready");
  });
  it("is review on a guess or a failed why-now", () => {
    expect(verdict({ claims: [cc("guess")], whyNow: pass, compliance: ok, channel: "email" }).verdict).toBe("review");
    expect(verdict({ claims: [cc("verified")], whyNow: { pass: false, reason: "" }, compliance: ok, channel: "email" }).verdict).toBe("review");
  });
  it("computes readiness as verified share, safe for zero claims", () => {
    expect(verdict({ claims: [cc("verified"), cc("guess"), cc("verified")], whyNow: pass, compliance: ok, channel: "email" }).readiness).toBe(67);
    expect(verdict({ claims: [], whyNow: pass, compliance: ok, channel: "email" }).readiness).toBe(0);
  });
});

describe("runCheck on the seed queue", () => {
  it("produces the planned verdict mix: 5 ready, 2 review, 1 blocked", () => {
    const mix = { ready: 0, review: 0, blocked: 0 };
    for (const d of drafts) mix[runCheck(d, cardFor(d.leadId), business, TODAY).verdict]++;
    expect(mix).toEqual({ ready: 5, review: 2, blocked: 1 });
  });

  it("blocks Lakeshore, reviews Harborview + Ironclad", () => {
    expect(check("d-lakeshore").verdict).toBe("blocked");
    expect(check("d-harborview").verdict).toBe("review");
    expect(check("d-ironclad").verdict).toBe("review");
  });

  it("returns counts per grounding status", () => {
    expect(check("d-lakeshore").counts).toEqual({ verified: 1, guess: 0, unsupported: 1 });
  });
});
