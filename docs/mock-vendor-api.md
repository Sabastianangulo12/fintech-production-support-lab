# Mock Vendor API

This project does not call a real vendor. The `FileVendorApiClient` reads synthetic JSON from `data/vendor-events/card-auth-events.json` and exposes it as if it came from a vendor authorization-event endpoint.

## Synthetic Endpoint Shape

```http
GET /v1/authorizations/{vendorReference}/events
```

## Example

```http
GET /v1/authorizations/ven_auth_8f41_demo/events
```

The mock response contains events like:

- `authorization.requested`
- `authorization.declined`
- `authorization.reversal_queued`

## Support Interpretation

The mock vendor event stream is evidence for timeline reconstruction. It should not be treated as real processor behavior, network behavior, or bank behavior.

For `TCK-1001`, the important distinction is:

- The authorization was declined.
- A release/reversal was queued.
- The sample data does not include a completed release event.

That means the CX response should say the customer may still see a pending hold, not that the hold has definitely disappeared.
