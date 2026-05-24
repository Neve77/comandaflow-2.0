const prisma = require('../prisma/client');

const createBracelet = async (number) => {
  const existing = await prisma.bracelet.findUnique({ where: { number } });
  if (existing) {
    const error = new Error('Número de pulseira já existe');
    error.status = 409;
    throw error;
  }

  return prisma.bracelet.create({ data: { number } });
};

const listAll = async () => {
  return prisma.bracelet.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      comandas: {
        where: { status: 'aberta' },
        take: 1,
        include: {
          pedidos: true
        }
      }
    }
  });
};

const updateStatus = async (id, status) => {
  const bracelet = await prisma.bracelet.update({
    where: { id },
    data: { status }
  });
  return bracelet;
};

module.exports = { createBracelet, listAll, updateStatus };
