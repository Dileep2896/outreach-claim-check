import { business, cards, drafts, history, leads } from "./seed";

describe("seed data", () => {
  it("parses against the zod schemas", () => {
    expect(business.name).toBe("Brightside Bakery");
    expect(leads).toHaveLength(8);
    expect(drafts).toHaveLength(8);
    expect(cards).toHaveLength(8);
    expect(history.length).toBeGreaterThanOrEqual(140);
  });

  it("has a research card for every lead and a lead for every draft", () => {
    for (const lead of leads) expect(cards.some((c) => c.leadId === lead.id)).toBe(true);
    for (const d of drafts) expect(leads.some((l) => l.id === d.leadId)).toBe(true);
  });

  it("gives every card a mix of facts and dated sources", () => {
    for (const c of cards) {
      expect(c.facts.length).toBeGreaterThanOrEqual(2);
      expect(c.facts.some((f) => f.confidence === "fact")).toBe(true);
    }
    expect(cards.flatMap((c) => c.facts).some((f) => f.confidence === "guess")).toBe(true);
  });
});
