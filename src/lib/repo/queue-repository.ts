import type { Business, Decision, Draft, Lead, ResearchCard } from "../types";

/**
 * Data access for the morning queue. Shaped like a thin Supabase/Postgres repository (see
 * supabase/migrations/0001_claim_check.sql). The demo uses the in-memory implementation.
 */
export interface QueueRepository {
  business(): Promise<Business>;
  listDrafts(date: string): Promise<Draft[]>;
  getLead(leadId: string): Promise<Lead | undefined>;
  getCard(leadId: string): Promise<ResearchCard | undefined>;
  saveDecision(decision: Decision): Promise<void>;
  history(): Promise<Decision[]>;
}

// A Supabase implementation would look like:
//   const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
//   listDrafts: supabase.from("drafts").select("*").eq("date", date)
//   getCard:    supabase.from("research_facts").select("*").eq("lead_id", leadId)
//   saveDecision: supabase.from("decisions").insert({...})
