# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY public ./public

RUN npm run build


# ---------- RUNTIME STAGE ----------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "dist/app.js"]
