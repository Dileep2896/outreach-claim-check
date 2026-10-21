// Dev-only helper that writes drafts.json + history.json deterministically. Not shipped in the bundle.
import fs from "node:fs";
const FOOTER = 'Brightside Bakery · 2150 Telegraph Ave, Oakland, CA 94612\nNot the right person? Reply "stop" and I won\'t email again.';
const d = (id, leadId, messageType, channel, subject, body) => ({ id, leadId, date: "2026-10-21", messageType, channel, ...(subject ? { subject } : {}), firstTouch: true, body });
const drafts = [
  d("d-lakeshore", "lead-lakeshore", "wholesale_intro_email", "email", "Wholesale pastries for Lakeshore",
    `Hi Dana,\n\nCongrats on opening your third café in Berkeley. We bake wholesale croissants and pastries every morning in Oakland, 15 minutes from Park Street. I read in Oaklandside that you want more local suppliers. Would a tasting box for the new team help next week?\n\nBest,\nMaria Alvarez\n${FOOTER}`),
  d("d-harborview", "lead-harborview", "catering_linkedin_dm", "linkedin", null,
    `Hi Priya,\n\nSaw that Harborview is hosting the Uptown Art Walk afterparty on Nov 7. Our catering trays (savory croissants, mini quiches) are built for standing crowds of 150 or more. I also noticed you're hiring for a new events lead. Would it help if I sent a sample menu this week?\n\nBest,\nMaria`),
  d("d-ironclad", "lead-ironclad", "partner_intro_email", "email", "A morning bun for Ironclad members",
    `Hi Marcus,\n\nCongrats on launching the 6am Rise class series. We make a high-protein morning bun that our wholesale partners sell next to coffee, and it would fit your lounge. Open to a two-week trial?\n\nBest,\nMaria Alvarez\n${FOOTER}`),
  d("d-fernfield", "lead-fernfield", "wholesale_intro_email", "email", "Croissants for the brunch rush",
    `Hi Sam,\n\nCongrats on the new weekend brunch menu at Fern & Field. Brunch crowds go through pastries fast, and our wholesale croissants arrive by 6:30am. Your 4.6 stars on Google say a lot. Could I drop off a sample tray on Saturday?\n\nBest,\nMaria Alvarez\n${FOOTER}`),
  d("d-hive", "lead-hive", "partner_intro_email", "email", "Breakfast for The Hive",
    `Hi Jen,\n\nSaw The Hive just announced a monthly member breakfast starting in November. We cater breakfast for offices around Uptown with croissants and fruit, and we could set up a standing order. With 220 members across two floors, that's a lot of breakfasts. Want me to price out the first one?\n\nBest,\nMaria Alvarez\n${FOOTER}`),
  d("d-pinewood", "lead-pinewood", "catering_linkedin_dm", "linkedin", null,
    `Hi Alex,\n\nCongrats on the move into the new Emeryville office on Hollis Street. I run catering at Brightside Bakery, and a Friday breakfast spread for a team your size is one of our most popular orders. Would a welcome-week tasting be useful?\n\nThanks,\nMaria`),
  d("d-goldenhour", "lead-goldenhour", "catering_linkedin_dm", "linkedin", null,
    `Hi Rosa,\n\nCongrats on being featured in 7x7's list of Bay Area wedding planners. Our catering team does dessert tables and late-night croissant bars for weddings up to 200 guests. Would a tasting for your next couple help?\n\nBest,\nMaria`),
  d("d-sunfield", "lead-sunfield", "wholesale_intro_email", "email", "Local pastries for Sunfield",
    `Hi Tom,\n\nI noticed Sunfield just expanded its bakery shelf with a local-makers section. We supply wholesale pastries to three East Bay grocers and deliver six days a week. Could I send over our wholesale price sheet?\n\nBest,\nMaria Alvarez\n${FOOTER}`),
];
fs.writeFileSync(new URL("./drafts.json", import.meta.url), JSON.stringify(drafts, null, 2) + "\n");

// history: deterministic decisions per message type
const plan = [
  ["partner_intro_email", 60, 58, 4],   // 96.7% clean over 60 -> eligible
  ["wholesale_intro_email", 48, 44, 6], // 91.7% clean -> close
  ["catering_linkedin_dm", 30, 21, 5],  // 70% clean
];
const history = [];
let n = 0;
for (const [type, sent, clean, skipped] of plan) {
  const dirtyEvery = Math.floor(sent / (sent - clean));
  let dirtyLeft = sent - clean;
  for (let i = 0; i < sent; i++) {
    const day = new Date(Date.UTC(2026, 6, 1) + (i % 110) * 86400000).toISOString().slice(0, 10);
    const dirty = dirtyLeft > 0 && i % dirtyEvery === dirtyEvery - 1;
    if (dirty) dirtyLeft--;
    history.push({ draftId: `h-${++n}`, messageType: type, decidedAt: day, action: "approved", unsupportedAtSend: dirty ? 1 : 0 });
  }
  for (let i = 0; i < skipped; i++) {
    history.push({ draftId: `h-${++n}`, messageType: type, decidedAt: "2026-10-1" + i, action: "skipped", unsupportedAtSend: 1 });
  }
}
fs.writeFileSync(new URL("./history.json", import.meta.url), JSON.stringify(history) + "\n");
console.log(drafts.length, "drafts,", history.length, "decisions");
