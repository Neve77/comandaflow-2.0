# ComandaFlow - Guia de Produção

## Deployment com Docker

### Pré-requisitos
- Docker 20.10+
- Docker Compose 2.0+
- Git

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
# Database
DB_USER=comanda_prod
DB_PASSWORD=sua_senha_muito_segura_aqui
DB_NAME=comanda_prod_db
DB_PORT=5432

# Backend
NODE_ENV=production
PORT=3000
JWT_SECRET=sua_chave_secreta_muito_segura_aqui_mude_em_producao
DATABASE_URL=postgresql://comanda_prod:sua_senha_muito_segura_aqui@postgres:5432/comanda_prod_db

# Frontend
VITE_API_URL=https://api.seu-dominio.com
VITE_FRONTEND_URL=https://seu-dominio.com
```

### Build e Deploy Local

```bash
# Construir imagens
docker-compose build

# Iniciar serviços (backend, frontend, postgres)
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Limpar tudo (incluindo volumes de dados)
docker-compose down -v
```

### Verificar Status

```bash
# Listar containers
docker-compose ps

# Acessar shell do backend
docker-compose exec backend sh

# Acessar shell do database
docker-compose exec postgres psql -U comanda_prod -d comanda_prod_db
```

### Dados de Produção

Os dados do PostgreSQL são persistidos em um volume chamado `postgres_data`. Fazer backup:

```bash
# Backup do banco
docker-compose exec postgres pg_dump -U comanda_prod comanda_prod_db > backup.sql

# Restaurar
docker-compose exec -T postgres psql -U comanda_prod comanda_prod_db < backup.sql
```

### Upgrade/Rollback

```bash
# Atualizar código e redeploy
git pull
docker-compose build
docker-compose up -d

# Rollback (voltar para versão anterior)
git revert HEAD
docker-compose build
docker-compose up -d
```

### Monitoramento

Adicionar scripts cron para backup automático:

```bash
# Adicionar ao crontab (backup diário)
0 2 * * * cd /path/to/comanda-full && docker-compose exec -T postgres pg_dump -U comanda_prod comanda_prod_db > backups/backup_$(date +\%Y\%m\%d).sql
```

### Troubleshooting

**Porta 5432 já está em uso:**
```bash
docker-compose down
# ou mudar DB_PORT em .env para 5433 (por exemplo)
```

**Erro de conexão ao banco:**
```bash
docker-compose logs postgres
docker-compose exec postgres psql -U comanda_prod -d comanda_prod_db
```

**Frontend não consegue conectar ao backend:**
- Verificar `VITE_API_URL` em `.env`
- Verificar se backend está rodando: `docker-compose logs backend`
- Verificar CORS no backend

---

## Deploy em Produção (AWS/GCP/DigitalOcean)

### Option 1: Docker Compose no VPS

1. SSH no servidor
2. Instalar Docker + Docker Compose
3. `git clone` do repositório
4. Copiar `.env.production` para `.env` e ajustar valores
5. `docker-compose up -d`

### Option 2: Kubernetes (Recomendado para escala)

Criar arquivos em `k8s/`:
- `postgres.yaml` - StatefulSet para database
- `backend.yaml` - Deployment para backend
- `frontend.yaml` - Deployment para frontend
- `service.yaml` - Serviços e ingress

```bash
kubectl apply -f k8s/
```

### Option 3: AWS ECS

Use AWS ECS com:
- RDS para PostgreSQL
- ECR para Docker images
- Application Load Balancer

---

## Performance e Segurança

- [ ] Usar HTTPS (Let's Encrypt via Nginx)
- [ ] Configurar WAF (firewall)
- [ ] Habilitar CORS seletivamente
- [ ] Rate limiting aumentado em produção
- [ ] Logs centralizados (CloudWatch, Datadog, etc)
- [ ] Monitoramento de uptime
- [ ] Backups automáticos diários
- [ ] Rotação de JWT_SECRET periodicamente

---

## Suporte

Para dúvidas ou problemas, abra uma issue no repositório.
