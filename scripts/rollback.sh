#!/bin/bash
# Rollback to previous version

echo "⚠️  Rollback para versão anterior"

# Stash any uncommitted changes
git stash

# Revert last commit
git revert --no-edit HEAD

# Rebuild and redeploy
docker-compose build
docker-compose up -d

echo "✅ Rollback concluído"
echo "Verifique os logs: docker-compose logs -f"
