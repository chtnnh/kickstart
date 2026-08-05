import type { AppContext } from "../layout/engine.ts";
import type { WidgetConfig } from "../config/types.ts";
import { saveConfig } from "../config/store.ts";

const QUOTES = [
  "The only way to do great work is to love what you do.",
  "Stay hungry, stay foolish.",
  "Simplicity is the ultimate sophistication.",
  "Make it work, make it right, make it fast.",
  "Done is better than perfect.",
];

function pickRandomQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]!;
}

function displayText(widget: WidgetConfig): string {
  const opts = widget.quote;
  if (opts?.source === "fixed" && opts.text?.trim()) {
    return opts.text.trim();
  }
  return pickRandomQuote();
}

export function renderQuote(ctx: AppContext, widget: WidgetConfig): HTMLElement {
  const root = document.createElement("div");
  root.className = "ks-quote-wrap";

  widget.quote ??= { source: "random" };

  const quote = document.createElement("blockquote");
  quote.className = "ks-quote";
  quote.textContent = displayText(widget);
  root.appendChild(quote);

  if (!ctx.editMode) return root;

  const controls = document.createElement("div");
  controls.className = "ks-quote-controls";

  const randomBtn = document.createElement("button");
  randomBtn.type = "button";
  randomBtn.className = "ks-btn ks-btn--small";
  randomBtn.textContent = "Random";
  if (widget.quote.source !== "fixed") randomBtn.classList.add("ks-btn--active");

  const customBtn = document.createElement("button");
  customBtn.type = "button";
  customBtn.className = "ks-btn ks-btn--small";
  customBtn.textContent = "Custom";
  if (widget.quote.source === "fixed") customBtn.classList.add("ks-btn--active");

  const input = document.createElement("textarea");
  input.className = "ks-field-input ks-quote-input";
  input.rows = 2;
  input.placeholder = "Write your quote…";
  input.value = widget.quote.text ?? "";
  input.hidden = widget.quote.source !== "fixed";

  const setMode = (mode: "random" | "fixed") => {
    widget.quote!.source = mode;
    randomBtn.classList.toggle("ks-btn--active", mode === "random");
    customBtn.classList.toggle("ks-btn--active", mode === "fixed");
    input.hidden = mode !== "fixed";
    if (mode === "random") {
      quote.textContent = pickRandomQuote();
    } else {
      quote.textContent = input.value.trim() || "Your quote here…";
    }
    saveConfig(ctx.config);
  };

  randomBtn.addEventListener("click", () => setMode("random"));
  customBtn.addEventListener("click", () => {
    setMode("fixed");
    input.focus();
  });

  input.addEventListener("input", () => {
    widget.quote!.source = "fixed";
    widget.quote!.text = input.value;
    quote.textContent = input.value.trim() || "Your quote here…";
    saveConfig(ctx.config);
  });

  controls.appendChild(randomBtn);
  controls.appendChild(customBtn);
  controls.appendChild(input);
  root.appendChild(controls);

  return root;
}
