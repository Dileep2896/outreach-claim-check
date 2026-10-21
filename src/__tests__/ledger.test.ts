import { history } from "./seed";
import { AUTO_SEND_MIN_SENT, AUTO_SEND_MIN_RATE, ledger } from "@/lib/ledger";
import type { Decision } from "@/lib/types";

describe("ledger", () => {
  const rows = ledger(history);
  const row = (t: string) => rows.find((r) => r.messageType === t)!;

  it("groups decisions by message type", () => {
    expect(rows.map((r) => r.messageType).sort()).toEqual(["catering_linkedin_dm", "partner_intro_email", "wholesale_intro_email"]);
  });

  it("gives one eligible type, one around 92% and one around 70%", () => {
    expect(row("partner_intro_email").eligible).toBe(true);
    expect(Math.round(row("wholesale_intro_email").cleanRate * 100)).toBe(92);
    expect(row("wholesale_intro_email").eligible).toBe(false);
    expect(Math.round(row("catering_linkedin_dm").cleanRate * 100)).toBe(70);
  });

  it("counts only approved drafts as sent, and clean = 0 unsupported at send", () => {
    const h: Decision[] = [
      { draftId: "a", messageType: "partner_intro_email", decidedAt: "2026-10-01", action: "approved", unsupportedAtSend: 0 },
      { draftId: "b", messageType: "partner_intro_email", decidedAt: "2026-10-01", action: "approved", unsupportedAtSend: 2 },
      { draftId: "c", messageType: "partner_intro_email", decidedAt: "2026-10-01", action: "skipped", unsupportedAtSend: 1 },
    ];
    expect(ledger(h)[0]).toMatchObject({ sent: 2, cleanSent: 1, cleanRate: 0.5, skipped: 1, eligible: false });
  });

  it("requires both 50 sends and a 95% clean rate", () => {
    const make = (n: number, clean: number): Decision[] =>
      Array.from({ length: n }, (_, i) => ({ draftId: `x${i}`, messageType: "catering_linkedin_dm", decidedAt: "2026-10-01", action: "approved", unsupportedAtSend: i < clean ? 0 : 1 }));
    expect(AUTO_SEND_MIN_SENT).toBe(50);
    expect(AUTO_SEND_MIN_RATE).toBe(0.95);
    expect(ledger(make(49, 49))[0]!.eligible).toBe(false);
    expect(ledger(make(50, 48))[0]!.eligible).toBe(true);
    expect(ledger(make(50, 47))[0]!.eligible).toBe(false);
  });

  it("reports how many more clean sends are needed", () => {
    expect(row("partner_intro_email").cleanSendsToEligible).toBe(0);
    expect(row("wholesale_intro_email").cleanSendsToEligible).toBeGreaterThan(0);
  });

  it("handles an empty history", () => {
    expect(ledger([])).toEqual([]);
  });
});
