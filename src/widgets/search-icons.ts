/** Official brand SVGs from the simple-icons project (https://simpleicons.org). */

import type { SimpleIcon } from "simple-icons";
import {
  siDuckduckgo,
  siGithub,
  siGoogle,
  siReddit,
  siStackoverflow,
  siWikipedia,
  siYcombinator,
  siYoutube,
} from "simple-icons";

function iconSvg(icon: SimpleIcon): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-hidden="true"><path fill="currentColor" d="${icon.path}"/></svg>`;
}

export const SEARCH_ICONS: Record<string, string> = {
  ddg: iconSvg(siDuckduckgo),
  google: iconSvg(siGoogle),
  youtube: iconSvg(siYoutube),
  github: iconSvg(siGithub),
  reddit: iconSvg(siReddit),
  wikipedia: iconSvg(siWikipedia),
  hn: iconSvg(siYcombinator),
  stackoverflow: iconSvg(siStackoverflow),
};

export function createSearchIcon(activeId: string, title: string): HTMLElement {
  const icon = document.createElement("span");
  icon.className = "search-brand-icon";
  icon.innerHTML = SEARCH_ICONS[activeId]!;
  icon.title = title;
  icon.setAttribute("aria-label", title);
  return icon;
}
