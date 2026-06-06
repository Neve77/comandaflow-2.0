const { Prisma } = require('@prisma/client');
const prisma = require('../infra/prisma/client');

const buildDateFilter = (start, end) => {
  const filter = {};
  if (start) filter.gte = new Date(start);
  if (end) filter.lt = new Date(end);
  return Object.keys(filter).length ? filter : undefined;
};

const createMovement = async ({ type, amount, description }) => {
  return prisma.cashMovement.create({
    data: {
      type,
      amount: new Prisma.Decimal(amount),
      description
    }
  });
};

const listMovements = async ({ start, end } = {}) => {
  const dateFilter = buildDateFilter(start, end);
  return prisma.cashMovement.findMany({
    where: dateFilter ? { createdAt: dateFilter } : {},
    orderBy: { createdAt: 'desc' },
    take: 200
  });
};

const getSummary = async ({ start, end } = {}) => {
  const dateFilter = buildDateFilter(start, end);
  const closedWhere = dateFilter ? { closedAt: dateFilter, status: 'fechada' } : { status: 'fechada' };
  const movementsWhere = dateFilter ? { createdAt: dateFilter } : {};

  const [sales, closedCount, movements] = await Promise.all([
    prisma.comanda.aggregate({ where: closedWhere, _sum: { total: true } }),
    prisma.comanda.count({ where: closedWhere }),
    prisma.cashMovement.findMany({ where: movementsWhere, orderBy: { createdAt: 'desc' }, take: 50 })
  ]);

  const salesTotal = Number(sales._sum.total || 0);
  const manualEntries = movements
    .filter((item) => ['entrada', 'abertura'].includes(item.type))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const exits = movements
    .filter((item) => ['saida', 'sangria', 'fechamento'].includes(item.type))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return {
    salesTotal,
    closedCount,
    manualEntries: Number(manualEntries.toFixed(2)),
    exits: Number(exits.toFixed(2)),
    netCash: Number((salesTotal + manualEntries - exits).toFixed(2)),
    averageTicket: closedCount ? Number((salesTotal / closedCount).toFixed(2)) : 0,
    movements: movements.map((item) => ({
      ...item,
      amount: Number(item.amount || 0)
    }))
  };
};

module.exports = { createMovement, getSummary, listMovements };
