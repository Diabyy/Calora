# Stage 1: Build frontend assets
FROM node:22-alpine AS frontend
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci || npm install

# Copy frontend source files
COPY resources ./resources
COPY public ./public
COPY vite.config.js tsconfig.json tailwind.config.js postcss.config.js ./

# Compile production assets into public/build
RUN npm run build

# Stage 2: Production PHP runtime with FrankenPHP (PHP 8.4)
FROM dunglas/frankenphp:1-php8.4-alpine AS runner

# Install PostgreSQL (Neon), bcmath, zip, and opcache
RUN install-php-extensions \
    pdo_pgsql \
    pgsql \
    bcmath \
    zip \
    opcache

WORKDIR /app

# Copy Composer binary from official image
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy custom configurations
COPY docker/Caddyfile /etc/frankenphp/Caddyfile
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY docker/Caddyfile /app/Caddyfile
COPY docker/php.ini $PHP_INI_DIR/conf.d/99-calora.ini

# Install composer dependencies without dev packages
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

# Copy full application files
COPY . .

# Copy compiled frontend assets from frontend stage
COPY --from=frontend /app/public/build ./public/build

# Complete composer autoloading
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev

# Create storage symlink
RUN php artisan storage:link --quiet || true

# Ensure storage and caddy directories exist and have proper permissions
RUN mkdir -p /data/caddy \
    /config/caddy \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache && \
    chmod -R 777 /data/caddy /config/caddy storage bootstrap/cache

ENV APP_ENV=production \
    APP_DEBUG=false \
    SERVER_NAME=":10000" \
    PORT=10000

EXPOSE 10000

ENTRYPOINT ["frankenphp", "run", "--config", "/etc/frankenphp/Caddyfile"]
