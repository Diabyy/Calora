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

# Stage 2: Production PHP runtime with Nginx + PHP-FPM (PHP 8.4)
FROM serversideup/php:8.4-fpm-nginx

ENV NGINX_WEB_ROOT=/var/www/html/public \
    NGINX_HTTP_PORT=10000 \
    PHP_OPCACHE_ENABLE=1 \
    AUTORUN_LARAVEL_STORAGE_LINK=true \
    APP_ENV=production \
    APP_DEBUG=false

WORKDIR /var/www/html

# Copy application files with proper web user permissions
COPY --chown=www-data:www-data . /var/www/html
COPY --chown=www-data:www-data --from=frontend /app/public/build /var/www/html/public/build

USER www-data
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev

USER root
EXPOSE 10000
