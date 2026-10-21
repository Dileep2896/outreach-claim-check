import { IsoDate } from "@/lib/types";
import { runCheck } from "@/lib/check";
import { InMemoryQueueRepository } from "@/lib/repo/in-memory";
import { DEMO_TODAY } from "@/lib/seed";

const repo = new InMemoryQueueRepository();

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? DEMO_TODAY;
  const parsed = IsoDate.safeParse(date);
  if (!parsed.success) return Response.json({ error: "invalid_date", detail: parsed.error.issues[0]?.message }, { status: 400 });
  const business = await repo.business();
  const drafts = await repo.listDrafts(parsed.data);
  const out = [];
  for (const draft of drafts) {
    const card = await repo.getCard(draft.leadId);
    if (!card) continue;
    out.push({ draft, check: runCheck(draft, card, business, DEMO_TODAY) });
  }
  return Response.json({ date: parsed.data, drafts: out });
}
