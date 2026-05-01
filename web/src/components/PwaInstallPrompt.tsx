"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Register SW
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show after user has been on the site for a bit
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 bg-blue-600 text-white rounded-xl p-4 shadow-2xl shadow-blue-500/20 z-50 max-w-xs animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">📲</span>
        <div className="flex-1">
          <p className="text-sm font-semibold mb-1">安装到桌面</p>
          <p className="text-xs text-blue-100 mb-3">获得更好的使用体验，离线也能查看数据</p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 bg-white text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition"
            >
              立即安装
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 bg-blue-500 rounded-lg text-xs hover:bg-blue-400 transition"
            >
              稍后
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
