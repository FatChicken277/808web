import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Check,
  Wifi,
  WifiOff,
  AlertTriangle,
  X,
  Loader2,
  CameraOff,
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
const COOLDOWN_MS = 1800;

function extractToken(decodedText: string): string {
  let token = decodedText.trim();
  try {
    const url = new URL(decodedText);
    if (url.searchParams.has('token')) {
      return url.searchParams.get('token')!;
    }
    const parts = decodedText.split(/\/checkin\/|\/ticket\//);
    if (parts.length > 1) {
      token = parts[1].split(/[?#]/)[0];
    }
  } catch {
    // Raw token
  }
  return token;
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
  const [cameraError, setCameraError] = useState('');
  const [flash, setFlash] = useState(false);

  const processingRef = useRef(false);
  const lastTokenRef = useRef<{ token: string; at: number } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResultSoon = useCallback(() => {
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    resultTimerRef.current = setTimeout(() => {
      setScanResult(null);
      processingRef.current = false;
    }, RESULT_MS);
  }, []);

  const vibrate = (pattern: number | number[]) => {
    try {
      navigator.vibrate?.(pattern);
    } catch {
      // ignore
    }
  };

  const processScan = useCallback(
    async (raw: string) => {
      const token = extractToken(raw);
      if (!token || processingRef.current) return;

      const last = lastTokenRef.current;
      if (last && last.token === token && Date.now() - last.at < COOLDOWN_MS) {
        return;
      }

      processingRef.current = true;
      lastTokenRef.current = { token, at: Date.now() };
      setFlash(true);
      setTimeout(() => setFlash(false), 120);

      try {
        if (!navigator.onLine) {
          setOfflineQueue((prev) => {
            const next = [...prev, token];
            localStorage.setItem('offlineQueue', JSON.stringify(next));
            return next;
          });
          setScanResult({
            status: 'OFFLINE_SAVED',
            message: 'Guardado offline',
          });
          vibrate(40);
          clearResultSoon();
          return;
        }

        const res = await fetch(`/api/checkin/${encodeURIComponent(token)}`, {
          method: 'POST',
        });
        const data = await res.json();

        if (data.status === 'VALID') {
          setScanResult({
            status: 'VALID',
            message: 'Acceso concedido',
            ticket: data.ticket,
          });
          vibrate([30, 40, 30]);
        } else if (data.status === 'ALREADY_USED') {
          setScanResult({
            status: 'ALREADY_USED',
            message: 'Ticket ya usado',
            ticket: data.ticket,
          });
          vibrate([60, 40, 60]);
        } else {
          setScanResult({ status: 'INVALID', message: 'Ticket inválido' });
          vibrate(100);
        }
      } catch {
        setScanResult({ status: 'ERROR', message: 'Error de conexión' });
        vibrate(100);
      } finally {
        clearResultSoon();
      }
    },
    [clearResultSoon],
  );

  // Network + offline queue
  useEffect(() => {
    const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    setOfflineQueue(queue);
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline || offlineQueue.length === 0) return;

    let cancelled = false;
    (async () => {
      const remaining: string[] = [];
      for (const token of offlineQueue) {
        try {
          await fetch(`/api/checkin/${encodeURIComponent(token)}`, { method: 'POST' });
        } catch {
          remaining.push(token);
        }
      }
      if (cancelled) return;
      setOfflineQueue(remaining);
      localStorage.setItem('offlineQueue', JSON.stringify(remaining));
    })();

    return () => {
      cancelled = true;
    };
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // Camera scanner
  useEffect(() => {
    let disposed = false;
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    const start = async () => {
      try {
        const size = Math.min(window.innerWidth, window.innerHeight);
        const box = Math.floor(size * 0.68);

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 12,
            qrbox: { width: box, height: box },
            disableFlip: false,
          },
          (decodedText) => {
            if (!disposed) processScan(decodedText);
          },
          () => {
            // Frame without QR — silent
          },
        );

        // html5-qrcode sizes the video to its internal qrbox; force fullscreen cover.
        const root = document.getElementById('qr-reader');
        const fit = (el: HTMLElement | null) => {
          if (!el) return;
          el.style.position = 'absolute';
          el.style.inset = '0';
          el.style.width = '100%';
          el.style.height = '100%';
          el.style.maxWidth = 'none';
          el.style.maxHeight = 'none';
        };
        fit(root);
        fit(root?.querySelector('#qr-reader__scan_region') as HTMLElement | null);
        const video = root?.querySelector('video') as HTMLVideoElement | null;
        if (video) {
          fit(video);
          video.style.objectFit = 'cover';
          video.setAttribute('playsinline', 'true');
          video.muted = true;
          // Some browsers leave the element paused after permission — ensure playback.
          video.play().catch(() => {});
        }
        const canvas = root?.querySelector('canvas') as HTMLElement | null;
        fit(canvas);

        if (!disposed) setCameraReady(true);
      } catch (err: any) {
        if (!disposed) {
          setCameraError(
            err?.message?.includes('Permission') || err?.name === 'NotAllowedError'
              ? 'Permite el acceso a la cámara para escanear.'
              : 'No se pudo iniciar la cámara.',
          );
        }
      }
    };

    start();

    return () => {
      disposed = true;
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
      scannerRef.current = null;
    };
  }, [processScan]);

  const styles = scanResult ? statusStyles(scanResult.status) : null;

  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-col font-sans text-white">
      {/* Header */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/40">808 Fest</p>
          <h1 className="text-xl font-black uppercase tracking-tight">Check-in</h1>
        </div>
        <div className="pointer-events-auto flex flex-col items-end gap-2">
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
            <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/60 backdrop-blur-md">
              Sync {offlineQueue.length}
            </span>
          )}
        </div>
      </header>

      {/* Camera stage */}
      <div className="relative flex min-h-[100dvh] flex-1 items-center justify-center overflow-hidden bg-black">
        <div id="qr-reader" className="absolute inset-0 z-0 overflow-hidden" />

        {/* Dim + scan frame */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/70" />

          <div className="absolute left-1/2 top-1/2 w-[min(72vw,280px)] -translate-x-1/2 -translate-y-1/2 aspect-square">
            {/* Corner brackets */}
            <span className="absolute left-0 top-0 h-10 w-10 border-l-[3px] border-t-[3px] border-[#39FF14] shadow-[0_0_18px_rgba(57,255,20,0.35)]" />
            <span className="absolute right-0 top-0 h-10 w-10 border-r-[3px] border-t-[3px] border-[#39FF14] shadow-[0_0_18px_rgba(57,255,20,0.35)]" />
            <span className="absolute bottom-0 left-0 h-10 w-10 border-b-[3px] border-l-[3px] border-[#39FF14] shadow-[0_0_18px_rgba(57,255,20,0.35)]" />
            <span className="absolute bottom-0 right-0 h-10 w-10 border-b-[3px] border-r-[3px] border-[#39FF14] shadow-[0_0_18px_rgba(57,255,20,0.35)]" />

            {/* Sweep line */}
            {cameraReady && !scanResult && (
              <span className="scan-sweep absolute left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-transparent via-[#39FF14] to-transparent opacity-80" />
            )}
          </div>

          <p className="absolute inset-x-0 bottom-28 text-center text-xs font-bold uppercase tracking-[0.3em] text-white/50">
            {cameraReady ? 'Centra el QR en el marco' : cameraError ? '' : 'Iniciando cámara…'}
          </p>
        </div>

        {/* Loading / error states */}
        {!cameraReady && !cameraError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/80">
            <Loader2 className="h-8 w-8 animate-spin text-[#39FF14]" />
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Preparando cámara</p>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/90 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/5">
              <CameraOff className="h-7 w-7 text-white/50" />
            </div>
            <p className="max-w-xs text-sm text-white/70">{cameraError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-[#39FF14] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-black"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Capture flash */}
        {flash && (
          <div className="pointer-events-none absolute inset-0 z-40 bg-white/70 animate-[fadeOut_120ms_ease-out_forwards]" />
        )}

        {/* Result sheet */}
        {scanResult && styles && (
          <div className="absolute inset-x-0 bottom-0 z-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div
              className={`result-sheet overflow-hidden rounded-2xl border shadow-2xl ${styles.panel} ${styles.text}`}
            >
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
          </div>
        )}
      </div>

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
          from { transform: translateY(110%); opacity: 0.4; }
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
      `}</style>
    </div>
  );
}
