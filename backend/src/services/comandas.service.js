const { Prisma } = require('@prisma/client');
const prisma = require('../prisma/client');

const openComanda = async ({ number, clienteNome, clienteCpf, clienteTelefone }) => {
  let bracelet = await prisma.bracelet.findUnique({ where: { number } });
  if (!bracelet) {
    bracelet = await prisma.bracelet.create({
      data: {
        number,
        status: 'livre'
      }
    });
  }
  if (bracelet.status !== 'livre') {
    const error = new Error('Pulseira não está disponível para abrir comanda');
    error.status = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const comanda = await tx.comanda.create({
      data: {
        braceletId: bracelet.id,
        total: new Prisma.Decimal(0),
        clienteNome,
        clienteCpf,
        clienteTelefone
      } 
    });
    await tx.bracelet.update({ where: { id: bracelet.id }, data: { status: 'em_uso' } });
    return comanda;
  });
};

const closeComanda = async (id) => {
  const comanda = await prisma.comanda.findUnique({ where: { id } });
  if (!comanda) {
    const error = new Error('Comanda não encontrada');
    error.status = 404;
    throw error;
  }
  if (comanda.status !== 'aberta') {
    const error = new Error('Comanda já está fechada ou cancelada');
    error.status = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const total = await tx.pedido.aggregate({
      where: { comandaId: id, cancelado: false },
      _sum: { subtotal: true }
    });
    const closed = await tx.comanda.update({
      where: { id },
      data: {
        status: 'fechada',
        closedAt: new Date(),
        total: new Prisma.Decimal(total._sum.subtotal || 0)
      }
    });
    await tx.bracelet.update({ where: { id: comanda.braceletId }, data: { status: 'livre' } });
    return closed;
  });
};

const getComanda = async (id) => {
  const comanda = await prisma.comanda.findUnique({
    where: { id },
    include: {
      bracelet: { select: { id: true, number: true, status: true } },
      pedidos: { where: { cancelado: false }, orderBy: { createdAt: 'desc' } }
    }
  });
  if (!comanda) {
    const error = new Error('Comanda não encontrada');
    error.status = 404;
    throw error;
  }
  return comanda;
};

const getHistoryByBraceletNumber = async (number) => {
  const bracelet = await prisma.bracelet.findUnique({
    where: { number },
    include: {
      comandas: {
        orderBy: { openedAt: 'desc' },
        include: {
          pedidos: { where: { cancelado: false } }
        }
      }
    }
  });

  if (!bracelet) {
    const error = new Error('Pulseira não cadastrada');
    error.status = 404;
    throw error;
  }

  return bracelet;
};

const listOpenComandas = async () => {
  return prisma.comanda.findMany({
    where: { status: 'aberta' },
    orderBy: { openedAt: 'desc' },
    include: {
      bracelet: { select: { id: true, number: true, status: true } },
      pedidos: { where: { cancelado: false } }
    }
  });
};

module.exports = { openComanda, closeComanda, getComanda, listOpenComandas, getHistoryByBraceletNumber };
