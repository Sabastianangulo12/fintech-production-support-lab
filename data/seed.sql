INSERT INTO customers (id, display_name, email, created_at)
VALUES
  ('cus_1001', 'Jordan Lee', 'jordan.lee@example.test', '2026-05-29T14:08:00Z');

INSERT INTO accounts (id, customer_id, status, created_at)
VALUES
  ('acct_1001', 'cus_1001', 'active', '2026-05-29T14:09:00Z');

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
  );

INSERT INTO ledger_entries (id, payment_attempt_id, entry_type, amount_cents, currency, status, created_at)
VALUES
  ('led_1001_auth_hold', 'pay_1001', 'authorization_hold', 8427, 'USD', 'pending_release', '2026-06-04T19:22:12Z'),
  ('led_1001_decline_marker', 'pay_1001', 'decline_marker', 0, 'USD', 'posted', '2026-06-04T19:22:16Z');

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
  );

INSERT INTO investigation_notes (id, ticket_id, note_type, body, created_at)
VALUES
  (
    'note_1001_intake',
    'TCK-1001',
    'intake',
    'Synthetic intake note: verify internal payment state, ledger hold state, and vendor authorization timeline before responding.',
    '2026-06-04T20:05:12Z'
  );
