CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE payment_attempts (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  payment_method_type TEXT NOT NULL,
  status TEXT NOT NULL,
  vendor_reference TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE TABLE ledger_entries (
  id TEXT PRIMARY KEY,
  payment_attempt_id TEXT NOT NULL,
  entry_type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (payment_attempt_id) REFERENCES payment_attempts(id)
);

CREATE TABLE support_tickets (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  payment_attempt_id TEXT,
  channel TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (payment_attempt_id) REFERENCES payment_attempts(id)
);

CREATE TABLE investigation_notes (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  note_type TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id)
);
