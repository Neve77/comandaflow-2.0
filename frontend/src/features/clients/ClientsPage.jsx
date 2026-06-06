import { useEffect, useMemo, useState } from 'react';
import { Gift, ShieldAlert, UserPlus } from 'lucide-react';
import api from '../../shared/services/api';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

const emptyForm = {
  name: '',
  cpf: '',
  phone: '',
  email: '',
  birthDate: '',
  notes: '',
  blocked: false
};

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [loyalty, setLoyalty] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [history, setHistory] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

  const loadAll = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [clientsResponse, loyaltyResponse, birthdaysResponse] = await Promise.all([
        api.get('/clients'),
        api.get('/loyalty/summary'),
        api.get('/clients/birthdays/month')
      ]);
      setClients(clientsResponse.data.clients || []);
      setLoyalty(loyaltyResponse.data);
      setBirthdays(birthdaysResponse.data.clients || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const term = search.toLowerCase();
    return clients.filter((client) =>
      client.clienteNome.toLowerCase().includes(term)
      || client.clienteCpf.includes(term)
      || client.clienteTelefone.includes(term)
      || (client.clienteEmail || '').toLowerCase().includes(term)
    );
  }, [clients, search]);

  const selectClient = async (client) => {
    setSelectedClient(client);
    setHistoryLoading(true);
    setMessage('');
    try {
      const response = await api.get(`/clients/${client.clienteCpf}/history`);
      setHistory(response.data.history);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erro ao carregar historico');
      setHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const editClient = (client) => {
    setForm({
      name: client.clienteNome,
      cpf: client.clienteCpf,
      phone: client.clienteTelefone,
      email: client.clienteEmail || '',
      birthDate: client.clienteNascimento ? new Date(client.clienteNascimento).toISOString().slice(0, 10) : '',
      notes: client.notes || '',
      blocked: Boolean(client.blocked)
    });
  };

  const saveClient = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      await api.post('/clients', form);
      setForm(emptyForm);
      setMessage('Cliente salvo com sucesso');
      await loadAll();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erro ao salvar cliente');
    }
  };

  const toggleBlocked = async (client) => {
    try {
      await api.patch(`/clients/${client.clienteCpf}/blocked`, { cpf: client.clienteCpf, blocked: !client.blocked });
      await loadAll();
      if (selectedClient?.clienteCpf === client.clienteCpf) setSelectedClient({ ...client, blocked: !client.blocked });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erro ao atualizar bloqueio');
    }
  };

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-slate-500">Clientes e fidelidade</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Area de clientes</h1>
            <p className="mt-1 text-slate-500">Historico de consumo, ranking VIP, cashback, pontos e bloqueios.</p>
          </div>
          <input className="input-field max-w-md" placeholder="Buscar por nome, CPF, telefone ou email" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </section>

      {message && <div className="panel p-4 text-sm text-slate-700">{message}</div>}

      <section className="grid gap-4 xl:grid-cols-4">
        <div className="panel p-5"><p className="text-sm text-slate-500">Clientes</p><p className="mt-2 text-3xl font-semibold text-slate-950">{loyalty?.totalClients || clients.length}</p></div>
        <div className="panel p-5"><p className="text-sm text-slate-500">Pontos emitidos</p><p className="mt-2 text-3xl font-semibold text-slate-950">{loyalty?.totalPoints || 0}</p></div>
        <div className="panel p-5"><p className="text-sm text-slate-500">Cashback</p><p className="mt-2 text-3xl font-semibold text-slate-950">{money(loyalty?.totalCashback)}</p></div>
        <div className="panel p-5"><p className="text-sm text-slate-500">VIPs</p><p className="mt-2 text-3xl font-semibold text-slate-950">{loyalty?.vipClients || 0}</p></div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-4">
          <form onSubmit={saveClient} className="panel p-6">
            <div className="flex items-center gap-2">
              <UserPlus size={18} />
              <h2 className="text-xl font-semibold text-slate-950">Cadastro rapido</h2>
            </div>
            <div className="mt-5 grid gap-3">
              <input className="input-field" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="input-field" placeholder="CPF" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
                <input className="input-field" placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <input className="input-field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="input-field" type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
              <textarea className="input-field min-h-20" placeholder="Observacoes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.blocked} onChange={(e) => setForm({ ...form, blocked: e.target.checked })} />
                Cliente bloqueado
              </label>
            </div>
            <button className="mt-5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" type="submit">Salvar cliente</button>
          </form>

          <div className="panel p-6">
            <div className="flex items-center gap-2">
              <Gift size={18} />
              <h2 className="text-xl font-semibold text-slate-950">Aniversariantes</h2>
            </div>
            <div className="mt-4 space-y-2">
              {birthdays.length === 0 ? <p className="text-sm text-slate-500">Nenhum aniversariante no mes.</p> : birthdays.map((client) => (
                <div key={client.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="font-medium text-slate-950">{client.name}</p>
                  <p className="text-sm text-slate-500">{new Date(client.birthDate).toLocaleDateString('pt-BR')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Lista de clientes</h2>
            {loading ? <div className="mt-6"><LoadingSpinner /></div> : (
              <div className="mt-5 space-y-3">
                {filteredClients.map((client) => (
                  <button key={client.clienteCpf} type="button" onClick={() => selectClient(client)} className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-brand-600">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{client.clienteNome}</p>
                        <p className="mt-1 text-sm text-slate-500">CPF {client.clienteCpf} · {client.clienteTelefone}</p>
                      </div>
                      <span className="status-chip bg-slate-100 text-slate-700">{client.tier}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <span className="text-slate-500">{client.visits} visita(s)</span>
                      <span className="text-slate-500">{money(client.totalSpent)}</span>
                      <span className="text-slate-500">{client.loyaltyPoints} pts</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="panel p-6">
              <h2 className="text-xl font-semibold text-slate-950">Detalhes</h2>
              {selectedClient ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">{selectedClient.clienteNome}</p>
                      <p className="text-sm text-slate-500">{selectedClient.clienteEmail || 'Sem email'}</p>
                    </div>
                    <span className={`status-chip ${selectedClient.blocked ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {selectedClient.blocked ? 'Bloqueado' : 'Ativo'}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Cashback</p><p className="font-semibold">{money(selectedClient.cashbackBalance)}</p></div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Ticket medio</p><p className="font-semibold">{money(selectedClient.averageTicket)}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => editClient(selectedClient)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Editar</button>
                    <button type="button" onClick={() => toggleBlocked(selectedClient)} className="inline-flex items-center gap-2 rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                      <ShieldAlert size={16} /> {selectedClient.blocked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                  </div>
                </div>
              ) : <p className="mt-4 text-sm text-slate-500">Selecione um cliente.</p>}
            </div>

            <div className="panel p-6">
              <h2 className="text-xl font-semibold text-slate-950">Historico</h2>
              {historyLoading ? <div className="mt-6"><LoadingSpinner /></div> : history ? (
                <div className="mt-4 space-y-3">
                  {history.comandas.map((comanda) => (
                    <div key={comanda.id} className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">Pulseira {comanda.braceletNumber}</p>
                          <p className="text-sm text-slate-500">{comanda.eventName || 'Sem evento'} · {comanda.status}</p>
                        </div>
                        <p className="font-semibold text-slate-950">{money(comanda.total)}</p>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-slate-500">
                        {comanda.pedidos.map((pedido, index) => (
                          <p key={`${pedido.nome}-${index}`}>{pedido.quantidade}x {pedido.nome} · {money(pedido.subtotal)}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-4 text-sm text-slate-500">Sem historico selecionado.</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
