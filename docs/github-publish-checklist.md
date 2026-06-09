# GitHub Publish Checklist

Use this before sharing the project in an application.

## Repository

- Name: `fintech-production-support-lab`
- Owner: `Sabastianangulo12`
- Visibility: public
- Description: `Synthetic fintech production-support lab using TypeScript, SQL, REST APIs, mock vendor events, and CX/engineering handoff reports.`

## Suggested Topics

- `typescript`
- `nodejs`
- `sql`
- `sqlite`
- `rest-api`
- `fintech`
- `production-support`
- `support-engineering`
- `payments`
- `portfolio-project`

## Pre-Publish Commands

```bash
npm ci
npm run verify
npm run reports
git status --short
```

## After Publish

- Confirm the README renders cleanly.
- Confirm the sample reports are visible under `reports/`.
- Add the GitHub URL to the OnePay application materials.
- Keep the language synthetic and independent; do not imply affiliation with OnePay.
