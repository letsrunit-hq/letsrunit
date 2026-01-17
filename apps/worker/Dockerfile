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

# Stage 2: prod deps only (manifests only)
FROM node:22-slim AS deps
WORKDIR /app
RUN corepack enable
ENV YARN_NODE_LINKER=node-modules
ENV NODE_ENV=production

COPY .yarn ./.yarn
COPY .yarnrc.yml package.json yarn.lock ./
COPY apps/worker ./apps/worker
COPY packages ./packages

RUN yarn workspaces focus worker --production

# Stage 3: runner
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/worker/dist /app/dist
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/package.json /app/package.json

EXPOSE 8080
CMD ["node", "dist/server.cjs"]
