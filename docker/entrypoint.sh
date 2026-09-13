#!/bin/sh

echo "=== Starting Calora in Production ==="

# Ensure storage directories exist without failing if running as non-root
mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache 2>/dev/null || true
chmod -R 777 storage bootstrap/cache 2>/dev/null || true

# Create storage symlink
php artisan storage:link --quiet || true

# Handle database setup
if [ -n "$DB_HOST" ] || [ -n "$DB_URL" ] || [ -n "$DATABASE_URL" ]; then
    echo "PostgreSQL database detected. Running migrations..."
    php artisan migrate --force || true
elif [ "${DB_CONNECTION:-sqlite}" = "sqlite" ]; then
    echo "SQLite detected. Ensuring database file exists..."
    touch database/database.sqlite 2>/dev/null || true
    chmod 666 database/database.sqlite 2>/dev/null || true
    php artisan migrate --force || true
fi

# Optimize Laravel route and view caches
echo "Optimizing route and view cache..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "Calora setup complete. Launching application..."

if [ $# -gt 0 ] && [ -n "$1" ]; then
    exec "$@"
else
    exec frankenphp run --config /etc/caddy/Caddyfile
fi
