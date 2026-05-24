# ComandaFlow - Sistema de Gerenciamento de Comandas

Sistema completo para restaurantes gerenciarem comandas, pulseiras, pedidos e vendas com suporte a real-time, exportação de relatórios e controle de estoque.

## 🚀 Quick Start (Produção)

```bash
# Clone
git clone https://github.com/seu-repo/comanda-full.git
cd comanda-full

# Configure ambiente
cp .env.production .env
# EDITE .env com suas credenciais

# Deploy com Docker
docker-compose up -d

# Verificar
docker-compose ps
```

Acesse:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 📋 Funcionalidades

### Core
- ✅ Autenticação JWT com Bcrypt
- ✅ Gerenciamento de Pulseiras (status: livre/em_uso)
- ✅ Abertura/Fechamento de Comandas
- ✅ Adicionar/Remover Pedidos
- ✅ Cálculo automático de total
- ✅ Dados do cliente (Nome, CPF, Telefone)

### Avançado
- ✅ CRUD de Produtos com categorias e estoque
- ✅ Cancelamento de pedidos
- ✅ Visualização de comandas abertas
- ✅ Exportação (PDF, Excel, CSV)
- ✅ Relatórios por período e categoria
- ✅ Socket.io para atualizações real-time
- ✅ Rate limiting e CORS configurado
- ✅ Validação com Zod

## 🛠️ Stack

### Backend
- Node.js 20 + Express 4
- PostgreSQL 16 (Produção)
- Prisma 5 ORM
- JWT + Bcrypt
- Socket.io real-time
- Helmet + Rate-limit

### Frontend
- React 18 + Vite
- Tailwind CSS 3
- Axios + React Router v6
- Chart.js para gráficos
- jsPDF + XLSX para exportação
- Socket.io client

## 📦 Arquitetura

```
comanda-full/
├── backend/
│   ├── src/
│   │   ├── services/      # Business logic
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth, validation, errors
│   │   └── prisma/        # DB client, seed
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── test/              # Jest tests
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/         # Route pages
│   │   ├── components/    # Reusable components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API calls
│   │   └── utils/
│   └── Dockerfile
├── docker-compose.yml
└── DEPLOYMENT.md
```

## 🔐 Segurança em Produção

⚠️ **ANTES DE DEPLOY, EXECUTE:**

```bash
# 1. Gere novas credenciais
JWT_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 32)

# 2. Atualize .env
echo "JWT_SECRET=$JWT_SECRET" >> .env
echo "DB_PASSWORD=$DB_PASSWORD" >> .env

# 3. MUDE senha do admin padrão!
# Acesse backend após deploy e altere email/password
```

Checklist de segurança:
- [ ] JWT_SECRET alterado e complexo
- [ ] DB_PASSWORD alterado e complexo
- [ ] NODE_ENV=production
- [ ] HTTPS ativado (SSL/TLS)
- [ ] CORS configurado para domínios específicos
- [ ] Rate limits aumentados
- [ ] Backups diários ativados
- [ ] Logs centralizados
- [ ] Monitore erros (Sentry, etc)

## 📊 Testes

```bash
# Backend tests (E2E + Unit)
cd backend && npm test

# Frontend build
cd frontend && npm run build
```

Cobertura:
- ✅ Comanda workflow (open → pedido → close)
- ✅ Product CRUD
- ✅ Pedido cancellation
- ✅ Validation schemas

## 🚢 Deploy

### Docker Compose (recomendado para iniciar)
```bash
docker-compose up -d
```

### Kubernetes (escala)
Ver `k8s/` para manifests YAML

### AWS/GCP/Azure
- RDS para PostgreSQL
- Container registry para images
- Load balancer para HTTPS

Veja [DEPLOYMENT.md](./DEPLOYMENT.md) para guia completo.

## 🐛 Troubleshooting

**Porta já em uso:**
```bash
docker-compose down
# ou mudar porta em .env
```

**Backend não conecta ao banco:**
```bash
docker-compose logs postgres
docker-compose exec postgres psql -U comanda -d comanda_db
```

**Frontend erro CORS:**
- Verificar VITE_API_URL em .env
- Verificar FRONTEND_URL no backend

**Migrations falhando:**
```bash
docker-compose exec backend npm run migrate:prod
```

## 📝 Logs

```bash
# Ver todos
docker-compose logs

# Backend only
docker-compose logs backend -f

# Database only
docker-compose logs postgres -f
```

## 💾 Backup

```bash
# Backup manual
docker-compose exec postgres pg_dump -U comanda comanda_db > backup.sql

# Restaurar
docker-compose exec -T postgres psql -U comanda comanda_db < backup.sql
```

## 📞 Suporte

- Issues: [GitHub Issues](https://github.com/seu-repo/comanda-full/issues)
- Documentação: [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📄 Licença

MIT - Veja LICENSE

---

**Status:** ✅ Production Ready

Last updated: 2024
