import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { CheckCircle2, Smartphone, ArrowRight } from "lucide-react";

type DeviceType = 'ios' | 'android' | 'desktop';

function getDevice(): DeviceType {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function isAlreadyInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
        style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--espresso)' }}
      >
        {number}
      </div>
      <p className="pt-1 text-sm leading-relaxed" style={{ color: 'rgba(250,247,242,0.85)' }}>
        {children}
      </p>
    </div>
  );
}

// ─── iOS instructions ────────────────────────────────────────────────────────

function IOSInstructions() {
  return (
    <div className="space-y-5">
      <Step number={1}>
        Open this page in <strong style={{ color: 'var(--golden-amber)' }}>Safari</strong> (not Chrome or another browser).
        Safari is required for iPhone installation.
      </Step>
      <Step number={2}>
        Tap the{" "}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: 'rgba(240,165,0,0.2)', color: 'var(--golden-amber)', border: '1px solid var(--golden-amber)' }}>
          {/* Safari share icon */}
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
            <path d="M6 1v8M3 3L6 1l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 7v5a1 1 0 001 1h8a1 1 0 001-1V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Share
        </span>{" "}
        button at the bottom of your Safari screen.
      </Step>
      <Step number={3}>
        Scroll down in the menu and tap{" "}
        <strong style={{ color: 'var(--golden-amber)' }}>"Add to Home Screen"</strong>.
      </Step>
      <Step number={4}>
        Tap <strong style={{ color: 'var(--golden-amber)' }}>"Add"</strong> in the top right — FoodChain will appear on your home screen!
      </Step>
    </div>
  );
}

// ─── Android instructions ────────────────────────────────────────────────────

function AndroidInstructions({ onInstall, hasPrompt }: { onInstall: () => void; hasPrompt: boolean }) {
  if (hasPrompt) {
    return (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'rgba(250,247,242,0.85)' }}>
          Your browser is ready to install FoodChain. Tap the button below — it takes one tap.
        </p>
        <button
          onClick={onInstall}
          className="w-full py-4 rounded-xl text-base font-bold transition-opacity hover:opacity-90 active:opacity-80 flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--espresso)' }}
        >
          <Smartphone className="w-5 h-5" />
          Install FoodChain Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Step number={1}>
        Tap the{" "}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: 'rgba(240,165,0,0.2)', color: 'var(--golden-amber)', border: '1px solid var(--golden-amber)' }}>
          ⋮ Menu
        </span>{" "}
        button at the top right of your Chrome browser.
      </Step>
      <Step number={2}>
        Tap <strong style={{ color: 'var(--golden-amber)' }}>"Add to Home Screen"</strong> or{" "}
        <strong style={{ color: 'var(--golden-amber)' }}>"Install App"</strong>.
      </Step>
      <Step number={3}>
        Tap <strong style={{ color: 'var(--golden-amber)' }}>"Install"</strong> to confirm — FoodChain will appear on your home screen!
      </Step>
    </div>
  );
}

// ─── Desktop instructions ────────────────────────────────────────────────────

function DesktopInstructions() {
  return (
    <div className="space-y-4 text-center">
      <Smartphone className="w-12 h-12 mx-auto" style={{ color: 'var(--golden-amber)' }} />
      <p className="text-base" style={{ color: 'rgba(250,247,242,0.85)' }}>
        This page is designed for mobile devices.
      </p>
      <p className="text-sm" style={{ color: 'rgba(250,247,242,0.6)' }}>
        Scan the QR code with your phone camera, or type the URL below into your mobile browser:
      </p>
      <div
        className="px-4 py-3 rounded-xl text-sm font-mono break-all"
        style={{ backgroundColor: 'rgba(240,165,0,0.1)', color: 'var(--golden-amber)', border: '1px solid rgba(240,165,0,0.3)' }}
      >
        {window.location.origin}/install
      </div>
      <p className="text-xs" style={{ color: 'rgba(250,247,242,0.4)' }}>
        Works best on Android Chrome or iPhone Safari
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function InstallPage() {
  const navigate = useNavigate();
  const [device] = useState<DeviceType>(getDevice);
  const [alreadyInstalled] = useState(isAlreadyInstalled);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [justInstalled, setJustInstalled] = useState(false);

  // Capture Android install prompt before it fires
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // If already running as installed PWA, redirect straight to login
  useEffect(() => {
    if (alreadyInstalled) {
      const t = setTimeout(() => navigate('/login'), 1800);
      return () => clearTimeout(t);
    }
  }, [alreadyInstalled, navigate]);

  const handleAndroidInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setJustInstalled(true);
      setTimeout(() => navigate('/login'), 2200);
    }
  };

  const titleMap: Record<DeviceType, string> = {
    ios: 'Install on iPhone',
    android: 'Install on Android',
    desktop: 'Open on Your Phone',
  };

  // ── Already installed ──
  if (alreadyInstalled || justInstalled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: 'var(--espresso)' }}>
        <CheckCircle2 className="w-16 h-16 mb-4" style={{ color: 'var(--golden-amber)' }} />
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--warm-white)' }}>You're all set!</h1>
        <p className="text-sm mb-6" style={{ color: 'rgba(250,247,242,0.6)' }}>
          FoodChain is installed. Taking you to the app…
        </p>
        <div className="w-8 h-1 rounded-full animate-pulse" style={{ backgroundColor: 'var(--golden-amber)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--espresso)' }}>
      {/* Header */}
      <div className="flex flex-col items-center pt-12 pb-8 px-6">
        <svg width="56" height="56" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
          <rect width="40" height="40" rx="10" fill="var(--golden-amber)"/>
          <path d="M20 10L28 16V24L20 30L12 24V16L20 10Z" fill="var(--espresso)"/>
          <circle cx="20" cy="20" r="4" fill="var(--warm-white)"/>
        </svg>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--warm-white)' }}>FoodChain</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(250,247,242,0.5)' }}>Restaurant Management</p>
      </div>

      {/* Card */}
      <div className="flex-1 px-5 pb-10">
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(250,247,242,0.1)' }}
        >
          <h2 className="text-lg font-semibold mb-5" style={{ color: 'var(--warm-white)' }}>
            {titleMap[device]}
          </h2>

          {device === 'ios' && <IOSInstructions />}
          {device === 'android' && (
            <AndroidInstructions
              onInstall={handleAndroidInstall}
              hasPrompt={!!installPrompt}
            />
          )}
          {device === 'desktop' && <DesktopInstructions />}
        </div>

        {/* Open app link (skip install) */}
        {device !== 'desktop' && (
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm transition-opacity hover:opacity-70"
            style={{ color: 'rgba(250,247,242,0.45)' }}
          >
            Skip — open in browser instead
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {/* Android: if no prompt yet, still show open app button */}
        {device === 'android' && !installPrompt && (
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 rounded-xl text-base font-bold mt-2 transition-opacity hover:opacity-90 active:opacity-80 flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--golden-amber)', color: 'var(--espresso)' }}
          >
            Open FoodChain
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-xs pb-8" style={{ color: 'rgba(250,247,242,0.25)' }}>
        FoodChain © 2024 · Free to install · No App Store needed
      </p>
    </div>
  );
}
