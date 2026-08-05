import type { AppContext } from "./engine.ts";
import type { LayoutZone, WidgetConfig } from "../config/types.ts";
import { LAYOUT_ZONES } from "../config/types.ts";
import { saveConfig } from "../config/store.ts";
import { ICONS } from "../ui/icons.ts";

/** Kept so tree drag handlers ignore widget drags (legacy MIME check). */
export const WIDGET_MIME = "application/x-kickstart-widget";

const ZONE_LABELS: Record<LayoutZone, string> = {
  top: "Top",
  "above-tree": "Above tree",
  main: "Main",
  "below-tree": "Below tree",
  bottom: "Bottom",
};

export function getSortedWidgets(widgets: WidgetConfig[]): WidgetConfig[] {
  return widgets
    .filter((w) => w.enabled)
    .sort((a, b) => {
      const za = LAYOUT_ZONES.indexOf(a.layout.zone);
      const zb = LAYOUT_ZONES.indexOf(b.layout.zone);
      if (za !== zb) return za - zb;
      return a.layout.order - b.layout.order;
    });
}

function widgetsInZone(widgets: WidgetConfig[], zone: LayoutZone): WidgetConfig[] {
  return widgets
    .filter((w) => w.enabled && w.layout.zone === zone)
    .sort((a, b) => a.layout.order - b.layout.order);
}

function normalizeWidgetOrders(widgets: WidgetConfig[]): void {
  for (const zone of LAYOUT_ZONES) {
    widgetsInZone(widgets, zone).forEach((w, i) => {
      w.layout.order = i;
    });
  }
}

function swapWidgets(a: WidgetConfig, b: WidgetConfig): void {
  const tmpZone = a.layout.zone;
  const tmpOrder = a.layout.order;
  a.layout.zone = b.layout.zone;
  a.layout.order = b.layout.order;
  b.layout.zone = tmpZone;
  b.layout.order = tmpOrder;
}

export function canMoveWidget(
  widgets: WidgetConfig[],
  widgetId: string,
  direction: "up" | "down",
): boolean {
  const widget = widgets.find((w) => w.id === widgetId && w.enabled);
  if (!widget) return false;

  const zoneIdx = LAYOUT_ZONES.indexOf(widget.layout.zone);
  const inZone = widgetsInZone(widgets, widget.layout.zone);
  const pos = inZone.findIndex((w) => w.id === widgetId);

  if (direction === "up") {
    return pos > 0 || zoneIdx > 0;
  }
  return pos < inZone.length - 1 || zoneIdx < LAYOUT_ZONES.length - 1;
}

export function moveWidget(
  widgets: WidgetConfig[],
  widgetId: string,
  direction: "up" | "down",
): boolean {
  const widget = widgets.find((w) => w.id === widgetId && w.enabled);
  if (!widget) return false;

  const zoneIdx = LAYOUT_ZONES.indexOf(widget.layout.zone);
  const inZone = widgetsInZone(widgets, widget.layout.zone);
  const pos = inZone.findIndex((w) => w.id === widgetId);
  if (pos < 0) return false;

  if (direction === "down") {
    if (pos < inZone.length - 1) {
      swapWidgets(widget, inZone[pos + 1]!);
    } else if (zoneIdx < LAYOUT_ZONES.length - 1) {
      const nextZone = LAYOUT_ZONES[zoneIdx + 1]!;
      widget.layout.zone = nextZone;
      widget.layout.order = widgetsInZone(widgets, nextZone).length;
    } else {
      return false;
    }
  } else {
    if (pos > 0) {
      swapWidgets(widget, inZone[pos - 1]!);
    } else if (zoneIdx > 0) {
      const prevZone = LAYOUT_ZONES[zoneIdx - 1]!;
      for (const w of widgets) {
        if (w.enabled && w.layout.zone === prevZone) w.layout.order += 1;
      }
      widget.layout.zone = prevZone;
      widget.layout.order = 0;
    } else {
      return false;
    }
  }

  normalizeWidgetOrders(widgets);
  return true;
}

export function canMoveWidgetToZone(
  widgets: WidgetConfig[],
  widgetId: string,
  targetZone: "top" | "bottom",
): boolean {
  const widget = widgets.find((w) => w.id === widgetId && w.enabled);
  if (!widget) return false;
  return widget.layout.zone !== targetZone;
}

export function moveWidgetToZone(
  widgets: WidgetConfig[],
  widgetId: string,
  targetZone: "top" | "bottom",
): boolean {
  const widget = widgets.find((w) => w.id === widgetId && w.enabled);
  if (!widget || widget.layout.zone === targetZone) return false;

  const order = widgets.filter(
    (w) => w.enabled && w.layout.zone === targetZone && w.id !== widgetId,
  ).length;
  widget.layout.zone = targetZone;
  widget.layout.order = order;
  normalizeWidgetOrders(widgets);
  return true;
}

export function deleteWidget(widgets: WidgetConfig[], widgetId: string): boolean {
  const widget = widgets.find((w) => w.id === widgetId);
  if (!widget || widget.type === "tree") return false;
  const idx = widgets.findIndex((w) => w.id === widgetId);
  if (idx < 0) return false;
  widgets.splice(idx, 1);
  normalizeWidgetOrders(widgets);
  return true;
}

export function setupZoneLabel(zoneEl: HTMLElement, zone: LayoutZone): void {
  zoneEl.classList.add("ks-zone--edit");
  if (zoneEl.querySelector(".ks-zone-label")) return;

  const label = document.createElement("span");
  label.className = "ks-zone-label";
  label.textContent = ZONE_LABELS[zone];
  zoneEl.insertBefore(label, zoneEl.firstChild);
}

export function attachWidgetMoveButtons(
  wrapper: HTMLElement,
  widgetId: string,
  ctx: AppContext,
): void {
  const widget = ctx.config.widgets.find((w) => w.id === widgetId);
  if (!widget) return;

  const toolbar = document.createElement("div");
  toolbar.className = "ks-widget-toolbar";

  const moveGrid = document.createElement("div");
  moveGrid.className = "ks-widget-move-grid";

  const toTopBtn = document.createElement("button");
  toTopBtn.type = "button";
  toTopBtn.className = "ks-move-btn";
  toTopBtn.title = "Move to top section";
  toTopBtn.textContent = "⇈";
  toTopBtn.disabled = !canMoveWidgetToZone(ctx.config.widgets, widgetId, "top");
  toTopBtn.addEventListener("click", () => {
    if (moveWidgetToZone(ctx.config.widgets, widgetId, "top")) {
      saveConfig(ctx.config);
      ctx.onConfigChange(ctx.config);
    }
  });

  const upBtn = document.createElement("button");
  upBtn.type = "button";
  upBtn.className = "ks-move-btn";
  upBtn.title = "Move up";
  upBtn.textContent = "↑";
  upBtn.disabled = !canMoveWidget(ctx.config.widgets, widgetId, "up");
  upBtn.addEventListener("click", () => {
    if (moveWidget(ctx.config.widgets, widgetId, "up")) {
      saveConfig(ctx.config);
      ctx.onConfigChange(ctx.config);
    }
  });

  const downBtn = document.createElement("button");
  downBtn.type = "button";
  downBtn.className = "ks-move-btn";
  downBtn.title = "Move down";
  downBtn.textContent = "↓";
  downBtn.disabled = !canMoveWidget(ctx.config.widgets, widgetId, "down");
  downBtn.addEventListener("click", () => {
    if (moveWidget(ctx.config.widgets, widgetId, "down")) {
      saveConfig(ctx.config);
      ctx.onConfigChange(ctx.config);
    }
  });

  const toBottomBtn = document.createElement("button");
  toBottomBtn.type = "button";
  toBottomBtn.className = "ks-move-btn";
  toBottomBtn.title = "Move to bottom section";
  toBottomBtn.textContent = "⇊";
  toBottomBtn.disabled = !canMoveWidgetToZone(ctx.config.widgets, widgetId, "bottom");
  toBottomBtn.addEventListener("click", () => {
    if (moveWidgetToZone(ctx.config.widgets, widgetId, "bottom")) {
      saveConfig(ctx.config);
      ctx.onConfigChange(ctx.config);
    }
  });

  moveGrid.appendChild(toTopBtn);
  moveGrid.appendChild(upBtn);
  moveGrid.appendChild(toBottomBtn);
  moveGrid.appendChild(downBtn);
  toolbar.appendChild(moveGrid);

  if (widget.type !== "tree") {
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "ks-move-btn ks-move-btn--delete";
    deleteBtn.title = "Remove widget";
    deleteBtn.innerHTML = ICONS.trash;
    deleteBtn.addEventListener("click", () => {
      if (deleteWidget(ctx.config.widgets, widgetId)) {
        saveConfig(ctx.config);
        ctx.onConfigChange(ctx.config);
      }
    });
    toolbar.appendChild(deleteBtn);
  }

  const body = document.createElement("div");
  body.className = "ks-widget-body";
  while (wrapper.firstChild) {
    body.appendChild(wrapper.firstChild);
  }

  wrapper.classList.add("ks-widget--editable");
  wrapper.appendChild(toolbar);
  wrapper.appendChild(body);
}
