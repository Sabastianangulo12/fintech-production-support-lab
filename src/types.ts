export type Severity = "info" | "warning" | "critical";

export interface CustomerRecord {
  id: string;
  display_name: string;
  email: string;
  created_at: string;
}

export interface AccountRecord {
  id: string;
  customer_id: string;
  status: string;
  created_at: string;
}

export interface PaymentAttemptRecord {
  id: string;
  customer_id: string;
  account_id: string;
  amount_cents: number;
  currency: string;
  payment_method_type: string;
  status: string;
  vendor_reference: string;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntryRecord {
  id: string;
  payment_attempt_id: string;
  entry_type: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface SupportTicketRecord {
  id: string;
  customer_id: string;
  payment_attempt_id: string | null;
  channel: string;
  priority: string;
  status: string;
  subject: string;
  description: string;
  created_at: string;
}

export interface InvestigationNoteRecord {
  id: string;
  ticket_id: string;
  note_type: string;
  body: string;
  created_at: string;
}

export interface VendorEvent {
  id: string;
  vendorReference: string;
  type: string;
  createdAt: string;
  payload: Record<string, unknown>;
}

export interface TimelineEntry {
  at: string;
  source: "support" | "internal-sql" | "vendor-api";
  title: string;
  detail: string;
  evidenceId: string;
}

export interface Finding {
  severity: Severity;
  title: string;
  detail: string;
  evidence: string[];
}

export interface AuditTrailEntry {
  at: string;
  actor: string;
  action: string;
  evidence: string;
}

export interface EngineeringHandoff {
  summary: string;
  suspectedArea: string;
  requestedAction: string;
  evidence: string[];
}

export interface InvestigationResult {
  generatedAt: string;
  ticket: SupportTicketRecord;
  customer: CustomerRecord;
  account: AccountRecord;
  paymentAttempt: PaymentAttemptRecord;
  ledgerEntries: LedgerEntryRecord[];
  investigationNotes: InvestigationNoteRecord[];
  vendorEvents: VendorEvent[];
  timeline: TimelineEntry[];
  findings: Finding[];
  disposition: string;
  customerImpact: string;
  cxDraft: string;
  engineeringHandoff: EngineeringHandoff;
  auditTrail: AuditTrailEntry[];
  operationalImprovements: string[];
}
