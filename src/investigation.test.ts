import { describe, expect, it } from "vitest";
import { investigateTicket } from "./investigation.js";
import { renderMarkdownReport } from "./report.js";

const fixedGeneratedAt = "2026-06-05T14:00:00Z";

describe("investigateTicket", () => {
  it("correlates SQL payment state with vendor authorization events", async () => {
    const result = await investigateTicket("TCK-1001", { generatedAt: fixedGeneratedAt });

    expect(result.ticket.id).toBe("TCK-1001");
    expect(result.paymentAttempt.status).toBe("declined");
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
    expect(report).toContain("## Engineering Handoff");
    expect(report).toContain("1-3 business days");
    expect(report).toContain("No settled debit found");
  });

  it("fails loudly for an unknown ticket", async () => {
    await expect(investigateTicket("TCK-404", { generatedAt: fixedGeneratedAt })).rejects.toThrow(
      "No support ticket found for id TCK-404"
    );
  });
});
