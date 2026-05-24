# 🐛 Production Troubleshooting Guide

## Common Issues

### 1. Backend Container Exits Immediately

**Symptoms:** `docker-compose ps` shows backend in "Exited" state

**Check logs:**
```bash
docker-compose logs backend
```

**Common causes & solutions:**

#### Missing DATABASE_URL
```bash
# Verify .env exists
cat .env | grep DATABASE_URL

# Should output: DATABASE_URL=postgresql://...
```

#### Migrations failed
```bash
# Try manual migration
docker-compose exec backend npm run migrate:prod

# Check migration status
docker-compose exec backend npx prisma migrate status
```

#### Port already in use
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process or change PORT in .env
```

---

### 2. Frontend Cannot Reach Backend

**Symptoms:** Frontend shows network errors, API calls fail

**Check:**
```bash
# Verify VITE_API_URL
docker-compose logs frontend | grep API_URL

# Test backend is reachable
curl http://localhost:3000/health

# Check CORS headers
curl -H "Origin: http://localhost:5173" http://localhost:3000/health -v
```

**Solutions:**

1. Verify VITE_API_URL points to backend:
```env
VITE_API_URL=http://localhost:3000  # Development
VITE_API_URL=https://api.seu-dominio.com  # Production
```

2. Restart frontend:
```bash
docker-compose restart frontend
```

3. Check backend CORS config in `backend/src/app.js`

---

### 3. Database Connection Refused

**Symptoms:** "connect ECONNREFUSED" errors

**Check:**
```bash
# Verify postgres container running
docker-compose ps postgres

# Test connection
docker-compose exec postgres pg_isready -U comanda

# Check DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:password@host:port/dbname
```

**Solutions:**

1. Ensure postgres is healthy:
```bash
docker-compose up postgres
docker-compose logs postgres
```

2. Verify credentials in .env match docker-compose.yml environment

3. Wait for postgres to be ready (healthcheck):
```bash
docker-compose exec postgres pg_isready -U $DB_USER
# Returns "accepting connections" when ready
```

---

### 4. Out of Disk Space

**Symptoms:** Containers won't start, "no space left on device"

**Check:**
```bash
# Check disk usage
df -h

# Check Docker volumes size
docker system df

# Check specific volume
du -sh /var/lib/docker/volumes/
```

**Solutions:**

1. Clean old Docker images:
```bash
docker image prune -a
```

2. Clean old logs:
```bash
docker-compose logs --tail=0 backend
```

3. Backup and prune old data:
```bash
./scripts/backup.sh  # Backup first
docker system prune  # Then clean
```

---

### 5. Migrations Stuck or Failed

**Symptoms:** "Migration failed", endless migration process

**Check:**
```bash
# Check migration status
docker-compose exec backend npx prisma migrate status

# Check logs
docker-compose logs backend
```

**Solutions:**

1. Reset migrations (⚠️ WARNING: Deletes data):
```bash
# Only in development!
docker-compose exec backend npx prisma migrate reset

# Confirm data loss warning
```

2. Manually resolve migration:
```bash
# List migrations
docker-compose exec backend npx prisma migrate resolve --applied 0_init

# Then retry
docker-compose exec backend npm run migrate:prod
```

3. Check Prisma schema for syntax errors:
```bash
docker-compose exec backend npx prisma validate
```

---

### 6. High Memory/CPU Usage

**Symptoms:** Containers consuming excessive resources

**Check:**
```bash
# Real-time monitoring
docker stats

# Check specific container
docker stats backend

# Logs for errors/infinite loops
docker-compose logs backend | tail -100
```

**Solutions:**

1. Increase container resources in docker-compose.yml:
```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 1G
```

2. Restart container:
```bash
docker-compose restart backend
```

3. Rebuild without cache:
```bash
docker-compose build --no-cache backend
```

---

### 7. Socket.io Not Working

**Symptoms:** Real-time features not updating, "socket is undefined"

**Check:**
```bash
# Verify socket.io connections
docker-compose logs backend | grep -i "socket\|connection"

# Test socket endpoint
curl -i http://localhost:3000/socket.io/?EIO=4&transport=polling
```

**Solutions:**

1. Verify socket.io is enabled in backend/src/server.js

2. Check frontend connection URL:
```javascript
// In frontend socket configuration
const socket = io('http://localhost:3000');
// Should match backend PORT
```

3. Restart both frontend and backend:
```bash
docker-compose restart backend frontend
```

---

### 8. SSL/HTTPS Certificate Issues

**Symptoms:** "ERR_SSL_PROTOCOL_ERROR", certificate validation failures

**Check:**
```bash
# Test certificate
openssl s_client -connect seu-dominio.com:443

# Check expiration
echo | openssl s_client -servername seu-dominio.com -connect seu-dominio.com:443 2>/dev/null | openssl x509 -noout -dates
```

**Solutions:**

1. Renew certificate (Let's Encrypt):
```bash
docker-compose run --rm certbot certonly --standalone -d seu-dominio.com

# Update nginx.conf with new cert paths
```

2. Verify certificate paths in nginx.conf or app config

---

### 9. Backup/Restore Failed

**Symptoms:** Backup file empty, restore hangs

**Check:**
```bash
# Verify backup file
ls -lh backups/
file backups/backup_*.sql

# Test restore without actually restoring
docker-compose exec -T postgres pg_restore --verbose --list backups/backup_*.sql > /dev/null
```

**Solutions:**

1. Manual backup:
```bash
docker-compose exec postgres pg_dump -U $DB_USER $DB_NAME > manual_backup.sql

# Verify file size
ls -lh manual_backup.sql
# Should be > 1KB
```

2. Restore with error details:
```bash
docker-compose exec -T postgres psql -U $DB_USER $DB_NAME < backup.sql 2>&1 | head -50
```

---

### 10. Logs Not Persisting

**Symptoms:** `docker-compose logs` returns empty or limited output

**Solutions:**

1. Check log rotation in docker-compose.yml:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

2. View JSON logs directly:
```bash
docker inspect --format='{{.LogPath}}' comanda_backend_prod
cat /var/lib/docker/containers/*/comanda_backend_prod-json.log | jq .
```

---

## Quick Diagnostics

Run this to get system status:

```bash
#!/bin/bash
echo "=== Docker Containers ===" 
docker-compose ps

echo -e "\n=== Resource Usage ===" 
docker stats --no-stream

echo -e "\n=== Recent Errors ===" 
docker-compose logs --tail=50 | grep -i error

echo -e "\n=== Network ===" 
docker-compose exec backend curl http://postgres:5432 -v 2>&1 | head -3

echo -e "\n=== Database ===" 
docker-compose exec postgres pg_isready -U $DB_USER

echo -e "\n=== Health Check ===" 
curl http://localhost:3000/health 2>/dev/null | jq .
```

---

## Getting Help

1. **Check logs first:**
   ```bash
   docker-compose logs --tail=100
   docker-compose logs backend
   ```

2. **Restart all services:**
   ```bash
   docker-compose down
   docker-compose up -d
   docker-compose logs
   ```

3. **Still stuck?**
   - Search in documentation
   - Check GitHub issues
   - Create detailed bug report with:
     - Full error message
     - Docker version
     - Output of: `docker-compose config`
     - Recent logs: `docker-compose logs --tail=100`

---

**Last Updated:** 2024
