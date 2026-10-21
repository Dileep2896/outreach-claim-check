import type { Claim } from "../types";
import { RuleClaimExtractor, type ClaimExtractor, type ExtractableDraft } from "../claims";

/**
 * Tool definition an LLM extractor would use to return structured claims (Anthropic tool use).
 * The model returns only text + kind; spans are recovered deterministically with indexOf so the UI
 * can underline them, and grounding stays rule-based ("model reasoning + deterministic software").
 */
export const CLAIM_TOOL_SCHEMA = {
  name: "record_claims",
  description: "Record every factual claim the outreach draft makes about the prospect.",
  input_schema: {
    type: "object",
    properties: {
      claims: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: { type: "string", description: "Exact sentence or clause copied from the draft" },
            kind: { type: "string", enum: ["event", "metric", "attribute", "relationship", "opinion"] },
          },
          required: ["text", "kind"],
        },
      },
    },
    required: ["claims"],
  },
} as const;

/** Stub only. Never called unless CLAIM_EXTRACTOR=anthropic and ANTHROPIC_API_KEY are both set. */
export class AnthropicClaimExtractor implements ClaimExtractor {
  readonly name = "anthropic";
  constructor(private readonly apiKey: string) {}
  async extract(draft: ExtractableDraft): Promise<Claim[]> {
    void draft;
    void this.apiKey;
    // A real adapter would POST to the Messages API with tools: [CLAIM_TOOL_SCHEMA] and
    // tool_choice: { type: "tool", name: "record_claims" }, then map each item to a Claim.
    throw new Error("AnthropicClaimExtractor is a stub in this demo; use the rule extractor");
  }
}

export function selectExtractor(env: Record<string, string | undefined>): ClaimExtractor {
  if (env.CLAIM_EXTRACTOR === "anthropic" && env.ANTHROPIC_API_KEY) return new AnthropicClaimExtractor(env.ANTHROPIC_API_KEY);
  return new RuleClaimExtractor();
}
