FROM node:22-alpine3.23 AS development

RUN apk add --no-cache libc6-compat

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/smart-games-front/package.json apps/smart-games-front/pnpm-lock.yaml ./apps/smart-games-front/

RUN pnpm install --frozen-lockfile

COPY apps/smart-games-front ./apps/smart-games-front

WORKDIR /app/apps/smart-games-front

EXPOSE 3000

CMD ["pnpm", "run", "dev"]
