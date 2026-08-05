import type { AppContext } from "../layout/engine.ts";
import { saveConfig } from "../config/store.ts";
import {
  SEARCH_ENGINES,
  matchEngine,
  getSearchLabel,
  applySearchEngine,
} from "./search-utils.ts";
import { SEARCH_ICONS, createSearchIcon } from "./search-icons.ts";

function formatPromptLabel(text: string): string {
  return `${text}:`;
}

export function renderSearchBar(ctx: AppContext): HTMLElement {
  const root = document.createElement("div");
  root.className = "search-bar";

  let active = matchEngine(ctx.config.search.name, ctx.config.search.url);
  let label = getSearchLabel(ctx.config.search);
  const isPreset = !!(active && SEARCH_ICONS[active.id]);

  const form = document.createElement("form");
  form.action = ctx.config.search.url;
  form.method = "get";
  form.autocomplete = "off";

  const prompt = document.createElement("span");
  prompt.className = "search-form-prompt";

  const appendPresetIcon = () => {
    prompt.replaceChildren(createSearchIcon(active!.id, active!.label));
  };

  const appendCustomLabel = (editable: boolean) => {
    prompt.replaceChildren();
    if (editable) {
      const labelInput = document.createElement("input");
      labelInput.type = "text";
      labelInput.className = "search-prompt-input";
      labelInput.value = label;
      labelInput.placeholder = "search";
      labelInput.spellcheck = false;
      labelInput.addEventListener("input", () => {
        label = labelInput.value.trim() || ctx.config.search.name || "search";
        ctx.config.search.label = labelInput.value;
        saveConfig(ctx.config);
      });
      const colon = document.createElement("span");
      colon.className = "search-prompt-colon";
      colon.textContent = ":";
      prompt.appendChild(labelInput);
      prompt.appendChild(colon);
    } else {
      const labelEl = document.createElement("h1");
      labelEl.textContent = formatPromptLabel(label);
      prompt.appendChild(labelEl);
    }
  };

  if (isPreset) {
    appendPresetIcon();
  } else {
    appendCustomLabel(ctx.editMode);
  }

  form.appendChild(prompt);

  const input = document.createElement("input");
  input.type = "text";
  input.name = "q";
  input.setAttribute("aria-label", "Search");
  form.appendChild(input);

  if (!ctx.editMode) {
    requestAnimationFrame(() => {
      if (document.querySelector(".ks-welcome-overlay, .ks-settings-overlay")) return;
      input.focus({ preventScroll: true });
    });
  }

  if (ctx.editMode) {
    const presets = document.createElement("div");
    presets.className = "search-presets";

    for (const engine of SEARCH_ENGINES) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "search-preset-btn";
      if (active?.id === engine.id) btn.classList.add("search-preset-btn--active");
      btn.title = engine.label;
      btn.setAttribute("aria-label", engine.label);
      btn.dataset.engineId = engine.id;
      const icon = SEARCH_ICONS[engine.id];
      if (icon) btn.innerHTML = icon;
      else btn.textContent = engine.label;
      btn.addEventListener("click", () => {
        applySearchEngine(ctx.config.search, engine);
        saveConfig(ctx.config);
        ctx.onConfigChange(ctx.config);
      });
      presets.appendChild(btn);
    }

    const customRow = document.createElement("div");
    customRow.className = "search-custom-row";

    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.className = "ks-field-input ks-field-input--url";
    urlInput.value = ctx.config.search.url;
    urlInput.placeholder = "https://…/?q=";
    let wasPreset = isPreset;
    urlInput.addEventListener("input", () => {
      ctx.config.search.url = urlInput.value;
      form.action = urlInput.value;
      const nextActive = matchEngine(ctx.config.search.name, ctx.config.search.url);
      const nowPreset = !!(nextActive && SEARCH_ICONS[nextActive.id]);
      saveConfig(ctx.config);
      if (nowPreset !== wasPreset) {
        wasPreset = nowPreset;
        ctx.onConfigChange(ctx.config);
        return;
      }
      active = nextActive;
      presets.querySelectorAll(".search-preset-btn").forEach((b) => b.classList.remove("search-preset-btn--active"));
      if (active) {
        presets.querySelector(`[data-engine-id="${active.id}"]`)?.classList.add("search-preset-btn--active");
      }
    });

    customRow.appendChild(urlInput);
    root.appendChild(presets);
    root.appendChild(customRow);
  }

  root.appendChild(form);
  return root;
}
