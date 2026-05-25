import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function Scanner() {
  const [scanResult, setScanResult] = useState<{ status: string; message: string; ticket?: any } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  // Load offline queue and network status on mount
  useEffect(() => {
    const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    setOfflineQueue(queue);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Attempt to sync offline queue when coming back online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      syncQueue();
    }
  }, [isOnline]);

  const syncQueue = async () => {
    const queue = [...offlineQueue];
    const newQueue: string[] = [];

    for (const token of queue) {
      try {
        await fetch(`/api/checkin/${token}`, { method: 'POST' });
      } catch (err) {
        newQueue.push(token); // Keep it if it fails again
      }
    }

    setOfflineQueue(newQueue);
    localStorage.setItem('offlineQueue', JSON.stringify(newQueue));
  };

  const processScan = async (token: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (!isOnline) {
        // Guardar offline
        const queue = [...offlineQueue, token];
        setOfflineQueue(queue);
        localStorage.setItem('offlineQueue', JSON.stringify(queue));
        setScanResult({
          status: 'OFFLINE_SAVED',
          message: 'Guardado localmente. Se sincronizará al volver la conexión.',
        });
      } else {
        const res = await fetch(`/api/checkin/${token}`, { method: 'POST' });
        const data = await res.json();

        if (data.status === 'VALID') {
          setScanResult({ status: 'VALID', message: '¡ACCESO CONCEDIDO!', ticket: data.ticket });
        } else if (data.status === 'ALREADY_USED') {
          setScanResult({ status: 'ALREADY_USED', message: 'TICKET YA USADO', ticket: data.ticket });
        } else {
          setScanResult({ status: 'INVALID', message: 'TICKET INVÁLIDO' });
        }
      }
    } catch (error) {
      setScanResult({ status: 'ERROR', message: 'Error de conexión.' });
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setScanResult(null); // Clear result after 3 seconds to scan next
      }, 3000);
    }
  };

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Decode token from URL (e.g. https://domain.com/admin/checkin?token=123)
        let token = decodedText;
        try {
          const url = new URL(decodedText);
          if (url.searchParams.has('token')) {
            token = url.searchParams.get('token')!;
          } else {
            // Check if it's the old pattern https://808fest.com/checkin/TOKEN or new /ticket/TOKEN
            const parts = decodedText.split(/\/checkin\/|\/ticket\//);
            if (parts.length > 1) {
              token = parts[1];
            }
          }
        } catch (e) {
          // If not URL, assume it's token directly
        }
        processScan(token);
      },
      (error) => {
        // Ignore errors to keep scanning silently
      }
    );

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear html5QrcodeScanner. ", error));
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-950 border border-white/20 p-4 relative">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-center mb-4">Scanner 808</h1>
        
        <div className="flex justify-between text-xs uppercase tracking-widest text-white/50 mb-4">
          <span>Status: {isOnline ? <span className="text-[#39FF14]">Online</span> : <span className="text-red-500">Offline</span>}</span>
          <span>Pendientes Sync: {offlineQueue.length}</span>
        </div>

        {/* QR Scanner Container */}
        <div id="reader" className="w-full bg-white text-black mb-4 overflow-hidden rounded-md"></div>

        {/* Scan Result Overlay */}
        {scanResult && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 z-50 animate-in fade-in zoom-in duration-200 ${
            scanResult.status === 'VALID' ? 'bg-[#39FF14] text-black' :
            scanResult.status === 'ALREADY_USED' ? 'bg-yellow-500 text-black' :
            scanResult.status === 'OFFLINE_SAVED' ? 'bg-blue-500 text-white' :
            'bg-red-600 text-white'
          }`}>
            <h2 className="text-4xl font-black uppercase text-center tracking-tighter leading-none mb-2">
              {scanResult.message}
            </h2>
            {scanResult.ticket && (
              <div className="mt-4 text-center">
                <p className="font-bold text-lg">{scanResult.ticket.full_name}</p>
                <p className="opacity-80">{scanResult.ticket.cedula}</p>
              </div>
            )}
          </div>
        )}

        <div className="text-center text-xs text-white/40 mt-4">
          Apunta la cámara al código QR.
        </div>
      </div>
    </div>
  );
}
