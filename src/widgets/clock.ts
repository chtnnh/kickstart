import type { AppContext } from "../layout/engine.ts";
import { saveConfig } from "../config/store.ts";

const intervals = new Map<string, ReturnType<typeof setInterval>>();

/** Detect system 12h vs 24h preference */
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
  let format = resolveClockFormat(widget?.clock?.format);
  let showSeconds = widget?.clock?.showSeconds ?? false;

  const root = document.createElement("div");
  root.className = "ks-clock-wrap";

  const el = document.createElement("div");
  el.className = "ks-clock";

  const update = () => {
    const now = new Date();
    el.textContent = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: showSeconds ? "2-digit" : undefined,
      hour12: format === "12h",
    });
  };

  update();
  setClockInterval(widgetId, update, showSeconds);

  if (ctx.editMode) {
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
      setClockInterval(widgetId, update, showSeconds);
      update();
    });

    controls.appendChild(secondsBtn);
    root.appendChild(el);
    root.appendChild(controls);
  } else {
    root.appendChild(el);
  }

  return root;
}
