import type { AppContext } from "../layout/engine.ts";
import { loadWhenIdle } from "./deferred.ts";

interface HnHit {
  title: string;
  url: string;
  points?: number;
  objectID?: string;
}

export function renderHn(ctx: AppContext, widgetId: string): HTMLElement {
  const widget = ctx.config.widgets.find((w) => w.id === widgetId);
  const count = widget?.hn?.count ?? 5;

  const root = document.createElement("div");
  root.className = "ks-hn ks-hn--centered";

  const header = document.createElement("div");
  header.className = "ks-hn-header";
  header.innerHTML = `<span class="ks-hn-logo">Y</span><span class="ks-hn-title">Hacker News</span>`;
  root.appendChild(header);

  const ul = document.createElement("ol");
  ul.className = "ks-hn-list";
  root.appendChild(ul);

  const skeleton = document.createElement("li");
  skeleton.className = "ks-hn-loading";
  skeleton.textContent = "Loading stories…";
  ul.appendChild(skeleton);

  loadWhenIdle(async () => {
    try {
      const res = await fetch(
        `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${count}`,
      );
      const data = (await res.json()) as { hits: HnHit[] };
      ul.innerHTML = "";
      data.hits.forEach((hit, i) => {
        const li = document.createElement("li");
        li.className = "ks-hn-item";
        const rank = document.createElement("span");
        rank.className = "ks-hn-rank";
        rank.textContent = String(i + 1);
        const a = document.createElement("a");
        a.href = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
        a.textContent = hit.title;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        li.appendChild(rank);
        li.appendChild(a);
        if (hit.points !== undefined) {
          const pts = document.createElement("span");
          pts.className = "ks-hn-points";
          pts.textContent = `${hit.points} pts`;
          li.appendChild(pts);
        }
        ul.appendChild(li);
      });
    } catch {
      ul.innerHTML = `<li class="ks-hn-error">Could not load Hacker News</li>`;
    }
  });

  return root;
}
