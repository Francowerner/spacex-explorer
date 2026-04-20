const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function formatLaunchDate(iso: string): string {
  try {
    return `${dateFormatter.format(new Date(iso))} UTC`;
  } catch {
    return iso;
  }
}
