const { Prisma } = require('@prisma/client');
const prisma = require('../infra/prisma/client');
const clientsService = require('./clients.service');
const loyaltyService = require('./loyalty.service');

const openComanda = async ({ number, clienteNome, clienteCpf, clienteTelefone, clienteEmail, clienteNascimento, eventId, userId }) => {
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
    const error = new Error('Pulseira nao esta disponivel para abrir comanda');
    error.status = 400;
    throw error;
  }

  if (eventId) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      const error = new Error('Evento nao encontrado');
      error.status = 404;
      throw error;
    }
    if (event.status === 'cancelado' || event.status === 'encerrado') {
      const error = new Error('Evento nao aceita novas comandas');
      error.status = 400;
      throw error;
    }
  }

  return prisma.$transaction(async (tx) => {
    const client = await clientsService.upsertClientFromComanda(tx, {
      clienteNome,
      clienteCpf,
      clienteTelefone,
      clienteEmail,
      clienteNascimento
    });

    const comanda = await tx.comanda.create({
      data: {
        braceletId: bracelet.id,
        clientId: client?.id || null,
        eventId: eventId || null,
        total: new Prisma.Decimal(0),
        clienteNome,
        clienteCpf,
        clienteTelefone,
        clienteEmail: clienteEmail || '',
        clienteNascimento: clienteNascimento ? new Date(clienteNascimento) : null
      }
    });

    await tx.bracelet.update({ where: { id: bracelet.id }, data: { status: 'em_uso' } });
    if (eventId) {
      await tx.event.update({ where: { id: eventId }, data: { checkIns: { increment: 1 } } });
    }

    await tx.auditLog.create({
      data: {
        userId: userId || null,
        action: 'open',
        entity: 'Comanda',
        entityId: comanda.id,
        metadata: JSON.stringify({ bracelet: number, clienteCpf, eventId })
      }
    });

    return comanda;
  });
};

const closeComanda = async (id, userId) => {
  const comanda = await prisma.comanda.findUnique({ where: { id } });
  if (!comanda) {
    const error = new Error('Comanda nao encontrada');
    error.status = 404;
    throw error;
  }
  if (comanda.status !== 'aberta') {
    const error = new Error('Comanda ja esta fechada ou cancelada');
    error.status = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const total = await tx.pedido.aggregate({
      where: { comandaId: id, cancelado: false },
      _sum: { subtotal: true }
    });
    const totalValue = new Prisma.Decimal(total._sum.subtotal || 0);

    const closed = await tx.comanda.update({
      where: { id },
      data: {
        status: 'fechada',
        closedAt: new Date(),
        total: totalValue
      }
    });

    await tx.bracelet.update({ where: { id: comanda.braceletId }, data: { status: 'livre' } });

    if (Number(totalValue) > 0) {
      await tx.cashMovement.create({
        data: {
          type: 'entrada',
          amount: totalValue,
          description: `Venda comanda ${id.slice(0, 8)}`
        }
      });
    }

    await loyaltyService.applyRewardsForClosedComanda(tx, comanda, totalValue);

    await tx.auditLog.create({
      data: {
        userId: userId || null,
        action: 'close',
        entity: 'Comanda',
        entityId: id,
        metadata: JSON.stringify({ total: Number(totalValue) })
      }
    });

    return closed;
  });
};

const getComanda = async (id) => {
  const comanda = await prisma.comanda.findUnique({
    where: { id },
    include: {
      bracelet: { select: { id: true, number: true, status: true } },
      client: true,
      event: { select: { id: true, name: true, status: true } },
      pedidos: { where: { cancelado: false }, orderBy: { createdAt: 'desc' } }
    }
  });
  if (!comanda) {
    const error = new Error('Comanda nao encontrada');
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
          event: { select: { id: true, name: true } },
          pedidos: { where: { cancelado: false } }
        }
      }
    }
  });

  if (!bracelet) {
    const error = new Error('Pulseira nao cadastrada');
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
      client: true,
      event: { select: { id: true, name: true, status: true } },
      pedidos: { where: { cancelado: false } }
    }
  });
};

module.exports = { openComanda, closeComanda, getComanda, listOpenComandas, getHistoryByBraceletNumber };
