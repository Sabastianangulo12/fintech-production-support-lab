import type { Database } from "sql.js";
import { required, selectAll, selectOne, toSqlParams } from "./database.js";
import type {
  AccountRecord,
  CustomerRecord,
  InvestigationNoteRecord,
  LedgerEntryRecord,
  PaymentAttemptRecord,
  SupportTicketRecord
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
}
