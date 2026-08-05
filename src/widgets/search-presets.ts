export interface SearchEngine {
  id: string;
  name: string;
  label: string;
  url: string;
}

export const SEARCH_ENGINES: SearchEngine[] = [
  { id: "ddg", name: "ddg", label: "DuckDuckGo", url: "https://duckduckgo.com/?q=" },
  { id: "google", name: "google", label: "Google", url: "https://www.google.com/search?q=" },
  { id: "youtube", name: "youtube", label: "YouTube", url: "https://www.youtube.com/results?search_query=" },
  { id: "github", name: "github", label: "GitHub", url: "https://github.com/search?q=" },
  { id: "reddit", name: "reddit", label: "Reddit", url: "https://www.reddit.com/search/?q=" },
];

export function matchEngine(name: string, url: string): SearchEngine | undefined {
  return SEARCH_ENGINES.find((e) => e.name === name && e.url === url);
}
