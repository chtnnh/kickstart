import { describe, expect, it } from "vitest";
import {
  siStackoverflow,
  siWikipedia,
  siYcombinator,
} from "simple-icons";
import { SEARCH_ICONS, createSearchIcon } from "./search-icons.ts";

describe("search icons", () => {
  it("provides icons for all preset engines", () => {
    for (const id of ["ddg", "google", "youtube", "github", "reddit", "wikipedia", "hn", "stackoverflow"]) {
      expect(SEARCH_ICONS[id]).toBeTruthy();
      expect(SEARCH_ICONS[id]).toContain("<svg");
    }
  });

  it("uses official simple-icons paths for Wikipedia, HN, and Stack Overflow", () => {
    expect(SEARCH_ICONS.wikipedia).toContain(siWikipedia.path);
    expect(SEARCH_ICONS.hn).toContain(siYcombinator.path);
    expect(SEARCH_ICONS.stackoverflow).toContain(siStackoverflow.path);
  });

  it("creates accessible icon element", () => {
    const el = createSearchIcon("google", "Google");
    expect(el.className).toBe("search-brand-icon");
    expect(el.getAttribute("aria-label")).toBe("Google");
    expect(el.title).toBe("Google");
    expect(el.innerHTML).toContain("svg");
  });

  it("tints icons with currentColor", () => {
    expect(SEARCH_ICONS.wikipedia).toContain('fill="currentColor"');
    expect(SEARCH_ICONS.hn).toContain('fill="currentColor"');
  });
});
