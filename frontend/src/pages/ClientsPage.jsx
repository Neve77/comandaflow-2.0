import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const fetchClients = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await api.get('/clients');
      setClients(response.data.clients);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSelectClient = async (client) => {
    setSelectedClient(client);
    setHistoryLoading(true);
    setMessage('');
    try {
      const response = await api.get(`/clients/${client.clienteCpf}/history`);
      setHistory(response.data.history);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erro ao carregar histórico');
      setHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const term = search.toLowerCase();
    return clients.filter((client) =>
      client.clienteNome.toLowerCase().includes(term)
      || client.clienteCpf.includes(term)
      || client.clienteTelefone.includes(term)
    );
  }, [clients, search]);

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Clientes</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Gestão de clientes</h1>
            <p className="mt-2 text-slate-400">Visualize clientes, histórico de consumo e acompanhe visitas com mais agilidade.</p>
          </div>
        </div>
      </div>

      <div className="panel p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Clientes cadastrados</h2>
            <p className="text-slate-400">Escolha um cliente para ver o histórico de comandas e consumo.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className="input-field w-full max-w-sm"
              placeholder="Buscar por nome, CPF ou telefone"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {message && <div className="mt-4 rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-200">{message}</div>}

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <div className="rounded-[1.75rem] border border-slate-800/90 bg-slate-950/95 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Lista</p>
                <p className="mt-2 text-3xl font-semibold text-white">{clients.length}</p>
              </div>
              <span className="status-chip bg-slate-800 text-slate-300">Clientes únicos</span>
            </div>

            {loading ? (
              <div className="mt-6"><LoadingSpinner /></div>
            ) : filteredClients.length === 0 ? (
              <div className="mt-6 rounded-[1.75rem] border border-dashed border-slate-700 bg-slate-950/90 p-8 text-center text-slate-400">
                Nenhum cliente encontrado. Abra comandas com dados de cliente para preencher a base.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {filteredClients.map((client) => (
                  <button
                    key={client.clienteCpf}
                    type="button"
                    onClick={() => handleSelectClient(client)}
                    className="w-full rounded-[1.75rem] border border-slate-800/90 bg-slate-900/90 p-4 text-left transition hover:border-brand-500 hover:bg-slate-800/90 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-white">{client.clienteNome}</p>
                        <p className="text-slate-400">CPF: {client.clienteCpf}</p>
                        <p className="text-slate-400">Telefone: {client.clienteTelefone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Visitas</p>
                        <p className="text-lg font-semibold text-white">{client.visits}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-400">Gasto total</span>
                      <span className="text-white">R$ {client.totalSpent.toFixed(2)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-slate-800/90 bg-slate-950/95 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Detalhes do cliente</p>
              {selectedClient ? (
                <div className="mt-4 space-y-4">
                  <p className="text-lg font-semibold text-white">{selectedClient.clienteNome}</p>
                  <p className="text-slate-400">CPF: {selectedClient.clienteCpf}</p>
                  <p className="text-slate-400">Telefone: {selectedClient.clienteTelefone}</p>
                  <p className="text-slate-400">Visitas: {selectedClient.visits}</p>
                  <p className="text-slate-400">Gasto total: R$ {selectedClient.totalSpent.toFixed(2)}</p>
                </div>
              ) : (
                <p className="mt-4 text-slate-400">Selecione um cliente para ver o histórico de consumo e detalhes de pedidos.</p>
              )}
            </div>

            <div className="rounded-[1.75rem] border border-slate-800/90 bg-slate-950/95 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Histórico</p>
                {historyLoading && <span className="text-slate-400">Carregando...</span>}
              </div>

              {historyLoading ? (
                <div className="mt-6"><LoadingSpinner /></div>
              ) : history ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-[1.5rem] border border-slate-800/90 bg-slate-900 p-4">
                    <p className="text-slate-400">Visitas</p>
                    <p className="text-2xl font-semibold text-white">{history.visits}</p>
                    <p className="text-slate-400">Total consumido: R$ {history.totalSpent.toFixed(2)}</p>
                  </div>
                  <div className="space-y-3">
                    {history.comandas.map((comanda) => (
                      <div key={comanda.id} className="rounded-[1.5rem] border border-slate-800/90 bg-slate-900 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Comanda #{comanda.id.slice(0, 6)}</p>
                            <p className="text-white">Pulseira: {comanda.braceletNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-400">Status</p>
                            <p className="font-semibold text-white">{comanda.status}</p>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-[0.25em]">Aberta</p>
                            <p className="text-white">{new Date(comanda.openedAt).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-[0.25em]">Fechada</p>
                            <p className="text-white">{comanda.closedAt ? new Date(comanda.closedAt).toLocaleString() : 'Ainda aberta'}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-[0.25em]">Total</p>
                            <p className="text-white">R$ {comanda.total.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <p className="text-slate-400 text-sm">Pedidos:</p>
                          {comanda.pedidos.length === 0 ? (
                            <p className="text-slate-400">Nenhum item registrado.</p>
                          ) : (
                            <div className="space-y-2">
                              {comanda.pedidos.map((pedido, index) => (
                                <div key={index} className="rounded-2xl bg-slate-950/90 p-3">
                                  <p className="font-semibold text-white">{pedido.nome}</p>
                                  <p className="text-slate-400">Qtd: {pedido.quantidade} · Subtotal: R$ {pedido.subtotal.toFixed(2)}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-slate-400">Selecione um cliente para visualizar o histórico de consumo.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
