import { SEARCH_ENGINES, matchEngine, type SearchEngine } from "./search-presets.ts";

export function getSearchLabel(
  search: { name: string; url: string; label?: string },
): string {
  if (search.label?.trim()) return search.label.trim();
  const matched = matchEngine(search.name, search.url);
  if (matched) return matched.name;
  return search.name;
}

export function applySearchEngine(
  search: { name: string; url: string; label?: string },
  engine: SearchEngine,
): void {
  search.name = engine.name;
  search.url = engine.url;
  search.label = engine.name;
}

export { SEARCH_ENGINES, matchEngine };
