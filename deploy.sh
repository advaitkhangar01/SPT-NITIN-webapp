#!/bin/bash
set -e

# ==============================================================================
# SPT Quotation & Invoice Maker - Safe Production VPS Deployment Script
# ==============================================================================

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

echo "=== [1/6] Backing up live SQLite database ==="
mkdir -p "$APP_DIR/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$APP_DIR/backups/dev_backup_${TIMESTAMP}.db"

if [ -f "$APP_DIR/prisma/dev.db" ]; then
    # Use sqlite3 .backup for an atomic, lock-free snapshot of SQLite WAL database
    if command -v sqlite3 >/dev/null 2>&1; then
        sqlite3 "$APP_DIR/prisma/dev.db" ".backup '$BACKUP_FILE'"
    else
        cp "$APP_DIR/prisma/dev.db" "$BACKUP_FILE"
    fi
    echo "✔ Live database safely backed up to: $BACKUP_FILE"
    # Keep last 30 backups, remove older
    ls -tp "$APP_DIR/backups"/dev_backup_*.db 2>/dev/null | tail -n +31 | xargs -I {} rm -- {} 2>/dev/null || true
else
    echo "ℹ No existing prisma/dev.db found to back up. A new database will be initialized."
fi

echo "=== [2/6] Pulling latest changes from git ==="
git pull origin main

echo "=== [3/6] Installing dependencies ==="
npm install

echo "=== [4/6] Synchronizing database schema ==="
npx prisma generate
npx prisma db push --skip-generate

echo "=== [5/6] Building production Next.js application ==="
npx next build

echo "=== [6/6] Ensuring proper permissions & reloading PM2 ==="
# Ensure prisma directory and database are writable by the current user
chmod -R u+rw "$APP_DIR/prisma"

# Reload PM2 process seamlessly with updated environment
if command -v pm2 >/dev/null 2>&1; then
    pm2 reload ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs
    echo "✔ PM2 process reloaded successfully!"
else
    echo "⚠ PM2 is not installed globally. Restart the service manually if needed."
fi

echo "=============================================================================="
echo "✔ Deployment completed successfully! Live data preserved and backup secured."
echo "=============================================================================="
