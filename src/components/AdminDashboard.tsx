import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { Users, UserCheck, Percent, Download, Search, Loader2, LogOut, Plus, Copy, Check, Trash2, Ticket } from 'lucide-react';

interface Artist {
  id: number;
  name: string;
  code: string;
  count: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, attended: 0 });
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const [artists, setArtists] = useState<Artist[]>([]);
  const [directCount, setDirectCount] = useState(0);
  const [newArtist, setNewArtist] = useState({ name: '', code: '' });
  const [artistError, setArtistError] = useState('');
  const [savingArtist, setSavingArtist] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);

  const loadArtists = () => {
    fetch('/api/admin/artists')
      .then((res) => res.json())
      .then((data) => {
        if (data.artists) setArtists(data.artists);
        if (typeof data.directCount === 'number') setDirectCount(data.directCount);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setTickets(data.tickets);
        setLoading(false);
      });
    loadArtists();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/admin/login';
  };

  const handleAddArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    setArtistError('');
    const name = newArtist.name.trim();
    const code = newArtist.code.trim().toUpperCase().replace(/\s+/g, '');
    if (!name || !code) {
      setArtistError('Ingresa nombre y código.');
      return;
    }
    setSavingArtist(true);
    try {
      const res = await fetch('/api/admin/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setArtistError(data.error || 'No se pudo crear el artista.');
      } else {
        setNewArtist({ name: '', code: '' });
        loadArtists();
      }
    } catch {
      setArtistError('Error de conexión.');
    } finally {
      setSavingArtist(false);
    }
  };

  const handleDeleteArtist = async (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar a "${name}"? Los registros ya hechos con su código se conservan.`)) return;
    await fetch(`/api/admin/artists?id=${id}`, { method: 'DELETE' }).catch(() => {});
    loadArtists();
  };

  const handleCopyLink = async (code: string) => {
    const link = `https://el808fest.com/?ref=${code}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Fallback silencioso si el navegador bloquea el portapapeles.
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 1800);
  };

  // Brand entrance animation (same easing language as the Hero)
  useEffect(() => {
    if (loading || !rootRef.current) return;
    const targets = rootRef.current.querySelectorAll('[data-reveal]');
    gsap.fromTo(
      targets,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' },
    );
  }, [loading]);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "ID,Nombre,Cédula,Celular,Email,Asistió,Fecha\n"
      + tickets.map(t => `${t.id},${t.full_name},${t.cedula},${t.phone},${t.email},${t.attended ? 'Si' : 'No'},${new Date(t.created_at).toLocaleString()}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "808_tickets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTickets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) =>
      [t.full_name, t.email, t.cedula, t.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [tickets, query]);

  const attendancePct = stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-4 bg-transparent text-white font-sans">
        <Loader2 className="h-8 w-8 animate-spin text-[#39FF14]" />
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/50">Cargando panel</p>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative z-10 min-h-screen bg-transparent text-white font-sans px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div data-reveal className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-[#39FF14]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#39FF14] shadow-[0_0_8px_#39FF14]" />
              808 Fest — Control
            </span>
            <h1 className="text-4xl md:text-6xl font-black uppercase leading-[0.9] tracking-tighter">
              Panel de <span className="text-[#39FF14] drop-shadow-[0_0_18px_rgba(57,255,20,0.45)]">Admin</span>
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleExport}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-[#39FF14] px-6 py-3 text-sm font-black uppercase tracking-widest text-black shadow-[0_0_15px_rgba(57,255,20,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(57,255,20,0.6)] md:w-auto cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Download className="h-4 w-4" /> Exportar CSV
              </span>
              <span className="absolute inset-0 origin-left scale-x-0 bg-white transition-transform duration-300 ease-out group-hover:scale-x-100" />
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-black uppercase tracking-widest text-white/70 transition-all duration-300 hover:border-white/40 hover:text-white md:w-auto cursor-pointer"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Total Registrados"
            value={stats.total}
          />
          <StatCard
            icon={<UserCheck className="h-5 w-5" />}
            label="Total Asistentes"
            value={stats.attended}
          />
          <StatCard
            icon={<Percent className="h-5 w-5" />}
            label="% Asistencia"
            value={`${attendancePct}%`}
            accent
          />
        </div>

        {/* Artistas / Códigos */}
        <div data-reveal className="mb-10 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-2xl">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-white/70">
              Artistas / Códigos
              <span className="ml-2 text-white/30">{artists.length}</span>
            </h2>
            <p className="mt-1 text-xs text-white/40">
              Cada artista tiene un código. Comparte su enlace y cuenta cuántas personas se registran con él.
            </p>
          </div>

          {/* Alta de artista */}
          <form onSubmit={handleAddArtist} className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-white/50">Nombre del artista</label>
              <input
                type="text"
                value={newArtist.name}
                onChange={(e) => setNewArtist({ ...newArtist, name: e.target.value })}
                placeholder="Ej: DJ Ana"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#39FF14]/60 focus:outline-none"
              />
            </div>
            <div className="flex-1 sm:max-w-[220px]">
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-white/50">Código</label>
              <input
                type="text"
                value={newArtist.code}
                onChange={(e) => setNewArtist({ ...newArtist, code: e.target.value.toUpperCase() })}
                placeholder="Ej: DJANA"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm uppercase text-white placeholder:text-white/30 focus:border-[#39FF14]/60 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={savingArtist}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#39FF14] px-5 py-2 text-sm font-black uppercase tracking-widest text-black transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Agregar
            </button>
          </form>

          {artistError && (
            <div className="border-b border-white/10 bg-red-500/10 px-5 py-3 text-sm text-red-300">
              {artistError}
            </div>
          )}

          {/* Lista de artistas */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/50">Artista</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/50">Código</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/50">Registros</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/50">Enlace</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {artists.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 transition-colors hover:bg-white/5">
                    <td className="p-4 font-medium">{a.name}</td>
                    <td className="p-4">
                      <span className="rounded border border-white/15 bg-black/40 px-2 py-1 font-mono text-xs uppercase tracking-widest text-[#39FF14]">
                        {a.code}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-2xl font-black tracking-tighter text-white">{a.count}</span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleCopyLink(a.code)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white/70 transition-colors hover:border-white/40 hover:text-white cursor-pointer"
                      >
                        {copiedCode === a.code ? (
                          <><Check className="h-3.5 w-3.5 text-[#39FF14]" /> Copiado</>
                        ) : (
                          <><Copy className="h-3.5 w-3.5" /> Copiar enlace</>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteArtist(a.id, a.name)}
                        aria-label={`Eliminar ${a.name}`}
                        className="inline-flex items-center justify-center rounded-lg border border-white/10 p-2 text-white/40 transition-colors hover:border-red-500/50 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Fila fija: registros directos / orgánicos */}
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <td className="p-4 font-medium text-white/60">
                    <span className="inline-flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-white/30" /> Directo / Orgánico
                    </span>
                  </td>
                  <td className="p-4 text-white/30">—</td>
                  <td className="p-4">
                    <span className="text-2xl font-black tracking-tighter text-white/70">{directCount}</span>
                  </td>
                  <td className="p-4 text-white/30">Sin código</td>
                  <td className="p-4"></td>
                </tr>
              </tbody>
            </table>

            {artists.length === 0 && (
              <div className="p-8 text-center text-sm text-white/40">
                Aún no hay artistas. Agrega uno arriba para empezar a repartir códigos.
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div data-reveal className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-2xl">
          <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-white/70">
              Registros
              <span className="ml-2 text-white/30">{filteredTickets.length}</span>
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar nombre, email, cédula..."
                className="w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 transition-colors focus:border-[#39FF14]/60 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto" data-native-cursor>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/50">Nombre</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/50">Email</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/50">Cédula</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-white/50">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 transition-colors hover:bg-white/5">
                    <td className="p-4 font-medium">{t.full_name}</td>
                    <td className="p-4 text-white/70">{t.email}</td>
                    <td className="p-4 text-white/70">{t.cedula}</td>
                    <td className="p-4">
                      {t.attended ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#39FF14]/50 bg-[#39FF14]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#39FF14]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#39FF14] shadow-[0_0_6px_#39FF14]" />
                          Adentro
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/40">
                          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                          Pendiente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTickets.length === 0 && (
              <div className="p-10 text-center text-sm text-white/40">
                No se encontraron registros.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      data-reveal
      className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">{label}</h3>
        <span
          className={
            'flex h-9 w-9 items-center justify-center rounded-lg border ' +
            (accent
              ? 'border-[#39FF14]/40 bg-[#39FF14]/10 text-[#39FF14]'
              : 'border-white/10 bg-white/5 text-white/60')
          }
        >
          {icon}
        </span>
      </div>
      <p
        className={
          'text-5xl font-black tracking-tighter ' +
          (accent ? 'text-[#39FF14] drop-shadow-[0_0_18px_rgba(57,255,20,0.4)]' : 'text-white')
        }
      >
        {value}
      </p>
    </div>
  );
}
