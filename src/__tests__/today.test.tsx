// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { ClaimSpan } from "@/components/ClaimSpan";
import { VerdictPill } from "@/components/VerdictPill";
import { TodayApp } from "@/components/TodayApp";
import { SEED, DEMO_TODAY } from "@/lib/seed";
import type { CheckedClaim } from "@/lib/types";

const props = { business: SEED.business, leads: SEED.leads, cards: SEED.cards, drafts: SEED.drafts, history: SEED.history, today: DEMO_TODAY };

const claim = (status: "verified" | "guess" | "unsupported"): CheckedClaim => ({
  id: "c1", text: "Congrats on the move.", span: [0, 21], kind: "event", sentenceIndex: 0, grounding: { status, score: 1, mismatches: [] },
});

describe("ClaimSpan", () => {
  it.each([
    ["verified", "Verified", "✓"],
    ["guess", "Guess", "?"],
    ["unsupported", "Unsupported", "!"],
  ] as const)("shows a %s label and icon, not only colour", (status, label, icon) => {
    render(<ClaimSpan claim={claim(status)} focused={false} onFocus={() => {}} />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAccessibleName(new RegExp(`${label} claim`));
    expect(btn).toHaveTextContent(icon);
    expect(btn).toHaveAttribute("data-status", status);
  });
});

describe("VerdictPill", () => {
  it("renders a text label with readiness", () => {
    render(<VerdictPill verdict="blocked" readiness={50} />);
    expect(screen.getByText("Blocked")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});

describe("TodayApp", () => {
  it("lists the morning queue with verdict counts in the filters", () => {
    render(<TodayApp {...props} />);
    const filters = screen.getByRole("group", { name: /filter/i });
    expect(within(filters).getByRole("button", { name: /Blocked 1/ })).toBeInTheDocument();
    expect(within(filters).getByRole("button", { name: /Review 2/ })).toBeInTheDocument();
    expect(within(filters).getByRole("button", { name: /Ready 5/ })).toBeInTheDocument();
  });

  it("opens with the blocked Lakeshore draft first and shows the mismatch", () => {
    render(<TodayApp {...props} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Lakeshore Coffee Co.");
    const panel = screen.getByRole("complementary", { name: /evidence/i });
    expect(panel).toHaveTextContent(/third/);
    expect(panel).toHaveTextContent(/second/);
  });

  it("Swap flips the Lakeshore verdict to ready", () => {
    render(<TodayApp {...props} />);
    const draft = screen.getByRole("region", { name: /draft/i });
    expect(within(draft).getByText("Blocked")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /swap/i }));
    expect(within(draft).getByText("Ready")).toBeInTheDocument();
    expect(draft).toHaveTextContent("Congrats on the new Alameda spot on Park Street.");
  });

  it("undo restores the original draft", () => {
    render(<TodayApp {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /swap/i }));
    fireEvent.click(screen.getByRole("button", { name: /undo/i }));
    expect(screen.getByRole("region", { name: /draft/i })).toHaveTextContent("third café in Berkeley");
  });

  it("keyboard: j moves to the next draft and a approves it", () => {
    render(<TodayApp {...props} />);
    act(() => { fireEvent.keyDown(window, { key: "j" }); });
    const title = screen.getByRole("heading", { level: 2 }).textContent;
    expect(title).not.toContain("Lakeshore");
    act(() => { fireEvent.keyDown(window, { key: "a" }); });
    const sent = screen.getByRole("list", { name: /sent/i });
    expect(within(sent).getByText(title!)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/Approved/);
  });

  it("keyboard: 2 applies Swap to the focused claim", () => {
    render(<TodayApp {...props} />);
    act(() => { fireEvent.keyDown(window, { key: "2" }); });
    expect(within(screen.getByRole("region", { name: /draft/i })).getByText("Ready")).toBeInTheDocument();
  });

  it("filters the queue", () => {
    render(<TodayApp {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /Review 2/ }));
    expect(within(screen.getByRole("list", { name: /queue/i })).getAllByRole("listitem")).toHaveLength(2);
  });
});
