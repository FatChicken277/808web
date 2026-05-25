import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, attended: 0 });
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setTickets(data.tickets);
        setLoading(false);
      });
  }, []);

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

  if (loading) return <div className="p-8 text-white">Cargando...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Panel de Admin</h1>
          <button onClick={handleExport} className="bg-white text-black px-4 py-2 text-sm font-bold uppercase tracking-widest hover:bg-[#39FF14] transition-colors">
            Exportar CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-950 border border-white/10 p-6">
            <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Total Registrados</h3>
            <p className="text-4xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-zinc-950 border border-white/10 p-6">
            <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Total Asistentes</h3>
            <p className="text-4xl font-bold">{stats.attended}</p>
          </div>
          <div className="bg-zinc-950 border border-white/10 p-6">
            <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">% Asistencia</h3>
            <p className="text-4xl font-bold text-[#39FF14]">{stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0}%</p>
          </div>
        </div>

        <div className="bg-zinc-950 border border-white/10 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="p-4 font-bold uppercase tracking-widest text-xs text-white/50">Nombre</th>
                <th className="p-4 font-bold uppercase tracking-widest text-xs text-white/50">Email</th>
                <th className="p-4 font-bold uppercase tracking-widest text-xs text-white/50">Cédula</th>
                <th className="p-4 font-bold uppercase tracking-widest text-xs text-white/50">Estado</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">{t.full_name}</td>
                  <td className="p-4 text-white/70">{t.email}</td>
                  <td className="p-4 text-white/70">{t.cedula}</td>
                  <td className="p-4">
                    {t.attended ? (
                      <span className="text-[#39FF14] text-xs border border-[#39FF14] px-2 py-1 uppercase tracking-widest">Adentro</span>
                    ) : (
                      <span className="text-white/30 text-xs border border-white/30 px-2 py-1 uppercase tracking-widest">Pendiente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
