import type { BookmarkCategory, BookmarkColumn } from "../config/types.ts";

export function duplicateCategory(columns: BookmarkColumn[], colIdx: number, catIdx: number): void {
  const cat = columns[colIdx]?.[catIdx];
  if (!cat) return;
  const copy: BookmarkCategory = {
    cn: `${cat.cn} (copy)`,
    b: cat.b.map((b) => ({ ...b })),
  };
  columns[colIdx]!.splice(catIdx + 1, 0, copy);
}

export function openAllInCategory(cat: BookmarkCategory): void {
  for (const b of cat.b) {
    if (!b.u) continue;
    const href = b.u.includes("://") ? b.u : `https://${b.u}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }
}
