import { describe, expect, it } from "vitest";
import { buildSearchUrl } from "./navigate.ts";
import { SEARCH_ENGINES } from "../widgets/search-presets.ts";

describe("search navigate", () => {
  it("builds DuckDuckGo URL", () => {
    const ddg = SEARCH_ENGINES.find((e) => e.id === "ddg")!;
    expect(buildSearchUrl(ddg, "hello world")).toBe("https://duckduckgo.com/?q=hello%20world");
  });

  it("builds YouTube URL with custom param", () => {
    const yt = SEARCH_ENGINES.find((e) => e.id === "youtube")!;
    const url = new URL(buildSearchUrl(yt, "cats"));
    expect(url.searchParams.get("search_query")).toBe("cats");
  });
});
