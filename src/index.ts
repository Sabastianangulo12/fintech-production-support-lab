import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { investigateTicket } from "./investigation.js";
import { reportFile } from "./paths.js";
import { renderMarkdownReport } from "./report.js";
import { startApiServer } from "./server.js";
import { findStaleAuthorizationHolds, renderStaleHoldsMarkdown, staleHoldsReportPath } from "./staleHolds.js";

interface CliOptions {
  command: string;
  ticketId: string;
  write: boolean;
  json: boolean;
  port: number;
  asOf: string;
  minimumAgeHours: number;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.command === "api") {
    const server = await startApiServer({ port: options.port });
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : options.port;
    console.log(`API listening at http://127.0.0.1:${port}`);
    return;
  }

  if (options.command === "stale-holds") {
    const holds = await findStaleAuthorizationHolds({
      asOf: options.asOf,
      minimumAgeHours: options.minimumAgeHours
    });

    if (options.json) {
      console.log(JSON.stringify(holds, null, 2));
      return;
    }

    const report = renderStaleHoldsMarkdown(holds, {
      asOf: options.asOf,
      minimumAgeHours: options.minimumAgeHours
    });

    if (options.write) {
      const outputPath = staleHoldsReportPath();
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, report, "utf8");
      console.log(`Wrote stale holds report: ${outputPath}`);
      return;
    }

    console.log(report);
    return;
  }

  if (options.command === "investigate") {
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
    return;
  }

  throw new Error(`Unknown command: ${options.command}. Try: npm run investigate`);
}

function parseArgs(args: string[]): CliOptions {
  const [command = "investigate", maybeTicketId] = args;
  const flags = new Set(args.filter((arg) => arg.startsWith("--")));
  const ticketId = maybeTicketId && !maybeTicketId.startsWith("--") ? maybeTicketId : "TCK-1001";

  return {
    command,
    ticketId,
    write: flags.has("--write"),
    json: flags.has("--json"),
    port: Number(readFlagValue(args, "--port") ?? "3000"),
    asOf: readFlagValue(args, "--as-of") ?? new Date().toISOString(),
    minimumAgeHours: Number(readFlagValue(args, "--hours") ?? "72")
  };
}

function readFlagValue(args: string[], flag: string): string | null {
  const index = args.indexOf(flag);

  if (index === -1) {
    return null;
  }

  return args[index + 1] ?? null;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Investigation failed: ${message}`);
  process.exitCode = 1;
});
