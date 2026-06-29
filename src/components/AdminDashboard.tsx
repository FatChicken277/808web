import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { Users, UserCheck, Percent, Download, Search, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, attended: 0 });
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setTickets(data.tickets);
        setLoading(false);
      });
  }, []);

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
          <button
            onClick={handleExport}
            className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-[#39FF14] px-6 py-3 text-sm font-black uppercase tracking-widest text-black shadow-[0_0_15px_rgba(57,255,20,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(57,255,20,0.6)] md:w-auto cursor-pointer"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Download className="h-4 w-4" /> Exportar CSV
            </span>
            <span className="absolute inset-0 origin-left scale-x-0 bg-white transition-transform duration-300 ease-out group-hover:scale-x-100" />
          </button>
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
