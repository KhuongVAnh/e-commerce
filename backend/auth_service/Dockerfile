FROM node:22-bookworm-slim

WORKDIR /app

# Prisma generate may run during install scripts in some setups, so provide a harmless default.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce?schema=auth_service"

COPY auth_service/package.json auth_service/package-lock.json auth_service/tsconfig.json auth_service/prisma.config.ts ./
COPY shared ../shared
COPY auth_service/prisma ./prisma
COPY auth_service/src ./src

RUN npm ci
RUN npx prisma generate
RUN npm run build || true

EXPOSE 3001

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/server.js"]
