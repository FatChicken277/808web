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

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

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
    // Raw token / UUID
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

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

function getBarcodeDetector(): BarcodeDetectorLike | null {
  const Ctor = (window as any).BarcodeDetector;
  if (!Ctor) return null;
  try {
    return new Ctor({ formats: ['qr_code'] });
  } catch {
    try {
      return new Ctor();
    } catch {
      return null;
    }
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
  const processScanRef = useRef<(raw: string) => void>(() => {});
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const saveOffline = useCallback(
    (token: string) => {
      setOfflineQueue(enqueueToken(token));
      requestBackgroundSync();
      setScanResult({
        status: 'OFFLINE_SAVED',
        message: 'Guardado offline',
      });
      vibrate(40);
      clearResultSoon();
    },
    [clearResultSoon],
  );

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
      setTimeout(() => setFlash(false), 140);

      // Safety unlock if something hangs
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = setTimeout(() => {
        processingRef.current = false;
      }, FETCH_TIMEOUT_MS + RESULT_MS + 500);

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
          // Respuesta rara / HTML de error de red: tratar como offline
          saveOffline(token);
        }
      } catch {
        saveOffline(token);
      }
    },
    [clearResultSoon, saveOffline],
  );

  useEffect(() => {
    processScanRef.current = (raw: string) => {
      void processScan(raw);
    };
  }, [processScan]);

  // Network + sync queue
  useEffect(() => {
    setOfflineQueue(readQueue());
    setIsOnline(navigator.onLine);

    const syncNow = async () => {
      if (!navigator.onLine) return;
      const remaining = await flushQueue();
      setOfflineQueue(remaining);
    };

    const handleOnline = () => {
      setIsOnline(true);
      syncNow();
    };
    const handleOffline = () => setIsOnline(false);
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_CHECKINS') syncNow();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    navigator.serviceWorker?.addEventListener('message', handleMessage);
    if (navigator.onLine) syncNow();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  // Camera + QR decode
  useEffect(() => {
    let disposed = false;
    let stream: MediaStream | null = null;
    let html5: Html5Qrcode | null = null;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const onDecoded = (text: string) => {
      if (!disposed && text) processScanRef.current(text);
    };

    const startNative = async () => {
      const detector = getBarcodeDetector();
      const video = document.getElementById('scan-video') as HTMLVideoElement | null;
      if (!detector || !video) return false;

      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.muted = true;
      await video.play();

      const tick = async () => {
        if (disposed) return;
        try {
          if (video.readyState >= 2) {
            const codes = await detector.detect(video);
            const value = codes[0]?.rawValue;
            if (value) onDecoded(value);
          }
        } catch {
          // Frame sin QR / detector ocupado
        }
        timer = setTimeout(() => {
          raf = requestAnimationFrame(() => {
            void tick();
          });
        }, 180);
      };

      void tick();
      return true;
    };

    const startHtml5 = async () => {
      const el = document.getElementById('qr-reader');
      if (!el) throw new Error('Missing qr-reader');

      html5 = new Html5Qrcode('qr-reader', { verbose: false });

      // Prefer back camera if listed
      let cameraConfig: MediaTrackConstraints | string = { facingMode: 'environment' };
      try {
        const cameras = await Html5Qrcode.getCameras();
        const back =
          cameras.find((c) => /back|rear|environment|trasera|posterior/i.test(c.label)) ||
          cameras[cameras.length - 1];
        if (back?.id) cameraConfig = back.id;
      } catch {
        // keep facingMode
      }

      await html5.start(
        cameraConfig,
        {
          fps: 15,
          // Sin qrbox rígido: escanea todo el frame (más fiable)
          disableFlip: false,
        },
        (decodedText) => onDecoded(decodedText),
        () => {},
      );

      const video = el.querySelector('video') as HTMLVideoElement | null;
      if (video) {
        video.setAttribute('playsinline', 'true');
        video.muted = true;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.play().catch(() => {});
      }
    };

    (async () => {
      try {
        const usedNative = await startNative().catch(() => false);
        if (!usedNative) {
          // Hide native video tag if unused
          const nativeVideo = document.getElementById('scan-video');
          if (nativeVideo) nativeVideo.style.display = 'none';
          await startHtml5();
        } else {
          // Hide html5 container when using native path
          const box = document.getElementById('qr-reader');
          if (box) box.style.display = 'none';
        }
        if (!disposed) setCameraReady(true);
      } catch (err: any) {
        if (!disposed) {
          const msg = String(err?.message || err || '');
          setCameraError(
            /NotAllowed|Permission|denied/i.test(msg)
              ? 'Permite el acceso a la cámara para escanear.'
              : 'No se pudo iniciar la cámara.',
          );
        }
      }
    })();

    return () => {
      disposed = true;
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
      if (timer) clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      if (html5) {
        html5
          .stop()
          .then(() => html5?.clear())
          .catch(() => {});
      }
    };
  }, []);

  const styles = scanResult ? statusStyles(scanResult.status) : null;

  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-col font-sans text-white">
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
          {!isOnline && (
            <span className="max-w-[11rem] rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-right text-[10px] font-bold uppercase tracking-widest text-sky-300 backdrop-blur-md">
              Modo offline
            </span>
          )}
        </div>
      </header>

      <div className="relative flex min-h-[100dvh] flex-1 items-center justify-center overflow-hidden bg-black">
        {/* Native BarcodeDetector path */}
        <video
          id="scan-video"
          className="absolute inset-0 z-0 h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />
        {/* html5-qrcode fallback path */}
        <div id="qr-reader" className="absolute inset-0 z-0 overflow-hidden" />

        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/65" />
          <div className="absolute left-1/2 top-1/2 aspect-square w-[min(72vw,280px)] -translate-x-1/2 -translate-y-1/2">
            <span className="absolute left-0 top-0 h-10 w-10 border-l-[3px] border-t-[3px] border-[#39FF14] shadow-[0_0_18px_rgba(57,255,20,0.35)]" />
            <span className="absolute right-0 top-0 h-10 w-10 border-r-[3px] border-t-[3px] border-[#39FF14] shadow-[0_0_18px_rgba(57,255,20,0.35)]" />
            <span className="absolute bottom-0 left-0 h-10 w-10 border-b-[3px] border-l-[3px] border-[#39FF14] shadow-[0_0_18px_rgba(57,255,20,0.35)]" />
            <span className="absolute bottom-0 right-0 h-10 w-10 border-b-[3px] border-r-[3px] border-[#39FF14] shadow-[0_0_18px_rgba(57,255,20,0.35)]" />
            {cameraReady && !scanResult && (
              <span className="scan-sweep absolute left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-transparent via-[#39FF14] to-transparent opacity-80" />
            )}
          </div>
          <p className="absolute inset-x-0 bottom-28 text-center text-xs font-bold uppercase tracking-[0.3em] text-white/50">
            {cameraReady ? 'Centra el QR en el marco' : cameraError ? '' : 'Iniciando cámara…'}
          </p>
        </div>

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

        {flash && (
          <div className="pointer-events-none absolute inset-0 z-40 bg-white/70 animate-[fadeOut_120ms_ease-out_forwards]" />
        )}

        {scanResult && styles && (
          <div className="absolute inset-x-0 bottom-0 z-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
