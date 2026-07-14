import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Html5QrcodeScanner,
  Html5QrcodeScanType,
} from 'html5-qrcode';
import {
  Check,
  Wifi,
  WifiOff,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';

type ScanStatus = 'VALID' | 'ALREADY_USED' | 'INVALID' | 'OFFLINE_SAVED' | 'ERROR';

interface ScanResult {
  status: ScanStatus;
  message: string;
  ticket?: {
    full_name?: string;
    cedula?: string;
    id_type?: string;
  };
}

const RESULT_MS = 2200;
const COOLDOWN_MS = 2000;
const FETCH_TIMEOUT_MS = 4500;
const QUEUE_KEY = 'offlineQueue';

function readQueue(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}

function writeQueue(tokens: string[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(tokens));
}

function enqueueToken(token: string): string[] {
  const next = Array.from(new Set([...readQueue(), token]));
  writeQueue(next);
  return next;
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function flushQueue(): Promise<string[]> {
  const queue = readQueue();
  if (queue.length === 0) return [];
  const remaining: string[] = [];
  for (const token of queue) {
    try {
      const res = await fetchWithTimeout(`/api/checkin/${encodeURIComponent(token)}`, {
        method: 'POST',
      });
      if (!res.ok && res.status >= 500) remaining.push(token);
    } catch {
      remaining.push(token);
    }
  }
  writeQueue(remaining);
  return remaining;
}

function requestBackgroundSync() {
  navigator.serviceWorker?.ready
    ?.then((r) => {
      const syncManager = (
        r as ServiceWorkerRegistration & {
          sync?: { register: (tag: string) => Promise<void> };
        }
      ).sync;
      return syncManager?.register('sync-checkins');
    })
    .catch(() => {});
}

function extractToken(decodedText: string): string {
  const raw = decodedText.trim();
  try {
    const url = new URL(raw);
    const tokenParam = url.searchParams.get('token');
    if (tokenParam) return tokenParam.trim();

    const parts = raw.split(/\/(?:checkin|ticket)\//i);
    if (parts.length > 1) {
      return parts[1].split(/[?#/]/)[0].trim();
    }
  } catch {
    // not a URL
  }
  return raw;
}

function statusStyles(status: ScanStatus) {
  switch (status) {
    case 'VALID':
      return {
        panel: 'border-[#39FF14]/50 bg-[#39FF14]',
        text: 'text-black',
        iconBg: 'bg-black/15',
        icon: <Check className="h-10 w-10" strokeWidth={3} />,
      };
    case 'ALREADY_USED':
      return {
        panel: 'border-amber-400/60 bg-amber-400',
        text: 'text-black',
        iconBg: 'bg-black/15',
        icon: <AlertTriangle className="h-10 w-10" strokeWidth={2.5} />,
      };
    case 'OFFLINE_SAVED':
      return {
        panel: 'border-sky-400/50 bg-sky-500',
        text: 'text-white',
        iconBg: 'bg-black/20',
        icon: <WifiOff className="h-10 w-10" strokeWidth={2.5} />,
      };
    default:
      return {
        panel: 'border-red-500/50 bg-red-600',
        text: 'text-white',
        iconBg: 'bg-black/20',
        icon: <X className="h-10 w-10" strokeWidth={3} />,
      };
  }
}

export default function Scanner() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [flash, setFlash] = useState(false);

  const processingRef = useRef(false);
  const lastTokenRef = useRef<{ token: string; at: number } | null>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processScanRef = useRef<(text: string) => void>(() => {});

  const vibrate = (pattern: number | number[]) => {
    try {
      navigator.vibrate?.(pattern);
    } catch {
      // ignore
    }
  };

  const clearResultSoon = useCallback(() => {
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    resultTimerRef.current = setTimeout(() => {
      setScanResult(null);
      processingRef.current = false;
    }, RESULT_MS);
  }, []);

  const saveOffline = useCallback(
    (token: string) => {
      setOfflineQueue(enqueueToken(token));
      requestBackgroundSync();
      setScanResult({ status: 'OFFLINE_SAVED', message: 'Guardado offline' });
      vibrate(40);
      clearResultSoon();
    },
    [clearResultSoon],
  );

  const processScan = useCallback(
    async (decodedText: string) => {
      const token = extractToken(decodedText);
      if (!token || processingRef.current) return;

      const last = lastTokenRef.current;
      if (last && last.token === token && Date.now() - last.at < COOLDOWN_MS) return;

      processingRef.current = true;
      lastTokenRef.current = { token, at: Date.now() };
      setFlash(true);
      setTimeout(() => setFlash(false), 120);

      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = setTimeout(() => {
        processingRef.current = false;
      }, FETCH_TIMEOUT_MS + RESULT_MS + 800);

      try {
        if (!navigator.onLine) {
          saveOffline(token);
          return;
        }

        const res = await fetchWithTimeout(`/api/checkin/${encodeURIComponent(token)}`, {
          method: 'POST',
        });
        const data = await res.json().catch(() => ({}));

        if (data.status === 'VALID') {
          setScanResult({
            status: 'VALID',
            message: 'Acceso concedido',
            ticket: data.ticket,
          });
          vibrate([30, 40, 30]);
          clearResultSoon();
        } else if (data.status === 'ALREADY_USED') {
          setScanResult({
            status: 'ALREADY_USED',
            message: 'Ticket ya usado',
            ticket: data.ticket,
          });
          vibrate([60, 40, 60]);
          clearResultSoon();
        } else if (data.status === 'INVALID') {
          setScanResult({ status: 'INVALID', message: 'Ticket inválido' });
          vibrate(100);
          clearResultSoon();
        } else {
          saveOffline(token);
        }
      } catch {
        saveOffline(token);
      }
    },
    [clearResultSoon, saveOffline],
  );

  useEffect(() => {
    processScanRef.current = (text: string) => {
      void processScan(text);
    };
  }, [processScan]);

  useEffect(() => {
    setOfflineQueue(readQueue());
    setIsOnline(navigator.onLine);

    const syncNow = async () => {
      if (!navigator.onLine) return;
      setOfflineQueue(await flushQueue());
    };

    const onOnline = () => {
      setIsOnline(true);
      syncNow();
    };
    const onOffline = () => setIsOnline(false);
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_CHECKINS') syncNow();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    navigator.serviceWorker?.addEventListener('message', onMessage);
    if (navigator.onLine) syncNow();

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      navigator.serviceWorker?.removeEventListener('message', onMessage);
    };
  }, []);

  // Motor original que sí leía QRs (Html5QrcodeScanner)
  useEffect(() => {
    let disposed = false;
    let scanner: Html5QrcodeScanner | null = null;

    // Esperar un frame para que el contenedor tenga tamaño real
    const boot = window.setTimeout(() => {
      const el = document.getElementById('qr-reader');
      if (!el || disposed) return;

      scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 12,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.75);
            return { width: Math.max(180, edge), height: Math.max(180, edge) };
          },
          rememberLastUsedCamera: true,
          aspectRatio: 1,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          showTorchButtonIfSupported: true,
        },
        /* verbose */ false,
      );

      scanner.render(
        (decodedText) => {
          if (!disposed) processScanRef.current(decodedText);
        },
        () => {
          // frames sin QR
        },
      );

      // Marcar listo cuando aparezca el video
      const waitVideo = window.setInterval(() => {
        if (disposed) {
          window.clearInterval(waitVideo);
          return;
        }
        if (el.querySelector('video')) {
          setCameraReady(true);
          window.clearInterval(waitVideo);
        }
      }, 200);
    }, 50);

    return () => {
      disposed = true;
      window.clearTimeout(boot);
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
      scanner?.clear().catch(() => {});
    };
  }, []);

  const styles = scanResult ? statusStyles(scanResult.status) : null;

  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-col font-sans text-white">
      <header className="relative z-30 flex items-start justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/40">808 Fest</p>
          <h1 className="text-xl font-black uppercase tracking-tight">Check-in</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md ${
              isOnline
                ? 'border-[#39FF14]/40 bg-[#39FF14]/10 text-[#39FF14]'
                : 'border-red-500/40 bg-red-500/10 text-red-300'
            }`}
          >
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? 'Online' : 'Offline'}
          </span>
          {offlineQueue.length > 0 && (
            <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/60">
              Sync {offlineQueue.length}
            </span>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-6">
        <div className="relative mb-4 overflow-hidden rounded-2xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-md">
          {/* Contenedor con tamaño real: crítico para que el decoder funcione */}
          <div className="relative aspect-square w-full bg-black">
            <div id="qr-reader" className="h-full w-full overflow-hidden" />

            {/* Marco visual encima (no bloquea el video: pointer-events none) */}
            <div className="pointer-events-none absolute inset-0 z-10">
              <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45" />
              <div className="absolute left-1/2 top-1/2 aspect-square w-[72%] -translate-x-1/2 -translate-y-1/2">
                <span className="absolute left-0 top-0 h-9 w-9 border-l-[3px] border-t-[3px] border-[#39FF14]" />
                <span className="absolute right-0 top-0 h-9 w-9 border-r-[3px] border-t-[3px] border-[#39FF14]" />
                <span className="absolute bottom-0 left-0 h-9 w-9 border-b-[3px] border-l-[3px] border-[#39FF14]" />
                <span className="absolute bottom-0 right-0 h-9 w-9 border-b-[3px] border-r-[3px] border-[#39FF14]" />
                {cameraReady && !scanResult && (
                  <span className="scan-sweep absolute left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-transparent via-[#39FF14] to-transparent" />
                )}
              </div>
            </div>

            {!cameraReady && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/85">
                <Loader2 className="h-8 w-8 animate-spin text-[#39FF14]" />
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">
                  Preparando cámara
                </p>
              </div>
            )}

            {flash && (
              <div className="pointer-events-none absolute inset-0 z-40 bg-white/70 animate-[fadeOut_120ms_ease-out_forwards]" />
            )}
          </div>
        </div>

        <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.3em] text-white/45">
          Centra el QR en el marco
        </p>

        {scanResult && styles && (
          <div className={`result-sheet overflow-hidden rounded-2xl border shadow-2xl ${styles.panel} ${styles.text}`}>
            <div className="flex items-center gap-4 p-5">
              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${styles.iconBg}`}>
                {styles.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-70">Resultado</p>
                <h2 className="text-2xl font-black uppercase tracking-tight leading-none">
                  {scanResult.message}
                </h2>
                {scanResult.ticket && (
                  <div className="mt-2 truncate text-sm font-medium opacity-90">
                    <p className="truncate">{scanResult.ticket.full_name}</p>
                    <p className="truncate text-xs opacity-70">
                      {(scanResult.ticket.id_type || 'C.C.') + ' '}
                      {scanResult.ticket.cedula}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="h-1 w-full bg-black/15">
              <div className="result-bar h-full bg-black/35" />
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes sweep {
          0% { top: 12%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 88%; opacity: 0; }
        }
        .scan-sweep {
          animation: sweep 2.2s ease-in-out infinite;
        }
        @keyframes sheetIn {
          from { transform: translateY(16px); opacity: 0.4; }
          to { transform: translateY(0); opacity: 1; }
        }
        .result-sheet {
          animation: sheetIn 0.28s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes barDrain {
          from { width: 100%; }
          to { width: 0%; }
        }
        .result-bar {
          animation: barDrain ${RESULT_MS}ms linear forwards;
        }

        /* Dejar solo la cámara; ocultar chrome del lib */
        #qr-reader {
          border: none !important;
        }
        #qr-reader__dashboard_section,
        #qr-reader__header_message,
        #qr-reader__scan_region > img {
          display: none !important;
        }
        #qr-reader__scan_region {
          min-height: 100% !important;
        }
        #qr-reader video {
          width: 100% !important;
          border-radius: 0 !important;
          object-fit: cover !important;
        }
        #qr-shaded-region {
          border-width: 0 !important;
        }
      `}</style>
    </div>
  );
}
