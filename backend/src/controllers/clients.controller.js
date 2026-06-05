const clientsService = require('../services/clients.service');

const listClients = async (req, res, next) => {
  try {
    const clients = await clientsService.listClients();
    res.json({ clients });
  } catch (error) {
    next(error);
  }
};

const getClientHistory = async (req, res, next) => {
  try {
    const { cpf } = req.validated;
    const history = await clientsService.getClientHistory(cpf);
    res.json({ history });
  } catch (error) {
    next(error);
  }
};

module.exports = { listClients, getClientHistory };