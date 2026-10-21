"use client";
import { useEffect, useState } from "react";
import { Decision, type Decision as DecisionT } from "@/lib/types";
import { AUTO_SEND_MIN_RATE, AUTO_SEND_MIN_SENT, ledger } from "@/lib/ledger";
import { LedgerRow } from "./LedgerRow";
import { SESSION_KEY } from "./TodayApp";
import styles from "./ledger.module.css";

function readSession(): DecisionT[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    const parsed = Decision.array().safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function LedgerView({ history }: { history: DecisionT[] }) {
  const [today, setToday] = useState<DecisionT[]>([]);
  useEffect(() => setToday(readSession()), []);
  const rows = ledger([...history, ...today]);
  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>Safety ledger</p>
        <h1 className={styles.title}>Which message types have earned auto-send?</h1>
        <p className={styles.lede}>
          A type becomes eligible after {AUTO_SEND_MIN_SENT} approved sends with at least {AUTO_SEND_MIN_RATE * 100}% sent
          with zero unsupported claims. This is the evidence an owner needs before letting anything send
          without a human.
        </p>
        {today.length > 0 && <p className={styles.session}>Includes {today.length} decision{today.length === 1 ? "" : "s"} from today&apos;s queue.</p>}
      </header>
      <ul className={styles.rows}>
        {rows.map((r) => <LedgerRow key={r.messageType} row={r} />)}
      </ul>
    </div>
  );
}
