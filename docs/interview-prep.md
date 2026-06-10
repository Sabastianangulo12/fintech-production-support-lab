# Interview Prep

## Project Pitch

I built a synthetic fintech production-support lab to show how I would investigate customer-impacting payment issues. It uses TypeScript, SQLite, mock vendor events, a CLI, a REST API, generated reports, and an ops automation script. The goal was to demonstrate the workflow behind production support: confirm facts with SQL, compare internal state against vendor events, communicate clearly to CX, and create an engineering handoff with evidence IDs.

## STAR Stories

### Debugging A Production-Style Issue

Situation: A synthetic customer reports a declined card payment but still sees a pending hold.
Task: Determine whether the customer was actually charged and what CX can safely say.
Action: I query support tickets, payment attempts, transactions, ledger rows, vendor-event mirrors, and mock vendor API events. I compare internal declined state against vendor decline and reversal-queued events.
Result: The report concludes there is no settled debit, but a pending authorization may still be visible while release completes.

### Communicating With Non-Technical Teams

Situation: CX needs a response that is accurate without over-promising.
Task: Convert technical evidence into support-safe language.
Action: I generate a CX draft that separates confirmed facts from likely customer impact and avoids saying the hold is gone before a completion event exists.
Result: CX gets a ready-to-review response and engineering gets a separate handoff with evidence IDs.

### Automating Manual Work

Situation: Stale pending holds can create repeat support tickets.
Task: Identify candidates before they become escalations.
Action: I built `npm run stale-holds`, which queries pending authorization holds and flags anything beyond the operations threshold.
Result: The script produces a concise escalation list with payment attempt ID, ticket ID, ledger ID, amount, and reason.

### Learning A New Backend Area Quickly

Situation: The project needed to cover more than one payment flow.
Task: Add ACH reasoning beyond the initial card scenario.
Action: I added a second incident with ACH debit, mock settlement, return event, ledger offset, and ACH-specific CX guardrails.
Result: The project now demonstrates payment breadth and careful support language around bank-side timing.

### Handling Ambiguity

Situation: Production support often starts with incomplete customer reports.
Task: Avoid guessing while still moving the investigation forward.
Action: I modeled investigation outputs around known facts, likely impact, evidence IDs, and explicit next actions.
Result: The workflow keeps uncertainty visible instead of hiding it, which makes escalation cleaner.

## Questions To Ask OnePay

- What are the most common production-support escalations between CX, Operations, and Engineering today?
- Where do vendor systems create the most investigation friction?
- What support workflows have the biggest opportunity for AI-assisted automation?
- How do Product Support Engineers decide when to fix directly versus escalate to a backend team?
- What would success look like in the first 60 days for this role?
