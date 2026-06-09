# REST API

The API exposes the same synthetic investigation engine used by the CLI.

Start it locally:

```bash
npm run api
```

Default base URL:

```text
http://127.0.0.1:3000
```

## Endpoints

```http
GET /health
```

Returns service health.

```http
GET /tickets/TCK-1001/investigation
GET /tickets/TCK-1002/investigation
```

Returns the full investigation as JSON, including SQL evidence, mock vendor events, findings, customer impact, CX draft checks, engineering handoff, and audit trail.

```http
GET /tickets/TCK-1001/investigation/report
GET /tickets/TCK-1002/investigation/report
```

Returns the generated Markdown handoff report.

## Safety

The API reads local synthetic seed data only. It does not call real payment vendors, banks, processors, or OnePay systems.
