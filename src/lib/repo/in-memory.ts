import type { Decision } from "../types";
import { SEED } from "../seed";
import type { QueueRepository } from "./queue-repository";

export class InMemoryQueueRepository implements QueueRepository {
  private decisions: Decision[] = [...SEED.history];

  async business() { return SEED.business; }
  async listDrafts(date: string) { return SEED.drafts.filter((d) => d.date === date); }
  async getLead(leadId: string) { return SEED.leads.find((l) => l.id === leadId); }
  async getCard(leadId: string) { return SEED.cards.find((c) => c.leadId === leadId); }
  async saveDecision(decision: Decision) { this.decisions = [...this.decisions, decision]; }
  async history() { return [...this.decisions]; }
}
