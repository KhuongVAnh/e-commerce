FROM node:22-bookworm-slim

WORKDIR /app

ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce?schema=commerce_service"

COPY commerce_service/package.json commerce_service/package-lock.json commerce_service/tsconfig.json commerce_service/prisma.config.ts ./
COPY shared ../shared
COPY commerce_service/prisma ./prisma
COPY commerce_service/src ./src

RUN npm ci
RUN npx prisma generate
RUN npm run build || true

EXPOSE 3003

CMD ["sh", "-c", "npx prisma generate && npx prisma db push && node dist/server.js"]
