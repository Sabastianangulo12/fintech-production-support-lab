import { buildCxDraftAssist } from "./cxDraftRules.js";
import { loadSeededDatabase } from "./database.js";
import { formatMoney } from "./format.js";
import { dataFile } from "./paths.js";
import { InvestigationRepository } from "./repository.js";
import type {
  AuditTrailEntry,
  EngineeringHandoff,
  FixAuditLogRecord,
  Finding,
  InvestigationResult,
  LedgerEntryRecord,
  PaymentAttemptRecord,
  SupportTicketRecord,
  TimelineEntry,
  TransactionRecord,
  VendorEvent
} from "./types.js";
import { FileVendorApiClient, type VendorApiClient } from "./vendorClient.js";

export interface InvestigationOptions {
  generatedAt?: string;
  schemaPath?: string;
  seedPath?: string;
  vendorClient?: VendorApiClient;
}

export async function investigateTicket(
  ticketId: string,
  options: InvestigationOptions = {}
): Promise<InvestigationResult> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const db = await loadSeededDatabase(
    options.schemaPath ?? dataFile("schema.sql"),
    options.seedPath ?? dataFile("seed.sql")
  );

  try {
    const repository = new InvestigationRepository(db);
    const vendorClient =
      options.vendorClient ?? new FileVendorApiClient(dataFile("vendor-events", "card-auth-events.json"));

    const ticket = repository.getTicket(ticketId);

    if (!ticket.payment_attempt_id) {
      throw new Error(`Ticket ${ticketId} is not linked to a payment attempt`);
    }

    const paymentAttempt = repository.getPaymentAttempt(ticket.payment_attempt_id);
    const [
      customer,
      account,
      transactions,
      ledgerEntries,
      investigationNotes,
      vendorEventRows,
      fixAuditLog,
      vendorEvents
    ] = await Promise.all([
      Promise.resolve(repository.getCustomer(ticket.customer_id)),
      Promise.resolve(repository.getAccount(paymentAttempt.account_id)),
      Promise.resolve(repository.getTransactions(paymentAttempt.id)),
      Promise.resolve(repository.getLedgerEntries(paymentAttempt.id)),
      Promise.resolve(repository.getInvestigationNotes(ticket.id)),
      Promise.resolve(repository.getVendorEventRows(paymentAttempt.vendor_reference)),
      Promise.resolve(repository.getFixAuditLog(ticket.id)),
      vendorClient.getAuthorizationEvents(paymentAttempt.vendor_reference)
    ]);

    const findings = buildFindings(paymentAttempt, ledgerEntries, vendorEventRows, vendorEvents);
    const disposition = buildDisposition(paymentAttempt, ledgerEntries, vendorEvents);
    const customerImpact = buildCustomerImpact(paymentAttempt, ledgerEntries, vendorEvents);
    const engineeringHandoff = buildEngineeringHandoff(paymentAttempt, ledgerEntries, vendorEvents);
    const timeline = buildTimeline(ticket, paymentAttempt, transactions, ledgerEntries, fixAuditLog, vendorEvents);
    const auditTrail = buildAuditTrail(generatedAt, ticket, paymentAttempt, transactions, ledgerEntries, vendorEvents);
    const cxDraftAssist = buildCxDraftAssist(paymentAttempt, ledgerEntries, vendorEvents);

    return {
      generatedAt,
      ticket,
      customer,
      account,
      paymentAttempt,
      transactions,
      ledgerEntries,
      investigationNotes,
      vendorEventRows,
      fixAuditLog,
      vendorEvents,
      timeline,
      findings,
      disposition,
      customerImpact,
      cxDraft: cxDraftAssist.draft,
      cxDraftReview: cxDraftAssist.review,
      engineeringHandoff,
      auditTrail,
      operationalImprovements: buildOperationalImprovements()
    };
  } finally {
    db.close();
  }
}

function buildFindings(
  paymentAttempt: PaymentAttemptRecord,
  ledgerEntries: LedgerEntryRecord[],
  vendorEventRows: { id: string; event_type: string }[],
  vendorEvents: VendorEvent[]
): Finding[] {
  const findings: Finding[] = [];
  const amount = formatMoney(paymentAttempt.amount_cents, paymentAttempt.currency);
  const captureEntries = ledgerEntries.filter((entry) => entry.entry_type === "capture");
  const pendingHold = ledgerEntries.find(
    (entry) => entry.entry_type === "authorization_hold" && entry.status === "pending_release"
  );
  const achDebit = ledgerEntries.find((entry) => entry.entry_type === "ach_debit");
  const achReturn = ledgerEntries.find((entry) => entry.entry_type === "ach_return");
  const vendorDecline = vendorEvents.find((event) => event.type === "authorization.declined");
  const reversalQueued = vendorEvents.find((event) => event.type === "authorization.reversal_queued");
  const reversalCompleted = vendorEvents.find((event) => event.type === "authorization.reversal_completed");
  const achReturnReceived = vendorEvents.find((event) => event.type === "ach.return.received");

  if (paymentAttempt.status === "declined" && vendorDecline) {
    findings.push({
      severity: "info",
      title: "Internal and vendor decline states match",
      detail: `Internal payment ${paymentAttempt.id} is declined and vendor event ${vendorDecline.id} also reports authorization decline for ${amount}.`,
      evidence: [paymentAttempt.id, vendorDecline.id]
    });
  }

  if (paymentAttempt.payment_method_type === "card" && captureEntries.length === 0) {
    findings.push({
      severity: "info",
      title: "No settled debit found",
      detail:
        "The synthetic ledger has no capture entry for this payment attempt, so the evidence does not support calling this a completed charge.",
      evidence: ledgerEntries.map((entry) => entry.id)
    });
  }

  if (paymentAttempt.status === "returned" && achReturnReceived) {
    findings.push({
      severity: "info",
      title: "Internal and vendor ACH return states match",
      detail: `Internal payment ${paymentAttempt.id} is returned and vendor event ${achReturnReceived.id} reports an ACH return for ${amount}.`,
      evidence: [paymentAttempt.id, achReturnReceived.id]
    });
  }

  if (achDebit && achReturn && achDebit.amount_cents + achReturn.amount_cents === 0) {
    findings.push({
      severity: "info",
      title: "ACH debit is offset by posted return",
      detail: `Ledger entry ${achDebit.id} is offset by return entry ${achReturn.id}, so the synthetic ledger nets this returned ACH attempt to zero.`,
      evidence: [achDebit.id, achReturn.id]
    });
  }

  if (pendingHold && reversalQueued && !reversalCompleted) {
    findings.push({
      severity: "warning",
      title: "Pending hold release is queued but not complete",
      detail: `Ledger entry ${pendingHold.id} is still pending release, while vendor event ${reversalQueued.id} says release was queued. No completed release event is present in the mock vendor timeline.`,
      evidence: [pendingHold.id, reversalQueued.id]
    });
  }

  if (vendorEvents.length === 0) {
    findings.push({
      severity: "critical",
      title: "Vendor timeline missing",
      detail: `No vendor events were found for vendor reference ${paymentAttempt.vendor_reference}.`,
      evidence: [paymentAttempt.vendor_reference]
    });
  }

  if (vendorEventRows.length === vendorEvents.length && vendorEventRows.length > 0) {
    findings.push({
      severity: "info",
      title: "SQLite vendor event mirror matches mock API fixture count",
      detail: `The vendor_events SQL mirror contains ${vendorEventRows.length} rows for ${paymentAttempt.vendor_reference}, matching the mock vendor API fixture used by the CLI.`,
      evidence: vendorEventRows.map((event) => event.id)
    });
  }

  return findings;
}

function buildDisposition(
  paymentAttempt: PaymentAttemptRecord,
  ledgerEntries: LedgerEntryRecord[],
  vendorEvents: VendorEvent[]
): string {
  const hasCapture = ledgerEntries.some((entry) => entry.entry_type === "capture");
  const hasDecline = vendorEvents.some((event) => event.type === "authorization.declined");
  const hasAchReturn = vendorEvents.some((event) => event.type === "ach.return.received");

  if (paymentAttempt.status === "declined" && hasDecline && !hasCapture) {
    return "Likely customer-visible pending authorization after a declined card attempt; no settled debit found in the synthetic internal ledger.";
  }

  if (paymentAttempt.status === "returned" && hasAchReturn) {
    return "ACH debit returned after settlement; synthetic ledger includes an offsetting return entry and CX should explain the return without promising bank-side timing.";
  }

  return "Needs deeper review because internal payment state, ledger state, and vendor event state do not fully align.";
}

function buildCustomerImpact(
  paymentAttempt: PaymentAttemptRecord,
  ledgerEntries: LedgerEntryRecord[],
  vendorEvents: VendorEvent[]
): string {
  const amount = formatMoney(paymentAttempt.amount_cents, paymentAttempt.currency);
  const achReturnReceived = vendorEvents.find((event) => event.type === "ach.return.received");
  const pendingHold = ledgerEntries.some(
    (entry) => entry.entry_type === "authorization_hold" && entry.status === "pending_release"
  );
  const reversalQueued = vendorEvents.find((event) => event.type === "authorization.reversal_queued");
  const releaseWindow = getStringPayloadValue(reversalQueued, "expectedReleaseWindow") ?? "the vendor release window";

  if (paymentAttempt.payment_method_type === "ach" && achReturnReceived) {
    const returnCode = getStringPayloadValue(achReturnReceived, "returnCode") ?? "the mock return code";
    const reason = getStringPayloadValue(achReturnReceived, "reason") ?? "a synthetic ACH return reason";
    return `Customer's ${amount} ACH debit was returned with synthetic code ${returnCode} (${reason}). The ledger has a posted return offset; CX should avoid promising exact bank-side timing.`;
  }

  if (pendingHold) {
    return `Customer may see the ${amount} pending hold while the reversal/release completes. Mock vendor release guidance is ${releaseWindow}.`;
  }

  return `No active synthetic hold is visible in the internal ledger for the ${amount} payment attempt.`;
}

function buildEngineeringHandoff(
  paymentAttempt: PaymentAttemptRecord,
  ledgerEntries: LedgerEntryRecord[],
  vendorEvents: VendorEvent[]
): EngineeringHandoff {
  const pendingHold = ledgerEntries.find(
    (entry) => entry.entry_type === "authorization_hold" && entry.status === "pending_release"
  );
  const reversalQueued = vendorEvents.find((event) => event.type === "authorization.reversal_queued");
  const achReturnReceived = vendorEvents.find((event) => event.type === "ach.return.received");

  if (paymentAttempt.payment_method_type === "ach" && achReturnReceived) {
    return {
      summary: `Payment ${paymentAttempt.id} is returned, vendor reference ${paymentAttempt.vendor_reference} has ACH return event ${achReturnReceived.id}, and the ledger has a posted return offset.`,
      suspectedArea: "Synthetic ACH return reconciliation",
      requestedAction:
        "Confirm the ACH return reason is surfaced to CX and add monitoring for ACH payments that show settled without a matching return offset after a return event.",
      evidence: [
        paymentAttempt.id,
        paymentAttempt.vendor_reference,
        ...ledgerEntries.map((entry) => entry.id),
        ...vendorEvents.map((event) => event.id)
      ]
    };
  }

  return {
    summary: `Payment ${paymentAttempt.id} is declined, vendor reference ${paymentAttempt.vendor_reference} has a queued reversal/release event, and no capture ledger entry exists.`,
    suspectedArea: "Synthetic card authorization webhook reconciliation",
    requestedAction:
      pendingHold && reversalQueued
        ? "Confirm that a later reversal-completed webhook would move the authorization hold from pending_release to released; add an alert for holds pending release beyond the expected vendor window."
        : "Review internal state and vendor timeline mismatch before CX sends a final resolution.",
    evidence: [
      paymentAttempt.id,
      paymentAttempt.vendor_reference,
      ...ledgerEntries.map((entry) => entry.id),
      ...vendorEvents.map((event) => event.id)
    ]
  };
}

function buildTimeline(
  ticket: SupportTicketRecord,
  paymentAttempt: PaymentAttemptRecord,
  transactions: TransactionRecord[],
  ledgerEntries: LedgerEntryRecord[],
  fixAuditLog: FixAuditLogRecord[],
  vendorEvents: VendorEvent[]
): TimelineEntry[] {
  const timeline: TimelineEntry[] = [
    {
      at: paymentAttempt.created_at,
      source: "internal-sql",
      title: "Payment attempt created",
      detail: `${paymentAttempt.payment_method_type} attempt ${paymentAttempt.id} created for ${formatMoney(
        paymentAttempt.amount_cents,
        paymentAttempt.currency
      )}.`,
      evidenceId: paymentAttempt.id
    },
    {
      at: paymentAttempt.updated_at,
      source: "internal-sql",
      title: "Payment attempt updated",
      detail: `Internal status is ${paymentAttempt.status}.`,
      evidenceId: paymentAttempt.id
    },
    {
      at: ticket.created_at,
      source: "support",
      title: "Support ticket opened",
      detail: `${ticket.subject}.`,
      evidenceId: ticket.id
    },
    ...transactions.map<TimelineEntry>((transaction) => ({
      at: transaction.created_at,
      source: "internal-sql",
      title: `Transaction ${transaction.transaction_type}`,
      detail: `${transaction.status} ${formatMoney(transaction.amount_cents, transaction.currency)} transaction row.`,
      evidenceId: transaction.id
    })),
    ...ledgerEntries.map<TimelineEntry>((entry) => ({
      at: entry.created_at,
      source: "internal-sql",
      title: `Ledger ${entry.entry_type}`,
      detail: `${entry.status} ${formatMoney(entry.amount_cents, entry.currency)} ledger row.`,
      evidenceId: entry.id
    })),
    ...vendorEvents.map<TimelineEntry>((event) => ({
      at: event.createdAt,
      source: "vendor-api",
      title: event.type,
      detail: `Vendor event for ${event.vendorReference}.`,
      evidenceId: event.id
    })),
    ...fixAuditLog.map<TimelineEntry>((entry) => ({
      at: entry.created_at,
      source: "fix-audit-log",
      title: entry.action,
      detail: entry.outcome,
      evidenceId: entry.id
    }))
  ];

  return timeline.sort((left, right) => {
    const byTimestamp = left.at.localeCompare(right.at);
    return byTimestamp === 0 ? left.evidenceId.localeCompare(right.evidenceId) : byTimestamp;
  });
}

function buildAuditTrail(
  generatedAt: string,
  ticket: SupportTicketRecord,
  paymentAttempt: PaymentAttemptRecord,
  transactions: TransactionRecord[],
  ledgerEntries: LedgerEntryRecord[],
  vendorEvents: VendorEvent[]
): AuditTrailEntry[] {
  return [
    {
      at: generatedAt,
      actor: "support-lab-cli",
      action: "Loaded support ticket from SQLite seed data",
      evidence: ticket.id
    },
    {
      at: generatedAt,
      actor: "support-lab-cli",
      action: "Queried payment attempt, transaction, and ledger entries",
      evidence: [paymentAttempt.id, ...transactions.map((entry) => entry.id), ...ledgerEntries.map((entry) => entry.id)].join(", ")
    },
    {
      at: generatedAt,
      actor: "support-lab-cli",
      action: "Fetched matching mock vendor events",
      evidence: vendorEvents.map((event) => event.id).join(", ")
    },
    {
      at: generatedAt,
      actor: "support-lab-cli",
      action: "Generated CX draft and engineering handoff from known evidence",
      evidence: "report"
    }
  ];
}

function buildOperationalImprovements(): string[] {
  return [
    "Add an automated queue for authorization holds that remain pending_release beyond the vendor release window.",
    "Generate a support-safe CX draft only after internal ledger state and vendor event state are both attached to the ticket.",
    "Add a webhook reconciliation check that alerts when authorization.reversal_queued is not followed by authorization.reversal_completed.",
    "Add ACH return monitoring that checks for returned payment attempts without a matching posted ledger offset.",
    "Run deterministic CX draft checks before a response is handed to Customer Experience."
  ];
}

function getStringPayloadValue(event: VendorEvent | undefined, key: string): string | null {
  const value = event?.payload[key];
  return typeof value === "string" ? value : null;
}
