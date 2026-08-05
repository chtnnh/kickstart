export function renderSpacer(size: "sm" | "md" | "lg", editMode = false): HTMLElement {
  const el = document.createElement("div");
  el.className = `ks-spacer ks-spacer--${size}`;
  if (editMode) {
    el.classList.add("ks-spacer--visible");
    el.textContent = `gap · ${size}`;
  } else {
    el.setAttribute("aria-hidden", "true");
  }
  return el;
}
