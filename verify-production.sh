#!/bin/bash
# Production Deployment Manifest
# Verify all production files are in place

echo "🔍 Verificando integridade dos arquivos de produção..."
echo ""

FILES=(
  # Dockerfiles
  "backend/Dockerfile"
  "frontend/Dockerfile"
  
  # Docker Compose files
  "docker-compose.yml"
  "docker-compose.prod.yml"
  "docker-compose.prod.complete.yml"
  ".dockerignore"
  
  # Configuration
  ".env.production"
  "nginx.conf"
  
  # Documentation
  "README.md"
  "DEPLOYMENT.md"
  "DEPLOYMENT_CHECKLIST.md"
  "TROUBLESHOOTING.md"
  "README_PRODUCTION.md"
  "QUICK_START_PRODUCTION.md"
  "PRODUCTION_DELIVERABLES.md"
  
  # Scripts
  "scripts/validate-prod.sh"
  "scripts/backup.sh"
  "scripts/restore.sh"
  "scripts/health-check.sh"
  "scripts/upgrade.sh"
  "scripts/rollback.sh"
  "scripts/README.md"
  "setup-prod.sh"
  
  # CI/CD
  ".github/workflows/test.yml"
  
  # Database migrations
  "backend/prisma/migrations/0_init/migration.sql"
)

FOUND=0
MISSING=0

echo "Verificando ${#FILES[@]} arquivos..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    SIZE=$(du -h "$file" | cut -f1)
    printf "✅ %-50s %8s\n" "$file" "$SIZE"
    ((FOUND++))
  else
    printf "❌ %-50s MISSING\n" "$file"
    ((MISSING++))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Resultado:"
echo "  ✅ Encontrados: $FOUND"
echo "  ❌ Faltando: $MISSING"

if [ $MISSING -eq 0 ]; then
  echo ""
  echo "🎉 Todos os arquivos de produção estão presentes!"
  echo ""
  echo "Próximos passos:"
  echo "  1. Ler: QUICK_START_PRODUCTION.md"
  echo "  2. Executar: ./scripts/validate-prod.sh"
  echo "  3. Configurar: .env (copiar de .env.production)"
  echo "  4. Deploy: docker-compose -f docker-compose.prod.yml up -d"
  exit 0
else
  echo ""
  echo "⚠️  Faltam arquivos. Execute o setup novamente."
  exit 1
fi
