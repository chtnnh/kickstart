import type { AppContext } from "../layout/engine.ts";
import type { Bookmark, BookmarkCategory, BookmarkColumn } from "../config/types.ts";
import { saveConfig } from "../config/store.ts";
import { setupTreeDnD } from "./dnd.ts";
import { iconButton, ICONS } from "../ui/icons.ts";

const EMPTY_CATEGORY = (): BookmarkCategory => ({
  cn: "new category",
  b: [{ n: "new link", u: "" }],
});

const collapsedCategories = new Set<string>();
let collapseAll = false;

function catKey(colIdx: number, catIdx: number): string {
  return `${colIdx}:${catIdx}`;
}

function commit(ctx: AppContext): void {
  saveConfig(ctx.config);
  ctx.onConfigChange(ctx.config);
}

export function renderTree(ctx: AppContext): HTMLElement {
  const container = document.createElement("div");
  container.className = "tree-container";

  const prompt = document.createElement("div");
  prompt.className = "prompt tree-header";
  prompt.innerHTML = '~ <span>λ </span> tree';

  if (ctx.editMode) {
    const collapseAllBtn = document.createElement("button");
    collapseAllBtn.type = "button";
    collapseAllBtn.className = "ks-btn ks-btn--small";
    collapseAllBtn.textContent = collapseAll ? "Expand all" : "Collapse all";
    collapseAllBtn.addEventListener("click", () => {
      collapseAll = !collapseAll;
      commit(ctx);
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
      col.push(EMPTY_CATEGORY());
      commit(ctx);
    });
    tree.appendChild(addCat);
  }

  column.appendChild(tree);
  return column;
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

  const key = catKey(colIdx, catIdx);
  const isCollapsed = ctx.editMode && (collapseAll || collapsedCategories.has(key));

  const h1 = document.createElement("h1");
  h1.className = "category-header";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "ks-collapse-btn";
  toggle.textContent = isCollapsed ? "▸" : "▾";
  toggle.title = isCollapsed ? "Expand category" : "Collapse category";
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (collapsedCategories.has(key)) collapsedCategories.delete(key);
    else collapsedCategories.add(key);
    commit(ctx);
  });
  if (ctx.editMode) h1.appendChild(toggle);

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

    const delCat = iconButton(ICONS.trash, "ks-btn ks-btn--icon ks-btn--danger", "Delete category");
    delCat.addEventListener("click", (e) => {
      e.stopPropagation();
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

  const body = document.createElement("div");
  body.className = "category-body";
  if (isCollapsed) body.hidden = true;

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

    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.className = "ks-field-input ks-field-input--url";
    urlInput.value = bm.u;
    urlInput.placeholder = "url";
    urlInput.addEventListener("input", () => {
      bm.u = urlInput.value;
      saveConfig(ctx.config);
    });
    row.appendChild(urlInput);

    const del = iconButton(ICONS.trash, "ks-btn ks-btn--icon ks-btn--danger", "Delete link");
    del.addEventListener("click", (e) => {
      e.stopPropagation();
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
    row.appendChild(a);
  }

  li.appendChild(row);
  return li;
}
