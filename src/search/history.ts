const HISTORY_KEY = "kickstart:search-history";
const MAX_HISTORY = 5;

export function loadSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

export function pushSearchHistory(query: string): string[] {
  const q = query.trim();
  if (!q || q.startsWith("=")) return loadSearchHistory();
  const next = [q, ...loadSearchHistory().filter((h) => h !== q)].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function cycleSearchHistory(
  current: string,
  direction: "up" | "down",
  history: string[] = loadSearchHistory(),
): string {
  if (history.length === 0) return current;

  const currentIndex = current === "" ? -1 : history.indexOf(current);

  if (direction === "down") {
    if (currentIndex < 0) return history[0]!;
    if (currentIndex >= history.length - 1) return history[history.length - 1]!;
    return history[currentIndex + 1]!;
  }

  if (direction === "up") {
    if (currentIndex < 0) return "";
    if (currentIndex <= 0) return "";
    return history[currentIndex - 1]!;
  }

  return current;
}
