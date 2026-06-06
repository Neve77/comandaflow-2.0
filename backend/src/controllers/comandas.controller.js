const comandasService = require('../services/comandas.service');

const listOpen = async (req, res, next) => {
  try {
    const comandas = await comandasService.listOpenComandas();
    res.json({ comandas });
  } catch (error) {
    next(error);
  }
};

const get = async (req, res, next) => {
  try {
    const { id } = req.validated;
    const comanda = await comandasService.getComanda(id);
    res.json({ comanda });
  } catch (error) {
    next(error);
  }
};

const open = async (req, res, next) => {
  try {
    const comanda = await comandasService.openComanda({
      ...req.validated,
      userId: req.user?.userId
    });
    const io = req.app.get('io');
    if (io) {
      io.emit('bracelet:update', { braceletId: comanda.braceletId });
      io.emit('dashboard:update', { source: 'comanda:open' });
    }
    res.status(201).json({ comanda });
  } catch (error) {
    next(error);
  }
};

const historyByBraceletNumber = async (req, res, next) => {
  try {
    const { number } = req.params;
    const bracelet = await comandasService.getHistoryByBraceletNumber(number);
    res.json({ bracelet });
  } catch (error) {
    next(error);
  }
};

const close = async (req, res, next) => {
  try {
    const { id } = req.validated;
    const comanda = await comandasService.closeComanda(id, req.user?.userId);
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('comanda-closed', { comandaId: id });
      io.emit('cashier:update', { comandaId: id });
      io.emit('dashboard:update', { source: 'comanda:close' });
    }
    res.json({ comanda });
  } catch (error) {
    next(error);
  }
};

module.exports = { listOpen, get, open, historyByBraceletNumber, close };
