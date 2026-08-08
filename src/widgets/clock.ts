import type { AppContext } from "../layout/engine.ts";
import { saveConfig } from "../config/store.ts";
import { buildTimezoneSelect } from "../lib/timezones.ts";

const intervals = new Map<string, ReturnType<typeof setInterval>>();

export function getSystemClockFormat(): "12h" | "24h" {
  const parts = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).formatToParts(new Date());
  return parts.some((p) => p.type === "dayPeriod") ? "12h" : "24h";
}

export function resolveClockFormat(format?: "12h" | "24h"): "12h" | "24h" {
  return format ?? getSystemClockFormat();
}

function setClockInterval(widgetId: string, tick: () => void, showSeconds: boolean): void {
  const prev = intervals.get(widgetId);
  if (prev) clearInterval(prev);
  intervals.set(widgetId, setInterval(tick, showSeconds ? 1000 : 60_000));
}

export function renderClock(ctx: AppContext, widgetId: string): HTMLElement {
  const widget = ctx.config.widgets.find((w) => w.id === widgetId);
  const root = document.createElement("div");
  root.className = "ks-clock-wrap";
  widget!.clock ??= {};
  const layout = widget!.clock.layout ?? "row";
  root.classList.add(`ks-clock-wrap--${layout}`);

  const zones = widget!.clock.zones;
  const zonesWrap = document.createElement("div");
  zonesWrap.className = "ks-clock-zones";

  if (zones?.length) {
    for (let i = 0; i < zones.length; i++) {
      zonesWrap.appendChild(renderSingleClock(ctx, widgetId, zones[i]!.label, zones[i]!.timeZone, widget, i));
    }
  } else {
    zonesWrap.appendChild(renderSingleClock(ctx, widgetId, undefined, undefined, widget));
  }
  root.appendChild(zonesWrap);

  if (ctx.editMode) {
    const zoneEditor = document.createElement("div");
    zoneEditor.className = "ks-clock-zone-toolbar";

    const layoutLabel = document.createElement("label");
    layoutLabel.className = "ks-field ks-field--row ks-clock-layout-field";
    layoutLabel.innerHTML = `<span>Layout</span><select class="ks-clock-layout-select">
      <option value="row" ${layout === "row" ? "selected" : ""}>Row</option>
      <option value="column" ${layout === "column" ? "selected" : ""}>Column</option>
    </select>`;
    layoutLabel.querySelector("select")?.addEventListener("change", (e) => {
      widget!.clock ??= {};
      widget!.clock.layout = (e.target as HTMLSelectElement).value as "row" | "column";
      saveConfig(ctx.config);
      ctx.onConfigChange(ctx.config);
    });
    zoneEditor.appendChild(layoutLabel);

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "ks-btn ks-btn--small ks-clock-add-btn";
    addBtn.textContent = "+";
    addBtn.setAttribute("aria-label", "Add timezone");
    addBtn.title = "Add timezone";
    addBtn.addEventListener("click", () => {
      widget!.clock ??= {};
      widget!.clock.zones ??= [];
      widget!.clock.zones.push({
        label: "Zone",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      saveConfig(ctx.config);
      ctx.onConfigChange(ctx.config);
    });
    zoneEditor.appendChild(addBtn);
    root.appendChild(zoneEditor);
  }

  return root;
}

function renderSingleClock(
  ctx: AppContext,
  widgetId: string,
  label: string | undefined,
  timeZone: string | undefined,
  widget: AppContext["config"]["widgets"][0] | undefined,
  zoneIdx?: number,
): HTMLElement {
  let format = resolveClockFormat(widget?.clock?.format);
  let showSeconds = widget?.clock?.showSeconds ?? false;

  const block = document.createElement("div");
  block.className = "ks-clock-block";

  if (ctx.editMode && timeZone !== undefined && zoneIdx !== undefined) {
    const editor = document.createElement("div");
    editor.className = "ks-clock-zone-fields";

    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.className = "ks-field-input";
    labelInput.value = label ?? "";
    labelInput.placeholder = "Label";
    labelInput.addEventListener("input", () => {
      const zone = widget?.clock?.zones?.[zoneIdx];
      if (zone) {
        zone.label = labelInput.value;
        saveConfig(ctx.config);
      }
    });
    editor.appendChild(labelInput);

    const tzSelect = document.createElement("select");
    tzSelect.className = "ks-field-input";
    tzSelect.innerHTML = buildTimezoneSelect(timeZone);
    tzSelect.addEventListener("change", () => {
      const zone = widget?.clock?.zones?.[zoneIdx];
      if (zone) {
        zone.timeZone = tzSelect.value;
        saveConfig(ctx.config);
        ctx.onConfigChange(ctx.config);
      }
    });
    editor.appendChild(tzSelect);

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "ks-btn ks-btn--small ks-btn--danger";
    delBtn.textContent = "Remove";
    delBtn.addEventListener("click", () => {
      widget?.clock?.zones?.splice(zoneIdx, 1);
      saveConfig(ctx.config);
      ctx.onConfigChange(ctx.config);
    });
    editor.appendChild(delBtn);
    block.appendChild(editor);
  } else if (label) {
    const lbl = document.createElement("span");
    lbl.className = "ks-clock-zone-label";
    lbl.textContent = label;
    block.appendChild(lbl);
  }

  const el = document.createElement("div");
  el.className = "ks-clock";

  const update = () => {
    const now = new Date();
    try {
      el.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: showSeconds ? "2-digit" : undefined,
        hour12: format === "12h",
        timeZone,
      });
    } catch {
      el.textContent = "invalid tz";
    }
  };

  update();
  const key = timeZone ? `${widgetId}:${timeZone}:${zoneIdx ?? 0}` : widgetId;
  setClockInterval(key, update, showSeconds);

  if (ctx.editMode && timeZone === undefined) {
    el.classList.add("ks-clock--editable");
    el.title = "Click to toggle 12h / 24h";
    el.addEventListener("click", () => {
      format = format === "12h" ? "24h" : "12h";
      if (widget) {
        widget.clock ??= {};
        widget.clock.format = format;
        saveConfig(ctx.config);
      }
      update();
    });

    const controls = document.createElement("div");
    controls.className = "ks-clock-controls";

    const secondsBtn = document.createElement("button");
    secondsBtn.type = "button";
    secondsBtn.className = "ks-btn ks-btn--small";
    secondsBtn.textContent = "Seconds";
    if (showSeconds) secondsBtn.classList.add("ks-btn--active");
    secondsBtn.addEventListener("click", () => {
      showSeconds = !showSeconds;
      if (widget) {
        widget.clock ??= {};
        widget.clock.showSeconds = showSeconds;
        saveConfig(ctx.config);
      }
      secondsBtn.classList.toggle("ks-btn--active", showSeconds);
      setClockInterval(key, update, showSeconds);
      update();
    });

    controls.appendChild(secondsBtn);
    block.appendChild(el);
    block.appendChild(controls);
  } else {
    block.appendChild(el);
  }

  return block;
}
