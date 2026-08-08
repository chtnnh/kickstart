let deferredPrompt: Event | null = null;

export function initPwaInstall(): void {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new CustomEvent("ks:pwa-install-available"));
  });
}

export function canInstallPwa(): boolean {
  return deferredPrompt !== null;
}

export async function promptPwaInstall(): Promise<"installed" | "dismissed" | "unavailable"> {
  if (!deferredPrompt) return "unavailable";
  const event = deferredPrompt as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  };
  await event.prompt();
  const choice = await event.userChoice;
  deferredPrompt = null;
  return choice.outcome === "accepted" ? "installed" : "dismissed";
}
