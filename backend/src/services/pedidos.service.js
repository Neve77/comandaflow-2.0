const { Prisma } = require('@prisma/client');
const prisma = require('../prisma/client');

const createPedido = async ({ comandaId, produtoId, nome, quantidade, valorUnitario }) => {
  const comanda = await prisma.comanda.findUnique({ where: { id: comandaId } });
  if (!comanda) {
    const error = new Error('Comanda não encontrada');
    error.status = 404;
    throw error;
  }
  if (comanda.status !== 'aberta') {
    const error = new Error('Não é possível adicionar pedido em comanda fechada');
    error.status = 400;
    throw error;
  }

  const subtotal = new Prisma.Decimal(valorUnitario).mul(quantidade);
  return prisma.$transaction(async (tx) => {
    const pedido = await tx.pedido.create({
      data: {
        comandaId,
        produtoId,
        nome,
        quantidade,
        valorUnitario: new Prisma.Decimal(valorUnitario),
        subtotal,
        cancelado: false
      }
    });
    await tx.comanda.update({
      where: { id: comandaId },
      data: { total: { increment: subtotal } }
    });
    return pedido;
  });
};

const cancelPedido = async (id) => {
  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) {
    const error = new Error('Pedido não encontrado');
    error.status = 404;
    throw error;
  }
  if (pedido.cancelado) {
    const error = new Error('Pedido já foi cancelado');
    error.status = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const canceled = await tx.pedido.update({
      where: { id },
      data: { cancelado: true }
    });
    await tx.comanda.update({
      where: { id: pedido.comandaId },
      data: { total: { decrement: pedido.subtotal } }
    });
    return canceled;
  });
};

module.exports = { createPedido, cancelPedido };
