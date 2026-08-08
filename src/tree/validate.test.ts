import { describe, expect, it } from "vitest";
import { bookmarkUrlError, isValidBookmarkUrl } from "./validate.ts";

describe("bookmark url validation", () => {
  it("accepts empty urls", () => {
    expect(isValidBookmarkUrl("")).toBe(true);
    expect(bookmarkUrlError("")).toBeNull();
  });

  it("accepts http(s) urls with hostnames", () => {
    expect(isValidBookmarkUrl("https://example.com")).toBe(true);
    expect(isValidBookmarkUrl("example.com")).toBe(true);
  });

  it("rejects invalid protocols and malformed urls", () => {
    expect(isValidBookmarkUrl("javascript:alert(1)")).toBe(false);
    expect(isValidBookmarkUrl("not a url")).toBe(false);
    expect(isValidBookmarkUrl("localhost")).toBe(false);
    expect(bookmarkUrlError("bad url")).toMatch(/valid/);
  });
});
