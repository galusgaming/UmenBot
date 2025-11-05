FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (better layer caching)
COPY package*.json ./

# If package-lock.json or yarn.lock exists, it will be used automatically
RUN npm ci --only=production

# Copy app source
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
