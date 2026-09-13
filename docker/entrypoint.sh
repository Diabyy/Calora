#!/bin/sh
set -e

echo "=== Starting Calora in Production ==="

# Ensure storage directories exist with write permissions
mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs
chmod -R 777 storage bootstrap/cache

# Create storage symlink
php artisan storage:link --quiet || true

# Handle database setup
if [ -n "$DB_HOST" ] || [ -n "$DB_URL" ] || [ -n "$DATABASE_URL" ]; then
    echo "PostgreSQL database detected. Running migrations..."
    php artisan migrate --force || echo "Warning: Migration failed, continuing..."
elif [ "${DB_CONNECTION:-sqlite}" = "sqlite" ]; then
    echo "SQLite detected. Ensuring database file exists..."
    touch database/database.sqlite
    chmod 666 database/database.sqlite
    php artisan migrate --force || true
fi

# Optimize Laravel route and view caches
echo "Optimizing route and view cache..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "Calora setup complete. Launching application..."

if [ $# -gt 0 ] && [ -n "$1" ]; then
    exec "$@"
else
    exec frankenphp run --config /etc/caddy/Caddyfile
fi
