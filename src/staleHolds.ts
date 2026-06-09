import { loadSeededDatabase } from "./database.js";
import { formatMoney, formatUtcDate } from "./format.js";
import { dataFile, reportFile } from "./paths.js";
import { InvestigationRepository } from "./repository.js";
import type { PendingAuthorizationHoldRecord } from "./types.js";

export interface StaleHoldOptions {
  asOf?: string;
  minimumAgeHours?: number;
  schemaPath?: string;
  seedPath?: string;
}

export interface StaleAuthorizationHold extends PendingAuthorizationHoldRecord {
  ageHours: number;
  escalationReason: string;
}

export async function findStaleAuthorizationHolds(
  options: StaleHoldOptions = {}
): Promise<StaleAuthorizationHold[]> {
  const asOf = options.asOf ?? new Date().toISOString();
  const minimumAgeHours = options.minimumAgeHours ?? 72;
  const db = await loadSeededDatabase(
    options.schemaPath ?? dataFile("schema.sql"),
    options.seedPath ?? dataFile("seed.sql")
  );

  try {
    const repository = new InvestigationRepository(db);
    const asOfTime = new Date(asOf).getTime();

    return repository
      .getPendingAuthorizationHolds()
      .map((hold) => {
        const ageHours = Math.floor((asOfTime - new Date(hold.hold_created_at).getTime()) / 36_000) / 100;

        return {
          ...hold,
          ageHours,
          escalationReason: `Authorization hold has been pending release for ${ageHours.toFixed(
            2
          )} hours, exceeding the ${minimumAgeHours}-hour operations threshold.`
        };
      })
      .filter((hold) => hold.ageHours >= minimumAgeHours);
  } finally {
    db.close();
  }
}

export function renderStaleHoldsMarkdown(
  holds: StaleAuthorizationHold[],
  options: Required<Pick<StaleHoldOptions, "asOf" | "minimumAgeHours">>
): string {
  const lines = [
    "# Stale Authorization Holds",
    "",
    "> Synthetic ops automation output. This report uses fake data only.",
    "",
    `As of: ${formatUtcDate(options.asOf)}`,
    `Threshold: ${options.minimumAgeHours} hours`,
    "",
    "## Candidates"
  ];

  if (holds.length === 0) {
    lines.push("- None");
  } else {
    lines.push(
      ...holds.map(
        (hold) =>
          `- ${hold.ledger_entry_id}: ${formatMoney(hold.amount_cents, hold.currency)} for ${
            hold.payment_attempt_id
          } (${hold.ticket_id ?? "no ticket"}), age ${hold.ageHours.toFixed(2)} hours. ${hold.escalationReason}`
      )
    );
  }

  lines.push(
    "",
    "## Suggested Operations Action",
    "- Attach the candidate list to the support queue.",
    "- Re-check vendor reversal completion events before messaging the customer.",
    "- Escalate any hold past the threshold with payment attempt id, ledger entry id, and vendor reference.",
    ""
  );

  return lines.join("\n");
}

export function staleHoldsReportPath(): string {
  return reportFile("stale-authorization-holds.md");
}
