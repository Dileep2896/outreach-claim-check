import type { Channel, CheckedClaim, ComplianceChip, Verdict, WhyNow } from "./types";

export type VerdictInput = { claims: CheckedClaim[]; whyNow: WhyNow; compliance: ComplianceChip[]; channel: Channel };

export function verdict({ claims, whyNow, compliance, channel }: VerdictInput): { verdict: Verdict; readiness: number } {
  const verified = claims.filter((c) => c.grounding.status === "verified").length;
  const readiness = Math.round((100 * verified) / Math.max(1, claims.length));
  const unsupported = claims.some((c) => c.grounding.status === "unsupported");
  const complianceFail = channel === "email" && compliance.some((c) => c.pass === false);
  if (unsupported || complianceFail) return { verdict: "blocked", readiness };
  if (claims.some((c) => c.grounding.status === "guess") || !whyNow.pass) return { verdict: "review", readiness };
  return { verdict: "ready", readiness };
}
