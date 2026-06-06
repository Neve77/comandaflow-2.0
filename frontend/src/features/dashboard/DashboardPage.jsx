import { useEffect, useState } from 'react';
import api, { socket } from '../../shared/services/api';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async (showLoading = false) => {
      if (showLoading) setLoading(true);
      setError('');
      try {
        const response = await api.get('/reports/dashboard');
        setData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erro ao carregar painel');
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    fetchDashboard(true);

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
  if (error && !data) {
    return <div className="panel p-6 text-slate-700">{error}</div>;
  }

  const recentQuantity = data.recentPedidos.reduce((sum, pedido) => sum + Number(pedido.quantidade || 0), 0);
  const recentRevenue = data.recentPedidos.reduce((sum, pedido) => sum + Number(pedido.subtotal || 0), 0);

  return (
    <div className="space-y-6">
      {error && <div className="panel p-4 text-sm text-rose-600">{error}</div>}

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="panel p-6">
          <p className="text-sm font-medium uppercase text-slate-500">Venda hoje</p>
          <p className="mt-4 text-4xl font-semibold text-slate-950">R$ {Number(data.totalSoldToday).toFixed(2)}</p>
          <p className="mt-2 text-slate-500">Faturamento fechado no dia.</p>
        </div>
        <div className="panel p-6">
          <p className="text-sm font-medium uppercase text-slate-500">Comandas abertas</p>
          <p className="mt-4 text-4xl font-semibold text-slate-950">{data.comandasAberta}</p>
          <p className="mt-2 text-slate-500">Atendimento em andamento.</p>
        </div>
        <div className="panel p-6">
          <p className="text-sm font-medium uppercase text-slate-500">Pulseiras em uso</p>
          <p className="mt-4 text-4xl font-semibold text-slate-950">{data.braceletsInUse}</p>
          <p className="mt-2 text-slate-500">Pulseiras ocupadas agora.</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="panel p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Pedidos recentes</h2>
              <p className="mt-1 text-slate-500">Ultimos itens registrados.</p>
            </div>
            <span className="status-chip bg-blue-50 text-blue-700">Tempo real</span>
          </div>

          <div className="mt-6 space-y-3">
            {data.recentPedidos.length === 0 ? (
              <p className="text-slate-500">Nenhum pedido recente.</p>
            ) : (
              data.recentPedidos.map((pedido) => (
                <div key={pedido.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{pedido.nome}</p>
                      <p className="text-sm text-slate-500">Qtd {pedido.quantidade}</p>
                    </div>
                    <span className="text-sm text-slate-500">#{pedido.comandaId.slice(0, 6)}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">Subtotal: R$ {Number(pedido.subtotal).toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel p-6">
          <h2 className="text-xl font-semibold text-slate-950">Operacao agora</h2>
          <p className="mt-2 text-slate-500">Resumo calculado pelos pedidos recentes.</p>
          <div className="mt-6 grid gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Itens recentes</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{recentQuantity}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Valor recente</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">R$ {recentRevenue.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">Ocupacao</span>
                <span className="text-sm font-semibold text-slate-950">{data.braceletsInUse} em uso</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{ width: `${Math.min(data.braceletsInUse * 10, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
