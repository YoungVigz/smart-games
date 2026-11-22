FROM node:22-alpine3.23 AS development

RUN apk add --no-cache libc6-compat openssl

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/smart-games-api/package.json apps/smart-games-api/pnpm-lock.yaml ./apps/smart-games-api/

RUN pnpm install --frozen-lockfile

COPY apps/smart-games-api ./apps/smart-games-api

WORKDIR /app/apps/smart-games-api

RUN pnpm prisma generate

EXPOSE 3000

CMD ["pnpm", "run", "start:dev"]
