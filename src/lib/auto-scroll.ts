/** Auto-scroll window while dragging near viewport edges */

let active = false;

export function enableDragAutoScroll(): void {
  if (active) return;
  active = true;
  document.addEventListener("dragover", onDragOver);
}

export function disableDragAutoScroll(): void {
  if (!active) return;
  active = false;
  document.removeEventListener("dragover", onDragOver);
}

function onDragOver(e: DragEvent): void {
  const margin = 72;
  const speed = 14;
  const y = e.clientY;
  if (y < margin) {
    window.scrollBy(0, -speed);
  } else if (y > window.innerHeight - margin) {
    window.scrollBy(0, speed);
  }
}
