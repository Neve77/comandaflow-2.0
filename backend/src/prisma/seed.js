const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const prisma = require('./client');

dotenv.config();

const run = async () => {
  // Limpar dados antigos
  await prisma.pedido.deleteMany();
  await prisma.comanda.deleteMany();
  await prisma.bracelet.deleteMany();
  await prisma.user.deleteMany();
  await prisma.produto.deleteMany();

  const password = await bcrypt.hash('Pass@1234', 10);

  await prisma.user.create({
    data: { email: 'admin@comanda.local', password, name: 'Administrador' }
  });

  // Produtos de teste
  const products = [
    { nome: 'Refrigerante 350ml', preco: 6.50, categoria: 'Bebidas', estoque: 20 },
    { nome: 'Cerveja 600ml', preco: 8.00, categoria: 'Bebidas', estoque: 15 },
    { nome: 'Suco Natural', preco: 7.00, categoria: 'Bebidas', estoque: 10 },
    { nome: 'Água Mineral', preco: 3.00, categoria: 'Bebidas', estoque: 30 },
    { nome: 'Pizza Calabresa G', preco: 45.00, categoria: 'Pizzas', estoque: 5 },
    { nome: 'Pizza Margherita G', preco: 42.00, categoria: 'Pizzas', estoque: 8 },
    { nome: 'Pizza Portuguesa G', preco: 48.00, categoria: 'Pizzas', estoque: 6 },
    { nome: 'Pizza Quatro Queijos G', preco: 46.00, categoria: 'Pizzas', estoque: 7 },
    { nome: 'Hambúrguer Artesanal', preco: 25.00, categoria: 'Lanches', estoque: 12 },
    { nome: 'Batata Frita', preco: 12.00, categoria: 'Acompanhamentos', estoque: 25 },
    { nome: 'Salada Caesar', preco: 18.00, categoria: 'Saladas', estoque: 9 },
    { nome: 'Sorvete', preco: 10.00, categoria: 'Sobremesas', estoque: 18 },
    { nome: 'Café Expresso', preco: 4.00, categoria: 'Bebidas', estoque: 40 },
    { nome: 'Cappuccino', preco: 8.00, categoria: 'Bebidas', estoque: 22 }
  ];

  for (const product of products) {
    try {
      await prisma.produto.create({ data: product });
    } catch (err) {
      // Ignorar se já existe
    }
  }

  // Pulseiras de teste
  const bracelets = ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010'];

  for (const number of bracelets) {
    try {
      await prisma.bracelet.create({ data: { number } });
    } catch (err) {
      // Ignorar se já existe
    }
  }

  console.log('✅ Seed concluído com sucesso');
  console.log('📦 14 produtos cadastrados');
  console.log('🏷️  10 pulseiras criadas');
  console.log('👤 Usuário admin@comanda.local / Pass@1234');
};

run()
  .catch((err) => {
    console.error('❌ Erro ao fazer seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
