const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/prisma/client');

describe('Pedido cancel', () => {
  let token;
  beforeAll(async () => {
    const res = await request(app).post('/auth/login').send({ email: 'admin@comanda.local', password: 'Pass@1234' });
    token = res.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('cancel pedido and update comanda total', async () => {
    const bracelet = `TEST-${Date.now()}`;
    const openRes = await request(app).post('/comandas/open').set('Authorization', `Bearer ${token}`).send({ number: bracelet, clienteNome: 'Cancel Test', clienteCpf: '12345678901', clienteTelefone: '11999999999' }).expect(201);
    const comandaId = openRes.body.comanda.id;

    const prod = await prisma.produto.findFirst();
    const pedidoRes = await request(app).post('/pedidos').set('Authorization', `Bearer ${token}`).send({ comandaId, produtoId: prod.id, nome: prod.nome, quantidade: '2', valorUnitario: prod.preco.toString() }).expect(201);

    const pedidoId = pedidoRes.body.pedido.id;

    const before = await prisma.comanda.findUnique({ where: { id: comandaId } });
    expect(Number(before.total)).toBeGreaterThan(0);

    await request(app).patch(`/pedidos/${pedidoId}/cancel`).set('Authorization', `Bearer ${token}`).send({ id: pedidoId }).expect(200);

    const after = await prisma.comanda.findUnique({ where: { id: comandaId } });
    expect(Number(after.total)).toBe(0);
  });
});
