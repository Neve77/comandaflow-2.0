#!/bin/bash
# Backup database

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "🔄 Fazendo backup do banco de dados..."
docker-compose exec -T postgres pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
  echo "✅ Backup salvo em: $BACKUP_FILE"
  echo "📊 Tamanho: $(du -h $BACKUP_FILE | cut -f1)"
  
  # Keep only last 7 backups
  ls -t $BACKUP_DIR/backup_*.sql | tail -n +8 | xargs -r rm
  echo "🗑️  Limpeza: mantendo últimos 7 backups"
else
  echo "❌ Erro ao fazer backup"
  exit 1
fi
