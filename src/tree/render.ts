import type { AppContext } from "../layout/engine.ts";
import type { Bookmark, BookmarkCategory, BookmarkColumn } from "../config/types.ts";
import { saveConfig } from "../config/store.ts";
import { setupTreeDnD } from "./dnd.ts";
import { iconButton, ICONS } from "../ui/icons.ts";
import {
  loadCollapsed,
  saveCollapsed,
  loadCollapseAll,
  saveCollapseAll,
  isCategoryCollapsed,
  toggleCategoryCollapsed,
  toggleCollapseAll,
} from "./collapse-state.ts";
import { attachFavicon } from "./favicon.ts";
import { pushUndo, popUndo, undoDepth } from "./undo.ts";
import { duplicateCategory, openAllInCategory } from "./actions.ts";
import { bookmarkUrlError } from "./validate.ts";

const EMPTY_CATEGORY = (): BookmarkCategory => ({
  cn: "new category",
  b: [{ n: "new link", u: "" }],
});

const collapsedCategories = loadCollapsed();
let collapseAll = loadCollapseAll();

function commit(ctx: AppContext): void {
  saveConfig(ctx.config);
  ctx.onConfigChange(ctx.config);
}

function snapshotUndo(ctx: AppContext, label: string): void {
  pushUndo(label, ctx.config.tree.columns);
}

function undoLast(ctx: AppContext): void {
  const entry = popUndo();
  if (!entry) return;
  ctx.config.tree.columns = entry.columns;
  commit(ctx);
  refreshUndoBar();
}

function refreshUndoBar(): void {
  const bar = document.querySelector(".ks-undo-bar");
  if (undoDepth() === 0) {
    bar?.remove();
    return;
  }
  if (!bar) {
    const el = document.createElement("div");
    el.className = "ks-undo-bar";
    el.innerHTML = `<span class="ks-undo-bar-msg"></span><button type="button" class="ks-btn ks-btn--small">Undo</button>`;
    document.body.appendChild(el);
    el.querySelector("button")?.addEventListener("click", () => {
      const appUndo = (window as unknown as { __ksUndo?: () => void }).__ksUndo;
      appUndo?.();
    });
  }
  const msg = document.querySelector(".ks-undo-bar-msg");
  if (msg) msg.textContent = "Change saved — undo available";
}

function notifyDelete(ctx: AppContext, label: string): void {
  snapshotUndo(ctx, label);
  refreshUndoBar();
}

export function bindTreeUndoHandler(handler: () => void): void {
  (window as unknown as { __ksUndo?: () => void }).__ksUndo = handler;
}

export function renderTree(ctx: AppContext): HTMLElement {
  bindTreeUndoHandler(() => undoLast(ctx));
  refreshUndoBar();

  const container = document.createElement("div");
  container.className = "tree-container";
  if (ctx.config.tree.columns.length === 1) {
    container.classList.add("tree-container--single");
  }

  const prompt = document.createElement("div");
  prompt.className = "prompt tree-header";
  prompt.innerHTML = '~ <span>λ </span> tree';

  if (ctx.editMode) {
    const collapseAllBtn = document.createElement("button");
    collapseAllBtn.type = "button";
    collapseAllBtn.className = "ks-btn ks-btn--small";
    collapseAllBtn.textContent = collapseAll ? "Expand all" : "Collapse all";
    collapseAllBtn.addEventListener("click", () => {
      const next = toggleCollapseAll(ctx.config.tree.columns);
      collapseAll = next.collapseAll;
      collapsedCategories.clear();
      for (const k of next.manual) collapsedCategories.add(k);
      ctx.onConfigChange(ctx.config);
    });
    prompt.appendChild(collapseAllBtn);
  }

  container.appendChild(prompt);

  const row = document.createElement("div");
  row.className = "row tree-row";

  ctx.config.tree.columns.forEach((col, colIdx) => {
    row.appendChild(renderColumn(ctx, col, colIdx));
  });

  if (ctx.editMode) {
    const addCol = document.createElement("button");
    addCol.type = "button";
    addCol.className = "column--add";
    addCol.title = "Add column";
    addCol.setAttribute("aria-label", "Add column");
    addCol.textContent = "+";
    addCol.addEventListener("click", () => {
      snapshotUndo(ctx, "add column");
      ctx.config.tree.columns.push([EMPTY_CATEGORY()]);
      commit(ctx);
    });
    row.appendChild(addCol);
    setupTreeDnD(row, ctx, () => commit(ctx));
  }

  container.appendChild(row);
  return container;
}

function renderColumn(ctx: AppContext, col: BookmarkColumn, colIdx: number): HTMLElement {
  const column = document.createElement("div");
  column.className = "column";
  column.dataset.dndKind = "column";
  column.dataset.colIdx = String(colIdx);
  column.dataset.dndDrop = "column";

  const tree = document.createElement("div");
  tree.className = "tree";

  const header = document.createElement("div");
  header.className = "tree-col-header";

  if (ctx.editMode) {
    const grip = document.createElement("span");
    grip.className = "ks-dnd-handle";
    grip.innerHTML = ICONS.grip;
    grip.title = "Drag to reorder column";
    header.appendChild(grip);

    const delCol = iconButton(ICONS.trash, "ks-btn ks-btn--icon ks-btn--danger", "Delete column");
    delCol.addEventListener("click", (e) => {
      e.stopPropagation();
      if (ctx.config.tree.columns.length <= 1) return;
      if (!confirm("Delete this column and all its contents?")) return;
      notifyDelete(ctx, "column");
      ctx.config.tree.columns.splice(colIdx, 1);
      commit(ctx);
    });
    header.appendChild(delCol);
  }

  const dot = document.createElement("h1");
  dot.textContent = ".";
  header.appendChild(dot);
  tree.appendChild(header);

  const ul = document.createElement("ul");
  ul.className = "category-list";
  col.forEach((cat, catIdx) => {
    ul.appendChild(renderCategory(ctx, cat, colIdx, catIdx));
  });
  tree.appendChild(ul);

  if (ctx.editMode) {
    const addCat = document.createElement("button");
    addCat.className = "ks-btn ks-btn--small";
    addCat.textContent = "+ category";
    addCat.addEventListener("click", () => {
      snapshotUndo(ctx, "add category");
      col.push(EMPTY_CATEGORY());
      commit(ctx);
    });
    tree.appendChild(addCat);
  }

  column.appendChild(tree);
  return column;
}

function updateCategoryCollapse(
  toggle: HTMLButtonElement,
  body: HTMLElement,
  collapsed: boolean,
): void {
  body.hidden = collapsed;
  toggle.textContent = collapsed ? "▸" : "▾";
  toggle.title = collapsed ? "Expand category" : "Collapse category";
  toggle.setAttribute("aria-expanded", String(!collapsed));
}

function renderCategory(
  ctx: AppContext,
  cat: BookmarkCategory,
  colIdx: number,
  catIdx: number,
): HTMLElement {
  const li = document.createElement("li");
  li.className = "category";
  li.dataset.dndKind = "category";
  li.dataset.colIdx = String(colIdx);
  li.dataset.catIdx = String(catIdx);
  li.dataset.dndDrop = "category";

  const isCollapsed = isCategoryCollapsed(colIdx, catIdx, collapseAll, collapsedCategories);

  const h1 = document.createElement("h1");
  h1.className = "category-header";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "ks-collapse-btn";
  toggle.setAttribute("aria-label", "Toggle category");
  toggle.textContent = isCollapsed ? "▸" : "▾";
  toggle.title = isCollapsed ? "Expand category" : "Collapse category";
  toggle.setAttribute("aria-expanded", String(!isCollapsed));

  const body = document.createElement("div");
  body.className = "category-body";
  body.hidden = isCollapsed;

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const next = toggleCategoryCollapsed(
      colIdx,
      catIdx,
      ctx.config.tree.columns,
      collapseAll,
      collapsedCategories,
    );
    collapseAll = next.collapseAll;
    collapsedCategories.clear();
    for (const k of next.manual) collapsedCategories.add(k);
    saveCollapsed(collapsedCategories);
    saveCollapseAll(collapseAll);
    updateCategoryCollapse(toggle, body, next.collapsed);
  });
  h1.appendChild(toggle);

  const openAll = iconButton(ICONS.external, "ks-btn ks-btn--icon ks-category-open", "Open all links");
  openAll.addEventListener("click", (e) => {
    e.stopPropagation();
    openAllInCategory(cat);
  });
  h1.appendChild(openAll);

  if (ctx.editMode) {
    const grip = document.createElement("span");
    grip.className = "ks-dnd-handle";
    grip.innerHTML = ICONS.grip;
    grip.title = "Drag to reorder category";
    h1.appendChild(grip);

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "ks-field-input ks-field-input--name";
    nameInput.value = cat.cn;
    nameInput.placeholder = "category name";
    nameInput.addEventListener("input", () => {
      cat.cn = nameInput.value;
      saveConfig(ctx.config);
    });
    h1.appendChild(nameInput);

    const dupCat = iconButton(ICONS.copy, "ks-btn ks-btn--icon", "Duplicate category");
    dupCat.addEventListener("click", (e) => {
      e.stopPropagation();
      snapshotUndo(ctx, "duplicate category");
      duplicateCategory(ctx.config.tree.columns, colIdx, catIdx);
      commit(ctx);
    });
    h1.appendChild(dupCat);

    const delCat = iconButton(ICONS.trash, "ks-btn ks-btn--icon ks-btn--danger", "Delete category");
    delCat.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!confirm("Delete this category and all its links?")) return;
      notifyDelete(ctx, "category");
      ctx.config.tree.columns[colIdx]!.splice(catIdx, 1);
      if (ctx.config.tree.columns[colIdx]!.length === 0 && ctx.config.tree.columns.length > 1) {
        ctx.config.tree.columns.splice(colIdx, 1);
      }
      commit(ctx);
    });
    h1.appendChild(delCat);
  } else {
    const span = document.createElement("span");
    span.className = "category-title";
    span.textContent = cat.cn;
    h1.appendChild(span);
  }

  li.appendChild(h1);

  const ul = document.createElement("ul");
  ul.className = "bookmark-list";
  cat.b.forEach((bm, bmIdx) => {
    ul.appendChild(renderBookmark(ctx, bm, colIdx, catIdx, bmIdx));
  });
  body.appendChild(ul);

  if (ctx.editMode) {
    const addBm = document.createElement("button");
    addBm.className = "ks-btn ks-btn--small";
    addBm.textContent = "+ link";
    addBm.addEventListener("click", () => {
      snapshotUndo(ctx, "add link");
      cat.b.push({ n: "new link", u: "" });
      commit(ctx);
    });
    body.appendChild(addBm);
  }

  li.appendChild(body);
  return li;
}

function renderBookmark(
  ctx: AppContext,
  bm: Bookmark,
  colIdx: number,
  catIdx: number,
  bmIdx: number,
): HTMLElement {
  const li = document.createElement("li");
  li.className = "bookmark";
  li.dataset.dndKind = "bookmark";
  li.dataset.colIdx = String(colIdx);
  li.dataset.catIdx = String(catIdx);
  li.dataset.bmIdx = String(bmIdx);
  li.dataset.dndDrop = "bookmark";

  const row = document.createElement("div");
  row.className = "bookmark-row";

  if (ctx.editMode) {
    const grip = document.createElement("span");
    grip.className = "ks-dnd-handle";
    grip.innerHTML = ICONS.grip;
    grip.title = "Drag to reorder link";
    row.appendChild(grip);

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "ks-field-input ks-field-input--name";
    nameInput.value = bm.n;
    nameInput.placeholder = "name";
    nameInput.addEventListener("input", () => {
      bm.n = nameInput.value;
      saveConfig(ctx.config);
    });
    row.appendChild(nameInput);

    const urlWrap = document.createElement("div");
    urlWrap.className = "ks-url-field";

    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.className = "ks-field-input ks-field-input--url";
    urlInput.value = bm.u;
    urlInput.placeholder = "https://example.com";
    const syncUrlValidation = () => {
      const err = bookmarkUrlError(bm.u);
      urlInput.classList.toggle("ks-field-input--invalid", Boolean(err));
      urlInput.setAttribute("aria-invalid", err ? "true" : "false");
      let hint = urlWrap.querySelector(".ks-field-error");
      if (err) {
        if (!hint) {
          hint = document.createElement("span");
          hint.className = "ks-field-error";
          urlWrap.appendChild(hint);
        }
        hint.textContent = err;
      } else {
        hint?.remove();
      }
    };
    urlInput.addEventListener("input", () => {
      bm.u = urlInput.value;
      syncUrlValidation();
      saveConfig(ctx.config);
    });
    urlInput.addEventListener("blur", syncUrlValidation);
    urlWrap.appendChild(urlInput);
    row.appendChild(urlWrap);

    const del = iconButton(ICONS.trash, "ks-btn ks-btn--icon ks-btn--danger", "Delete link");
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      notifyDelete(ctx, "link");
      ctx.config.tree.columns[colIdx]![catIdx]!.b.splice(bmIdx, 1);
      commit(ctx);
    });
    row.appendChild(del);
  } else {
    const a = document.createElement("a");
    a.className = "bookmark-link";
    a.href = bm.u.includes("//") ? bm.u : bm.u ? "//" + bm.u : "#";
    a.textContent = bm.n;
    if (!bm.u) a.addEventListener("click", (e) => e.preventDefault());
    attachFavicon(a, bm.u, ctx.config.privacy?.favicons !== false);
    row.appendChild(a);
  }

  li.appendChild(row);
  return li;
}
