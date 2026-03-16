# ─── Stage 1: Build the React frontend ───────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

COPY client/package*.json ./
COPY client/.npmrc ./
RUN npm ci --legacy-peer-deps

COPY client/ ./
RUN npm run build

# ─── Stage 2: Production Express server ───────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/ ./

# Copy the built React app so Express can serve it as static files
COPY --from=frontend-builder /app/client/dist /app/client/dist

EXPOSE 10000

CMD ["node", "server.js"]
