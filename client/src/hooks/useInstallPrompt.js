// src/hooks/useInstallPrompt.js
import { useEffect, useState } from "react";

const DISMISS_KEY = "tickispot_pwa_install_dismissed";
const INSTALLED_KEY = "tickispot_pwa_installed";

export default function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    setIsIos(ios);
    setIsInstalled(standaloneMode || localStorage.getItem(INSTALLED_KEY) === "1");
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setPrompt(event);
    };

    const handleAppInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "1");
      setIsInstalled(true);
      setIsVisible(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (isInstalled || dismissed) return;
    if (!prompt && !isIos) return;

    const handleInteraction = () => {
      setIsVisible(true);
    };

    const timeout = window.setTimeout(() => setIsVisible(true), 9000);
    window.addEventListener("pointerdown", handleInteraction, { once: true });
    window.addEventListener("keydown", handleInteraction, { once: true });

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("pointerdown", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [prompt, isIos, isInstalled, dismissed]);

  const install = async () => {
    if (!prompt) return;

    prompt.prompt();
    const choice = await prompt.userChoice;
    setPrompt(null);

    if (choice?.outcome === "accepted") {
      localStorage.setItem(INSTALLED_KEY, "1");
      setIsInstalled(true);
      setIsVisible(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    setIsVisible(false);
  };

  const showPrompt = isVisible && !isInstalled && !dismissed && (prompt !== null || isIos);
  const canInstall = !!prompt;

  return {
    canInstall,
    install,
    isIos,
    isInstalled,
    showPrompt,
    dismiss,
  };
}
