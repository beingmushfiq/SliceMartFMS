ARG PHP_VERSION=8.3
FROM php:${PHP_VERSION}-fpm-alpine AS base

# Install system dependencies and PHP build essentials
RUN apk add --no-cache \
    curl \
    git \
    bash \
    icu-dev \
    libpq-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev \
    supervisor \
    linux-headers \
    $PHPIZE_DEPS

# Configure and install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        bcmath \
        pdo_mysql \
        pdo_pgsql \
        intl \
        zip \
        opcache \
        pcntl \
        gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/backend

# Copy dependency definition files
COPY backend/composer.json backend/composer.lock ./

# Install production PHP dependencies
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# Copy full application code
COPY backend/ .

# Complete composer autoloader optimization
RUN composer dump-autoload --optimize --no-dev --classmap-authoritative

# Copy PHP and OpCache configuration
COPY docker/backend/php.ini /usr/local/etc/php/conf.d/99-custom.ini
COPY docker/backend/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

# Set permissions for storage and bootstrap/cache
RUN chown -R www-data:www-data /var/www/backend/storage /var/www/backend/bootstrap/cache \
    && chmod -R 775 /var/www/backend/storage /var/www/backend/bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]
