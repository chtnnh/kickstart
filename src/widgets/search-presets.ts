export interface SearchEngine {
  id: string;
  name: string;
  label: string;
  url: string;
  param?: string;
  bang?: string;
}

export const SEARCH_ENGINES: SearchEngine[] = [
  { id: "ddg", name: "ddg", label: "DuckDuckGo", url: "https://duckduckgo.com/?q=", param: "q", bang: "ddg" },
  { id: "google", name: "google", label: "Google", url: "https://www.google.com/search?q=", param: "q", bang: "g" },
  { id: "youtube", name: "youtube", label: "YouTube", url: "https://www.youtube.com/results?search_query=", param: "search_query", bang: "yt" },
  { id: "github", name: "github", label: "GitHub", url: "https://github.com/search?q=", param: "q", bang: "gh" },
  { id: "reddit", name: "reddit", label: "Reddit", url: "https://www.reddit.com/search/?q=", param: "q", bang: "r" },
  { id: "wikipedia", name: "wikipedia", label: "Wikipedia", url: "https://en.wikipedia.org/w/index.php?search=", param: "search", bang: "w" },
  { id: "hn", name: "hn", label: "Hacker News", url: "https://hn.algolia.com/?q=", param: "q", bang: "hn" },
  { id: "stackoverflow", name: "stackoverflow", label: "Stack Overflow", url: "https://stackoverflow.com/search?q=", param: "q", bang: "so" },
];

export function matchEngine(name: string, url: string): SearchEngine | undefined {
  return SEARCH_ENGINES.find((e) => e.name === name && e.url === url);
}

export function resolveBang(query: string): { engine: SearchEngine; query: string } | null {
  const m = query.match(/^!(\w+)\s+(.+)$/);
  if (!m) return null;
  const bang = m[1]!.toLowerCase();
  const engine = SEARCH_ENGINES.find((e) => e.bang === bang);
  if (!engine) return null;
  return { engine, query: m[2]!.trim() };
}

export const DEFAULT_MULTI_SEARCH_ENGINES = ["ddg", "google", "github"] as const;

export function resolveMultiSearchEngines(
  search: { multiSearchEngines?: string[] },
): SearchEngine[] {
  const ids = search.multiSearchEngines ?? [...DEFAULT_MULTI_SEARCH_ENGINES];
  return ids
    .map((id) => SEARCH_ENGINES.find((engine) => engine.id === id))
    .filter((engine): engine is SearchEngine => Boolean(engine));
}

export function engineParam(engine: SearchEngine | undefined): string {
  return engine?.param ?? "q";
}
