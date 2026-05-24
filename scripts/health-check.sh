#!/bin/bash
# Monitor system health

echo "🔍 Status dos Containers:"
docker-compose ps

echo ""
echo "💾 PostgreSQL Health:"
docker-compose exec postgres pg_isready -U $DB_USER

echo ""
echo "🏥 Backend Health:"
curl -s http://localhost:3000/health | python3 -m json.tool || echo "Backend indisponível"

echo ""
echo "📊 Uso de Recursos:"
docker stats --no-stream

echo ""
echo "🔴 Erros recentes:"
docker-compose logs --tail=20 | grep -i "error" | head -5
