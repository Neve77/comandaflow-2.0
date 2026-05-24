# 🚀 Production Deployment Checklist

## Pre-Deployment (Before Going Live)

### Security
- [ ] Generate strong JWT_SECRET (32+ bytes)
- [ ] Generate strong DB_PASSWORD (20+ chars, mixed)
- [ ] Change default admin password
- [ ] Enable HTTPS (SSL/TLS certificate)
- [ ] Review CORS settings (whitelist specific domains)
- [ ] Set NODE_ENV=production
- [ ] Enable rate limiting in production rates
- [ ] Review helmet security headers
- [ ] Setup WAF (if using cloud provider)

### Database
- [ ] Verify PostgreSQL version (16+)
- [ ] Test database connection string
- [ ] Run all migrations successfully
- [ ] Verify seed data loaded
- [ ] Test backup/restore process
- [ ] Schedule automated backups (daily)
- [ ] Monitor disk space (PostgreSQL data partition)

### Application
- [ ] Run all tests (backend + frontend)
- [ ] Build frontend production bundle
- [ ] Verify no build warnings/errors
- [ ] Test API endpoints with production DATABASE_URL
- [ ] Verify socket.io working correctly
- [ ] Check API response times
- [ ] Test file uploads (if applicable)

### Infrastructure
- [ ] Firewall configured (only 80/443 open)
- [ ] DNS records pointing to server
- [ ] Server has adequate resources (CPU/Memory/Disk)
- [ ] Monitor disk space alerts configured
- [ ] Log rotation configured
- [ ] SSH key pair generated and secured
- [ ] Load balancer configured (if multi-server)

### Monitoring & Alerts
- [ ] Uptime monitoring configured
- [ ] Error logging configured (Sentry/etc)
- [ ] Performance monitoring configured
- [ ] Database monitoring configured
- [ ] Alert emails configured for:
  - [ ] Server down
  - [ ] High CPU/Memory
  - [ ] Database errors
  - [ ] Disk space low
- [ ] Log aggregation configured (if needed)

### Documentation
- [ ] Deploy procedure documented
- [ ] Rollback procedure documented
- [ ] Recovery procedure documented
- [ ] Team trained on procedures
- [ ] Incident response plan created
- [ ] Runbook created

## Deployment

### Pre-Deployment Steps
```bash
# 1. Test locally with production config
cp .env.production .env
# Edit .env with production values

# 2. Build Docker images
docker-compose build

# 3. Test startup
docker-compose up -d
docker-compose logs

# 4. Run health checks
curl http://localhost:3000/health
curl http://localhost:5173
```

### Deploy to Production
```bash
# 1. SSH to production server
ssh user@production-server

# 2. Pull latest code
cd /opt/comanda-full
git pull

# 3. Update environment
cp .env.production .env
# Edit .env with ACTUAL production secrets

# 4. Build and deploy
docker-compose build
docker-compose -f docker-compose.prod.yml up -d

# 5. Verify
docker-compose logs -f

# 6. Test endpoints
curl https://seu-dominio.com/health
```

## Post-Deployment

### Immediate (First 24 hours)
- [ ] Monitor logs closely
- [ ] Test all core workflows
- [ ] Verify database is persistent
- [ ] Check response times
- [ ] Test backup process
- [ ] Verify alerts are working
- [ ] Check API rate limits

### Short-term (First week)
- [ ] Monitor error rates
- [ ] Gather performance metrics
- [ ] Test failure scenarios
- [ ] User acceptance testing
- [ ] Load testing (if expected high traffic)

### Ongoing
- [ ] Daily backup verification
- [ ] Weekly security updates
- [ ] Monthly performance review
- [ ] Quarterly capacity planning
- [ ] Update documentation as needed

## Rollback Procedure

If issues occur in production:

```bash
# 1. Stop services
docker-compose down

# 2. Revert code
git revert HEAD --no-edit

# 3. Build and restart
docker-compose build
docker-compose up -d

# 4. Verify
docker-compose logs -f
```

## Emergency Recovery

Database corruption or critical data loss:

```bash
# 1. Stop application
docker-compose down

# 2. Restore from backup
./scripts/restore.sh backups/backup_YYYYMMDD_HHMMSS.sql

# 3. Verify data integrity
docker-compose exec postgres psql -U comanda -d comanda_db \
  -c "SELECT COUNT(*) FROM \"User\", \"Comanda\", \"Pedido\";"

# 4. Start application
docker-compose up -d
```

## Performance Tuning

### Database
```sql
-- Connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
SELECT pg_reload_conf();
```

### Application
- Increase rate limit thresholds if needed
- Enable caching headers for static assets
- Use CDN for static files
- Implement database connection pooling

### Monitoring Commands
```bash
# CPU/Memory usage
docker stats

# Database connections
docker-compose exec postgres psql -U comanda -d comanda_db \
  -c "SELECT count(*) FROM pg_stat_activity;"

# Slow queries
docker-compose exec postgres psql -U comanda -d comanda_db \
  -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

## Security Maintenance

### Weekly
- [ ] Review access logs for suspicious activity
- [ ] Check for failed login attempts
- [ ] Verify backups completed successfully

### Monthly
- [ ] Update dependencies (npm audit)
- [ ] Review user access/permissions
- [ ] Rotate secrets (if policy requires)
- [ ] Test disaster recovery

### Quarterly
- [ ] Security audit
- [ ] Penetration testing
- [ ] Review change logs
- [ ] Update documentation

---

**Last Updated:** 2024
**Maintained By:** DevOps Team
**Escalation Contact:** [contact info]
