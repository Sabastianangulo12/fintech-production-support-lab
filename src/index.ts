import { existsSync } from "node:fs";
import { join } from "node:path";

const [, , command, ticketId = "TCK-1001"] = process.argv;

const dataFiles = [
  "data/schema.sql",
  "data/seed.sql",
  "data/vendor-events/card-auth-events.json"
];

function printInvestigationScaffold(selectedTicketId: string): void {
  console.log(`Fintech Production Support Lab`);
  console.log(`Investigation scaffold for ticket: ${selectedTicketId}`);
  console.log("");
  console.log("Synthetic data sources:");

  for (const file of dataFiles) {
    const status = existsSync(join(process.cwd(), file)) ? "ready" : "missing";
    console.log(`- ${file} (${status})`);
  }

  console.log("");
  console.log("Next implementation step:");
  console.log("Wire the SQL seed data and mock vendor events into a repeatable investigation report.");
}

if (!command || command === "investigate") {
  printInvestigationScaffold(ticketId);
} else {
  console.error(`Unknown command: ${command}`);
  console.error("Try: npm run investigate");
  process.exitCode = 1;
}
