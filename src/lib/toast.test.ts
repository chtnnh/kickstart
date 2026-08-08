import { describe, expect, it, vi } from "vitest";
import { showToast } from "./toast.ts";

describe("toast", () => {
  it("renders message and action button", () => {
    const onClick = vi.fn();
    showToast("Deleted link", { action: { label: "Undo", onClick } });
    const toast = document.querySelector(".ks-toast");
    expect(toast?.textContent).toContain("Deleted link");
    toast?.querySelector(".ks-toast-action")?.dispatchEvent(new Event("click"));
    expect(onClick).toHaveBeenCalled();
  });
});
