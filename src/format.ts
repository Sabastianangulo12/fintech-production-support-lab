export function formatMoney(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amountCents / 100);
}

export function formatUtcDate(isoTimestamp: string): string {
  const formatted = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "UTC"
  }).format(new Date(isoTimestamp));

  return `${formatted} UTC`;
}

export function sentenceList(items: string[]): string {
  if (items.length === 0) {
    return "None";
  }

  return items.join("; ");
}
