#!/bin/bash
# Initialize production environment

set -e

echo "🚀 Iniciando setup de produção..."

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker não instalado. Instale em https://docker.com"
  exit 1
fi

# Copy .env template if not exists
if [ ! -f ".env" ]; then
  echo "📝 Criando .env a partir de .env.production..."
  cp .env.production .env
  echo "⚠️  Edite .env com suas variáveis secretas antes de continuar"
  exit 1
fi

# Build
echo "🔨 Building images..."
docker-compose build

# Start
echo "▶️  Iniciando containers..."
docker-compose up -d

# Wait for postgres
echo "⏳ Aguardando banco de dados..."
sleep 5

# Run migrations
echo "📊 Rodando migrations..."
docker-compose exec -T backend npm run migrate:prod

# Run seed
echo "🌱 Seeding dados iniciais..."
docker-compose exec -T backend npm run seed

echo "✅ Setup completo!"
echo ""
echo "Acessar:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000"
echo ""
echo "Credenciais padrão:"
echo "  Email:    admin@comanda.local"
echo "  Senha:    Pass@1234"
echo ""
echo "🔒 ALTERE a senha padrão antes de usar em produção!"
