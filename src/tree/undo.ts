import type { BookmarkColumn } from "../config/types.ts";

export interface UndoEntry {
  label: string;
  columns: BookmarkColumn[];
}

const stack: UndoEntry[] = [];
const MAX_UNDO = 10;

export function pushUndo(label: string, columns: BookmarkColumn[]): void {
  stack.push({ label, columns: structuredClone(columns) });
  if (stack.length > MAX_UNDO) stack.shift();
}

export function popUndo(): UndoEntry | undefined {
  return stack.pop();
}

export function clearUndo(): void {
  stack.length = 0;
}

export function undoDepth(): number {
  return stack.length;
}
