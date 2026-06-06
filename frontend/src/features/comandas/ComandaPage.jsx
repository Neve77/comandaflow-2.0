import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useComanda } from './useComanda';
import { useProducts } from '../products/useProducts';
import api from '../../shared/services/api';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

export default function ComandaPage() {
  const location = useLocation();
  const [braceletNumber, setBraceletNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientCpf, setClientCpf] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientBirthDate, setClientBirthDate] = useState('');
  const [eventId, setEventId] = useState('');
  const [events, setEvents] = useState([]);
  const [order, setOrder] = useState({ produtoId: '', nome: '', quantidade: '1', valorUnitario: '0' });
  const [message, setMessage] = useState('');

  const { comanda, openComandas, braceletHistory, braceletInfo, loading, openComanda, closeComanda, addPedido, findOpenByBraceletNumber, cancelPedido, loadOpenComandas, loadComanda } = useComanda();
  const { products } = useProducts();
  const availableProducts = products.filter((product) => product.estoque > 0);

  useEffect(() => {
    if (location.state?.braceletNumber) {
      setBraceletNumber(location.state.braceletNumber);
    }
  }, [location.state]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await api.get('/events');
        setEvents((response.data.events || []).filter((event) => ['ativo', 'planejado'].includes(event.status)));
      } catch {
        setEvents([]);
      }
    };
    loadEvents();
  }, []);

  const formatDigits = (value) => value.replace(/\D/g, '');

  const formatDateTime = (value) => new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleOpen = async () => {
    setMessage('');
    const rawCpf = formatDigits(clientCpf);
    const rawPhone = formatDigits(clientPhone);

    if (!braceletNumber.trim() || !clientName.trim() || !rawCpf || !rawPhone) {
      setMessage('Preencha todos os campos de abertura de comanda');
      return;
    }
    if (rawCpf.length !== 11) {
      setMessage('CPF deve conter 11 dígitos');
      return;
    }
    if (rawPhone.length < 10 || rawPhone.length > 15) {
      setMessage('Telefone deve conter entre 10 e 15 dígitos');
      return;
    }

    try {
      await openComanda({
        number: braceletNumber,
        clienteNome: clientName,
        clienteCpf: rawCpf,
        clienteTelefone: rawPhone,
        clienteEmail: clientEmail,
        clienteNascimento: clientBirthDate,
        eventId
      });
      setMessage('Comanda aberta com sucesso');
      setBraceletNumber('');
      setClientName('');
      setClientCpf('');
      setClientPhone('');
      setClientEmail('');
      setClientBirthDate('');
      setEventId('');
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'Falha ao abrir comanda');
    }
  };

  const handleAddPedido = async () => {
    setMessage('');
    if (!comanda) return;
    if (!order.nome || Number(order.quantidade) <= 0 || Number(order.valorUnitario) <= 0) {
      setMessage('Selecione um produto com quantidade e valor válidos');
      return;
    }

    try {
      await addPedido(order);
      setMessage('Pedido adicionado');
      setOrder({ produtoId: '', nome: '', quantidade: '1', valorUnitario: '0' });
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'Erro ao adicionar pedido');
    }
  };

  const handleClose = async () => {
    setMessage('');
    try {
      await closeComanda(comanda.id);
      setMessage('Comanda fechada e pulseira liberada');
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'Erro ao fechar comanda');
    }
  };

  const handleSearch = async () => {
    setMessage('');
    try {
      const open = await findOpenByBraceletNumber(braceletNumber);
      if (open) {
        setMessage('Comanda aberta encontrada');
      } else {
        setMessage('Pulseira encontrada. Não há comanda aberta no momento; exibindo histórico.');
      }
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
        err.message ||
        'Nenhuma comanda aberta para essa pulseira. Registre a pulseira ou abra uma comanda.'
      );
    }
  };

  const handleProductChange = (e) => {
    const selectedId = e.target.value;
    const selectedProduct = products.find((p) => p.id === selectedId);
    if (selectedProduct) {
      setOrder({ ...order, produtoId: selectedId, nome: selectedProduct.nome, valorUnitario: selectedProduct.preco.toString() });
    } else {
      setOrder({ ...order, produtoId: '', nome: '', valorUnitario: '0' });
    }
  };

  const handleCancelPedido = async (pedidoId) => {
    setMessage('');
    try {
      await cancelPedido(pedidoId);
      setMessage('Pedido cancelado');
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'Erro ao cancelar pedido');
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Comanda</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Abertura e busca</h2>
            <p className="mt-1 text-slate-400">Digite o número da pulseira e os dados do cliente para abrir (ou criar) uma comanda na mesma aba.</p>
          </div>
          <div className="grid w-full max-w-full gap-3">
            <input
              className="input-field"
              value={braceletNumber}
              onChange={(e) => setBraceletNumber(e.target.value)}
              placeholder="Número da pulseira"
            />
            <div className="grid gap-3 lg:grid-cols-3">
              <input
                className="input-field"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nome do cliente"
              />
              <input
                className="input-field"
                value={clientCpf}
                onChange={(e) => setClientCpf(e.target.value)}
                placeholder="CPF do cliente"
              />
              <input
                className="input-field"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Telefone do cliente"
              />
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              <input
                className="input-field"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Email do cliente"
              />
              <input
                className="input-field"
                type="date"
                value={clientBirthDate}
                onChange={(e) => setClientBirthDate(e.target.value)}
              />
              <select
                className="input-field"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              >
                <option value="">Sem evento vinculado</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={handleOpen} disabled={loading} className="rounded-[1.5rem] bg-brand-600 px-5 py-3 text-white font-semibold hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50">
                Abrir
              </button>
              <button type="button" onClick={handleSearch} disabled={loading} className="rounded-[1.5rem] bg-slate-700 px-5 py-3 text-white font-semibold hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50">
                Buscar
              </button>
            </div>
          </div>
        </div>
        {message && <p className="mt-5 text-slate-300">{message}</p>}
      </div>

      <div className="panel p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Comandas abertas</h2>
            <p className="text-slate-400">Visualize as comandas abertas sem precisar digitar o número.</p>
          </div>
          <button
            type="button"
            onClick={loadOpenComandas}
            className="rounded-[1.5rem] bg-slate-700 px-5 py-3 text-white font-semibold hover:bg-slate-600"
          >
            Atualizar
          </button>
        </div>

        {openComandas.length === 0 ? (
          <div className="mt-6 rounded-[1.75rem] border border-dashed border-slate-700 bg-slate-950/90 p-8 text-center text-slate-400">
            Nenhuma comanda aberta no momento.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {openComandas.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => loadComanda(item.id)}
                className="group rounded-[1.75rem] border border-slate-800/90 bg-slate-950/95 p-5 text-left transition hover:border-brand-500"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">Pulseira {item.bracelet.number}</p>
                    <p className="mt-1 text-slate-400 text-sm">Cliente: {item.clienteNome || 'Não informado'}</p>
                    <p className="mt-1 text-slate-400 text-sm">Evento: {item.event?.name || 'Sem evento'}</p>
                  </div>
                  <span className="rounded-full bg-brand-600/15 px-3 py-1 text-xs font-semibold text-brand-200">{item.status}</span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-400">
                  <p>ID: {item.id.slice(0, 8)}</p>
                  <p>Pedidos: {item.pedidos.length}</p>
                  <p>Total atual: R$ {Number(item.total || 0).toFixed(2)}</p>
                </div>
                <p className="mt-4 text-sm text-slate-400 group-hover:text-slate-200">Clique para abrir detalhes da comanda</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {braceletInfo ? (
        <div className="panel p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Histórico da pulseira {braceletInfo.number}</h2>
              <p className="text-slate-400">Registros de abertura e fechamento de comandas desta pulseira.</p>
            </div>
            <span className={`status-chip ${braceletInfo.status === 'livre' ? 'bg-emerald-500/15 text-emerald-300' : braceletInfo.status === 'em_uso' ? 'bg-amber-500/15 text-amber-300' : 'bg-rose-500/15 text-rose-300'}`}>
              {braceletInfo.status}
            </span>
          </div>
          {braceletHistory.length === 0 ? (
            <div className="mt-6 rounded-[1.75rem] border border-dashed border-slate-700 bg-slate-950/90 p-8 text-center text-slate-400">
              Nenhum histórico de comanda encontrado para esta pulseira.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {braceletHistory.map((entry) => (
                <div key={entry.id} className="rounded-[1.75rem] border border-slate-800/90 bg-slate-950/95 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-white">Comanda #{entry.id.slice(0, 8)}</p>
                      <p className="mt-1 text-slate-400 text-sm">Status: {entry.status}</p>
                    </div>
                    <span className="rounded-full bg-brand-600/15 px-3 py-1 text-xs font-semibold text-brand-200">
                      Total R$ {Number(entry.total || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-400">
                    <p>Abrida em: {formatDateTime(entry.openedAt)}</p>
                    <p>Fechada em: {entry.closedAt ? formatDateTime(entry.closedAt) : 'Ainda aberta'}</p>
                    <p>Pedidos: {entry.pedidos.length}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {loading ? (
        <LoadingSpinner />
      ) : comanda ? (
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="panel p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Comanda aberta</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">#{comanda.id.slice(0, 8)} - Pulseira {comanda.bracelet.number}</h3>
                <div className="mt-3 space-y-1 text-slate-400 text-sm">
                  <p>Cliente: <span className="text-white">{comanda.clienteNome}</span></p>
                  <p>CPF: <span className="text-white">{comanda.clienteCpf}</span></p>
                  <p>Telefone: <span className="text-white">{comanda.clienteTelefone}</span></p>
                  <p>Email: <span className="text-white">{comanda.clienteEmail || 'Nao informado'}</span></p>
                  <p>Evento: <span className="text-white">{comanda.event?.name || 'Sem evento'}</span></p>
                </div>
              </div>
              <span className="status-chip bg-emerald-500/15 text-emerald-200">{comanda.status}</span>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-6 rounded-[1.75rem] border border-slate-800/90 bg-slate-950/95 p-6">
                <div>
                  <h4 className="text-lg font-semibold text-white">Novo pedido</h4>
                  <p className="mt-1 text-slate-400">Escolha o produto e confirme a quantidade.</p>
                </div>
                <select className="input-field" value={order.produtoId} onChange={handleProductChange}>
                  <option value="">Selecione um produto</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.nome} - R$ {Number(product.preco).toFixed(2)} - estoque {product.estoque}
                    </option>
                  ))}
                </select>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="input-field"
                    placeholder="Quantidade"
                    type="number"
                    min="1"
                    value={order.quantidade}
                    onChange={(e) => setOrder({ ...order, quantidade: e.target.value })}
                  />
                  <input
                    className="input-field"
                    placeholder="Valor unitário"
                    type="number"
                    min="0"
                    step="0.01"
                    value={order.valorUnitario}
                    readOnly
                  />
                </div>
                <button onClick={handleAddPedido} className="w-full rounded-[1.5rem] bg-brand-600 px-5 py-3 text-white font-semibold hover:bg-brand-500">
                  Adicionar ao pedido
                </button>
              </div>
              <div className="rounded-[1.75rem] border border-slate-800/90 bg-slate-950/95 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white">Total da comanda</h4>
                    <p className="mt-1 text-slate-400">Resumo dos pedidos ativos.</p>
                  </div>
                  <button onClick={handleClose} className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-400">
                    Fechar comanda
                  </button>
                </div>
                <p className="mt-6 text-5xl font-semibold text-white">R$ {Number(comanda.total).toFixed(2)}</p>
                <div className="mt-6 space-y-4">
                  {comanda.pedidos.map((item) => (
                    <div key={item.id} className="rounded-[1.5rem] border border-slate-800/90 bg-slate-900/95 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">{item.nome}</p>
                          <p className="mt-1 text-slate-400 text-sm">{item.quantidade} x R$ {Number(item.valorUnitario).toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => handleCancelPedido(item.id)}
                          className="rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-400"
                        >
                          Cancelar
                        </button>
                      </div>
                      <p className="mt-3 text-slate-400 text-sm">Subtotal: R$ {Number(item.subtotal).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
