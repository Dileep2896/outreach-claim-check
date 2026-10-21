import type { Metadata } from "next";
import { TodayApp } from "@/components/TodayApp";
import { DEMO_TODAY, SEED } from "@/lib/seed";

export const metadata: Metadata = { title: "Today · Claim Check" };

export default function TodayPage() {
  return (
    <main>
      <TodayApp
        business={SEED.business}
        leads={SEED.leads}
        cards={SEED.cards}
        drafts={SEED.drafts.filter((d) => d.date === DEMO_TODAY)}
        history={SEED.history}
        today={DEMO_TODAY}
      />
    </main>
  );
}
