import React, { useState, useEffect } from 'react';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TicketModal({ isOpen, onClose }: TicketModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    idType: 'C.C.',
    cedula: '',
    phone: '',
    email: '',
    refCode: '',
    terms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<{ token: string; qrSvg: string } | null>(null);

  // When modal opens, disable the halation filter so position:fixed works correctly
  useEffect(() => {
    const wrapper = document.querySelector('.halation-wrapper') as HTMLElement | null;
    if (!wrapper) return;
    if (isOpen) {
      wrapper.style.filter = 'none';
      document.body.style.overflow = 'hidden';
    } else {
      wrapper.style.filter = '';
      document.body.style.overflow = '';
    }
    return () => {
      wrapper.style.filter = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Precarga el código de artista desde la URL (?ref=CODIGO) al abrir el modal.
  useEffect(() => {
    if (!isOpen) return;
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) {
      setFormData((prev) =>
        prev.refCode ? prev : { ...prev, refCode: ref.trim().toUpperCase() }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    if (!formData.terms) {
      setError('Debes aceptar los términos y condiciones.');
      return;
    }

    if (formData.fullName.trim().length < 3) {
      setError('Por favor ingresa un nombre válido.');
      return;
    }

    if (!/^\d+$/.test(formData.cedula) || formData.cedula.length < 6) {
      setError('El número de documento debe contener solo números y al menos 6 dígitos.');
      return;
    }

    if (!/^[0-9+\-\s]+$/.test(formData.phone) || formData.phone.length < 7) {
      setError('Por favor ingresa un número de celular válido.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Ocurrió un error en el registro.');
      } else {
        setSuccessData(data);
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 99999 }}
      className="flex items-center justify-center bg-black/80 p-4 font-sans text-white backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md bg-zinc-950 border border-white/20 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/50 hover:text-white"
        >
          ✕
        </button>

        {!successData ? (
          <>
            <h2 className="mb-6 text-2xl font-bold tracking-tighter uppercase text-white">
              Registro 808 Fest
            </h2>
            {error && (
              <div className="mb-4 bg-red-500/20 border border-red-500 p-3 text-sm text-red-200">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-white/70">Nombre Completo</label>
                <input
                  required
                  type="text"
                  className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-white focus:outline-none"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <div className="w-1/3">
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-white/70">Tipo</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-white focus:outline-none appearance-none"
                    value={formData.idType}
                    onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                  >
                    <option value="C.C." className="bg-zinc-950">C.C.</option>
                    <option value="T.I." className="bg-zinc-950">T.I.</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-white/70">Número de Documento</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-white focus:outline-none"
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-white/70">Celular</label>
                <input
                  required
                  type="tel"
                  className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-white focus:outline-none"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-white/70">Correo Electrónico</label>
                <input
                  required
                  type="email"
                  className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-white focus:outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-white/70">Código de Artista <span className="text-white/40">(opcional)</span></label>
                <input
                  type="text"
                  placeholder="Si un artista te invitó, ingresa su código"
                  className="w-full bg-white/5 border border-white/10 p-2 text-white placeholder:text-white/30 focus:border-white focus:outline-none uppercase"
                  value={formData.refCode}
                  onChange={(e) => setFormData({ ...formData, refCode: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="mt-2 flex items-start gap-2">
                <input
                  required
                  type="checkbox"
                  id="terms"
                  className="mt-1"
                  checked={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
                />
                <label htmlFor="terms" className="text-[10px] text-white/60 leading-tight">
                  Acepto el tratamiento de mis datos personales para fines de acceso al evento, marketing, promociones y comunicaciones relacionadas con 808 Fest.
                </label>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-4 bg-[#39FF14] p-3 text-black font-bold tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50"
              >
                {loading ? 'Procesando...' : 'Obtener Ticket'}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center text-center">
            <h2 className="mb-2 text-2xl font-bold tracking-tighter text-[#39FF14] uppercase">
              ¡Registro Exitoso!
            </h2>
            <p className="mb-6 text-sm text-white/70">
              Tu ticket también fue enviado a tu correo.
            </p>
            <div 
              className="bg-white p-4 w-full aspect-square max-w-[250px] mb-6 rounded-xl overflow-hidden"
              dangerouslySetInnerHTML={{ __html: successData.qrSvg }}
            />
            <p className="text-xs text-white/50 break-all bg-white/5 p-2 w-full">
              Token: {successData.token}
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full border border-white/20 p-3 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
