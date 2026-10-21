import { DEMO_TODAY, SEED } from "@/lib/seed";

export const { business, leads, cards, drafts, history } = SEED;
export const TODAY = DEMO_TODAY;

export function draftById(id: string) {
  const d = drafts.find((x) => x.id === id);
  if (!d) throw new Error(`no draft ${id}`);
  return d;
}
export function cardFor(leadId: string) {
  const c = cards.find((x) => x.leadId === leadId);
  if (!c) throw new Error(`no card ${leadId}`);
  return c;
}
