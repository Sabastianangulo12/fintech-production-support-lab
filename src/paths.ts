import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = dirname(fileURLToPath(import.meta.url));

export const repoRoot = resolve(sourceDir, "..");

export function fromRoot(...segments: string[]): string {
  return join(repoRoot, ...segments);
}

export function dataFile(...segments: string[]): string {
  return fromRoot("data", ...segments);
}

export function reportFile(fileName: string): string {
  return fromRoot("reports", fileName);
}
