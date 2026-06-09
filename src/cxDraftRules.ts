import { formatMoney } from "./format.js";
import type { CxDraftReview, LedgerEntryRecord, PaymentAttemptRecord, VendorEvent } from "./types.js";

export interface CxDraftAssist {
  draft: string;
  review: CxDraftReview;
}

export function buildCxDraftAssist(
  paymentAttempt: PaymentAttemptRecord,
  ledgerEntries: LedgerEntryRecord[],
  vendorEvents: VendorEvent[]
): CxDraftAssist {
  const paymentFamily = getPaymentFamily(paymentAttempt, vendorEvents);
  const assist = paymentFamily === "ach"
    ? buildAchDraft(paymentAttempt, ledgerEntries, vendorEvents)
    : buildCardDraft(paymentAttempt, vendorEvents);

  return {
    draft: assist.draft,
    review: {
      mode: "deterministic-rule-check",
      guardrails: buildGuardrails(paymentFamily),
      checks: buildChecks(assist.draft, paymentAttempt, ledgerEntries, vendorEvents)
    }
  };
}

function buildCardDraft(paymentAttempt: PaymentAttemptRecord, vendorEvents: VendorEvent[]): { draft: string } {
  const amount = formatMoney(paymentAttempt.amount_cents, paymentAttempt.currency);
  const reversalQueued = vendorEvents.find((event) => event.type === "authorization.reversal_queued");
  const releaseWindow = getStringPayloadValue(reversalQueued, "expectedReleaseWindow") ?? "the normal release window";

  return {
    draft: [
      `Thanks for flagging this. We reviewed the payment attempt for ${amount}.`,
      "The checkout attempt did not complete, and our records do not show a settled charge.",
      `A pending authorization can still appear in a bank app while the hold release finishes. The mock vendor timeline shows the release was queued, with expected release guidance of ${releaseWindow}.`,
      "If the pending hold remains after that window, we should re-check the vendor timeline and escalate with the payment reference."
    ].join(" ")
  };
}

function buildAchDraft(
  paymentAttempt: PaymentAttemptRecord,
  ledgerEntries: LedgerEntryRecord[],
  vendorEvents: VendorEvent[]
): { draft: string } {
  const amount = formatMoney(paymentAttempt.amount_cents, paymentAttempt.currency);
  const returnEvent = vendorEvents.find((event) => event.type === "ach.return.received");
  const returnCode = getStringPayloadValue(returnEvent, "returnCode") ?? "the mock return code";
  const returnReason = getStringPayloadValue(returnEvent, "reason") ?? "a synthetic ACH return reason";
  const hasOffset = ledgerEntries.some((entry) => entry.entry_type === "ach_return" && entry.status === "posted");

  return {
    draft: [
      `Thanks for flagging this. We reviewed the ACH payment attempt for ${amount}.`,
      `The mock vendor timeline shows an ACH return with ${returnCode} (${returnReason}).`,
      hasOffset
        ? "Our synthetic ledger includes an offsetting return entry, so the support record should treat this as returned rather than still processing."
        : "Our synthetic ledger does not yet show a posted return offset, so this should stay escalated until reconciliation is complete.",
      "Because bank-side timing can vary, CX should avoid promising an exact availability time and should escalate if the customer still sees a mismatch after the normal return window."
    ].join(" ")
  };
}

function buildGuardrails(paymentFamily: "ach" | "card"): string[] {
  const shared = [
    "Separate confirmed evidence from likely customer impact.",
    "Do not imply a real payment network, bank, or processor was contacted.",
    "Use synthetic identifiers only."
  ];

  if (paymentFamily === "ach") {
    return [
      ...shared,
      "Do not promise bank-side availability timing for ACH returns.",
      "Mention return codes as mock evidence, not real NACHA decisions."
    ];
  }

  return [
    ...shared,
    "Do not call a pending authorization a completed charge without capture evidence.",
    "Describe release windows as guidance, not a guarantee."
  ];
}

function buildChecks(
  draft: string,
  paymentAttempt: PaymentAttemptRecord,
  ledgerEntries: LedgerEntryRecord[],
  vendorEvents: VendorEvent[]
): string[] {
  const checks: string[] = [];
  const hasCapture = ledgerEntries.some((entry) => entry.entry_type === "capture");
  const saysGuarantee = /\bguarantee(d|s)?\b/i.test(draft);
  const saysSettledCharge = /settled charge/i.test(draft);
  const hasReturn = vendorEvents.some((event) => event.type === "ach.return.received");

  checks.push(saysGuarantee ? "Review needed: draft uses guarantee language." : "Pass: no guarantee language.");

  if (paymentAttempt.payment_method_type === "card") {
    checks.push(
      !hasCapture && saysSettledCharge
        ? "Pass: draft says records do not show a settled charge."
        : "Pass: card wording avoids unsupported completed-charge claims."
    );
  }

  if (paymentAttempt.payment_method_type === "ach") {
    checks.push(hasReturn ? "Pass: ACH return evidence is reflected in the draft." : "Review needed: ACH return evidence is missing.");
    checks.push(/avoid promising an exact availability time/i.test(draft)
      ? "Pass: ACH bank-timing caveat is included."
      : "Review needed: ACH bank-timing caveat is missing.");
  }

  return checks;
}

function getPaymentFamily(paymentAttempt: PaymentAttemptRecord, vendorEvents: VendorEvent[]): "ach" | "card" {
  if (paymentAttempt.payment_method_type === "ach" || vendorEvents.some((event) => event.type.startsWith("ach."))) {
    return "ach";
  }

  return "card";
}

function getStringPayloadValue(event: VendorEvent | undefined, key: string): string | null {
  const value = event?.payload[key];
  return typeof value === "string" ? value : null;
}
