// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { LedgerView } from "@/components/LedgerView";
import { SEED } from "@/lib/seed";
import { SESSION_KEY } from "@/components/TodayApp";

describe("LedgerView", () => {
  beforeEach(() => sessionStorage.clear());

  it("renders one row per message type with clean rate, threshold and eligibility badge", () => {
    render(<LedgerView history={SEED.history} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    const partner = rows.find((r) => r.textContent?.includes("Partner intro email"))!;
    expect(within(partner).getByText("Auto-send eligible")).toBeInTheDocument();
    expect(within(partner).getByRole("meter")).toHaveAttribute("aria-valuenow", "97");
    const wholesale = rows.find((r) => r.textContent?.includes("Wholesale intro email"))!;
    expect(wholesale).toHaveTextContent("92%");
    expect(within(wholesale).queryByText("Auto-send eligible")).toBeNull();
    expect(wholesale).toHaveTextContent(/more clean sends/);
  });

  it("merges today's simulated decisions from session storage", () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([
      { draftId: "d-x", messageType: "catering_linkedin_dm", decidedAt: "2026-10-21", action: "approved", unsupportedAtSend: 0 },
    ]));
    render(<LedgerView history={SEED.history} />);
    expect(screen.getByText(/1 decision from today/)).toBeInTheDocument();
    const dm = screen.getAllByRole("listitem").find((r) => r.textContent?.includes("Catering LinkedIn DM"))!;
    expect(dm).toHaveTextContent("22 of 31");
  });
});
