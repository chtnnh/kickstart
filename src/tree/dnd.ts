import type { AppContext } from "../layout/engine.ts";
import type { BookmarkColumn } from "../config/types.ts";
import { saveConfig } from "../config/store.ts";
import { WIDGET_MIME } from "../layout/widget-move.ts";
import { enableDragAutoScroll, disableDragAutoScroll } from "../lib/auto-scroll.ts";

export type DragKind = "column" | "category" | "bookmark";

export const TREE_MIME = "application/x-kickstart-dnd";

export interface DragPayload {
  kind: DragKind;
  colIdx: number;
  catIdx?: number;
  bmIdx?: number;
}

const MIME = TREE_MIME;

export function encodePayload(p: DragPayload): string {
  return JSON.stringify(p);
}

export function decodePayload(raw: string): DragPayload | null {
  try {
    return JSON.parse(raw) as DragPayload;
  } catch {
    return null;
  }
}

export function setupTreeDnD(
  row: HTMLElement,
  ctx: AppContext,
  onReorder: () => void,
): void {
  row.querySelectorAll(".ks-dnd-handle").forEach((handle) => {
    const grip = handle as HTMLElement;
    const parent = grip.closest("[data-dnd-kind]") as HTMLElement | null;
    if (!parent) return;

    grip.draggable = true;

    grip.addEventListener("dragstart", (e) => {
      const ev = e as DragEvent;
      ev.stopPropagation();
      const kind = parent.dataset.dndKind as DragKind;
      const colIdx = Number(parent.dataset.colIdx);
      const catIdx = parent.dataset.catIdx !== undefined ? Number(parent.dataset.catIdx) : undefined;
      const bmIdx = parent.dataset.bmIdx !== undefined ? Number(parent.dataset.bmIdx) : undefined;
      const payload: DragPayload = { kind, colIdx, catIdx, bmIdx };
      ev.dataTransfer?.setData(MIME, encodePayload(payload));
      ev.dataTransfer!.effectAllowed = "move";
      document.body.classList.add("ks-dragging-tree");
      enableDragAutoScroll();
      parent.classList.add("ks-dnd-dragging");
    });

    grip.addEventListener("dragend", () => {
      document.body.classList.remove("ks-dragging-tree");
      disableDragAutoScroll();
      parent.classList.remove("ks-dnd-dragging");
      row.querySelectorAll(".ks-dnd-over").forEach((n) => n.classList.remove("ks-dnd-over"));
    });
  });

  row.querySelectorAll("[data-dnd-drop]").forEach((el) => {
    const dropEl = el as HTMLElement;
    dropEl.addEventListener("dragover", (e) => {
      const ev = e as DragEvent;
      if (!ev.dataTransfer?.types.includes(MIME)) return;
      if (ev.dataTransfer.types.includes(WIDGET_MIME)) return;
      e.preventDefault();
      dropEl.classList.add("ks-dnd-over");
    });
    dropEl.addEventListener("dragleave", () => {
      dropEl.classList.remove("ks-dnd-over");
    });
    dropEl.addEventListener("drop", (e) => {
      const ev = e as DragEvent;
      e.preventDefault();
      e.stopPropagation();
      dropEl.classList.remove("ks-dnd-over");
      if (!ev.dataTransfer?.types.includes(MIME)) return;
      const raw = ev.dataTransfer.getData(MIME);
      if (!raw) return;
      const src = decodePayload(raw);
      if (!src) return;

      const targetKind = dropEl.dataset.dndDrop as DragKind;
      const toCol = Number(dropEl.dataset.colIdx);
      const toCat = dropEl.dataset.catIdx !== undefined ? Number(dropEl.dataset.catIdx) : undefined;
      const toBm = dropEl.dataset.bmIdx !== undefined ? Number(dropEl.dataset.bmIdx) : undefined;

      if (applyReorder(ctx.config.tree.columns, src, targetKind, toCol, toCat, toBm)) {
        saveConfig(ctx.config);
        onReorder();
      }
    });
  });
}

function applyReorder(
  columns: BookmarkColumn[],
  src: DragPayload,
  targetKind: DragKind,
  toCol: number,
  toCat?: number,
  toBm?: number,
): boolean {
  if (src.kind === "column" && targetKind === "column") {
    const from = src.colIdx;
    let to = toCol;
    if (from === to) return false;
    const [col] = columns.splice(from, 1);
    if (!col) return false;
    if (from < to) to--;
    columns.splice(to, 0, col);
    return true;
  }

  if (src.kind === "category" && targetKind === "category" && src.catIdx !== undefined && toCat !== undefined) {
    const fromCol = columns[src.colIdx];
    const toColArr = columns[toCol];
    if (!fromCol || !toColArr) return false;
    const from = src.catIdx;
    let to = toCat;
    if (src.colIdx === toCol && from === to) return false;
    const [cat] = fromCol.splice(from, 1);
    if (!cat) return false;
    if (src.colIdx === toCol && from < to) to--;
    toColArr.splice(to, 0, cat);
    if (fromCol.length === 0 && columns.length > 1) columns.splice(src.colIdx, 1);
    return true;
  }

  if (
    src.kind === "bookmark" &&
    targetKind === "bookmark" &&
    src.catIdx !== undefined &&
    src.bmIdx !== undefined &&
    toCat !== undefined &&
    toBm !== undefined
  ) {
    const fromCol = columns[src.colIdx];
    const toColArr = columns[toCol];
    if (!fromCol || !toColArr) return false;
    const fromCat = fromCol[src.catIdx];
    const toCatObj = toColArr[toCat];
    if (!fromCat || !toCatObj) return false;
    const from = src.bmIdx;
    let to = toBm;
    if (src.colIdx === toCol && src.catIdx === toCat && from === to) return false;
    const [bm] = fromCat.b.splice(from, 1);
    if (!bm) return false;
    if (src.colIdx === toCol && src.catIdx === toCat && from < to) to--;
    toCatObj.b.splice(to, 0, bm);
    if (fromCat.b.length === 0) fromCol.splice(src.catIdx, 1);
    if (fromCol.length === 0 && columns.length > 1) columns.splice(src.colIdx, 1);
    return true;
  }

  if (src.kind === "category" && targetKind === "column") {
    const fromCol = columns[src.colIdx];
    const toColArr = columns[toCol];
    if (!fromCol || !toColArr || src.catIdx === undefined) return false;
    const [cat] = fromCol.splice(src.catIdx, 1);
    if (!cat) return false;
    toColArr.push(cat);
    if (fromCol.length === 0 && columns.length > 1) columns.splice(src.colIdx, 1);
    return true;
  }

  if (src.kind === "bookmark" && targetKind === "category" && src.catIdx !== undefined && src.bmIdx !== undefined && toCat !== undefined) {
    const fromCol = columns[src.colIdx];
    const toColArr = columns[toCol];
    if (!fromCol || !toColArr) return false;
    const fromCat = fromCol[src.catIdx];
    const toCatObj = toColArr[toCat];
    if (!fromCat || !toCatObj) return false;
    const [bm] = fromCat.b.splice(src.bmIdx, 1);
    if (!bm) return false;
    toCatObj.b.push(bm);
    if (fromCat.b.length === 0) fromCol.splice(src.catIdx, 1);
    if (fromCol.length === 0 && columns.length > 1) columns.splice(src.colIdx, 1);
    return true;
  }

  return false;
}
