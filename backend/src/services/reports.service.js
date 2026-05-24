const prisma = require('../prisma/client');

const getDashboard = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [salesToday, openComandas, braceletsInUse, recentPedidos] = await Promise.all([
    prisma.comanda.aggregate({
      where: { closedAt: { gte: today, lt: tomorrow } },
      _sum: { total: true }
    }),
    prisma.comanda.count({ where: { status: 'aberta' } }),
    prisma.bracelet.count({ where: { status: 'em_uso' } }),
    prisma.pedido.findMany({
      where: { cancelado: false },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { comanda: true }
    })
  ]);

  return {
    totalSoldToday: salesToday._sum.total || 0,
    comandasAberta: openComandas,
    braceletsInUse,
    recentPedidos: recentPedidos.map((pedido) => ({
      id: pedido.id,
      comandaId: pedido.comandaId,
      nome: pedido.nome,
      quantidade: pedido.quantidade,
      subtotal: Number(pedido.subtotal),
      createdAt: pedido.createdAt
    }))
  };
};

const buildDateFilter = (start, end) => {
  const filter = {};
  if (start) filter.gte = new Date(start);
  if (end) filter.lt = new Date(end);
  return Object.keys(filter).length ? filter : undefined;
};

const getSales = async ({ start, end }) => {
  const dateFilter = buildDateFilter(start, end);
  const where = dateFilter ? { closedAt: dateFilter } : { status: 'fechada' };

  const sales = await prisma.comanda.findMany({
    where,
    select: { total: true, openedAt: true, closedAt: true }
  });

  const total = sales.reduce((sum, comanda) => sum + Number(comanda.total), 0);
  const count = sales.length;
  const average = count ? Number((total / count).toFixed(2)) : 0;

  return { total, count, average, sales };
};

const getTopProducts = async ({ start, end, category }) => {
  const dateFilter = buildDateFilter(start, end);
  const where = { cancelado: false };
  if (dateFilter) {
    where.comanda = { closedAt: dateFilter };
  }
  if (category) {
    where.produto = { categoria: category };
  }

  const pedidos = await prisma.pedido.groupBy({
    by: ['produtoId', 'nome'],
    where,
    _sum: { quantidade: true, subtotal: true },
    orderBy: { _sum: { quantidade: 'desc' } },
    take: 10
  });

  return pedidos.map((item) => ({
    produtoId: item.produtoId,
    nome: item.nome,
    quantidade: Number(item._sum.quantidade),
    faturamento: Number(item._sum.subtotal)
  }));
};

module.exports = { getDashboard, getSales, getTopProducts };
