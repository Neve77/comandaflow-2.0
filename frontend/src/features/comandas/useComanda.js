import { useState, useEffect } from 'react';
import api, { socket } from '../../shared/services/api';

export const useComanda = () => {
  const [comanda, setComanda] = useState(null);
  const [openComandas, setOpenComandas] = useState([]);
  const [braceletHistory, setBraceletHistory] = useState([]);
  const [braceletInfo, setBraceletInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadComanda = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/comandas/${id}`);
      setComanda(response.data.comanda);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar comanda');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadOpenComandas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/comandas');
      setOpenComandas(response.data.comandas);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar comandas abertas');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const openComanda = async (openData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/comandas/open', openData);
      await loadComanda(response.data.comanda.id);
      await loadOpenComandas();
      return response.data.comanda;
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao abrir comanda');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const closeComanda = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/comandas/${id}/close`);
      setComanda(null);
      await loadOpenComandas();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao fechar comanda');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addPedido = async (pedidoData) => {
    if (!comanda) return;
    setLoading(true);
    setError(null);
    try {
      await api.post('/pedidos', { comandaId: comanda.id, ...pedidoData });
      await loadComanda(comanda.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao adicionar pedido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadBraceletHistory = async (number) => {
    setError(null);
    const response = await api.get(`/comandas/history/${number}`);
    const bracelet = response.data.bracelet;
    setBraceletInfo({ number: bracelet.number, status: bracelet.status });
    setBraceletHistory(bracelet.comandas || []);
    return bracelet;
  };

  const findOpenByBraceletNumber = async (number) => {
    setLoading(true);
    setError(null);
    setBraceletHistory([]);
    setBraceletInfo(null);
    try {
      const response = await api.get('/comandas');
      const open = response.data.comandas.find((item) => item.bracelet.number === number);
      await loadBraceletHistory(number);
      if (!open) {
        setComanda(null);
        return null;
      }
      setComanda(open);
      return open;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Erro ao buscar comanda';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelPedido = async (pedidoId) => {
    if (!comanda) return;
    setLoading(true);
    setError(null);
    try {
      await api.patch(`/pedidos/${pedidoId}/cancel`);
      await loadComanda(comanda.id);
      await loadOpenComandas();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao cancelar pedido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handlePedidoAdded = (data) => {
      if (comanda && data.comandaId === comanda.id) {
        loadComanda(comanda.id).catch(() => {});
      }
    };
    const handlePedidoCancelled = () => {
      if (comanda) {
        loadComanda(comanda.id).catch(() => {});
      }
    };

    socket.on('pedido-added', handlePedidoAdded);
    socket.on('pedido-cancelled', handlePedidoCancelled);

    return () => {
      socket.off('pedido-added', handlePedidoAdded);
      socket.off('pedido-cancelled', handlePedidoCancelled);
    };
  }, [comanda]);

  useEffect(() => {
    loadOpenComandas().catch(() => {});
  }, []);

  return {
    comanda,
    openComandas,
    braceletHistory,
    braceletInfo,
    loading,
    error,
    loadComanda,
    loadOpenComandas,
    openComanda,
    closeComanda,
    addPedido,
    cancelPedido,
    findOpenByBraceletNumber,
  };
};
