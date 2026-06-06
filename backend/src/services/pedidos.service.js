const { Prisma } = require('@prisma/client');
const prisma = require('../infra/prisma/client');

const createPedido = async ({ comandaId, produtoId, nome, quantidade, valorUnitario }) => {
  const comanda = await prisma.comanda.findUnique({ where: { id: comandaId } });
  if (!comanda) {
    const error = new Error('Comanda nao encontrada');
    error.status = 404;
    throw error;
  }
  if (comanda.status !== 'aberta') {
    const error = new Error('Nao e possivel adicionar pedido em comanda fechada');
    error.status = 400;
    throw error;
  }

  let pedidoNome = nome;
  let unitPrice = valorUnitario;

  if (produtoId) {
    const product = await prisma.produto.findUnique({ where: { id: produtoId } });
    if (!product) {
      const error = new Error('Produto nao encontrado');
      error.status = 404;
      throw error;
    }
    if (!product.ativo) {
      const error = new Error('Produto inativo nao pode ser vendido');
      error.status = 400;
      throw error;
    }
    if (product.estoque < quantidade) {
      const error = new Error('Estoque insuficiente para este produto');
      error.status = 400;
      throw error;
    }

    pedidoNome = product.nome;
    unitPrice = product.preco;
  }

  const subtotal = new Prisma.Decimal(unitPrice).mul(quantidade);

  return prisma.$transaction(async (tx) => {
    if (produtoId) {
      const currentProduct = await tx.produto.findUnique({ where: { id: produtoId } });
      const stockUpdate = await tx.produto.updateMany({
        where: { id: produtoId, estoque: { gte: quantidade } },
        data: { estoque: { decrement: quantidade } }
      });

      if (stockUpdate.count !== 1) {
        const error = new Error('Estoque insuficiente para este produto');
        error.status = 400;
        throw error;
      }

      await tx.stockMovement.create({
        data: {
          produtoId,
          type: 'saida',
          quantity: quantidade,
          previousStock: currentProduct.estoque,
          newStock: currentProduct.estoque - quantidade,
          reason: 'Venda em comanda'
        }
      });
    }

    const pedido = await tx.pedido.create({
      data: {
        comandaId,
        produtoId,
        nome: pedidoNome,
        quantidade,
        valorUnitario: new Prisma.Decimal(unitPrice),
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
    const error = new Error('Pedido nao encontrado');
    error.status = 404;
    throw error;
  }
  if (pedido.cancelado) {
    const error = new Error('Pedido ja foi cancelado');
    error.status = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const canceled = await tx.pedido.update({
      where: { id },
      data: { cancelado: true }
    });

    if (pedido.produtoId) {
      const currentProduct = await tx.produto.findUnique({ where: { id: pedido.produtoId } });
      await tx.produto.update({
        where: { id: pedido.produtoId },
        data: { estoque: { increment: pedido.quantidade } }
      });
      await tx.stockMovement.create({
        data: {
          produtoId: pedido.produtoId,
          type: 'entrada',
          quantity: pedido.quantidade,
          previousStock: currentProduct.estoque,
          newStock: currentProduct.estoque + pedido.quantidade,
          reason: 'Cancelamento de pedido'
        }
      });
    }

    await tx.comanda.update({
      where: { id: pedido.comandaId },
      data: { total: { decrement: pedido.subtotal } }
    });

    return canceled;
  });
};

module.exports = { createPedido, cancelPedido };
