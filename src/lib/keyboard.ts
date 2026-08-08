import { focusSearchInput } from "../widgets/search.ts";

export interface KeyboardHandlers {
  toggleEdit: () => void;
  openCommandPalette: () => void;
  closeOverlays: () => void;
  openSettings?: () => void;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export function initKeyboardShortcuts(handlers: KeyboardHandlers): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      const search = document.getElementById("ks-search-input");
      if (search instanceof HTMLInputElement && document.activeElement === search) {
        e.preventDefault();
        search.blur();
        return;
      }
      handlers.closeOverlays();
      return;
    }
    if (isTypingTarget(e.target)) return;

    if (e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      if (e.key === "k") handlers.openCommandPalette();
      else focusSearchInput();
      return;
    }
    if (e.key === "," && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      handlers.openSettings?.();
      return;
    }
    if (e.key === "e" && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      handlers.toggleEdit();
      return;
    }
    if (e.key === "?" && e.shiftKey) {
      e.preventDefault();
      showShortcutHelp();
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}

const SHORTCUTS = [
  { keys: ["/"], desc: "Focus search" },
  { keys: ["Ctrl", "K"], desc: "Command palette" },
  { keys: [","], desc: "Open settings" },
  { keys: ["e"], desc: "Toggle edit mode" },
  { keys: ["Esc"], desc: "Blur search / close overlays" },
  { keys: ["↑", "↓"], desc: "Browse recent searches" },
  { keys: ["Shift", "Enter"], desc: "Multi-search (when enabled)" },
  { keys: ["=", "expr"], desc: "Calculator — e.g. =2+2, =2^8, =5×3" },
  { keys: ["!", "gh", "query"], desc: "Bang search — e.g. !gh kickstart" },
];

export function showShortcutHelp(): void {
  if (document.querySelector(".ks-shortcuts-overlay")) return;
  const overlay = document.createElement("div");
  overlay.className = "ks-shortcuts-overlay";
  overlay.innerHTML = `
    <div class="ks-shortcuts-card" role="dialog" aria-label="Keyboard shortcuts">
      <header class="ks-shortcuts-header">
        <h2>Keyboard shortcuts</h2>
        <button type="button" class="ks-shortcuts-close" aria-label="Close">×</button>
      </header>
      <table class="ks-shortcuts-table ks-shortcuts-table--compact">
        <tbody>
          ${SHORTCUTS.map(
            (s) => `
            <tr>
              <td class="ks-shortcuts-keys">${s.keys.map((k) => `<kbd>${k}</kbd>`).join("")}</td>
              <td>${s.desc}</td>
            </tr>`,
          ).join("")}
        </tbody>
      </table>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) close();
  });
  overlay.querySelector(".ks-shortcuts-close")?.addEventListener("click", close);
}
