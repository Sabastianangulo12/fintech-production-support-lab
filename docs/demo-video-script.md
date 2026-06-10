# Demo Video Script

Target length: 60-90 seconds.

## Setup

Open a terminal in the repository root.

## Script

Hi, I am Sabastian Angulo. This is a synthetic fintech production-support lab I built to model the workflow behind investigating payment support issues.

First, I run the full verification suite:

```bash
npm run verify
```

This checks the TypeScript build, tests, card investigation, ACH investigation, and stale-holds automation.

Next, I investigate a card decline where the customer still sees a pending hold:

```bash
npm run investigate
```

The report pulls SQL evidence, mock vendor events, ledger entries, customer impact, a CX response draft, and an engineering handoff.

Then I investigate a second ACH return scenario:

```bash
npm run investigate:ach
```

This shows an ACH debit, mock settlement, return event, ledger offset, and customer-safe language around bank timing.

I also added an ops automation script:

```bash
npm run stale-holds
```

That identifies stale authorization holds that should be escalated.

Finally, the same investigation is available through a REST API:

```bash
npm run api
```

Then:

```text
GET /tickets/TCK-1001/investigation
GET /tickets/TCK-1002/investigation
```

Everything is synthetic, but the workflow is designed to mirror real production-support muscles: SQL investigation, API/event correlation, customer communication, engineering handoff, and operational improvement.
