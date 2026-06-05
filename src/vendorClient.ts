import { readFile } from "node:fs/promises";
import type { VendorEvent } from "./types.js";

export interface VendorApiClient {
  getAuthorizationEvents(vendorReference: string): Promise<VendorEvent[]>;
}

export class FileVendorApiClient implements VendorApiClient {
  constructor(private readonly eventFilePath: string) {}

  async getAuthorizationEvents(vendorReference: string): Promise<VendorEvent[]> {
    const rawEvents = JSON.parse(await readFile(this.eventFilePath, "utf8")) as unknown;
    const events = parseVendorEvents(rawEvents);

    return events
      .filter((event) => event.vendorReference === vendorReference)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }
}

function parseVendorEvents(value: unknown): VendorEvent[] {
  if (!Array.isArray(value)) {
    throw new Error("Vendor event payload must be an array");
  }

  return value.map((event, index) => parseVendorEvent(event, index));
}

function parseVendorEvent(value: unknown, index: number): VendorEvent {
  if (!isObject(value)) {
    throw new Error(`Vendor event at index ${index} must be an object`);
  }

  const event = value as Record<string, unknown>;
  const id = requiredString(event.id, `Vendor event at index ${index} is missing id`);
  const vendorReference = requiredString(
    event.vendorReference,
    `Vendor event ${id} is missing vendorReference`
  );
  const type = requiredString(event.type, `Vendor event ${id} is missing type`);
  const createdAt = requiredString(event.createdAt, `Vendor event ${id} is missing createdAt`);
  const payload = isObject(event.payload) ? event.payload : {};

  return {
    id,
    vendorReference,
    type,
    createdAt,
    payload
  };
}

function requiredString(value: unknown, message: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(message);
  }

  return value;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
