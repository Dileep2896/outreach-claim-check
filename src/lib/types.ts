import { z } from "zod";

/** ISO calendar date, e.g. 2026-10-21 */
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

export const Business = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  address: z.string(),
  senderName: z.string(),
  offerKeywords: z.array(z.string()).min(1),
});
export type Business = z.infer<typeof Business>;

export const MessageType = z.enum(["wholesale_intro_email", "catering_linkedin_dm", "partner_intro_email"]);
export type MessageType = z.infer<typeof MessageType>;

export const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  wholesale_intro_email: "Wholesale intro email",
  catering_linkedin_dm: "Catering LinkedIn DM",
  partner_intro_email: "Partner intro email",
};

export const Lead = z.object({
  id: z.string(),
  company: z.string(),
  contactName: z.string(),
  contactRole: z.string(),
  segment: z.string(),
  city: z.string(),
  reason: z.string(),
});
export type Lead = z.infer<typeof Lead>;

export const ResearchFact = z.object({
  id: z.string(),
  text: z.string(),
  /** A short clause that can be dropped into outreach ("the new Alameda spot"). Used by Swap. */
  mention: z.string().optional(),
  sourceUrl: z.string().url(),
  sourceLabel: z.string(),
  observedAt: IsoDate,
  confidence: z.enum(["fact", "guess"]),
});
export type ResearchFact = z.infer<typeof ResearchFact>;

export const ResearchCard = z.object({
  leadId: z.string(),
  company: z.string(),
  contactName: z.string(),
  facts: z.array(ResearchFact).min(1),
});
export type ResearchCard = z.infer<typeof ResearchCard>;

export const Channel = z.enum(["email", "linkedin"]);
export type Channel = z.infer<typeof Channel>;

export const Draft = z.object({
  id: z.string(),
  leadId: z.string(),
  date: IsoDate,
  messageType: MessageType,
  channel: Channel,
  subject: z.string().optional(),
  firstTouch: z.boolean().default(true),
  body: z.string().min(1),
});
export type Draft = z.infer<typeof Draft>;
export type DraftInput = z.input<typeof Draft>;

export const ClaimKind = z.enum(["event", "metric", "attribute", "relationship", "opinion"]);
export type ClaimKind = z.infer<typeof ClaimKind>;

export const Claim = z.object({
  id: z.string(),
  text: z.string(),
  span: z.tuple([z.number().int(), z.number().int()]),
  kind: ClaimKind,
  /** index of the sentence this claim was taken from (used by why-now) */
  sentenceIndex: z.number().int(),
});
export type Claim = z.infer<typeof Claim>;

export const GroundingStatus = z.enum(["verified", "guess", "unsupported"]);
export type GroundingStatus = z.infer<typeof GroundingStatus>;

export const Mismatch = z.object({
  field: z.enum(["ordinal", "number", "city", "entity", "evidence"]),
  draft: z.string(),
  evidence: z.string().nullable(),
});
export type Mismatch = z.infer<typeof Mismatch>;

export const Grounding = z.object({
  status: GroundingStatus,
  evidenceId: z.string().optional(),
  score: z.number(),
  mismatches: z.array(Mismatch),
});
export type Grounding = z.infer<typeof Grounding>;

export type CheckedClaim = Claim & { grounding: Grounding };

export type WhyNow = {
  pass: boolean;
  reason: string;
  claimId?: string;
  factId?: string;
};

export type ComplianceChip = {
  id: "optOut" | "address" | "subject";
  label: string;
  /** null = not applicable for this channel */
  pass: boolean | null;
  detail: string;
};

export type Verdict = "ready" | "review" | "blocked";

export type CheckResult = {
  draftId: string;
  body: string;
  claims: CheckedClaim[];
  whyNow: WhyNow;
  compliance: ComplianceChip[];
  verdict: Verdict;
  readiness: number;
  counts: Record<GroundingStatus, number>;
};

export const Decision = z.object({
  draftId: z.string(),
  messageType: MessageType,
  decidedAt: IsoDate,
  action: z.enum(["approved", "skipped"]),
  /** number of unsupported claims in the draft at the moment it was approved */
  unsupportedAtSend: z.number().int().min(0),
});
export type Decision = z.infer<typeof Decision>;

export const CheckRequest = z.object({
  leadId: z.string().min(1),
  draft: z.object({
    id: z.string().min(1),
    body: z.string().min(1).max(10_000),
    subject: z.string().max(300).optional(),
    channel: Channel.default("email"),
    messageType: MessageType.default("wholesale_intro_email"),
    firstTouch: z.boolean().default(true),
  }),
});
export type CheckRequest = z.infer<typeof CheckRequest>;
