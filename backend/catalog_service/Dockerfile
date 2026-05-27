FROM node:22-bookworm-slim

WORKDIR /app

ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce?schema=catalog_service"

COPY catalog_service/package.json catalog_service/package-lock.json catalog_service/tsconfig.json catalog_service/prisma.config.ts ./
COPY shared ../shared
COPY catalog_service/prisma ./prisma
COPY catalog_service/src ./src

RUN npm ci
RUN npx prisma generate
RUN npm run build || true

EXPOSE 3002

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node prisma/seed.js && node dist/server.js"]
