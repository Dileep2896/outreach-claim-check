// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { StoryPage } from "@/app/(marketing)/story/StoryPage";

beforeAll(() => {
  // Mock prefers-reduced-motion: reduce, plus the browser APIs motion relies on.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query, onchange: null,
      addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
    }),
  });
  class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
  Object.assign(window, { IntersectionObserver: IO, ResizeObserver: IO });
  window.scrollTo = () => {};
});

describe("/story", () => {
  it("renders every section with reduced motion and no thrown errors", () => {
    const errors: unknown[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...a) => { errors.push(a); });
    render(<StoryPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName(/AI tools now write personalized sales outreach/);
    for (const name of [/bottleneck is the morning review/, /Two ideas/, /Every claim gets a source/, /sits between/, /Review in seconds/, /Open the morning queue/]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: /Try the queue/ })).toHaveAttribute("href", "/today");
    expect(screen.getByText(/Targets and estimates/)).toBeInTheDocument();
    expect(screen.getByText(/Built with Claude Code/)).toBeInTheDocument();
    spy.mockRestore();
    expect(errors).toEqual([]);
  });
});
