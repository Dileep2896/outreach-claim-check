import { GET } from "@/app/api/queue/route";
import { POST } from "@/app/api/check/route";
import { InMemoryQueueRepository } from "@/lib/repo/in-memory";

describe("InMemoryQueueRepository", () => {
  it("lists drafts by date and returns cards", async () => {
    const repo = new InMemoryQueueRepository();
    expect(await repo.listDrafts("2026-10-21")).toHaveLength(8);
    expect(await repo.listDrafts("2026-10-20")).toHaveLength(0);
    expect((await repo.getCard("lead-lakeshore"))?.company).toBe("Lakeshore Coffee Co.");
    expect(await repo.getCard("missing")).toBeUndefined();
  });

  it("appends decisions to history without mutating the seed", async () => {
    const a = new InMemoryQueueRepository();
    const before = (await a.history()).length;
    await a.saveDecision({ draftId: "d-hive", messageType: "partner_intro_email", decidedAt: "2026-10-21", action: "approved", unsupportedAtSend: 0 });
    expect((await a.history()).length).toBe(before + 1);
    expect((await new InMemoryQueueRepository().history()).length).toBe(before);
  });
});

describe("GET /api/queue", () => {
  it("returns checked drafts for the date", async () => {
    const res = await GET(new Request("http://x/api/queue?date=2026-10-21"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.drafts).toHaveLength(8);
    expect(body.drafts[0].check.verdict).toBeDefined();
  });

  it("rejects a malformed date with 400", async () => {
    expect((await GET(new Request("http://x/api/queue?date=yesterday"))).status).toBe(400);
  });
});

describe("POST /api/check", () => {
  const post = (body: unknown) =>
    POST(new Request("http://x/api/check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));

  it("checks an edited draft against the lead's card", async () => {
    const res = await post({ leadId: "lead-lakeshore", draft: { id: "d-lakeshore", body: "Congrats on opening your third café in Berkeley.", subject: "Hi" } });
    expect(res.status).toBe(200);
    const r = await res.json();
    expect(r.verdict).toBe("blocked");
    expect(r.claims[0].grounding.status).toBe("unsupported");
  });

  it("returns 400 on an invalid payload", async () => {
    const res = await post({ leadId: "", draft: { id: "x" } });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_request");
  });

  it("returns 400 on non-JSON", async () => {
    const res = await POST(new Request("http://x/api/check", { method: "POST", body: "{nope" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown lead", async () => {
    expect((await post({ leadId: "nope", draft: { id: "x", body: "Hi" } })).status).toBe(404);
  });
});
