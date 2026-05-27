FROM node:22-bookworm-slim

WORKDIR /app

ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce?schema=notification_service"

COPY api_gateway/package.json api_gateway/package-lock.json api_gateway/tsconfig.json api_gateway/prisma.config.ts ./
COPY shared ../shared
COPY api_gateway/prisma ./prisma
COPY api_gateway/src ./src

RUN npm ci
RUN npx prisma generate
RUN npm run build || true

EXPOSE 3000

# api_gateway doesn't have migrations; use db push to create tables.
CMD ["sh", "-c", "npx prisma generate && npx prisma db push && node prisma/seed.js && node dist/server.js"]
