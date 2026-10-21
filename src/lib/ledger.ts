import { MESSAGE_TYPE_LABELS, type Decision, type MessageType } from "./types";

export const AUTO_SEND_MIN_SENT = 50;
export const AUTO_SEND_MIN_RATE = 0.95;

export type LedgerRow = {
  messageType: MessageType;
  label: string;
  sent: number;
  cleanSent: number;
  skipped: number;
  cleanRate: number;
  eligible: boolean;
  /** clean sends in a row still needed before this type can auto-send */
  cleanSendsToEligible: number;
};

function sendsToEligible(sent: number, clean: number): number {
  for (let k = 0; k < 10_000; k++) {
    if (sent + k >= AUTO_SEND_MIN_SENT && (clean + k) / (sent + k) >= AUTO_SEND_MIN_RATE) return k;
  }
  return Infinity;
}

/**
 * Per-message-type safety ledger. "Clean" = approved with 0 unsupported claims at send time. A type becomes
 * eligible for auto-send at >= 50 sends with >= 95% clean, the evidence an owner needs before turning on auto-send.
 */
export function ledger(history: Decision[]): LedgerRow[] {
  const groups = new Map<MessageType, { sent: number; clean: number; skipped: number }>();
  for (const d of history) {
    const g = groups.get(d.messageType) ?? { sent: 0, clean: 0, skipped: 0 };
    if (d.action === "approved") {
      g.sent++;
      if (d.unsupportedAtSend === 0) g.clean++;
    } else g.skipped++;
    groups.set(d.messageType, g);
  }
  const order = Object.keys(MESSAGE_TYPE_LABELS) as MessageType[];
  return [...groups.entries()]
    .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
    .map(([messageType, g]) => {
      const cleanRate = g.sent === 0 ? 0 : g.clean / g.sent;
      return {
        messageType,
        label: MESSAGE_TYPE_LABELS[messageType],
        sent: g.sent,
        cleanSent: g.clean,
        skipped: g.skipped,
        cleanRate,
        eligible: g.sent >= AUTO_SEND_MIN_SENT && cleanRate >= AUTO_SEND_MIN_RATE,
        cleanSendsToEligible: sendsToEligible(g.sent, g.clean),
      };
    });
}
