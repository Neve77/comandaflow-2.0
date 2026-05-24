#!/bin/bash
# Restore from backup

if [ -z "$1" ]; then
  echo "❌ Uso: ./restore.sh <arquivo-backup.sql>"
  echo "Backups disponíveis:"
  ls -lh ./backups/backup_*.sql | awk '{print $NF, "(" $5 ")"}'
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Arquivo não encontrado: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  Restaurando banco de dados de: $BACKUP_FILE"
echo "Tem certeza? (y/n)"
read -r response

if [ "$response" != "y" ]; then
  echo "Cancelado"
  exit 0
fi

echo "🔄 Restaurando..."
docker-compose exec -T postgres psql -U $DB_USER $DB_NAME < $BACKUP_FILE

if [ $? -eq 0 ]; then
  echo "✅ Restauração concluída"
else
  echo "❌ Erro na restauração"
  exit 1
fi
