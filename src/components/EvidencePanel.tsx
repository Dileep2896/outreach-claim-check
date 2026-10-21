import type { CheckedClaim, Mismatch, ResearchCard, WhyNow } from "@/lib/types";
import { STATUS_ICON, STATUS_LABEL } from "./ClaimSpan";
import styles from "./queue.module.css";

const FIELD: Record<Mismatch["field"], string> = {
  ordinal: "Ordinal",
  number: "Number",
  city: "City",
  entity: "Name",
  evidence: "Evidence",
};

const title = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

function describe(m: Mismatch): string {
  if (m.field === "city") m = { ...m, draft: title(m.draft), evidence: m.evidence ? title(m.evidence) : null };
  if (m.field === "evidence") return "Nothing on the research card supports this.";
  if (m.field === "entity") return `"${m.draft}" appears nowhere on the research card.`;
  return m.evidence ? `Draft says "${m.draft}", the card says "${m.evidence}".` : `Draft says "${m.draft}", the card gives none.`;
}

export function EvidencePanel({ claim, card, whyNow }: { claim: CheckedClaim | undefined; card: ResearchCard; whyNow: WhyNow }) {
  const evidence = claim?.grounding.evidenceId ? card.facts.find((f) => f.id === claim.grounding.evidenceId) : undefined;
  return (
    <aside className={styles.evidence} aria-label="Evidence">
      <h3 className={styles.panelTitle}>Evidence</h3>
      {claim ? (
        <div className={`${styles.evidenceCard} ${styles[`ev_${claim.grounding.status}`]}`}>
          <p className={styles.evidenceStatus}>
            <span aria-hidden>{STATUS_ICON[claim.grounding.status]}</span> {STATUS_LABEL[claim.grounding.status]}
            <span className={styles.evidenceScore}>match {Math.round(claim.grounding.score * 100)}%</span>
          </p>
          <blockquote className={styles.evidenceClaim}>{claim.text}</blockquote>
          {claim.grounding.mismatches.length > 0 && (
            <ul className={styles.mismatches}>
              {claim.grounding.mismatches.map((m, i) => (
                <li key={i}><strong>{FIELD[m.field]}:</strong> {describe(m)}</li>
              ))}
            </ul>
          )}
          {evidence && (
            <div className={styles.source}>
              <p className={styles.sourceLabel}>{claim.grounding.status === "unsupported" ? "Closest research" : "Source"}</p>
              <p>{evidence.text}</p>
              <p className={styles.sourceMeta}>
                <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">{evidence.sourceLabel}</a> · {evidence.observedAt} ·{" "}
                {evidence.confidence === "fact" ? "fact" : "guess"}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className={styles.muted}>This draft makes no checkable claims about the prospect.</p>
      )}

      <h3 className={styles.panelTitle}>Why now</h3>
      <p className={`${styles.whyNow} ${whyNow.pass ? styles.whyOk : styles.whyBad}`}>
        <span aria-hidden>{whyNow.pass ? "✓" : "!"}</span> {whyNow.reason}
      </p>

      <h3 className={styles.panelTitle}>Research card</h3>
      <ul className={styles.facts}>
        {card.facts.map((f) => (
          <li key={f.id} className={f.id === evidence?.id ? styles.factActive : undefined}>
            <span className={`${styles.factTag} ${f.confidence === "guess" ? styles.factGuess : ""}`}>{f.confidence}</span>
            <span>{f.text}</span>
            <span className={styles.sourceMeta}>{f.sourceLabel} · {f.observedAt}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
