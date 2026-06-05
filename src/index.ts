import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { investigateTicket } from "./investigation.js";
import { reportFile } from "./paths.js";
import { renderMarkdownReport } from "./report.js";

interface CliOptions {
  command: string;
  ticketId: string;
  write: boolean;
  json: boolean;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.command !== "investigate") {
    throw new Error(`Unknown command: ${options.command}. Try: npm run investigate`);
  }

  const result = await investigateTicket(options.ticketId);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const report = renderMarkdownReport(result);

  if (options.write) {
    const outputPath = reportFile(`${options.ticketId}-investigation.md`);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, report, "utf8");
    console.log(`Wrote investigation report: ${outputPath}`);
    return;
  }

  console.log(report);
}

function parseArgs(args: string[]): CliOptions {
  const [command = "investigate", maybeTicketId] = args;
  const flags = new Set(args.filter((arg) => arg.startsWith("--")));
  const ticketId = maybeTicketId && !maybeTicketId.startsWith("--") ? maybeTicketId : "TCK-1001";

  return {
    command,
    ticketId,
    write: flags.has("--write"),
    json: flags.has("--json")
  };
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Investigation failed: ${message}`);
  process.exitCode = 1;
});
