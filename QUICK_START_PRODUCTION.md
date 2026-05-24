# 🚀 Production Quick Start Guide

## File Overview

```
comanda-full/
├── 📦 Docker & Compose
│   ├── backend/Dockerfile                    # Node.js production image
│   ├── frontend/Dockerfile                   # Vite build + serve
│   ├── docker-compose.yml                    # Development setup
│   ├── docker-compose.prod.yml               # Production optimized
│   ├── docker-compose.prod.complete.yml      # + Nginx
│   ├── .dockerignore                         # Docker build exclusions
│   └── nginx.conf                            # Reverse proxy config
│
├── 🔧 Configuration
│   └── .env.production                       # Production env template
│
├── 📚 Documentation
│   ├── README.md                             # Updated with production info
│   ├── DEPLOYMENT.md                         # Complete deployment guide
│   ├── DEPLOYMENT_CHECKLIST.md               # Pre-launch checklist
│   ├── TROUBLESHOOTING.md                    # Common issues & fixes
│   └── README_PRODUCTION.md                  # Production-specific guide
│
├── 🛠️ Scripts
│   ├── scripts/validate-prod.sh              # Pre-deployment validation
│   ├── scripts/backup.sh                     # Database backup
│   ├── scripts/restore.sh                    # Database restore
│   ├── scripts/health-check.sh               # System monitoring
│   ├── scripts/upgrade.sh                    # Deploy updates
│   ├── scripts/rollback.sh                   # Emergency rollback
│   ├── scripts/README.md                     # Scripts documentation
│   └── setup-prod.sh                         # Initial setup helper
│
├── 🔄 CI/CD
│   └── .github/workflows/test.yml            # GitHub Actions pipeline
│
├── 📦 Backend Updates
│   ├── prisma/migrations/0_init/migration.sql
│   ├── package.json (new scripts)            # migrate:prod, setup:prod
│   └── src/app.js (health endpoint)          # /health for monitoring
│
└── ✅ Production Ready
    └── All components tested and documented
```

## 3-Minute Production Setup

### Step 1: Prepare Environment (1 min)
```bash
cd /opt/comanda-full  # or your deployment path

# Copy and edit config
cp .env.production .env

# Edit .env with production values
nano .env
# Set: JWT_SECRET, DB_PASSWORD, FRONTEND_URL, VITE_API_URL
```

### Step 2: Validate (1 min)
```bash
chmod +x scripts/validate-prod.sh
./scripts/validate-prod.sh
# ✅ If all green, continue to step 3
```

### Step 3: Deploy (1 min)
```bash
# Build images
docker-compose build

# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Verify running
docker-compose ps
```

**Done!** Application is running with:
- ✅ PostgreSQL persistent database
- ✅ Node.js backend on port 3000
- ✅ React frontend on port 5173
- ✅ Auto-migrations and seed
- ✅ Health checks configured

## 5 Essential Commands

```bash
# 1. Check status
docker-compose ps

# 2. View logs (real-time)
docker-compose logs -f backend

# 3. Backup database
./scripts/backup.sh

# 4. Restore from backup
./scripts/restore.sh backups/backup_20240101_120000.sql

# 5. Monitoring (CPU/Memory/Network)
./scripts/health-check.sh
```

## Pre-Production Checklist

- [ ] Secrets configured (JWT_SECRET, DB_PASSWORD)
- [ ] Admin password changed (not Pass@1234)
- [ ] HTTPS/SSL certificate ready
- [ ] DNS pointing to server
- [ ] Backups automated in cron
- [ ] Monitoring setup (uptime, errors)
- [ ] Rate limits appropriate for load
- [ ] CORS whitelist configured

See [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md) for complete checklist.

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 5432 in use | Change `DB_PORT` in .env |
| Backend exits | Check: `docker-compose logs backend` |
| Frontend can't reach API | Verify `VITE_API_URL` in .env |
| Database not persisting | Check volume: `docker volume ls` |
| Out of disk | Run: `docker system prune` |

See [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) for more.

## Upgrade Path

```bash
# 1. Get latest code
git pull

# 2. Auto-deploy with migrations
./scripts/upgrade.sh

# 3. If issues, rollback
./scripts/rollback.sh
```

## Backup Strategy

```bash
# Manual backup (anytime)
./scripts/backup.sh

# Automated daily at 2 AM (add to crontab)
0 2 * * * cd /opt/comanda-full && ./scripts/backup.sh

# Restore if needed
./scripts/restore.sh backups/backup_20240101_020000.sql
```

## Production URLs

| Component | URL |
|-----------|-----|
| Frontend | http://localhost:5173 (or https://your-domain.com) |
| Backend API | http://localhost:3000 (or https://api.your-domain.com) |
| Health Check | http://localhost:3000/health |
| Database | localhost:5432 (internal only) |

## Performance Tips

1. **Database**: Connection pooling configured in docker-compose
2. **Frontend**: Vite build optimized with chunk splitting
3. **Backend**: Rate limiting 100 requests/15min (configurable)
4. **Caching**: Static assets cached for 30 days
5. **Logging**: JSON file with 10MB rotation

## Next: SSL/HTTPS

```bash
# Using Let's Encrypt (requires domain)
docker-compose run --rm certbot certonly --standalone -d your-domain.com

# Copy certificates
cp /etc/letsencrypt/live/your-domain.com/*.pem ./certs/

# Update nginx.conf with cert paths
# Uncomment HTTPS section in nginx.conf
```

## Production Monitoring

Monitor these metrics:
```bash
# Real-time
docker stats

# Database connections
docker-compose exec postgres psql -U $DB_USER -d $DB_NAME -c "SELECT count(*) FROM pg_stat_activity;"

# Disk usage
du -sh /var/lib/docker/volumes/

# Check errors
docker-compose logs --tail=100 | grep -i error
```

## Getting Help

1. **Error occurs**: Check logs → `docker-compose logs -f`
2. **Not sure**: See [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
3. **Need guidance**: See [DEPLOYMENT.md](../DEPLOYMENT.md)
4. **Lost data**: Restore backup → `./scripts/restore.sh backup.sql`

---

**Remember:** 
- ✅ Backup before major changes
- ✅ Test upgrades in staging first
- ✅ Monitor system regularly
- ✅ Update dependencies monthly

**Status:** ✅ Production Ready
**Deployment Time:** ~5 minutes (after secrets setup)
