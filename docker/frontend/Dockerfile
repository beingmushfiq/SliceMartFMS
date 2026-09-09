# Multi-stage Frontend Production Build
# Stage 1: Build React 19 SPA with Vite
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and frontend package declarations
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/

# Install dependencies cleanly
RUN npm ci

# Copy full frontend source code
COPY frontend/ ./frontend/

# Build production bundle and verify bundle size budgets
WORKDIR /app/frontend
RUN npm run build \
    && npm run budget

# Stage 2: Nginx Static Serving Image
FROM nginx:alpine AS runner

WORKDIR /var/www/frontend

# Copy compiled SPA bundle
COPY --from=builder /app/frontend/dist /var/www/frontend/dist

# Copy production Nginx virtual host configuration
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
