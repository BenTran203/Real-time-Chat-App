# ============================================
# CHATWAVE BACKEND DOCKERFILE
# ============================================

# ============================================
# STAGE 1: Development
# ============================================
FROM node:20-alpine AS development

# Install OpenSSL (required by Prisma)
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema BEFORE npm install (postinstall runs prisma generate)
COPY prisma ./prisma/

# Install dependencies (postinstall will run prisma generate)
RUN npm install

# Copy source code
COPY src ./src/

EXPOSE 5000

# Start with nodemon for hot reload
CMD ["npm", "run", "dev"]

# ============================================
# STAGE 2: Production
# ============================================
FROM node:20-alpine AS production

# Install OpenSSL (required by Prisma)
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema BEFORE npm ci (needed for postinstall hook)
COPY prisma ./prisma/

# Install ALL dependencies (prisma is now in dependencies, not devDependencies)
RUN npm ci

# Explicitly generate Prisma client (belt and suspenders approach)
RUN npx prisma generate

# Copy source code
COPY src ./src/

EXPOSE 5000

# Health check for container orchestration
# Use PORT env if provided (Railway sets PORT)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD sh -c "wget --no-verbose --tries=1 --spider http://localhost:${PORT:-5000}/health || exit 1"

# Run migrations and start the server
CMD ["node", "src/server.js"]

# ============================================
# ENVIRONMENT VARIABLES (set via .env or docker-compose)
# ============================================
# DATABASE_URL=postgresql://user:password@host:5432/dbname
# JWT_SECRET=your-secret-key
# FRONTEND_URL=http://localhost:5173
# PORT=5000

# ============================================
# USAGE NOTES
# ============================================
#
# BUILD:
#   docker build -t chatwave-backend .
#
# RUN (with .env file):
#   docker run -p 5000:5000 --env-file .env chatwave-backend
#
# RUN (with environment variables):
#   docker run -p 5000:5000 \
#     -e DATABASE_URL=postgresql://... \
#     -e JWT_SECRET=your-secret \
#     chatwave-backend
#
# RUN MIGRATIONS (before starting):
#   docker run --env-file .env chatwave-backend npx prisma migrate deploy
#
# SHELL ACCESS (for debugging):
#   docker exec -it <container_id> sh
