const COMMON_TIMEZONES = [
  "Etc/UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

export interface TimezoneOption {
  value: string;
  label: string;
  group: "common" | "all";
}

function formatTimezoneLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    const city = tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
    return `${city} (${offset})`;
  } catch {
    return tz;
  }
}

export function listTimezoneOptions(): TimezoneOption[] {
  const supported =
    typeof Intl !== "undefined" && "supportedValuesOf" in Intl
      ? (Intl as typeof Intl & { supportedValuesOf: (key: string) => string[] }).supportedValuesOf(
          "timeZone",
        )
      : [...COMMON_TIMEZONES];

  const options: TimezoneOption[] = [];

  for (const tz of COMMON_TIMEZONES) {
    options.push({ value: tz, label: formatTimezoneLabel(tz), group: "common" });
  }

  const common = new Set<string>(COMMON_TIMEZONES);
  for (const tz of supported) {
    if (!common.has(tz)) {
      options.push({ value: tz, label: formatTimezoneLabel(tz), group: "all" });
    }
  }

  return options;
}

export function buildTimezoneSelect(selected: string): string {
  const options = listTimezoneOptions();
  const common = options.filter((o) => o.group === "common");
  const rest = options.filter((o) => o.group === "all");
  const render = (items: TimezoneOption[]) =>
    items
      .map(
        (o) =>
          `<option value="${o.value.replace(/"/g, "&quot;")}" ${o.value === selected ? "selected" : ""}>${o.label.replace(/</g, "&lt;")}</option>`,
      )
      .join("");
  return `<optgroup label="Common">${render(common)}</optgroup><optgroup label="All timezones">${render(rest)}</optgroup>`;
}
