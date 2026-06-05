# Investigation Runbook

This runbook describes the synthetic workflow behind `TCK-1001`.

## Command

```bash
npm run investigate
```

The CLI loads `data/schema.sql` and `data/seed.sql` into an in-memory SQLite database, looks up the support ticket, retrieves related payment and ledger rows, then correlates those rows with mock vendor authorization events.

## Operator Checklist

1. Confirm the support ticket is tied to the expected customer and payment attempt.
2. Confirm internal payment state from SQL.
3. Confirm ledger entries do not show a settled debit.
4. Compare internal state with vendor authorization events.
5. Identify any timing gap or missing webhook.
6. Draft a customer-safe CX response.
7. Draft an engineering handoff only for actions that require engineering follow-up.

## SQL Starting Points

```sql
SELECT *
FROM support_tickets
WHERE id = 'TCK-1001';
```

```sql
SELECT *
FROM payment_attempts
WHERE id = 'pay_1001';
```

```sql
SELECT *
FROM ledger_entries
WHERE payment_attempt_id = 'pay_1001'
ORDER BY created_at ASC;
```

## Decision Rules

- If payment status is `declined` and no ledger entry has `entry_type = 'capture'`, do not call it a completed charge.
- If an authorization hold is still `pending_release`, tell CX that the customer may still see a pending hold.
- If the vendor timeline includes `authorization.reversal_queued`, report that release has been queued, not completed.
- If the expected release window passes without a release/completion event, escalate to engineering/vendor operations.

## Escalation Quality Bar

An engineering handoff should include:

- Ticket id.
- Payment attempt id.
- Vendor reference.
- Internal state.
- Vendor event sequence.
- Customer impact.
- Specific requested action.
- Evidence links or row ids.
