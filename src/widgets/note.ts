import type { AppContext } from "../layout/engine.ts";
import type { WidgetConfig } from "../config/types.ts";
import { saveConfig } from "../config/store.ts";

export function renderNote(ctx: AppContext, widget: WidgetConfig): HTMLElement {
  const root = document.createElement("div");
  root.className = "ks-note";

  if (ctx.editMode) {
    const ta = document.createElement("textarea");
    ta.className = "ks-note-input";
    ta.rows = 3;
    ta.value = widget.note?.text ?? "";
    ta.placeholder = "Sticky note…";
    ta.addEventListener("input", () => {
      widget.note ??= {};
      widget.note.text = ta.value;
      saveConfig(ctx.config);
    });
    root.appendChild(ta);
  } else {
    const p = document.createElement("p");
    p.className = "ks-note-text";
    p.textContent = widget.note?.text?.trim() || "";
    root.appendChild(p);
  }
  return root;
}
