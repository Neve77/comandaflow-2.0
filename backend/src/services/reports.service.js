const prisma = require('../infra/prisma/client');

const PROFIT_MARGIN = 0.38;

const buildDateFilter = (start, end) => {
  const filter = {};
  if (start) filter.gte = new Date(start);
  if (end) filter.lt = new Date(end);
  return Object.keys(filter).length ? filter : undefined;
};

const buildClosedWhere = ({ start, end, eventId } = {}) => {
  const dateFilter = buildDateFilter(start, end);
  return {
    status: 'fechada',
    ...(dateFilter ? { closedAt: dateFilter } : {}),
    ...(eventId ? { eventId } : {})
  };
};

const buildPedidoWhere = ({ start, end, category, eventId } = {}) => {
  const dateFilter = buildDateFilter(start, end);
  return {
    cancelado: false,
    comanda: {
      status: 'fechada',
      ...(dateFilter ? { closedAt: dateFilter } : {}),
      ...(eventId ? { eventId } : {})
    },
    ...(category ? { produto: { categoria: category } } : {})
  };
};

const formatMoney = (value) => Number(Number(value || 0).toFixed(2));

const getSales = async ({ start, end, eventId } = {}) => {
  const where = buildClosedWhere({ start, end, eventId });

  const sales = await prisma.comanda.aggregate({
    where,
    _sum: { total: true },
    _count: { _all: true }
  });

  const total = formatMoney(sales._sum.total || 0);
  const count = sales._count._all;
  const average = count ? formatMoney(total / count) : 0;

  return { total, count, average };
};

const getTopProducts = async ({ start, end, category, eventId, take = 10 } = {}) => {
  const pedidos = await prisma.pedido.findMany({
    where: buildPedidoWhere({ start, end, category, eventId }),
    include: { produto: true }
  });

  const map = new Map();
  pedidos.forEach((pedido) => {
    const key = pedido.produtoId || pedido.nome;
    const item = map.get(key) || {
      produtoId: pedido.produtoId,
      nome: pedido.nome,
      categoria: pedido.produto?.categoria || 'Avulso',
      quantidade: 0,
      faturamento: 0
    };
    item.quantidade += pedido.quantidade;
    item.faturamento += Number(pedido.subtotal || 0);
    map.set(key, item);
  });

  return Array.from(map.values())
    .map((item) => ({ ...item, faturamento: formatMoney(item.faturamento) }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, take);
};

const getDashboard = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [salesToday, openComandas, braceletsInUse, recentPedidos, activeClients, lowStock] = await Promise.all([
    prisma.comanda.aggregate({
      where: { closedAt: { gte: today, lt: tomorrow }, status: 'fechada' },
      _sum: { total: true },
      _count: { _all: true }
    }),
    prisma.comanda.count({ where: { status: 'aberta' } }),
    prisma.bracelet.count({ where: { status: 'em_uso' } }),
    prisma.pedido.findMany({
      where: { cancelado: false },
      orderBy: { createdAt: 'desc' },
      take: 8
    }),
    prisma.comanda.groupBy({
      by: ['clienteCpf'],
      where: { status: 'aberta', clienteCpf: { not: '' } }
    }),
    prisma.produto.count({ where: { estoque: { lte: 8 }, ativo: true } })
  ]);

  const totalSoldToday = formatMoney(salesToday._sum.total || 0);
  const comandasFechadasHoje = salesToday._count._all;

  return {
    totalSoldToday,
    comandasFechadasHoje,
    ticketMedioHoje: comandasFechadasHoje ? formatMoney(totalSoldToday / comandasFechadasHoje) : 0,
    comandasAberta: openComandas,
    braceletsInUse,
    activeClients: activeClients.length,
    lowStock,
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

const getRevenueByPeriod = async ({ start, end, eventId } = {}) => {
  const comandas = await prisma.comanda.findMany({
    where: buildClosedWhere({ start, end, eventId }),
    orderBy: { closedAt: 'asc' },
    select: { closedAt: true, total: true }
  });

  const map = new Map();
  comandas.forEach((comanda) => {
    const key = new Date(comanda.closedAt).toISOString().slice(0, 10);
    const item = map.get(key) || { period: key, total: 0, count: 0 };
    item.total += Number(comanda.total || 0);
    item.count += 1;
    map.set(key, item);
  });

  return Array.from(map.values()).map((item) => ({
    ...item,
    total: formatMoney(item.total)
  }));
};

const getCategoryConsumption = async ({ start, end, eventId } = {}) => {
  const pedidos = await prisma.pedido.findMany({
    where: buildPedidoWhere({ start, end, eventId }),
    include: { produto: true }
  });

  const map = new Map();
  pedidos.forEach((pedido) => {
    const category = pedido.produto?.categoria || 'Avulso';
    const item = map.get(category) || { categoria: category, quantidade: 0, faturamento: 0 };
    item.quantidade += pedido.quantidade;
    item.faturamento += Number(pedido.subtotal || 0);
    map.set(category, item);
  });

  return Array.from(map.values())
    .map((item) => ({ ...item, faturamento: formatMoney(item.faturamento) }))
    .sort((a, b) => b.faturamento - a.faturamento);
};

const getRecurrentClients = async ({ start, end, eventId } = {}) => {
  const comandas = await prisma.comanda.findMany({
    where: {
      ...buildClosedWhere({ start, end, eventId }),
      clienteCpf: { not: '' }
    },
    select: {
      clienteNome: true,
      clienteCpf: true,
      clienteTelefone: true,
      total: true,
      closedAt: true
    }
  });

  const map = new Map();
  comandas.forEach((comanda) => {
    const item = map.get(comanda.clienteCpf) || {
      clienteNome: comanda.clienteNome,
      clienteCpf: comanda.clienteCpf,
      clienteTelefone: comanda.clienteTelefone,
      visits: 0,
      totalSpent: 0,
      lastVisit: comanda.closedAt
    };
    item.visits += 1;
    item.totalSpent += Number(comanda.total || 0);
    if (new Date(comanda.closedAt) > new Date(item.lastVisit)) item.lastVisit = comanda.closedAt;
    map.set(comanda.clienteCpf, item);
  });

  return Array.from(map.values())
    .filter((item) => item.visits > 1)
    .map((item) => ({ ...item, totalSpent: formatMoney(item.totalSpent) }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);
};

const getFlowByHour = async ({ start, end, eventId } = {}) => {
  const dateFilter = buildDateFilter(start, end);
  const where = {
    ...(dateFilter ? { openedAt: dateFilter } : {}),
    ...(eventId ? { eventId } : {})
  };
  const comandas = await prisma.comanda.findMany({
    where,
    select: { openedAt: true, closedAt: true }
  });

  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, entries: 0, exits: 0 }));
  comandas.forEach((comanda) => {
    hours[new Date(comanda.openedAt).getHours()].entries += 1;
    if (comanda.closedAt) {
      hours[new Date(comanda.closedAt).getHours()].exits += 1;
    }
  });

  return hours;
};

const getEventComparison = async () => {
  const events = await prisma.event.findMany({ orderBy: { startAt: 'desc' }, take: 12 });
  return Promise.all(events.map(async (event) => {
    const sales = await prisma.comanda.aggregate({
      where: { eventId: event.id, status: 'fechada' },
      _sum: { total: true },
      _count: { _all: true }
    });
    return {
      id: event.id,
      name: event.name,
      status: event.status,
      startAt: event.startAt,
      total: formatMoney(sales._sum.total || 0),
      comandas: sales._count._all
    };
  }));
};

const getTopClients = async ({ start, end, eventId } = {}) => {
  const comandas = await prisma.comanda.findMany({
    where: {
      ...buildClosedWhere({ start, end, eventId }),
      clienteCpf: { not: '' }
    },
    select: { clienteNome: true, clienteCpf: true, clienteTelefone: true, total: true }
  });

  const map = new Map();
  comandas.forEach((comanda) => {
    const item = map.get(comanda.clienteCpf) || {
      clienteNome: comanda.clienteNome,
      clienteCpf: comanda.clienteCpf,
      clienteTelefone: comanda.clienteTelefone,
      visits: 0,
      totalSpent: 0
    };
    item.visits += 1;
    item.totalSpent += Number(comanda.total || 0);
    map.set(comanda.clienteCpf, item);
  });

  return Array.from(map.values())
    .map((item) => ({ ...item, totalSpent: formatMoney(item.totalSpent) }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);
};

const getPreviousPeriodSales = async ({ start, end, eventId } = {}) => {
  if (!start || !end) return { total: 0, count: 0, average: 0 };
  const startDate = new Date(start);
  const endDate = new Date(end);
  const duration = endDate.getTime() - startDate.getTime();
  if (duration <= 0) return { total: 0, count: 0, average: 0 };
  const previousEnd = new Date(startDate);
  const previousStart = new Date(startDate.getTime() - duration);
  return getSales({ start: previousStart.toISOString(), end: previousEnd.toISOString(), eventId });
};

const getPeakHour = (flow) => {
  return flow.reduce((best, item) => {
    const score = item.entries + item.exits;
    return score > best.score ? { hour: item.hour, score } : best;
  }, { hour: null, score: 0 });
};

const getInsights = ({ sales, previousSales, topProducts, topClients, flow, eventComparison }) => {
  const topProduct = topProducts[0] || null;
  const topClient = topClients[0] || null;
  const topEvent = eventComparison.sort((a, b) => b.total - a.total)[0] || null;
  const peakHour = getPeakHour(flow);
  const growth = previousSales.total
    ? Number((((sales.total - previousSales.total) / previousSales.total) * 100).toFixed(1))
    : null;

  return [
    topEvent ? `Evento com maior faturamento: ${topEvent.name}, com R$ ${topEvent.total.toFixed(2)}.` : 'Ainda nao ha eventos com faturamento fechado.',
    peakHour.hour !== null ? `Horario de pico operacional: ${String(peakHour.hour).padStart(2, '0')}:00.` : 'Sem volume suficiente para identificar horario de pico.',
    topProduct ? `Produto mais vendido: ${topProduct.nome}, com ${topProduct.quantidade} unidade(s).` : 'Nenhum produto vendido no periodo selecionado.',
    topClient ? `Cliente com maior consumo: ${topClient.clienteNome}, com R$ ${topClient.totalSpent.toFixed(2)}.` : 'Nenhum cliente recorrente identificado no periodo.',
    growth === null ? 'Crescimento nao calculado por falta de periodo anterior comparavel.' : `Crescimento contra periodo anterior: ${growth}%.`
  ];
};

const getCompleteReport = async ({ start, end, category, eventId } = {}) => {
  const [sales, previousSales, topProducts, revenueByPeriod, categoryConsumption, recurrentClients, flow, eventComparison, topClients] = await Promise.all([
    getSales({ start, end, eventId }),
    getPreviousPeriodSales({ start, end, eventId }),
    getTopProducts({ start, end, category, eventId, take: 20 }),
    getRevenueByPeriod({ start, end, eventId }),
    getCategoryConsumption({ start, end, eventId }),
    getRecurrentClients({ start, end, eventId }),
    getFlowByHour({ start, end, eventId }),
    getEventComparison(),
    getTopClients({ start, end, eventId })
  ]);

  const [clientsCount, braceletsIssued, braceletsActive, stockSummary] = await Promise.all([
    prisma.client.count(),
    prisma.bracelet.count(),
    prisma.bracelet.count({ where: { status: 'em_uso' } }),
    prisma.produto.findMany({ where: { ativo: true }, orderBy: { estoque: 'asc' }, take: 10 })
  ]);

  const executive = {
    receitaTotal: sales.total,
    quantidadeClientes: clientsCount,
    pulseirasEmitidas: braceletsIssued,
    pulseirasAtivas: braceletsActive,
    comandasFechadas: sales.count,
    ticketMedio: sales.average,
    lucroEstimado: formatMoney(sales.total * PROFIT_MARGIN),
    crescimentoPercentual: previousSales.total
      ? Number((((sales.total - previousSales.total) / previousSales.total) * 100).toFixed(1))
      : null
  };

  const insights = getInsights({ sales, previousSales, topProducts, topClients, flow, eventComparison });

  return {
    generatedAt: new Date().toISOString(),
    filters: { start, end, category, eventId },
    executive,
    sales,
    previousSales,
    topProducts,
    topClients,
    revenueByPeriod,
    categoryConsumption,
    recurrentClients,
    flow,
    eventComparison,
    lowStock: stockSummary.map((product) => ({
      id: product.id,
      nome: product.nome,
      categoria: product.categoria,
      estoque: product.estoque,
      preco: Number(product.preco || 0)
    })),
    insights
  };
};

module.exports = {
  getCategoryConsumption,
  getCompleteReport,
  getDashboard,
  getFlowByHour,
  getRevenueByPeriod,
  getSales,
  getTopClients,
  getTopProducts
};
