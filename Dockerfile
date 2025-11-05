FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (better layer caching)
COPY package*.json ./

# If package-lock.json or yarn.lock exists, it will be used automatically
RUN npm ci --only=production

# Copy app source
COPY . .

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /usr/src/app

USER appuser

# The bot doesn't listen on a port; it connects out to Discord. Use CMD to start.
# The repository's package.json doesn't define a start script; run node index.js by default.
CMD ["node", "index.js"]
