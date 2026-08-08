import { loadWhenIdle } from "../widgets/deferred.ts";

const cache = new Map<string, string>();

export function faviconUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    return `https://icons.duckduckgo.com/ip3/${host}.ico`;
  } catch {
    return null;
  }
}

export function attachFavicon(anchor: HTMLAnchorElement, url: string, enabled: boolean): void {
  if (!enabled || !url) return;
  const src = faviconUrl(url);
  if (!src) return;
  if (cache.has(src)) {
    if (cache.get(src) === "ok") prependIcon(anchor, src);
    return;
  }
  loadWhenIdle(() => {
    const img = new Image();
    img.onload = () => {
      cache.set(src, "ok");
      prependIcon(anchor, src);
    };
    img.onerror = () => cache.set(src, "fail");
    img.src = src;
  });
}

function prependIcon(anchor: HTMLAnchorElement, src: string): void {
  if (anchor.querySelector(".ks-favicon")) return;
  const img = document.createElement("img");
  img.className = "ks-favicon";
  img.src = src;
  img.alt = "";
  img.width = 14;
  img.height = 14;
  img.loading = "lazy";
  anchor.insertBefore(img, anchor.firstChild);
}
