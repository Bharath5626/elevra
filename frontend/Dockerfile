# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_ vars must be baked in at build time — pass them as build args
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
# Default config: stands alone (DO App Platform / standalone Docker)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Compose config (includes backend proxy) is mounted via docker-compose.yml

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
