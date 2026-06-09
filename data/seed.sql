INSERT INTO customers (id, display_name, email, created_at)
VALUES
  ('cus_1001', 'Jordan Lee', 'jordan.lee@example.test', '2026-05-29T14:08:00Z'),
  ('cus_1002', 'Maya Thompson', 'maya.thompson@example.test', '2026-05-30T16:42:00Z');

INSERT INTO accounts (id, customer_id, status, created_at)
VALUES
  ('acct_1001', 'cus_1001', 'active', '2026-05-29T14:09:00Z'),
  ('acct_1002', 'cus_1002', 'active', '2026-05-30T16:44:00Z');

INSERT INTO payment_attempts (
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
)
VALUES
  (
    'pay_1001',
    'cus_1001',
    'acct_1001',
    8427,
    'USD',
    'card',
    'declined',
    'ven_auth_8f41_demo',
    '2026-06-04T19:22:11Z',
    '2026-06-04T19:22:16Z'
  ),
  (
    'pay_1002',
    'cus_1002',
    'acct_1002',
    12500,
    'USD',
    'ach',
    'returned',
    'ven_ach_9c22_demo',
    '2026-06-03T15:14:05Z',
    '2026-06-05T11:31:40Z'
  );

INSERT INTO transactions (
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
)
VALUES
  (
    'txn_1001',
    'cus_1001',
    'acct_1001',
    'pay_1001',
    'card_authorization',
    8427,
    'USD',
    'authorization_hold_pending_release',
    'ven_auth_8f41_demo',
    '2026-06-04T19:22:12Z',
    '2026-06-04T19:22:18Z'
  ),
  (
    'txn_1002',
    'cus_1002',
    'acct_1002',
    'pay_1002',
    'ach_debit',
    12500,
    'USD',
    'returned',
    'ven_ach_9c22_demo',
    '2026-06-03T15:14:06Z',
    '2026-06-05T11:31:40Z'
  );

INSERT INTO ledger_entries (id, payment_attempt_id, entry_type, amount_cents, currency, status, created_at)
VALUES
  ('led_1001_auth_hold', 'pay_1001', 'authorization_hold', 8427, 'USD', 'pending_release', '2026-06-04T19:22:12Z'),
  ('led_1001_decline_marker', 'pay_1001', 'decline_marker', 0, 'USD', 'posted', '2026-06-04T19:22:16Z'),
  ('led_1002_ach_debit', 'pay_1002', 'ach_debit', 12500, 'USD', 'posted', '2026-06-04T08:10:00Z'),
  ('led_1002_ach_return', 'pay_1002', 'ach_return', -12500, 'USD', 'posted', '2026-06-05T11:31:40Z');

INSERT INTO vendor_events (id, payment_attempt_id, vendor_reference, event_type, payload_json, created_at)
VALUES
  (
    'evt_vendor_1001_auth_requested',
    'pay_1001',
    'ven_auth_8f41_demo',
    'authorization.requested',
    '{"amountCents":8427,"currency":"USD","merchantCategory":"synthetic_checkout","paymentMethodType":"card"}',
    '2026-06-04T19:22:11Z'
  ),
  (
    'evt_vendor_1001_auth_declined',
    'pay_1001',
    'ven_auth_8f41_demo',
    'authorization.declined',
    '{"declineCode":"insufficient_funds_demo","networkAdvice":"do_not_retry_without_customer_action"}',
    '2026-06-04T19:22:15Z'
  ),
  (
    'evt_vendor_1001_reversal_queued',
    'pay_1001',
    'ven_auth_8f41_demo',
    'authorization.reversal_queued',
    '{"reason":"declined_authorization_hold_release","expectedReleaseWindow":"1-3 business days"}',
    '2026-06-04T19:22:18Z'
  ),
  (
    'evt_vendor_1002_ach_initiated',
    'pay_1002',
    'ven_ach_9c22_demo',
    'ach.debit.initiated',
    '{"amountCents":12500,"currency":"USD","secCode":"WEB","direction":"debit"}',
    '2026-06-03T15:14:05Z'
  ),
  (
    'evt_vendor_1002_ach_settled',
    'pay_1002',
    'ven_ach_9c22_demo',
    'ach.debit.settled',
    '{"settlementBatch":"synthetic_batch_20260604","effectiveDate":"2026-06-04"}',
    '2026-06-04T08:10:00Z'
  ),
  (
    'evt_vendor_1002_ach_returned',
    'pay_1002',
    'ven_ach_9c22_demo',
    'ach.return.received',
    '{"returnCode":"R02","reason":"account_closed_demo","receivedInBatch":"synthetic_batch_20260605"}',
    '2026-06-05T11:31:40Z'
  );

INSERT INTO support_tickets (
  id,
  customer_id,
  payment_attempt_id,
  channel,
  priority,
  status,
  subject,
  description,
  created_at
)
VALUES
  (
    'TCK-1001',
    'cus_1001',
    'pay_1001',
    'email',
    'normal',
    'open',
    'Customer sees pending hold after declined card payment',
    'Customer reports that checkout failed, but their bank app still shows a pending card hold for $84.27.',
    '2026-06-04T20:03:44Z'
  ),
  (
    'TCK-1002',
    'cus_1002',
    'pay_1002',
    'chat',
    'high',
    'open',
    'Customer asks why ACH payment was reversed after showing complete',
    'Customer reports that an ACH debit appeared complete, then their balance changed after a return notice.',
    '2026-06-05T12:02:19Z'
  );

INSERT INTO investigation_notes (id, ticket_id, note_type, body, created_at)
VALUES
  (
    'note_1001_intake',
    'TCK-1001',
    'intake',
    'Synthetic intake note: verify internal payment state, ledger hold state, and vendor authorization timeline before responding.',
    '2026-06-04T20:05:12Z'
  ),
  (
    'note_1002_intake',
    'TCK-1002',
    'intake',
    'Synthetic intake note: verify ACH return code, ledger offset, and customer-safe timing language before responding.',
    '2026-06-05T12:04:03Z'
  );

INSERT INTO fix_audit_log (id, ticket_id, actor, action, outcome, created_at)
VALUES
  (
    'fixlog_1001_triage_started',
    'TCK-1001',
    'support-lab-cli',
    'Started synthetic production-support investigation',
    'Ticket linked to customer cus_1001 and payment pay_1001.',
    '2026-06-04T20:06:01Z'
  ),
  (
    'fixlog_1001_evidence_compared',
    'TCK-1001',
    'support-lab-cli',
    'Compared SQL transaction state with vendor event mirror',
    'No capture found; reversal is queued but no completion event is present.',
    '2026-06-04T20:07:34Z'
  ),
  (
    'fixlog_1002_triage_started',
    'TCK-1002',
    'support-lab-cli',
    'Started synthetic ACH return investigation',
    'Ticket linked to customer cus_1002 and payment pay_1002.',
    '2026-06-05T12:05:27Z'
  ),
  (
    'fixlog_1002_return_verified',
    'TCK-1002',
    'support-lab-cli',
    'Verified ACH return evidence against ledger offset',
    'Vendor return code R02 is mirrored in SQL and ledger offset is posted.',
    '2026-06-05T12:08:11Z'
  );
