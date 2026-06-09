# Investigation Report: TCK-1002

> Synthetic portfolio lab output. This report uses fake data only and is not connected to real payment systems.

## Disposition
ACH debit returned after settlement; synthetic ledger includes an offsetting return entry and CX should explain the return without promising bank-side timing.

## Customer Impact
Customer's $125.00 ACH debit was returned with synthetic code R02 (account_closed_demo). The ledger has a posted return offset; CX should avoid promising exact bank-side timing.

## Ticket
- Subject: Customer asks why ACH payment was reversed after showing complete
- Channel: chat
- Priority: high
- Status: open
- Customer: Maya Thompson (cus_1002)
- Intake note: intake: Synthetic intake note: verify ACH return code, ledger offset, and customer-safe timing language before responding.

## SQL Evidence
- Account acct_1002: active
- Payment pay_1002: returned, $125.00, ach, vendor reference ven_ach_9c22_demo
- Transactions: txn_1002=ach_debit/returned/$125.00
- Ledger entries: led_1002_ach_debit=ach_debit/posted/$125.00; led_1002_ach_return=ach_return/posted/-$125.00
- SQLite vendor_events mirror: evt_vendor_1002_ach_initiated=ach.debit.initiated; evt_vendor_1002_ach_settled=ach.debit.settled; evt_vendor_1002_ach_returned=ach.return.received
- fix_audit_log rows: fixlog_1002_triage_started=Started synthetic ACH return investigation -> Ticket linked to customer cus_1002 and payment pay_1002.; fixlog_1002_return_verified=Verified ACH return evidence against ledger offset -> Vendor return code R02 is mirrored in SQL and ledger offset is posted.

## Vendor Event Correlation
- Jun 3, 2026, 3:14:05 PM UTC: ach.debit.initiated (evt_vendor_1002_ach_initiated) for ven_ach_9c22_demo
- Jun 4, 2026, 8:10:00 AM UTC: ach.debit.settled (evt_vendor_1002_ach_settled) for ven_ach_9c22_demo
- Jun 5, 2026, 11:31:40 AM UTC: ach.return.received (evt_vendor_1002_ach_returned) for ven_ach_9c22_demo

## Findings
- [INFO] Internal and vendor ACH return states match: Internal payment pay_1002 is returned and vendor event evt_vendor_1002_ach_returned reports an ACH return for $125.00. Evidence: pay_1002; evt_vendor_1002_ach_returned.
- [INFO] ACH debit is offset by posted return: Ledger entry led_1002_ach_debit is offset by return entry led_1002_ach_return, so the synthetic ledger nets this returned ACH attempt to zero. Evidence: led_1002_ach_debit; led_1002_ach_return.
- [INFO] SQLite vendor event mirror matches mock API fixture count: The vendor_events SQL mirror contains 3 rows for ven_ach_9c22_demo, matching the mock vendor API fixture used by the CLI. Evidence: evt_vendor_1002_ach_initiated; evt_vendor_1002_ach_settled; evt_vendor_1002_ach_returned.

## Timeline
- Jun 3, 2026, 3:14:05 PM UTC [vendor-api] ach.debit.initiated: Vendor event for ven_ach_9c22_demo. Evidence: evt_vendor_1002_ach_initiated.
- Jun 3, 2026, 3:14:05 PM UTC [internal-sql] Payment attempt created: ach attempt pay_1002 created for $125.00. Evidence: pay_1002.
- Jun 3, 2026, 3:14:06 PM UTC [internal-sql] Transaction ach_debit: returned $125.00 transaction row. Evidence: txn_1002.
- Jun 4, 2026, 8:10:00 AM UTC [vendor-api] ach.debit.settled: Vendor event for ven_ach_9c22_demo. Evidence: evt_vendor_1002_ach_settled.
- Jun 4, 2026, 8:10:00 AM UTC [internal-sql] Ledger ach_debit: posted $125.00 ledger row. Evidence: led_1002_ach_debit.
- Jun 5, 2026, 11:31:40 AM UTC [vendor-api] ach.return.received: Vendor event for ven_ach_9c22_demo. Evidence: evt_vendor_1002_ach_returned.
- Jun 5, 2026, 11:31:40 AM UTC [internal-sql] Ledger ach_return: posted -$125.00 ledger row. Evidence: led_1002_ach_return.
- Jun 5, 2026, 11:31:40 AM UTC [internal-sql] Payment attempt updated: Internal status is returned. Evidence: pay_1002.
- Jun 5, 2026, 12:02:19 PM UTC [support] Support ticket opened: Customer asks why ACH payment was reversed after showing complete. Evidence: TCK-1002.
- Jun 5, 2026, 12:05:27 PM UTC [fix-audit-log] Started synthetic ACH return investigation: Ticket linked to customer cus_1002 and payment pay_1002. Evidence: fixlog_1002_triage_started.
- Jun 5, 2026, 12:08:11 PM UTC [fix-audit-log] Verified ACH return evidence against ledger offset: Vendor return code R02 is mirrored in SQL and ledger offset is posted. Evidence: fixlog_1002_return_verified.

## CX Response Draft
Thanks for flagging this. We reviewed the ACH payment attempt for $125.00. The mock vendor timeline shows an ACH return with R02 (account_closed_demo). Our synthetic ledger includes an offsetting return entry, so the support record should treat this as returned rather than still processing. Because bank-side timing can vary, CX should avoid promising an exact availability time and should escalate if the customer still sees a mismatch after the normal return window.

## AI-Assisted Draft Checks
- Mode: deterministic-rule-check
- Guardrails: Separate confirmed evidence from likely customer impact.; Do not imply a real payment network, bank, or processor was contacted.; Use synthetic identifiers only.; Do not promise bank-side availability timing for ACH returns.; Mention return codes as mock evidence, not real NACHA decisions.
- Checks: Pass: no guarantee language.; Pass: ACH return evidence is reflected in the draft.; Pass: ACH bank-timing caveat is included.

## Engineering Handoff
- Summary: Payment pay_1002 is returned, vendor reference ven_ach_9c22_demo has ACH return event evt_vendor_1002_ach_returned, and the ledger has a posted return offset.
- Suspected area: Synthetic ACH return reconciliation
- Requested action: Confirm the ACH return reason is surfaced to CX and add monitoring for ACH payments that show settled without a matching return offset after a return event.
- Evidence: pay_1002; ven_ach_9c22_demo; led_1002_ach_debit; led_1002_ach_return; evt_vendor_1002_ach_initiated; evt_vendor_1002_ach_settled; evt_vendor_1002_ach_returned

## Audit Trail
- Jun 9, 2026, 1:40:24 PM UTC: support-lab-cli: Loaded support ticket from SQLite seed data. Evidence: TCK-1002.
- Jun 9, 2026, 1:40:24 PM UTC: support-lab-cli: Queried payment attempt, transaction, and ledger entries. Evidence: pay_1002, txn_1002, led_1002_ach_debit, led_1002_ach_return.
- Jun 9, 2026, 1:40:24 PM UTC: support-lab-cli: Fetched matching mock vendor events. Evidence: evt_vendor_1002_ach_initiated, evt_vendor_1002_ach_settled, evt_vendor_1002_ach_returned.
- Jun 9, 2026, 1:40:24 PM UTC: support-lab-cli: Generated CX draft and engineering handoff from known evidence. Evidence: report.

## Operational Improvements
- Add an automated queue for authorization holds that remain pending_release beyond the vendor release window.
- Generate a support-safe CX draft only after internal ledger state and vendor event state are both attached to the ticket.
- Add a webhook reconciliation check that alerts when authorization.reversal_queued is not followed by authorization.reversal_completed.
- Add ACH return monitoring that checks for returned payment attempts without a matching posted ledger offset.
- Run deterministic CX draft checks before a response is handed to Customer Experience.
