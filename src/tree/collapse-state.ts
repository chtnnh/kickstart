import type { BookmarkColumn } from "../config/types.ts";

const COLLAPSE_KEY = "kickstart:tree-collapsed";
const COLLAPSE_ALL_KEY = "kickstart:tree-collapse-all";

export function catKey(colIdx: number, catIdx: number): string {
  return `${colIdx}:${catIdx}`;
}

export function allCatKeys(columns: BookmarkColumn[]): string[] {
  const keys: string[] = [];
  columns.forEach((col, colIdx) => {
    col.forEach((_, catIdx) => keys.push(catKey(colIdx, catIdx)));
  });
  return keys;
}

export function loadCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function saveCollapsed(keys: Set<string>): void {
  localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...keys]));
}

export function loadCollapseAll(): boolean {
  return localStorage.getItem(COLLAPSE_ALL_KEY) === "1";
}

export function saveCollapseAll(value: boolean): void {
  localStorage.setItem(COLLAPSE_ALL_KEY, value ? "1" : "0");
  if (value) saveCollapsed(new Set());
}

export function isCategoryCollapsed(
  colIdx: number,
  catIdx: number,
  collapseAll: boolean,
  manual: Set<string>,
): boolean {
  if (collapseAll) return true;
  return manual.has(catKey(colIdx, catIdx));
}

/** Toggle one category; returns new collapsed state. */
export function toggleCategoryCollapsed(
  colIdx: number,
  catIdx: number,
  columns: BookmarkColumn[],
  collapseAll: boolean,
  manual: Set<string>,
): { collapsed: boolean; collapseAll: boolean; manual: Set<string> } {
  const key = catKey(colIdx, catIdx);
  if (collapseAll) {
    const nextManual = new Set(allCatKeys(columns));
    nextManual.delete(key);
    return { collapsed: false, collapseAll: false, manual: nextManual };
  }
  const nextManual = new Set(manual);
  if (nextManual.has(key)) nextManual.delete(key);
  else nextManual.add(key);
  return { collapsed: nextManual.has(key), collapseAll: false, manual: nextManual };
}

export function toggleCollapseAll(_columns: BookmarkColumn[]): {
  collapseAll: boolean;
  manual: Set<string>;
} {
  const next = !loadCollapseAll();
  saveCollapseAll(next);
  return { collapseAll: next, manual: next ? new Set() : loadCollapsed() };
}
