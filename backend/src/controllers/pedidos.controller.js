const pedidosService = require('../services/pedidos.service');

const create = async (req, res, next) => {
  try {
    const data = req.validated;
    const pedido = await pedidosService.createPedido(data);
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('pedido-added', { comandaId: data.comandaId, pedido });
      io.emit('order:create', { comandaId: data.comandaId, pedido });
      io.emit('stock:update', { produtoId: pedido.produtoId });
      io.emit('dashboard:update', { source: 'order:create' });
    }
    res.status(201).json({ pedido });
  } catch (error) {
    next(error);
  }
};

const cancel = async (req, res, next) => {
  try {
    const { id } = req.validated;
    const pedido = await pedidosService.cancelPedido(id);
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('pedido-cancelled', { pedidoId: id });
      io.emit('order:cancel', { pedidoId: id });
      io.emit('stock:update', { produtoId: pedido.produtoId });
      io.emit('dashboard:update', { source: 'order:cancel' });
    }
    res.json({ pedido });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, cancel };
