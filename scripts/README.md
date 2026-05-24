# Production Scripts

Scripts auxiliares para gerenciamento da aplicação em produção.

## Disponíveis

### 🔍 validate-prod.sh
Valida toda a configuração pré-produção:
- Docker e Docker Compose instalados
- Arquivo `.env` configurado
- docker-compose.yml válido
- Build de imagens
- Inicialização de serviços
- Conexão com PostgreSQL
- Migrations
- Seed de dados
- Health checks
- Testes backend

**Uso:**
```bash
chmod +x scripts/validate-prod.sh
./scripts/validate-prod.sh
```

### 💾 backup.sh
Faz backup automático do banco de dados PostgreSQL.

**Uso:**
```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

**Features:**
- Backup automático com timestamp
- Mantém últimos 7 backups
- Mostra tamanho do arquivo

### 🏥 health-check.sh
Monitora saúde dos serviços em tempo real.

**Uso:**
```bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

**Verifica:**
- Status dos containers
- Saúde do PostgreSQL
- Health endpoint do backend
- Uso de recursos
- Erros recentes nos logs

### 📦 upgrade.sh
Atualiza a aplicação para versão mais recente.

**Uso:**
```bash
chmod +x scripts/upgrade.sh
./scripts/upgrade.sh
```

**Processo:**
1. Git pull (latest code)
2. Build de novas imagens
3. Inicialização de containers
4. Execução de migrations
5. Verificação de logs

### 🔙 rollback.sh
Reverte para versão anterior em caso de problemas.

**Uso:**
```bash
chmod +x scripts/rollback.sh
./scripts/rollback.sh
```

**Processo:**
1. Git stash (descarta mudanças locais)
2. Git revert (desfaz último commit)
3. Build e restart

### 🔄 restore.sh
Restaura banco de dados a partir de backup.

**Uso:**
```bash
chmod +x scripts/restore.sh

# Listar backups disponíveis
ls -lh ./backups/

# Restaurar de backup específico
./scripts/restore.sh backups/backup_20240101_120000.sql
```

**Segurança:**
- Pede confirmação antes de restaurar
- Suporta restauração sem downtime

## Setup Rápido

```bash
# 1. Tornar scripts executáveis
chmod +x scripts/*.sh

# 2. Validar configuração
./scripts/validate-prod.sh

# 3. Se OK, aplicação está pronta para produção
```

## Agendamento Automático (Cron)

### Backup diário às 02:00 AM
```bash
# Abrir crontab
crontab -e

# Adicionar linha
0 2 * * * cd /path/to/comanda-full && ./scripts/backup.sh >> /var/log/comanda-backup.log 2>&1
```

### Health check a cada 5 minutos
```bash
*/5 * * * * cd /path/to/comanda-full && ./scripts/health-check.sh >> /var/log/comanda-health.log 2>&1
```

## Troubleshooting

**Permissão negada ao executar script:**
```bash
chmod +x scripts/backup.sh
# ou
chmod 755 scripts/*.sh
```

**PostgreSQL não disponível:**
```bash
docker-compose exec postgres pg_isready -U $(grep DB_USER .env | cut -d= -f2)
```

**Variáveis de ambiente não carregadas:**
```bash
# Verificar .env
cat .env

# Source manualmente se necessário
source .env
./scripts/backup.sh
```

---

**Last Updated:** 2024
