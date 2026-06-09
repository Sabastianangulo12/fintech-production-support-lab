import { formatMoney, formatUtcDate, sentenceList } from "./format.js";
import type { Finding, InvestigationResult, TimelineEntry } from "./types.js";

export function renderMarkdownReport(result: InvestigationResult): string {
  const payment = result.paymentAttempt;
  const amount = formatMoney(payment.amount_cents, payment.currency);

  return [
    `# Investigation Report: ${result.ticket.id}`,
    "",
    "> Synthetic portfolio lab output. This report uses fake data only and is not connected to real payment systems.",
    "",
    "## Disposition",
    result.disposition,
    "",
    "## Customer Impact",
    result.customerImpact,
    "",
    "## Ticket",
    `- Subject: ${result.ticket.subject}`,
    `- Channel: ${result.ticket.channel}`,
    `- Priority: ${result.ticket.priority}`,
    `- Status: ${result.ticket.status}`,
    `- Customer: ${result.customer.display_name} (${result.customer.id})`,
    `- Intake note: ${sentenceList(result.investigationNotes.map((note) => `${note.note_type}: ${note.body}`))}`,
    "",
    "## SQL Evidence",
    `- Account ${result.account.id}: ${result.account.status}`,
    `- Payment ${payment.id}: ${payment.status}, ${amount}, ${payment.payment_method_type}, vendor reference ${payment.vendor_reference}`,
    `- Transactions: ${sentenceList(
      result.transactions.map(
        (transaction) =>
          `${transaction.id}=${transaction.transaction_type}/${transaction.status}/${formatMoney(
            transaction.amount_cents,
            transaction.currency
          )}`
      )
    )}`,
    `- Ledger entries: ${sentenceList(
      result.ledgerEntries.map(
        (entry) =>
          `${entry.id}=${entry.entry_type}/${entry.status}/${formatMoney(entry.amount_cents, entry.currency)}`
      )
    )}`,
    `- SQLite vendor_events mirror: ${sentenceList(
      result.vendorEventRows.map((event) => `${event.id}=${event.event_type}`)
    )}`,
    `- fix_audit_log rows: ${sentenceList(
      result.fixAuditLog.map((entry) => `${entry.id}=${entry.action} -> ${entry.outcome}`)
    )}`,
    "",
    "## Vendor Event Correlation",
    ...result.vendorEvents.map(
      (event) =>
        `- ${formatUtcDate(event.createdAt)}: ${event.type} (${event.id}) for ${event.vendorReference}`
    ),
    "",
    "## Findings",
    ...result.findings.map(renderFinding),
    "",
    "## Timeline",
    ...result.timeline.map(renderTimelineEntry),
    "",
    "## CX Response Draft",
    result.cxDraft,
    "",
    "## AI-Assisted Draft Checks",
    `- Mode: ${result.cxDraftReview.mode}`,
    `- Guardrails: ${sentenceList(result.cxDraftReview.guardrails)}`,
    `- Checks: ${sentenceList(result.cxDraftReview.checks)}`,
    "",
    "## Engineering Handoff",
    `- Summary: ${result.engineeringHandoff.summary}`,
    `- Suspected area: ${result.engineeringHandoff.suspectedArea}`,
    `- Requested action: ${result.engineeringHandoff.requestedAction}`,
    `- Evidence: ${sentenceList(result.engineeringHandoff.evidence)}`,
    "",
    "## Audit Trail",
    ...result.auditTrail.map(
      (entry) => `- ${formatUtcDate(entry.at)}: ${entry.actor}: ${entry.action}. Evidence: ${entry.evidence}.`
    ),
    "",
    "## Operational Improvements",
    ...result.operationalImprovements.map((item) => `- ${item}`),
    ""
  ].join("\n");
}

function renderFinding(finding: Finding): string {
  return `- [${finding.severity.toUpperCase()}] ${finding.title}: ${finding.detail} Evidence: ${sentenceList(
    finding.evidence
  )}.`;
}

function renderTimelineEntry(entry: TimelineEntry): string {
  return `- ${formatUtcDate(entry.at)} [${entry.source}] ${entry.title}: ${entry.detail} Evidence: ${entry.evidenceId}.`;
}
