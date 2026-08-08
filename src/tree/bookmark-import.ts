import type { BookmarkColumn } from "../config/types.ts";

/** Parse Netscape bookmark HTML export into tree columns. */
export function parseBookmarkHtml(html: string): BookmarkColumn[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const rootDl = doc.querySelector("dl");
  if (!rootDl) throw new Error("Invalid bookmark HTML");

  const column: BookmarkColumn = [];

  function walkDl(dl: Element, categories: BookmarkColumn): void {
    for (const child of dl.children) {
      if (child.tagName === "DT") {
        const h3 = child.querySelector("h3");
        const a = child.querySelector(":scope > a") ?? child.querySelector("a");
        const nested = child.querySelector(":scope > dl") ?? child.querySelector("dl");
        if (h3) {
          const cat = { cn: h3.textContent?.trim() || "Imported", b: [] as Array<{ n: string; u: string }> };
          categories.push(cat);
          if (nested) walkDl(nested, [cat] as unknown as BookmarkColumn);
        } else if (a) {
          const link = { n: a.textContent?.trim() || a.getAttribute("href") || "link", u: a.getAttribute("href") || "" };
          const last = categories[categories.length - 1];
          if (last) last.b.push(link);
          else {
            categories.push({ cn: "Imported", b: [link] });
          }
        }
      }
    }
  }

  walkDl(rootDl, column);
  if (column.length === 0) throw new Error("No bookmarks found");
  return [column];
}

export function treeToMarkdown(columns: BookmarkColumn[]): string {
  const lines: string[] = [];
  for (const col of columns) {
    for (const cat of col) {
      lines.push(`## ${cat.cn}`);
      for (const b of cat.b) {
        lines.push(b.u ? `- [${b.n}](${b.u})` : `- ${b.n}`);
      }
      lines.push("");
    }
  }
  return lines.join("\n").trim();
}
