const { Prisma } = require('@prisma/client');
const prisma = require('../prisma/client');

const listClients = async () => {
  const comandas = await prisma.comanda.findMany({
    where: { clienteCpf: { not: '' } },
    select: {
      clienteNome: true,
      clienteCpf: true,
      clienteTelefone: true,
      status: true,
      total: true,
      openedAt: true,
      closedAt: true
    }
  });

  const clientsMap = new Map();

  comandas.forEach((comanda) => {
    const cpf = comanda.clienteCpf;
    if (!clientsMap.has(cpf)) {
      clientsMap.set(cpf, {
        clienteNome: comanda.clienteNome,
        clienteCpf: cpf,
        clienteTelefone: comanda.clienteTelefone,
        totalSpent: 0,
        visits: 0,
        openComandas: 0,
        lastVisit: comanda.closedAt || comanda.openedAt
      });
    }

    const client = clientsMap.get(cpf);
    client.visits += 1;

    if (comanda.status === 'fechada') {
      client.totalSpent += Number(comanda.total || 0);
    }

    if (comanda.status === 'aberta') {
      client.openComandas += 1;
    }

    const visitDate = comanda.closedAt || comanda.openedAt;
    if (visitDate > client.lastVisit) {
      client.lastVisit = visitDate;
    }
  });

  return Array.from(clientsMap.values()).sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
};

const getClientHistory = async (clienteCpf) => {
  const comandas = await prisma.comanda.findMany({
    where: { clienteCpf },
    orderBy: { openedAt: 'desc' },
    include: {
      bracelet: { select: { number: true } },
      pedidos: {
        where: { cancelado: false },
        select: {
          nome: true,
          quantidade: true,
          valorUnitario: true,
          subtotal: true
        }
      }
    }
  });

  if (!comandas.length) {
    const error = new Error('Cliente não encontrado ou sem histórico de consumo');
    error.status = 404;
    throw error;
  }

  const clienteNome = comandas[0].clienteNome;
  const clienteTelefone = comandas[0].clienteTelefone;
  const totalSpent = comandas.reduce((sum, comanda) => sum + Number(comanda.total || 0), 0);

  return {
    clienteNome,
    clienteCpf,
    clienteTelefone,
    totalSpent,
    visits: comandas.length,
    comandas: comandas.map((comanda) => ({
      id: comanda.id,
      status: comanda.status,
      openedAt: comanda.openedAt,
      closedAt: comanda.closedAt,
      total: Number(comanda.total || 0),
      braceletNumber: comanda.bracelet?.number || '',
      pedidos: comanda.pedidos.map((pedido) => ({
        nome: pedido.nome,
        quantidade: pedido.quantidade,
        subtotal: Number(pedido.subtotal)
      }))
    }))
  };
};

module.exports = { listClients, getClientHistory };