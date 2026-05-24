#!/bin/bash
# Upgrade to latest version

echo "📦 Upgrading to latest version..."

# Pull latest
git pull

# Build new images
docker-compose build

# Start
docker-compose up -d

# Run migrations
docker-compose exec -T backend npm run migrate:prod

echo "✅ Upgrade concluído"
echo "Verifique os logs: docker-compose logs -f backend"
