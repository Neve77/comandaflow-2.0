const reportsService = require('../services/reports.service');

const dashboard = async (req, res, next) => {
  try {
    const data = await reportsService.getDashboard();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const sales = async (req, res, next) => {
  try {
    const { start, end } = req.validated;
    const data = await reportsService.getSales({ start, end });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const topProducts = async (req, res, next) => {
  try {
    const { start, end, category } = req.validated;
    const data = await reportsService.getTopProducts({ start, end, category });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = { dashboard, sales, topProducts };
