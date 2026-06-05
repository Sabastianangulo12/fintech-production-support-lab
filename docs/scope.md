# Scope

## Objective

Build a compact fintech production-support lab that demonstrates how Sabastian investigates a synthetic customer-impacting payment issue from ticket intake through CX and engineering handoff.

The project should feel like a realistic support workflow while staying clearly fake, safe, and portfolio-friendly.

## In Scope

- Synthetic support tickets.
- Fake customers and accounts.
- Fake payment attempts.
- Fake ledger entries.
- Mock vendor API/webhook event payloads.
- SQL queries for investigation.
- A TypeScript investigation runner.
- Generated audit trail with timestamps and evidence references.
- Generated handoff report for CX and engineering.

## Out Of Scope

- Real payment processing.
- Real ACH, debit, credit, or bank integrations.
- Real customer data.
- Secrets, API keys, credentials, or tokens.
- Production deployment against live financial systems.
- Claims that this is affiliated with or modeled from OnePay internals.

## MVP Acceptance Criteria

- A reviewer can run one command to investigate `TCK-1001`.
- The command reads fake internal records and mock vendor events.
- The output distinguishes facts, likely cause, customer impact, and next steps.
- The output includes an audit trail suitable for attaching to an internal support ticket.
- The README makes the project purpose and safety boundaries obvious.

## Initial Scenario

`TCK-1001` covers a fake card authorization decline where the customer sees a pending hold. The investigation should verify whether the internal payment state, ledger state, and mock vendor timeline agree.

Expected learning signals:

- SQL investigation.
- Event timeline reconstruction.
- Support communication.
- Engineering escalation hygiene.
- Careful fintech language around pending authorizations and reversals.
