import { describe, expect, it } from "vitest";
import { buildTimezoneSelect } from "./timezones.ts";

describe("timezones", () => {
  it("builds select HTML with selected timezone", () => {
    const html = buildTimezoneSelect("America/New_York");
    expect(html).toContain('value="America/New_York" selected');
    expect(html).toContain("optgroup");
  });

  it("includes common regions", () => {
    const html = buildTimezoneSelect("UTC");
    expect(html).toContain("Europe");
    expect(html).toContain("America");
    expect(html).toContain("Asia");
  });

  it("marks only the selected timezone", () => {
    const html = buildTimezoneSelect("Asia/Dubai");
    const selectedCount = (html.match(/selected/g) ?? []).length;
    expect(selectedCount).toBe(1);
    expect(html).toContain("Dubai");
  });
});
