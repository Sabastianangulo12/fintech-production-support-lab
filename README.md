# Fintech Production Support Lab

A synthetic production-support portfolio project by Sabastian Angulo.

This lab models how a Production Support Engineer investigates a fintech customer issue using SQL data, mock vendor API events, REST-style service assumptions, and a concise audit trail for CX and engineering partners.

It is not a OnePay clone and does not process real payments, bank data, card data, ACH files, credentials, or personally identifiable information. All customers, transactions, tickets, vendors, identifiers, and events are fake.

## Why This Exists

Production support in fintech is part debugging, part incident response, part customer communication, and part product judgment. This project is designed to show those muscles in one small, inspectable workflow:

1. A fake customer support ticket reports a payment problem.
2. The investigator checks internal SQL records.
3. The investigator compares those records against mock vendor API events.
4. The system generates an audit trail.
5. The system drafts a CX and engineering handoff report.

## MVP Scenario

The first scenario is `TCK-1001`: a synthetic customer says their card payment was declined, but they still see a pending hold.

The intended support workflow:

- Identify the customer and payment attempt from the ticket.
- Query fake internal records for account, payment, ledger, and support-ticket state.
- Review mock vendor events for authorization, decline, reversal, and webhook timing.
- Summarize likely customer impact without over-claiming.
- Produce an audit trail and a handoff report with next actions.

## Tech Stack

- Node.js
- TypeScript
- SQL schema and seed data
- Mock JSON vendor events
- CLI-first workflow for reproducible investigations

Planned additions include a small REST API, SQLite-backed investigation runner, report generation, and optional AI-assisted wording checks for support communications.

## Project Structure

```text
docs/
  scope.md
data/
  schema.sql
  seed.sql
  vendor-events/
src/
  index.ts
```

## Getting Started

```bash
npm install
npm run build
npm run investigate
```

At this initial scaffold stage, the CLI prints the selected scenario and points to the fake data sources. The next implementation step is to wire the SQL seed data into an investigation runner.

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
