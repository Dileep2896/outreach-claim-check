import type { Metadata } from "next";
import { LedgerView } from "@/components/LedgerView";
import { SEED } from "@/lib/seed";

export const metadata: Metadata = { title: "Ledger · Claim Check" };

export default function LedgerPage() {
  return (
    <main>
      <LedgerView history={SEED.history} />
    </main>
  );
}
