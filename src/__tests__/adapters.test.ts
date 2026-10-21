import { AnthropicClaimExtractor, CLAIM_TOOL_SCHEMA, selectExtractor } from "@/lib/llm/anthropic-extractor";
import { track } from "@/lib/analytics";

describe("extractor selection", () => {
  it("defaults to the deterministic rule extractor", () => {
    expect(selectExtractor({}).name).toBe("rules");
    expect(selectExtractor({ CLAIM_EXTRACTOR: "anthropic" }).name).toBe("rules");
  });
  it("only picks the Anthropic stub with both a key and the flag", () => {
    expect(selectExtractor({ CLAIM_EXTRACTOR: "anthropic", ANTHROPIC_API_KEY: "k" }).name).toBe("anthropic");
  });
  it("ships a typed tool schema and the stub refuses to call the network", async () => {
    expect(CLAIM_TOOL_SCHEMA.name).toBe("record_claims");
    await expect(new AnthropicClaimExtractor("k").extract({ id: "x", body: "Hi" })).rejects.toThrow(/stub/);
  });
});

describe("track", () => {
  it("is a no-op that returns the captured event", () => {
    expect(track("draft_opened", { draftId: "d1" })).toEqual({ event: "draft_opened", properties: { draftId: "d1" } });
  });
});
