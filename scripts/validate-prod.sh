#!/bin/bash
# Pre-production validation script

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Validação Pré-Produção${NC}"
echo "================================"

# 1. Check Docker
echo -e "\n${YELLOW}1. Verificando Docker...${NC}"
if command -v docker &> /dev/null; then
  DOCKER_VERSION=$(docker --version)
  echo -e "${GREEN}✓${NC} $DOCKER_VERSION"
else
  echo -e "${RED}✗${NC} Docker não instalado"
  exit 1
fi

# 2. Check Docker Compose
echo -e "\n${YELLOW}2. Verificando Docker Compose...${NC}"
if command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE_VERSION=$(docker-compose --version)
  echo -e "${GREEN}✓${NC} $DOCKER_COMPOSE_VERSION"
else
  echo -e "${RED}✗${NC} Docker Compose não instalado"
  exit 1
fi

# 3. Check .env
echo -e "\n${YELLOW}3. Verificando .env...${NC}"
if [ -f ".env" ]; then
  echo -e "${GREEN}✓${NC} .env encontrado"
  
  # Check required variables
  for var in DB_USER DB_PASSWORD DB_NAME JWT_SECRET NODE_ENV; do
    if grep -q "^$var=" .env; then
      echo -e "${GREEN}  ✓${NC} $var configurado"
    else
      echo -e "${RED}  ✗${NC} $var não configurado"
    fi
  done
else
  echo -e "${RED}✗${NC} .env não encontrado"
  echo "Execute: cp .env.production .env"
  exit 1
fi

# 4. Check docker-compose.yml
echo -e "\n${YELLOW}4. Validando docker-compose.yml...${NC}"
if docker-compose config > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} docker-compose.yml válido"
else
  echo -e "${RED}✗${NC} docker-compose.yml inválido"
  docker-compose config
  exit 1
fi

# 5. Build images
echo -e "\n${YELLOW}5. Buildando imagens Docker...${NC}"
if docker-compose build > /tmp/docker-build.log 2>&1; then
  echo -e "${GREEN}✓${NC} Imagens buildadas com sucesso"
else
  echo -e "${RED}✗${NC} Erro ao buildar imagens"
  tail -20 /tmp/docker-build.log
  exit 1
fi

# 6. Start services
echo -e "\n${YELLOW}6. Iniciando serviços...${NC}"
if docker-compose up -d > /tmp/docker-up.log 2>&1; then
  echo -e "${GREEN}✓${NC} Serviços iniciados"
else
  echo -e "${RED}✗${NC} Erro ao iniciar serviços"
  cat /tmp/docker-up.log
  exit 1
fi

# 7. Wait for services
echo -e "\n${YELLOW}7. Aguardando serviços ficarem prontos...${NC}"
sleep 5

# 8. Check PostgreSQL
echo -e "\n${YELLOW}8. Verificando PostgreSQL...${NC}"
if docker-compose exec postgres pg_isready -U $(grep DB_USER .env | cut -d= -f2) > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} PostgreSQL respondendo"
else
  echo -e "${RED}✗${NC} PostgreSQL não respondendo"
  docker-compose logs postgres | tail -10
  exit 1
fi

# 9. Run migrations
echo -e "\n${YELLOW}9. Rodando migrations...${NC}"
if docker-compose exec -T backend npm run migrate:prod > /tmp/migrate.log 2>&1; then
  echo -e "${GREEN}✓${NC} Migrations concluídas"
else
  echo -e "${RED}✗${NC} Erro nas migrations"
  cat /tmp/migrate.log | tail -20
  exit 1
fi

# 10. Run seed
echo -e "\n${YELLOW}10. Seeding dados iniciais...${NC}"
if docker-compose exec -T backend npm run seed > /tmp/seed.log 2>&1; then
  echo -e "${GREEN}✓${NC} Seed concluído"
else
  echo -e "${RED}✗${NC} Erro no seed"
  cat /tmp/seed.log | tail -20
fi

# 11. Health checks
echo -e "\n${YELLOW}11. Health Checks...${NC}"

# Backend health
if curl -s http://localhost:3000/health | grep -q "ok"; then
  echo -e "${GREEN}✓${NC} Backend saudável"
else
  echo -e "${RED}✗${NC} Backend não respondendo"
  docker-compose logs backend | tail -10
fi

# Frontend check
if curl -s http://localhost:5173 | head -1 > /dev/null; then
  echo -e "${GREEN}✓${NC} Frontend acessível"
else
  echo -e "${RED}✗${NC} Frontend não respondendo"
  docker-compose logs frontend | tail -10
fi

# 12. Run backend tests
echo -e "\n${YELLOW}12. Rodando testes backend...${NC}"
if docker-compose exec -T backend npm test > /tmp/tests.log 2>&1; then
  PASSED=$(grep -o "passed" /tmp/tests.log | wc -l)
  echo -e "${GREEN}✓${NC} $PASSED testes passaram"
else
  echo -e "${YELLOW}⚠${NC} Alguns testes falharam (verificar logs)"
  cat /tmp/tests.log | grep -A 5 "FAIL"
fi

# 13. Final summary
echo -e "\n${GREEN}═══════════════════════════════════${NC}"
echo -e "${GREEN}✓ VALIDAÇÃO PRÉ-PRODUÇÃO CONCLUÍDA${NC}"
echo -e "${GREEN}═══════════════════════════════════${NC}"

echo ""
echo "Próximos passos:"
echo "1. Verificar logs: docker-compose logs"
echo "2. Testar aplicação: http://localhost:5173"
echo "3. Testar API: curl http://localhost:3000/health"
echo "4. Se OK, fazer deploy em produção"
echo ""
echo "Para parar: docker-compose down"
