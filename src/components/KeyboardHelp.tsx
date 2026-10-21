import styles from "./queue.module.css";

const KEYS: [string, string][] = [
  ["j / k", "next / previous draft"],
  ["a", "approve (sent, simulated)"],
  ["s", "skip"],
  ["e", "edit the draft"],
  ["n", "next claim"],
  ["1 2 3", "soften / swap / remove claim"],
  ["z", "undo"],
];

export function KeyboardHelp() {
  return (
    <details className={styles.keys}>
      <summary>Keyboard</summary>
      <dl>
        {KEYS.map(([k, v]) => (
          <div key={k}><dt><kbd>{k}</kbd></dt><dd>{v}</dd></div>
        ))}
      </dl>
    </details>
  );
}
