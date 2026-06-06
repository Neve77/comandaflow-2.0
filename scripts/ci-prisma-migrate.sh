#!/usr/bin/env bash
set -euo pipefail

# Ensure DATABASE_URL is set; default to file:./dev.db if not provided
: "${DATABASE_URL:=file:./dev.db}"
export DATABASE_URL

echo "Using DATABASE_URL=$DATABASE_URL"

# Run from repository root; ensure we run prisma in backend folder
cd "$(dirname "$0")/.."
cd backend

# Run prisma migrate deploy
npx prisma migrate deploy
