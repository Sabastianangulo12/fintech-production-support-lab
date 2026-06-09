import type { Database } from "sql.js";
import { required, selectAll, selectOne, toSqlParams } from "./database.js";
import type {
  AccountRecord,
  CustomerRecord,
  FixAuditLogRecord,
  InvestigationNoteRecord,
  LedgerEntryRecord,
  PendingAuthorizationHoldRecord,
  PaymentAttemptRecord,
  SupportTicketRecord,
  TransactionRecord,
  VendorEventRecord
} from "./types.js";

export class InvestigationRepository {
  constructor(private readonly db: Database) {}

  getTicket(ticketId: string): SupportTicketRecord {
    return required(
      selectOne<SupportTicketRecord>(
        this.db,
        `
          SELECT id, customer_id, payment_attempt_id, channel, priority, status, subject, description, created_at
          FROM support_tickets
          WHERE id = $ticketId
        `,
        toSqlParams({ $ticketId: ticketId })
      ),
      `No support ticket found for id ${ticketId}`
    );
  }

  getCustomer(customerId: string): CustomerRecord {
    return required(
      selectOne<CustomerRecord>(
        this.db,
        `
          SELECT id, display_name, email, created_at
          FROM customers
          WHERE id = $customerId
        `,
        toSqlParams({ $customerId: customerId })
      ),
      `No customer found for id ${customerId}`
    );
  }

  getAccount(accountId: string): AccountRecord {
    return required(
      selectOne<AccountRecord>(
        this.db,
        `
          SELECT id, customer_id, status, created_at
          FROM accounts
          WHERE id = $accountId
        `,
        toSqlParams({ $accountId: accountId })
      ),
      `No account found for id ${accountId}`
    );
  }

  getPaymentAttempt(paymentAttemptId: string): PaymentAttemptRecord {
    return required(
      selectOne<PaymentAttemptRecord>(
        this.db,
        `
          SELECT
            id,
            customer_id,
            account_id,
            amount_cents,
            currency,
            payment_method_type,
            status,
            vendor_reference,
            created_at,
            updated_at
          FROM payment_attempts
          WHERE id = $paymentAttemptId
        `,
        toSqlParams({ $paymentAttemptId: paymentAttemptId })
      ),
      `No payment attempt found for id ${paymentAttemptId}`
    );
  }

  getLedgerEntries(paymentAttemptId: string): LedgerEntryRecord[] {
    return selectAll<LedgerEntryRecord>(
      this.db,
      `
        SELECT id, payment_attempt_id, entry_type, amount_cents, currency, status, created_at
        FROM ledger_entries
        WHERE payment_attempt_id = $paymentAttemptId
        ORDER BY created_at ASC, id ASC
      `,
      toSqlParams({ $paymentAttemptId: paymentAttemptId })
    );
  }

  getTransactions(paymentAttemptId: string): TransactionRecord[] {
    return selectAll<TransactionRecord>(
      this.db,
      `
        SELECT
          id,
          customer_id,
          account_id,
          payment_attempt_id,
          transaction_type,
          amount_cents,
          currency,
          status,
          external_reference,
          created_at,
          updated_at
        FROM transactions
        WHERE payment_attempt_id = $paymentAttemptId
        ORDER BY created_at ASC, id ASC
      `,
      toSqlParams({ $paymentAttemptId: paymentAttemptId })
    );
  }

  getVendorEventRows(vendorReference: string): VendorEventRecord[] {
    return selectAll<VendorEventRecord>(
      this.db,
      `
        SELECT id, payment_attempt_id, vendor_reference, event_type, payload_json, created_at
        FROM vendor_events
        WHERE vendor_reference = $vendorReference
        ORDER BY created_at ASC, id ASC
      `,
      toSqlParams({ $vendorReference: vendorReference })
    );
  }

  getInvestigationNotes(ticketId: string): InvestigationNoteRecord[] {
    return selectAll<InvestigationNoteRecord>(
      this.db,
      `
        SELECT id, ticket_id, note_type, body, created_at
        FROM investigation_notes
        WHERE ticket_id = $ticketId
        ORDER BY created_at ASC, id ASC
      `,
      toSqlParams({ $ticketId: ticketId })
    );
  }

  getFixAuditLog(ticketId: string): FixAuditLogRecord[] {
    return selectAll<FixAuditLogRecord>(
      this.db,
      `
        SELECT id, ticket_id, actor, action, outcome, created_at
        FROM fix_audit_log
        WHERE ticket_id = $ticketId
        ORDER BY created_at ASC, id ASC
      `,
      toSqlParams({ $ticketId: ticketId })
    );
  }

  getPendingAuthorizationHolds(): PendingAuthorizationHoldRecord[] {
    return selectAll<PendingAuthorizationHoldRecord>(
      this.db,
      `
        SELECT
          ledger_entries.id AS ledger_entry_id,
          payment_attempts.id AS payment_attempt_id,
          support_tickets.id AS ticket_id,
          payment_attempts.customer_id AS customer_id,
          payment_attempts.account_id AS account_id,
          ledger_entries.amount_cents AS amount_cents,
          ledger_entries.currency AS currency,
          ledger_entries.status AS ledger_status,
          payment_attempts.vendor_reference AS vendor_reference,
          ledger_entries.created_at AS hold_created_at
        FROM ledger_entries
        INNER JOIN payment_attempts ON payment_attempts.id = ledger_entries.payment_attempt_id
        LEFT JOIN support_tickets ON support_tickets.payment_attempt_id = payment_attempts.id
        WHERE ledger_entries.entry_type = 'authorization_hold'
          AND ledger_entries.status = 'pending_release'
        ORDER BY ledger_entries.created_at ASC, ledger_entries.id ASC
      `
    );
  }
}
