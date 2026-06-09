# Mock Vendor API

This project does not call a real vendor. The `FileVendorApiClient` reads synthetic JSON from `data/vendor-events/card-auth-events.json` and exposes it as if it came from a vendor event endpoint.

## Synthetic Endpoint Shape

```http
GET /v1/vendor-references/{vendorReference}/events
```

## Example

```http
GET /v1/vendor-references/ven_auth_8f41_demo/events
```

The mock response contains events like:

- `authorization.requested`
- `authorization.declined`
- `authorization.reversal_queued`
- `ach.debit.initiated`
- `ach.debit.settled`
- `ach.return.received`

## Support Interpretation

The mock vendor event stream is evidence for timeline reconstruction. It should not be treated as real processor behavior, network behavior, or bank behavior.

For `TCK-1001`, the important distinction is:

- The authorization was declined.
- A release/reversal was queued.
- The sample data does not include a completed release event.

That means the CX response should say the customer may still see a pending hold, not that the hold has definitely disappeared.

For `TCK-1002`, the important distinction is:

- The ACH debit was initiated.
- A mock settlement event exists.
- A mock ACH return event exists.
- The ledger has an offsetting return entry.

That means the CX response should explain the synthetic return evidence and avoid promising exact bank-side timing.
