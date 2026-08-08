import type { KickstartConfig } from "../config/types.ts";
import { renderSearchBar } from "../widgets/search.ts";
import { renderTree } from "../tree/render.ts";
import { renderClock } from "../widgets/clock.ts";
import { renderQuote } from "../widgets/quote.ts";
import { renderSpacer } from "../widgets/spacer.ts";
import { renderPomodoro } from "../widgets/pomodoro.ts";
import { renderNote } from "../widgets/note.ts";
import { renderHn } from "../widgets/hn.ts";
import { LAYOUT_ZONES } from "../config/types.ts";
import { attachWidgetMoveButtons, getSortedWidgets, setupZoneLabel } from "./widget-move.ts";

export interface AppContext {
  config: KickstartConfig;
  editMode: boolean;
  onConfigChange: (config: KickstartConfig) => void;
}

export function renderLayout(ctx: AppContext, root: HTMLElement): void {
  root.innerHTML = "";

  const bg = document.createElement("div");
  bg.id = "ks-background";
  bg.className = "ks-background";
  root.appendChild(bg);

  const page = document.createElement("div");
  page.className = "ks-page";
  if (ctx.editMode) page.classList.add("ks-page--edit");
  root.appendChild(page);

  for (const zone of LAYOUT_ZONES) {
    const zoneEl = document.createElement("div");
    zoneEl.className = `ks-zone ks-zone--${zone}`;
    zoneEl.dataset.zone = zone;
    page.appendChild(zoneEl);
  }

  const widgets = getSortedWidgets(ctx.config.widgets);

  for (const zone of LAYOUT_ZONES) {
    const zoneEl = page.querySelector(`[data-zone="${zone}"]`) as HTMLElement;
    const zoneWidgets = widgets.filter((w) => w.layout.zone === zone);

    if (ctx.editMode) {
      setupZoneLabel(zoneEl, zone);
    }

    zoneWidgets.forEach((widget) => {
      const wrapper = document.createElement("div");
      wrapper.className = `ks-widget ks-widget--${widget.type} ks-align--${widget.layout.align}`;
      wrapper.dataset.widgetId = widget.id;

      switch (widget.type) {
        case "search":
          wrapper.appendChild(renderSearchBar(ctx));
          break;
        case "tree":
          wrapper.appendChild(renderTree(ctx));
          break;
        case "clock":
          wrapper.appendChild(renderClock(ctx, widget.id));
          break;
        case "quote":
          wrapper.appendChild(renderQuote(ctx, widget));
          break;
        case "spacer":
          wrapper.appendChild(renderSpacer(widget.spacer?.size ?? "md", ctx.editMode));
          break;
        case "pomodoro":
          wrapper.appendChild(renderPomodoro(ctx, widget.id));
          break;
        case "note":
          wrapper.appendChild(renderNote(ctx, widget));
          break;
        case "hn":
          wrapper.appendChild(renderHn(ctx, widget.id));
          break;
      }

      if (ctx.editMode) {
        attachWidgetMoveButtons(wrapper, widget.id, ctx);
      }

      zoneEl.appendChild(wrapper);
    });
  }
}
