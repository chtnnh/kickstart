export function isValidBookmarkUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (/\s/.test(trimmed)) return false;
  try {
    const u = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return Boolean(u.hostname && u.hostname.includes("."));
  } catch {
    return false;
  }
}

export function bookmarkUrlError(url: string): string | null {
  if (isValidBookmarkUrl(url)) return null;
  if (!url.trim()) return null;
  return "Enter a valid http(s) URL";
}
