import type { SearchEngine } from "../widgets/search-presets.ts";
import { engineParam } from "../widgets/search-presets.ts";

export function buildSearchUrl(engine: SearchEngine, query: string): string {
  const param = engineParam(engine);
  if (param === "q" && engine.url.includes("?q=")) {
    return `${engine.url}${encodeURIComponent(query)}`;
  }
  const u = new URL(engine.url);
  u.searchParams.set(param, query);
  return u.toString();
}

export function openSearchUrl(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openMultiSearch(engines: SearchEngine[], query: string): void {
  for (const engine of engines) {
    openSearchUrl(buildSearchUrl(engine, query));
  }
}
