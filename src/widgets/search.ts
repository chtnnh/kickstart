import type { AppContext } from "../layout/engine.ts";
import { saveConfig } from "../config/store.ts";
import {
  SEARCH_ENGINES,
  matchEngine,
  getSearchLabel,
  applySearchEngine,
  resolveBang,
  engineParam,
  resolveMultiSearchEngines,
} from "./search-utils.ts";
import { SEARCH_ICONS, createSearchIcon } from "./search-icons.ts";
import { tryEvaluateCalc } from "../search/calc.ts";
import { cycleSearchHistory, loadSearchHistory, pushSearchHistory } from "../search/history.ts";
import { buildSearchUrl, openMultiSearch } from "../search/navigate.ts";

function formatPromptLabel(text: string): string {
  return `${text}:`;
}

function mountSearchHistory(root: HTMLElement, input: HTMLInputElement): void {
  const history = loadSearchHistory();
  if (history.length === 0) return;

  const wrap = document.createElement("div");
  wrap.className = "search-history-wrap";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "search-history-btn";
  btn.title = "Recent searches";
  btn.setAttribute("aria-label", "Recent searches");
  btn.setAttribute("aria-haspopup", "listbox");
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;

  const panel = document.createElement("div");
  panel.className = "search-history-panel";
  panel.hidden = true;
  panel.setAttribute("role", "listbox");
  panel.innerHTML = `<div class="search-history-header">Recent searches</div>`;

  const list = document.createElement("ul");
  list.className = "search-history-list";
  for (const item of history) {
    const li = document.createElement("li");
    const rowBtn = document.createElement("button");
    rowBtn.type = "button";
    rowBtn.className = "search-history-item";
    rowBtn.textContent = item;
    rowBtn.addEventListener("click", () => {
      input.value = item;
      input.focus();
      panel.hidden = true;
    });
    li.appendChild(rowBtn);
    list.appendChild(li);
  }
  panel.appendChild(list);
  wrap.appendChild(btn);
  wrap.appendChild(panel);
  root.appendChild(wrap);

  const close = (e: MouseEvent) => {
    if (!wrap.contains(e.target as Node)) panel.hidden = true;
  };

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.hidden = !panel.hidden;
    if (!panel.hidden) document.addEventListener("click", close, { once: true });
  });
}

function bindSearchHistoryKeys(input: HTMLInputElement): void {
  input.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    if (loadSearchHistory().length === 0) return;
    e.preventDefault();
    input.value = cycleSearchHistory(input.value, e.key === "ArrowDown" ? "down" : "up");
  });
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
  input.name = engineParam(active);
  input.id = "ks-search-input";
  input.setAttribute("aria-label", "Search");
  input.setAttribute("enterkeyhint", "search");
  if (!ctx.editMode) input.setAttribute("autofocus", "");
  form.appendChild(input);

  form.addEventListener("submit", (e) => {
    const q = input.value.trim();
    const calc = tryEvaluateCalc(q);
    if (calc !== null) {
      e.preventDefault();
      input.value = String(calc);
      return;
    }
    const bang = resolveBang(q);
    if (bang) {
      e.preventDefault();
      window.location.href = buildSearchUrl(bang.engine, bang.query);
      return;
    }
    pushSearchHistory(q);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.shiftKey && ctx.config.search.multiSearch) {
      e.preventDefault();
      const q = input.value.trim();
      if (!q || tryEvaluateCalc(q) !== null) return;
      openMultiSearch(resolveMultiSearchEngines(ctx.config.search), q);
      pushSearchHistory(q);
    }
  });

  bindSearchHistoryKeys(input);
  mountSearchHistory(form, input);

  if (ctx.editMode) {
    root.classList.add("search-bar--edit");
    root.appendChild(form);

    const editPanel = document.createElement("div");
    editPanel.className = "search-edit-panel";

    const engineRow = document.createElement("div");
    engineRow.className = "search-edit-row";

    const engineLabel = document.createElement("span");
    engineLabel.className = "search-edit-row-label";
    engineLabel.textContent = "Default engine";
    engineRow.appendChild(engineLabel);

    const presets = document.createElement("div");
    presets.className = "search-presets";

    const selectEngine = (engine: (typeof SEARCH_ENGINES)[number] | null) => {
      if (engine) {
        applySearchEngine(ctx.config.search, engine);
        input.name = engineParam(engine);
        form.action = engine.url;
      }
      saveConfig(ctx.config);
      ctx.onConfigChange(ctx.config);
    };

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
      btn.addEventListener("click", () => selectEngine(engine));
      presets.appendChild(btn);
    }

    const customToggle = document.createElement("button");
    customToggle.type = "button";
    customToggle.className = "search-preset-btn search-custom-toggle";
    if (!isPreset) customToggle.classList.add("search-preset-btn--active");
    customToggle.title = "Custom search URL";
    customToggle.textContent = "Custom";
    presets.appendChild(customToggle);
    engineRow.appendChild(presets);
    editPanel.appendChild(engineRow);

    const customPanel = document.createElement("div");
    customPanel.className = "search-custom-panel";
    customPanel.hidden = isPreset;

    const customHint = document.createElement("p");
    customHint.className = "search-custom-hint";
    customHint.textContent = "Use a URL template with a query parameter, e.g. https://example.com/search?q=";
    customPanel.appendChild(customHint);

    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.className = "ks-field-input ks-field-input--url";
    urlInput.value = ctx.config.search.url;
    urlInput.placeholder = "https://…/?q=";
    urlInput.addEventListener("input", () => {
      ctx.config.search.url = urlInput.value;
      form.action = urlInput.value;
      const nextActive = matchEngine(ctx.config.search.name, ctx.config.search.url);
      saveConfig(ctx.config);
      active = nextActive;
      presets.querySelectorAll(".search-preset-btn").forEach((b) => b.classList.remove("search-preset-btn--active"));
      customToggle.classList.add("search-preset-btn--active");
      customPanel.hidden = false;
    });
    customPanel.appendChild(urlInput);

    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.className = "ks-field-input";
    labelInput.value = ctx.config.search.label ?? ctx.config.search.name;
    labelInput.placeholder = "Search label";
    labelInput.addEventListener("input", () => {
      ctx.config.search.label = labelInput.value;
      ctx.config.search.name = labelInput.value.trim() || ctx.config.search.name;
      saveConfig(ctx.config);
    });
    customPanel.appendChild(labelInput);

    customToggle.addEventListener("click", () => {
      presets.querySelectorAll(".search-preset-btn").forEach((b) => b.classList.remove("search-preset-btn--active"));
      customToggle.classList.add("search-preset-btn--active");
      customPanel.hidden = false;
      urlInput.focus();
    });

    editPanel.appendChild(customPanel);

    const multiRow = document.createElement("div");
    multiRow.className = "search-edit-row";

    const multiRowLabel = document.createElement("span");
    multiRowLabel.className = "search-edit-row-label";
    multiRowLabel.textContent = "Multi-search";
    multiRow.appendChild(multiRowLabel);

    const multiSection = document.createElement("div");
    multiSection.className = "search-multi-section";

    const multiLabel = document.createElement("label");
    multiLabel.className = "ks-field ks-field--row ks-checkbox-field";
    multiLabel.innerHTML = `<span>Multi-search (Shift+Enter)</span><input type="checkbox" id="ks-multi-search" ${ctx.config.search.multiSearch ? "checked" : ""} />`;
    multiLabel.querySelector("input")?.addEventListener("change", (ev) => {
      ctx.config.search.multiSearch = (ev.target as HTMLInputElement).checked;
      enginesWrap.hidden = !ctx.config.search.multiSearch;
      saveConfig(ctx.config);
    });
    multiSection.appendChild(multiLabel);

    const enginesWrap = document.createElement("div");
    enginesWrap.className = "search-multi-engines";
    enginesWrap.hidden = !ctx.config.search.multiSearch;
    ctx.config.search.multiSearchEngines ??= resolveMultiSearchEngines(ctx.config.search).map((e) => e.id);

    for (const engine of SEARCH_ENGINES) {
      const engineLabel = document.createElement("label");
      engineLabel.className = "ks-checkbox-field search-multi-engine";
      const checked = ctx.config.search.multiSearchEngines!.includes(engine.id);
      engineLabel.innerHTML = `<input type="checkbox" value="${engine.id}" ${checked ? "checked" : ""} /><span>${engine.label}</span>`;
      engineLabel.querySelector("input")?.addEventListener("change", (ev) => {
        const box = ev.target as HTMLInputElement;
        const ids = new Set(ctx.config.search.multiSearchEngines ?? []);
        if (box.checked) ids.add(engine.id);
        else ids.delete(engine.id);
        ctx.config.search.multiSearchEngines = [...ids];
        saveConfig(ctx.config);
      });
      enginesWrap.appendChild(engineLabel);
    }
    multiSection.appendChild(enginesWrap);
    multiRow.appendChild(multiSection);
    editPanel.appendChild(multiRow);

    root.appendChild(editPanel);
    return root;
  }

  root.appendChild(form);
  return root;
}

export function focusSearchInput(): void {
  const input = document.getElementById("ks-search-input") as HTMLInputElement | null;
  if (!input) return;
  input.focus({ preventScroll: true });
  input.select();
}

export function scheduleSearchFocus(): void {
  const tryFocus = () => {
    if (document.querySelector(".ks-welcome-overlay, .ks-settings-overlay")) return;
    focusSearchInput();
  };
  requestAnimationFrame(() => {
    tryFocus();
    window.setTimeout(tryFocus, 50);
  });
}
