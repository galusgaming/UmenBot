FROM node:18-alpine

# Instalacja zależności systemowych potrzebnych dla node-canvas
RUN apk add --no-cache \
    build-base \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Build React client (Vite)
RUN npm ci --prefix web/client \
	&& npm run build --prefix web/client

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /usr/src/app

USER appuser

# Panel WWW (Express) domyślnie nasłuchuje na porcie 3000
EXPOSE 3000

# Start bota (i panelu)
CMD ["node", "index.js"]
