import { describe, expect, it } from "vitest";
import { parseBookmarkHtml, treeToMarkdown } from "./bookmark-import.ts";

const SAMPLE_HTML = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<dl><dt><h3>Dev</h3>
<dl><dt><a href="https://github.com">GitHub</a></dt></dl>
</dt></dl>`;

describe("bookmark import", () => {
  it("parses Netscape bookmark HTML", () => {
    const columns = parseBookmarkHtml(SAMPLE_HTML);
    expect(columns[0]![0]!.cn).toBe("Dev");
    expect(columns[0]![0]!.b[0]!.u).toBe("https://github.com");
  });

  it("exports tree to markdown", () => {
    const md = treeToMarkdown([
      [{ cn: "Dev", b: [{ n: "GitHub", u: "https://github.com" }] }],
    ]);
    expect(md).toContain("## Dev");
    expect(md).toContain("[GitHub](https://github.com)");
  });

  it("throws on invalid HTML", () => {
    expect(() => parseBookmarkHtml("<html></html>")).toThrow(/Invalid bookmark HTML/);
  });

  it("imports orphan links into a default category", () => {
    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<dl><dt><a href="https://example.com">Example</a></dt></dl>`;
    const columns = parseBookmarkHtml(html);
    expect(columns[0]![0]!.cn).toBe("Imported");
    expect(columns[0]![0]!.b[0]!.u).toBe("https://example.com");
  });
});
