# Stage 1: build
FROM node:22-slim AS builder
WORKDIR /app
RUN corepack enable
ENV YARN_NODE_LINKER=node-modules

COPY .yarn ./.yarn
COPY .yarnrc.yml package.json yarn.lock tsconfig.base.json ./
COPY apps/worker ./apps/worker
COPY packages ./packages

RUN yarn workspaces focus worker
RUN yarn workspace worker build

# Stage 2: runner
FROM mcr.microsoft.com/playwright:v1.57.0-noble AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY .yarn ./.yarn
COPY .yarnrc.yml package.json yarn.lock ./
COPY apps/worker ./apps/worker
COPY packages ./packages

RUN corepack enable
ENV YARN_NODE_LINKER=node-modules
RUN yarn workspaces focus worker --production

COPY --from=builder /app/apps/worker/dist /app/dist

EXPOSE 8080
CMD ["node", "dist/server.cjs"]
