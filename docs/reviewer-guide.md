# Reviewer Guide

This guide is for a recruiter, hiring manager, or engineer reviewing the project quickly.

## What This Demonstrates

The project shows a production-support style workflow in a safe synthetic lab:

- SQL investigation against support, account, payment, transaction, ledger, vendor-event, and audit-log records.
- Mock vendor event correlation.
- CX-ready customer impact language.
- Engineering handoff details with evidence IDs.
- REST API access to investigation output.
- Operations automation for stale authorization holds.
- Deterministic AI-style draft checks that reduce risky support wording.

## Suggested 5-Minute Review

```bash
npm install
npm run verify
```

Then inspect:

```bash
npm run investigate
npm run investigate:ach
npm run stale-holds
```

For API behavior:

```bash
npm run api
```

Open:

```text
GET /tickets/TCK-1001/investigation
GET /tickets/TCK-1002/investigation
GET /tickets/TCK-1001/investigation/report
```

## Scenario Coverage

| Ticket | Scenario | Support skill shown |
| --- | --- | --- |
| `TCK-1001` | Declined card attempt with pending authorization hold | Distinguish declined payment from settled charge, correlate vendor reversal event, write careful CX language |
| `TCK-1002` | ACH debit returned after mock settlement | Interpret ACH return evidence, verify ledger offset, avoid over-promising bank timing |

## Evidence Model

The SQLite seed includes:

- `customers`
- `accounts`
- `payment_attempts`
- `transactions`
- `ledger_entries`
- `vendor_events`
- `support_tickets`
- `investigation_notes`
- `fix_audit_log`

The JSON vendor-event fixture mirrors the SQL `vendor_events` rows to model the common support task of comparing internal state against vendor/API state.

## Safety Boundaries

This is a synthetic portfolio project. It does not call payment vendors, banks, processors, or OnePay systems. It contains no real customer data and no secrets.
