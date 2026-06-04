# ComandaFlow - Sistema de Gerenciamento de Comandas

![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-20-green)
![React](https://img.shields.io/badge/React-18-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)

Sistema completo para gerenciamento de comandas de restaurante com suporte a pulseiras numeradas, pedidos, produtos, relatórios e export em múltiplos formatos.

## 🎯 Funcionalidades

### Core
- ✅ Autenticação JWT com Bcrypt
- ✅ Gerenciamento de pulseiras com status (livre/em_uso)
- ✅ Abertura/fechamento de comandas
- ✅ Dados do cliente integrados (nome, CPF, telefone)
- ✅ Pedidos com cálculo automático de total
- ✅ Cancelamento de pedidos

### Avançado
- ✅ CRUD completo de produtos com categorias e estoque
- ✅ Visualização de comandas abertas em tempo real
- ✅ Exportação de relatórios (PDF, Excel, CSV)
- ✅ Filtros por período e categoria
- ✅ Socket.io para atualizações real-time
- ✅ Rate limiting e CORS configurado
- ✅ Validação com Zod

## 🚀 Quick Start (Desenvolvimento)

### Pré-requisitos
- Node.js 20+
- PostgreSQL 16 (ou Docker)

### Instalação Local

```bash
# 1. Clone o repositório
git clone https://github.com/seu-repo/comanda-full.git
cd comanda-full

# 2. Setup Backend
cd backend
npm install
cp .env.example .env
# Edite .env com suas credenciais locais

# 3. Setup Database
npx prisma generate
npx prisma db push
npm run seed

# 4. Start Backend
npm run dev  # roda em http://localhost:3000

# 5. Em outro terminal, setup Frontend
cd ../frontend
npm install
npm run dev  # roda em http://localhost:5173
```

### Electron Desktop App

```bash
# Instalar dependências em todos os pacotes
npm run install:all

# Executar em modo de desenvolvimento com backend + frontend + Electron
npm run electron:dev

# Gerar o build do frontend e empacotar para Windows
npm run build:app
```

### Com Docker Compose (Recomendado)

```bash
# 1. Configure ambiente
cp .env.production .env

# 2. Start tudo
docker-compose up -d

# 3. Acesse
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

## 📦 Stack Tecnológico

### Backend
| Tecnologia | Versão | Propósito |
|-----------|--------|---------|
| Node.js | 20 | Runtime |
| Express | 4.18 | Framework Web |
| Prisma | 5.15 | ORM |
| PostgreSQL | 16 | Database (Produção) |
| SQLite | - | Database (Desenvolvimento) |
| JWT | 9.0 | Autenticação |
| Bcrypt | 5.1 | Hash de Senha |
| Socket.io | 4.8 | Real-time |
| Zod | 3.23 | Validação |
| Helmet | 7.0 | Segurança |

### Frontend
| Tecnologia | Versão | Propósito |
|-----------|--------|---------|
| React | 18.3 | UI Framework |
| Vite | 5.4 | Build Tool |
| Tailwind CSS | 3.4 | Styling |
| React Router | 6.14 | Roteamento |
| Axios | 1.7 | HTTP Client |
| Socket.io | 4.8 | Real-time |
| Chart.js | 4.5 | Gráficos |
| jsPDF | 4.2 | Export PDF |
| XLSX | 0.18 | Export Excel |

## 📚 Documentação

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guia completo de deployment
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Checklist pré-produção
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Guia de troubleshooting
- **[scripts/README.md](./scripts/README.md)** - Documentação dos scripts

## 🚢 Deploy

### Docker Compose (Recomendado)

```bash
# 1. Prepare
cp .env.production .env
# Edit .env with production values

# 2. Build and Deploy
docker-compose build
docker-compose -f docker-compose.prod.yml up -d

# 3. Verify
docker-compose logs -f
curl http://localhost:3000/health
```

### Validação Pré-Produção

```bash
chmod +x scripts/validate-prod.sh
./scripts/validate-prod.sh
```

## 🔐 Segurança

⚠️ **ANTES DE PRODUÇÃO:**

- [ ] Generate JWT_SECRET complexo (32+ bytes)
- [ ] Change DB_PASSWORD (20+ chars)
- [ ] Change admin password (admin@comanda.local / Pass@1234)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS whitelist
- [ ] Set NODE_ENV=production

Veja [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) para checklist completo.

## 📊 Dados Padrão

- **Usuário:** admin@comanda.local / Pass@1234
- **Produtos:** 14 produtos em 7 categorias
- **Pulseiras:** 001-010 (todas livres)

## 🧪 Testes

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm run build
```

## 💾 Backups

```bash
# Manual backup
./scripts/backup.sh

# Restore from backup
./scripts/restore.sh backups/backup_20240101_120000.sql

# Health check
./scripts/health-check.sh
```

## 🔄 Updates & Rollback

```bash
# Update to latest
./scripts/upgrade.sh

# Rollback to previous version
./scripts/rollback.sh
```

## 🐛 Troubleshooting

- **Database connection error:** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#3-database-connection-refused)
- **Frontend can't reach backend:** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#2-frontend-cannot-reach-backend)
- **Port already in use:** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#1-backend-container-exits-immediately)

Full guide: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## 📄 Licença

MIT - veja LICENSE
