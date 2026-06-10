# Fintech Production Support Lab

A synthetic production-support portfolio project by Sabastian Angulo.

This lab models how a Production Support Engineer investigates a fintech customer issue using SQL data, mock vendor API events, REST-style service assumptions, and a concise audit trail for CX and engineering partners.

It is not a OnePay clone and does not process real payments, bank data, card data, ACH files, credentials, or personally identifiable information. All customers, transactions, tickets, vendors, identifiers, and events are fake.

## Fast Review

This project is designed to demonstrate the practical workflow behind fintech production support:

- Investigate customer-impacting payment tickets with SQL evidence.
- Correlate internal records with mock vendor/API events.
- Generate customer-safe CX language and engineering handoff notes.
- Expose the investigation through both a CLI and REST API.
- Automate a repetitive ops check for stale authorization holds.
- Keep every data point synthetic, auditable, and safe to share publicly.

Reviewer path:

```bash
npm install
npm run verify
npm run api
```

Then open:

```text
GET http://127.0.0.1:3000/tickets/TCK-1001/investigation
GET http://127.0.0.1:3000/tickets/TCK-1002/investigation
```

## What To Look At First

- [reports/TCK-1001-investigation.md](reports/TCK-1001-investigation.md): card decline plus pending authorization hold.
- [reports/TCK-1002-investigation.md](reports/TCK-1002-investigation.md): ACH return with ledger offset.
- [reports/stale-authorization-holds.md](reports/stale-authorization-holds.md): operations automation output.
- [docs/reviewer-guide.md](docs/reviewer-guide.md): how the project maps to support-engineering work.

## Why This Exists

Production support in fintech is part debugging, part incident response, part customer communication, and part product judgment. This project is designed to show those muscles in one small, inspectable workflow:

1. A fake customer support ticket reports a payment problem.
2. The investigator checks internal SQL records.
3. The investigator compares those records against mock vendor API events.
4. The system generates an audit trail.
5. The system drafts a CX and engineering handoff report.

## MVP Scenario

The first scenario is `TCK-1001`: a synthetic customer says their card payment was declined, but they still see a pending hold.

The second scenario is `TCK-1002`: a synthetic customer asks why an ACH debit appeared complete, then reversed after a mock return event.

The intended support workflow:

- Identify the customer and payment attempt from the ticket.
- Query fake internal records for account, payment, ledger, and support-ticket state.
- Review mock vendor events for authorization, decline, reversal, and webhook timing.
- Summarize likely customer impact without over-claiming.
- Produce an audit trail and a CX/engineering handoff report with next actions.
- Expose the same investigation through a REST API.
- Run an ops automation script that finds stale authorization holds.

## Tech Stack

- Node.js
- TypeScript
- SQLite via `sql.js`
- SQL schema and seed data
- Mock JSON vendor events behind a small vendor-client abstraction
- CLI-first workflow for reproducible investigations
- Node HTTP REST API
- Vitest coverage for the core investigation logic

Implemented support workflows include a card authorization issue, ACH return issue, stale-hold automation, REST API access, and deterministic AI-style support-draft checks.

## Project Structure

```text
docs/
  ai-support-drafting.md
  api.md
  github-publish-checklist.md
  mock-vendor-api.md
  reviewer-guide.md
  runbook.md
  scope.md
data/
  schema.sql
  seed.sql
  vendor-events/
reports/
src/
  index.ts
  server.ts
```

## Getting Started

```bash
npm install
npm run build
npm test
npm run investigate
npm run investigate:ach
npm run stale-holds
```

To write the generated Markdown handoff into `reports/`:

```bash
npm run report
npm run report:ach
npm run report:stale-holds
```

To run the full verification pass:

```bash
npm run verify
```

To start the local REST API:

```bash
npm run api
```

Example endpoints:

```text
GET /health
GET /tickets/TCK-1001/investigation
GET /tickets/TCK-1001/investigation/report
GET /tickets/TCK-1002/investigation
```

## Example Output

```text
# Investigation Report: TCK-1001

## Disposition
Likely customer-visible pending authorization after a declined card attempt; no settled debit found in the synthetic internal ledger.

## Customer Impact
Customer may see the $84.27 pending hold while the reversal/release completes. Mock vendor release guidance is 1-3 business days.
```

The full report includes SQL evidence, vendor event correlation, known facts, deterministic AI-style CX draft checks, CX response draft, engineering handoff, audit trail, and operational improvement ideas.

The SQLite seed data includes synthetic `customers`, `accounts`, `payment_attempts`, `transactions`, `ledger_entries`, `vendor_events`, `support_tickets`, `investigation_notes`, and `fix_audit_log` records for both incidents.
The ACH incident uses the same fake data model and adds return-specific vendor events and ledger offsets.

## Safety And Data Boundaries

- Uses synthetic data only.
- Does not connect to payment networks, banks, processors, or vendors.
- Does not store secrets.
- Does not simulate real fraud decisions or real payment authorization.
- Focuses on support-engineering reasoning, not financial transaction execution.

## Portfolio Signal

This project is meant to demonstrate practical readiness for fintech production/product support work:

- Reading production-like data carefully.
- Comparing internal records with external event timelines.
- Communicating clearly to CX and engineering.
- Separating known facts from assumptions.
- Creating repeatable workflows that reduce operational toil.

## Role Alignment

The public OnePay Product Support Engineer posting emphasizes bridging Engineering and Customer Experience, investigating production issues, using SQL and API calls against vendor systems, TypeScript/Node.js interest, operational improvements, and clear written communication. This lab is intentionally aimed at those exact muscles while remaining independent, synthetic, and safe.
