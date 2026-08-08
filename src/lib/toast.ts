export interface ToastAction {
  label: string;
  onClick: () => void;
}

export function showToast(
  message: string,
  opts?: { error?: boolean; action?: ToastAction; duration?: number },
): void {
  document.querySelectorAll(".ks-toast").forEach((el) => el.remove());
  const el = document.createElement("div");
  el.className = `ks-toast${opts?.error ? " ks-toast--error" : ""}`;
  el.setAttribute("role", "status");

  const text = document.createElement("span");
  text.textContent = message;
  el.appendChild(text);

  if (opts?.action) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ks-toast-action";
    btn.textContent = opts.action.label;
    btn.addEventListener("click", () => {
      opts.action!.onClick();
      el.remove();
    });
    el.appendChild(btn);
  }

  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), opts?.duration ?? 4500);
}
