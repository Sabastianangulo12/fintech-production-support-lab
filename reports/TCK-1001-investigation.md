# Investigation Report: TCK-1001

> Synthetic portfolio lab output. This report uses fake data only and is not connected to real payment systems.

## Disposition
Likely customer-visible pending authorization after a declined card attempt; no settled debit found in the synthetic internal ledger.

## Customer Impact
Customer may see the $84.27 pending hold while the reversal/release completes. Mock vendor release guidance is 1-3 business days.

## Ticket
- Subject: Customer sees pending hold after declined card payment
- Channel: email
- Priority: normal
- Status: open
- Customer: Jordan Lee (cus_1001)
- Intake note: intake: Synthetic intake note: verify internal payment state, ledger hold state, and vendor authorization timeline before responding.

## SQL Evidence
- Account acct_1001: active
- Payment pay_1001: declined, $84.27, card, vendor reference ven_auth_8f41_demo
- Transactions: txn_1001=card_authorization/authorization_hold_pending_release/$84.27
- Ledger entries: led_1001_auth_hold=authorization_hold/pending_release/$84.27; led_1001_decline_marker=decline_marker/posted/$0.00
- SQLite vendor_events mirror: evt_vendor_1001_auth_requested=authorization.requested; evt_vendor_1001_auth_declined=authorization.declined; evt_vendor_1001_reversal_queued=authorization.reversal_queued
- fix_audit_log rows: fixlog_1001_triage_started=Started synthetic production-support investigation -> Ticket linked to customer cus_1001 and payment pay_1001.; fixlog_1001_evidence_compared=Compared SQL transaction state with vendor event mirror -> No capture found; reversal is queued but no completion event is present.

## Vendor Event Correlation
- Jun 4, 2026, 7:22:11 PM UTC: authorization.requested (evt_vendor_1001_auth_requested) for ven_auth_8f41_demo
- Jun 4, 2026, 7:22:15 PM UTC: authorization.declined (evt_vendor_1001_auth_declined) for ven_auth_8f41_demo
- Jun 4, 2026, 7:22:18 PM UTC: authorization.reversal_queued (evt_vendor_1001_reversal_queued) for ven_auth_8f41_demo

## Findings
- [INFO] Internal and vendor decline states match: Internal payment pay_1001 is declined and vendor event evt_vendor_1001_auth_declined also reports authorization decline for $84.27. Evidence: pay_1001; evt_vendor_1001_auth_declined.
- [INFO] No settled debit found: The synthetic ledger has no capture entry for this payment attempt, so the evidence does not support calling this a completed charge. Evidence: led_1001_auth_hold; led_1001_decline_marker.
- [WARNING] Pending hold release is queued but not complete: Ledger entry led_1001_auth_hold is still pending release, while vendor event evt_vendor_1001_reversal_queued says release was queued. No completed release event is present in the mock vendor timeline. Evidence: led_1001_auth_hold; evt_vendor_1001_reversal_queued.
- [INFO] SQLite vendor event mirror matches mock API fixture count: The vendor_events SQL mirror contains 3 rows for ven_auth_8f41_demo, matching the mock vendor API fixture used by the CLI. Evidence: evt_vendor_1001_auth_requested; evt_vendor_1001_auth_declined; evt_vendor_1001_reversal_queued.

## Timeline
- Jun 4, 2026, 7:22:11 PM UTC [vendor-api] authorization.requested: Vendor event for ven_auth_8f41_demo. Evidence: evt_vendor_1001_auth_requested.
- Jun 4, 2026, 7:22:11 PM UTC [internal-sql] Payment attempt created: card attempt pay_1001 created for $84.27. Evidence: pay_1001.
- Jun 4, 2026, 7:22:12 PM UTC [internal-sql] Ledger authorization_hold: pending_release $84.27 ledger row. Evidence: led_1001_auth_hold.
- Jun 4, 2026, 7:22:12 PM UTC [internal-sql] Transaction card_authorization: authorization_hold_pending_release $84.27 transaction row. Evidence: txn_1001.
- Jun 4, 2026, 7:22:15 PM UTC [vendor-api] authorization.declined: Vendor event for ven_auth_8f41_demo. Evidence: evt_vendor_1001_auth_declined.
- Jun 4, 2026, 7:22:16 PM UTC [internal-sql] Ledger decline_marker: posted $0.00 ledger row. Evidence: led_1001_decline_marker.
- Jun 4, 2026, 7:22:16 PM UTC [internal-sql] Payment attempt updated: Internal status is declined. Evidence: pay_1001.
- Jun 4, 2026, 7:22:18 PM UTC [vendor-api] authorization.reversal_queued: Vendor event for ven_auth_8f41_demo. Evidence: evt_vendor_1001_reversal_queued.
- Jun 4, 2026, 8:03:44 PM UTC [support] Support ticket opened: Customer sees pending hold after declined card payment. Evidence: TCK-1001.
- Jun 4, 2026, 8:06:01 PM UTC [fix-audit-log] Started synthetic production-support investigation: Ticket linked to customer cus_1001 and payment pay_1001. Evidence: fixlog_1001_triage_started.
- Jun 4, 2026, 8:07:34 PM UTC [fix-audit-log] Compared SQL transaction state with vendor event mirror: No capture found; reversal is queued but no completion event is present. Evidence: fixlog_1001_evidence_compared.

## CX Response Draft
Thanks for flagging this. We reviewed the payment attempt for $84.27. The checkout attempt did not complete, and our records do not show a settled charge. A pending authorization can still appear in a bank app while the hold release finishes. The mock vendor timeline shows the release was queued, with expected release guidance of 1-3 business days. If the pending hold remains after that window, we should re-check the vendor timeline and escalate with the payment reference.

## Engineering Handoff
- Summary: Payment pay_1001 is declined, vendor reference ven_auth_8f41_demo has a queued reversal/release event, and no capture ledger entry exists.
- Suspected area: Synthetic card authorization webhook reconciliation
- Requested action: Confirm that a later reversal-completed webhook would move the authorization hold from pending_release to released; add an alert for holds pending release beyond the expected vendor window.
- Evidence: pay_1001; ven_auth_8f41_demo; led_1001_auth_hold; led_1001_decline_marker; evt_vendor_1001_auth_requested; evt_vendor_1001_auth_declined; evt_vendor_1001_reversal_queued

## Audit Trail
- Jun 9, 2026, 1:27:49 PM UTC: support-lab-cli: Loaded support ticket from SQLite seed data. Evidence: TCK-1001.
- Jun 9, 2026, 1:27:49 PM UTC: support-lab-cli: Queried payment attempt, transaction, and ledger entries. Evidence: pay_1001, txn_1001, led_1001_auth_hold, led_1001_decline_marker.
- Jun 9, 2026, 1:27:49 PM UTC: support-lab-cli: Fetched matching mock vendor authorization events. Evidence: evt_vendor_1001_auth_requested, evt_vendor_1001_auth_declined, evt_vendor_1001_reversal_queued.
- Jun 9, 2026, 1:27:49 PM UTC: support-lab-cli: Generated CX draft and engineering handoff from known evidence. Evidence: report.

## Operational Improvements
- Add an automated queue for authorization holds that remain pending_release beyond the vendor release window.
- Generate a support-safe CX draft only after internal ledger state and vendor event state are both attached to the ticket.
- Add a webhook reconciliation check that alerts when authorization.reversal_queued is not followed by authorization.reversal_completed.
