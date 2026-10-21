import businessJson from "@/data/business.json";
import leadsJson from "@/data/leads.json";
import cardsJson from "@/data/cards.json";
import draftsJson from "@/data/drafts.json";
import historyJson from "@/data/history.json";
import { Business, Decision, Draft, Lead, ResearchCard } from "./types";

/** Seed data, validated with zod at load so a bad edit to the JSON fails fast. */
export const SEED = {
  business: Business.parse(businessJson),
  leads: Lead.array().parse(leadsJson),
  cards: ResearchCard.array().parse(cardsJson),
  drafts: Draft.array().parse(draftsJson),
  history: Decision.array().parse(historyJson),
};

/** The demo's fixed "today" so the why-now window is reproducible. */
export const DEMO_TODAY = "2026-10-21";
