import { useEffect, useState } from 'react';
import api, { socket } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      const response = await api.get('/reports/dashboard');
      setData(response.data);
      setLoading(false);
    };
    fetchDashboard();

    const handleUpdate = () => {
      fetchDashboard();
    };

    socket.on('pedido-added', handleUpdate);
    socket.on('pedido-cancelled', handleUpdate);
    socket.on('comanda-closed', handleUpdate);

    return () => {
      socket.off('pedido-added', handleUpdate);
      socket.off('pedido-cancelled', handleUpdate);
      socket.off('comanda-closed', handleUpdate);
    };
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-3">
        <div className="panel p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Venda hoje</p>
          <p className="mt-4 text-4xl font-semibold text-white">R$ {Number(data.totalSoldToday).toFixed(2)}</p>
          <p className="mt-2 text-slate-400">Controle rápido de faturamento diário.</p>
        </div>
        <div className="panel p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Comandas abertas</p>
          <p className="mt-4 text-4xl font-semibold text-white">{data.comandasAberta}</p>
          <p className="mt-2 text-slate-400">Comandas em andamento agora.</p>
        </div>
        <div className="panel p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Pulseiras ativas</p>
          <p className="mt-4 text-4xl font-semibold text-white">{data.braceletsInUse}</p>
          <p className="mt-2 text-slate-400">Pulseiras ocupadas na operação.</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="panel p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Pedidos recentes</h2>
              <p className="mt-1 text-slate-500">Os últimos serviços registrados na comanda.</p>
            </div>
            <span className="status-chip bg-brand-600/15 text-brand-200">Em tempo real</span>
          </div>
          <div className="mt-6 space-y-4">
            {data.recentPedidos.length === 0 ? (
              <p className="text-slate-400">Nenhum pedido recente.</p>
            ) : (
              data.recentPedidos.map((pedido) => (
                <div key={pedido.id} className="rounded-[1.75rem] border border-slate-800/90 bg-slate-950/95 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{pedido.nome}</p>
                      <p className="text-slate-400 text-sm">Qtd {pedido.quantidade}</p>
                    </div>
                    <span className="text-slate-400">#{pedido.comandaId.slice(0, 6)}</span>
                  </div>
                  <p className="mt-3 text-slate-400">Subtotal: R$ {pedido.subtotal.toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel p-6">
          <h2 className="text-xl font-semibold text-white">Visão rápida</h2>
          <p className="mt-2 text-slate-500">Indicadores prontos para acompanhar a operação.</p>
          <div className="mt-6 space-y-4">
            {[5, 7, 4, 9, 6].map((value, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Período {index + 1}</span>
                  <span>{value}k</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${value * 10}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
