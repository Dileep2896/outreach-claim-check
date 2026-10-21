import type { Business, ComplianceChip, Draft } from "./types";

const OPT_OUT = /unsubscribe|opt[\s-]?out|reply\s+["“]?stop|don't want (more )?emails/i;

/** Advisory CAN-SPAM / PECR style chips. Email only; LinkedIn messages get "not applicable". */
export function checkCompliance(
  draft: Pick<Draft, "body" | "subject" | "channel" | "firstTouch">,
  business: Pick<Business, "address">,
): ComplianceChip[] {
  if (draft.channel !== "email") {
    return [
      { id: "optOut", label: "Opt-out line", pass: null, detail: "Not needed for LinkedIn messages." },
      { id: "address", label: "Postal address", pass: null, detail: "Not needed for LinkedIn messages." },
      { id: "subject", label: "Honest subject", pass: null, detail: "LinkedIn messages have no subject." },
    ];
  }
  const optOut = OPT_OUT.test(draft.body);
  const street = business.address.split(",")[0]!.trim().toLowerCase();
  const address = draft.body.toLowerCase().includes(street);
  const subject = draft.subject?.trim() ?? "";
  const letters = subject.replace(/[^A-Za-z]/g, "");
  const fakeReply = /^(re|fwd?)\s*:/i.test(subject) && draft.firstTouch !== false;
  const shouting = letters.length >= 4 && letters === letters.toUpperCase();
  const subjectOk = subject.length > 0 && !fakeReply && !shouting;
  return [
    { id: "optOut", label: "Opt-out line", pass: optOut, detail: optOut ? "Recipient can say stop." : "Add a line such as: Reply \"stop\" and I won't email again." },
    { id: "address", label: "Postal address", pass: address, detail: address ? "Sender address is in the footer." : `Add your address (${business.address}) to the footer.` },
    {
      id: "subject",
      label: "Honest subject",
      pass: subjectOk,
      detail: !subject ? "Add a subject line." : fakeReply ? "Don't use RE:/FWD: on a first email." : shouting ? "Avoid ALL CAPS subjects." : "Subject reads as a first touch.",
    },
  ];
}
