import type { KickstartConfig } from "../config/types.ts";
import { listThemeOptions } from "../themes/presets.ts";
import { focusSearchInput } from "../widgets/search.ts";

export interface CommandPaletteHandlers {
  onSelectTheme: (id: string) => void;
  onNavigate: (url: string) => void;
  onToggleEdit: () => void;
}

export function openCommandPalette(
  config: KickstartConfig,
  handlers: CommandPaletteHandlers,
): void {
  const overlay = document.createElement("div");
  overlay.className = "ks-cmd-overlay";
  overlay.innerHTML = `
    <div class="ks-cmd-panel" role="dialog" aria-label="Command palette">
      <input type="text" class="ks-cmd-input" placeholder="Jump to link, theme, or action…" autocomplete="off" />
      <ul class="ks-cmd-list"></ul>
    </div>`;
  document.body.appendChild(overlay);

  const input = overlay.querySelector(".ks-cmd-input") as HTMLInputElement;
  const list = overlay.querySelector(".ks-cmd-list") as HTMLUListElement;

  type Item = { label: string; run: () => void };
  const items: Item[] = [];

  for (const col of config.tree.columns) {
    for (const cat of col) {
      for (const b of cat.b) {
        if (!b.u) continue;
        items.push({
          label: `${cat.cn} › ${b.n}`,
          run: () => {
            window.location.href = b.u;
          },
        });
      }
    }
  }
  for (const t of listThemeOptions(config)) {
    items.push({
      label: `Theme: ${t.name}`,
      run: () => handlers.onSelectTheme(t.id),
    });
  }
  items.push({ label: "Focus search", run: () => focusSearchInput() });
  items.push({ label: "Toggle edit mode", run: () => handlers.onToggleEdit() });

  const render = (q: string) => {
    const needle = q.toLowerCase();
    const matches = items.filter((i) => i.label.toLowerCase().includes(needle)).slice(0, 12);
    list.innerHTML = matches
      .map(
        (m, idx) =>
          `<li><button type="button" data-idx="${idx}" class="ks-cmd-item">${escapeHtml(m.label)}</button></li>`,
      )
      .join("");
    list.querySelectorAll(".ks-cmd-item").forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        matches[idx]?.run();
        close();
      });
    });
  };

  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  input.addEventListener("input", () => render(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
  render("");
  input.focus();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}
