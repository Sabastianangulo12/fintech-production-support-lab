import { describe, expect, it } from "vitest";
import { investigateTicket } from "./investigation.js";
import { renderMarkdownReport } from "./report.js";
import { createApiServer } from "./server.js";
import { findStaleAuthorizationHolds } from "./staleHolds.js";

const fixedGeneratedAt = "2026-06-05T14:00:00Z";

describe("investigateTicket", () => {
  it("correlates SQL payment state with vendor authorization events", async () => {
    const result = await investigateTicket("TCK-1001", { generatedAt: fixedGeneratedAt });

    expect(result.ticket.id).toBe("TCK-1001");
    expect(result.paymentAttempt.status).toBe("declined");
    expect(result.transactions).toHaveLength(1);
    expect(result.vendorEventRows).toHaveLength(3);
    expect(result.fixAuditLog).toHaveLength(2);
    expect(result.vendorEvents.map((event) => event.type)).toEqual([
      "authorization.requested",
      "authorization.declined",
      "authorization.reversal_queued"
    ]);
    expect(result.findings.map((finding) => finding.title)).toContain("No settled debit found");
    expect(result.findings.map((finding) => finding.title)).toContain(
      "Pending hold release is queued but not complete"
    );
    expect(result.disposition).toContain("no settled debit");
  });

  it("builds a chronological timeline across support, SQL, and vendor evidence", async () => {
    const result = await investigateTicket("TCK-1001", { generatedAt: fixedGeneratedAt });
    const timestamps = result.timeline.map((entry) => entry.at);
    const sortedTimestamps = [...timestamps].sort((left, right) => left.localeCompare(right));

    expect(timestamps).toEqual(sortedTimestamps);
    expect(result.timeline.some((entry) => entry.source === "support")).toBe(true);
    expect(result.timeline.some((entry) => entry.source === "internal-sql")).toBe(true);
    expect(result.timeline.some((entry) => entry.source === "vendor-api")).toBe(true);
  });

  it("renders a support-ready Markdown report", async () => {
    const result = await investigateTicket("TCK-1001", { generatedAt: fixedGeneratedAt });
    const report = renderMarkdownReport(result);

    expect(report).toContain("# Investigation Report: TCK-1001");
    expect(report).toContain("## CX Response Draft");
    expect(report).toContain("## AI-Assisted Draft Checks");
    expect(report).toContain("## Engineering Handoff");
    expect(report).toContain("SQLite vendor_events mirror");
    expect(report).toContain("fix_audit_log rows");
    expect(report).toContain("1-3 business days");
    expect(report).toContain("No settled debit found");
  });

  it("investigates an ACH return scenario with payment-specific wording", async () => {
    const result = await investigateTicket("TCK-1002", { generatedAt: fixedGeneratedAt });
    const findingTitles = result.findings.map((finding) => finding.title);

    expect(result.paymentAttempt.payment_method_type).toBe("ach");
    expect(result.paymentAttempt.status).toBe("returned");
    expect(result.vendorEvents.map((event) => event.type)).toEqual([
      "ach.debit.initiated",
      "ach.debit.settled",
      "ach.return.received"
    ]);
    expect(findingTitles).toContain("Internal and vendor ACH return states match");
    expect(findingTitles).toContain("ACH debit is offset by posted return");
    expect(result.cxDraft).toContain("avoid promising an exact availability time");
  });

  it("finds stale authorization holds for operations follow-up", async () => {
    const holds = await findStaleAuthorizationHolds({
      asOf: "2026-06-09T13:00:00Z",
      minimumAgeHours: 72
    });

    expect(holds).toHaveLength(1);
    expect(holds[0]?.payment_attempt_id).toBe("pay_1001");
    expect(holds[0]?.ticket_id).toBe("TCK-1001");
  });

  it("serves investigation JSON and Markdown over REST", async () => {
    const server = createApiServer();

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    try {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      const baseUrl = `http://127.0.0.1:${port}`;

      const jsonResponse = await fetch(`${baseUrl}/tickets/TCK-1001/investigation`);
      const json = (await jsonResponse.json()) as { ticket: { id: string } };

      expect(jsonResponse.status).toBe(200);
      expect(json.ticket.id).toBe("TCK-1001");

      const reportResponse = await fetch(`${baseUrl}/tickets/TCK-1001/investigation/report`);
      const report = await reportResponse.text();

      expect(reportResponse.status).toBe(200);
      expect(reportResponse.headers.get("content-type")).toContain("text/markdown");
      expect(report).toContain("# Investigation Report: TCK-1001");
    } finally {
      server.close();
    }
  });

  it("fails loudly for an unknown ticket", async () => {
    await expect(investigateTicket("TCK-404", { generatedAt: fixedGeneratedAt })).rejects.toThrow(
      "No support ticket found for id TCK-404"
    );
  });
});
