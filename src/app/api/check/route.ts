import { CheckRequest } from "@/lib/types";
import { runCheck } from "@/lib/check";
import { InMemoryQueueRepository } from "@/lib/repo/in-memory";
import { DEMO_TODAY } from "@/lib/seed";

const repo = new InMemoryQueueRepository();

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = CheckRequest.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
  }
  const card = await repo.getCard(parsed.data.leadId);
  if (!card) return Response.json({ error: "unknown_lead" }, { status: 404 });
  return Response.json(runCheck(parsed.data.draft, card, await repo.business(), DEMO_TODAY));
}
