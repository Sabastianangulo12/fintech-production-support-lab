# Role Application Map

This project is intentionally aligned with fintech Product/Production Support Engineering work while remaining independent and synthetic.

## Role Signal Matrix

| Role need | Project evidence |
| --- | --- |
| Investigate production issues affecting user experience | `npm run investigate`, `npm run investigate:ach` |
| Use SQL to research customer complaints | `data/schema.sql`, `data/seed.sql`, `src/repository.ts` |
| Interface with vendor systems through APIs/events | `data/vendor-events/card-auth-events.json`, `src/vendorClient.ts` |
| Work with REST APIs | `src/server.ts`, `docs/api.md` |
| Communicate with CX and Operations | Generated reports under `reports/` |
| Commit backend fixes or support tooling | TypeScript modules under `src/` |
| Automate manual operations workflows | `npm run stale-holds`, `src/staleHolds.ts` |
| Use AI thoughtfully in support workflows | `src/cxDraftRules.ts`, `docs/ai-support-drafting.md` |
| Understand payment concepts | Card authorization hold and ACH return scenarios |

## Suggested Reviewer Commands

```bash
npm run verify
npm run investigate
npm run investigate:ach
npm run stale-holds
npm run api
```

## Why Synthetic Data Matters

The project is public and portfolio-safe because every customer, account, payment, vendor reference, ticket, and event is fake. The implementation demonstrates investigation habits without exposing real financial data or implying access to any private systems.
