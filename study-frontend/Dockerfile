# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Önce sadece bağımlılık dosyalarını kopyala (cache katmanı)
COPY package.json package-lock.json ./
RUN npm ci

# Kaynak kodları kopyala
COPY . .

# Build arg — docker-compose'dan gelir, default da aynı
ARG VITE_API_URL=http://127.0.0.1:10000/api

# Vite öncelik sırası: .env.production > .env.local > .env
# "vite build" production modunda çalışır → .env.production her zaman kazanır.
# Her iki dosyaya da yaz: hiçbir repo .env'i geçersiz kılmasın.
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env.production && \
    echo "VITE_API_URL=${VITE_API_URL}" > .env

# Build log'da URL'in doğru set edildiğini göster
RUN echo ">>> Docker build VITE_API_URL:" && cat .env.production

RUN npm run build

# ── Stage 2: Serve (nginx) ────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS final

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
