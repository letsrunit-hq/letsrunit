# Stage 1: Build
FROM node:22-slim AS builder

WORKDIR /app

# Enable Corepack to use Yarn v4
RUN corepack enable

# Copy workspace configuration and lockfile
COPY .yarn ./.yarn
COPY .yarnrc.yml ./
COPY package.json yarn.lock ./

# Copy all package.json files to allow Yarn to link workspaces
COPY apps/worker/package.json ./apps/worker/
COPY packages/ ./packages/
# Note: We copy all packages because they are interconnected

# Install all dependencies (including devDependencies for building)
RUN yarn install --immutable

# Copy the rest of the source code
COPY apps/worker ./apps/worker
# packages are already copied in the previous step if we want to be safe,
# but let's be explicit and copy them now if we didn't before.
# Actually, the previous COPY packages/ already copied everything in packages/.

# Build the worker
RUN yarn workspace worker build

# Stage 2: Run
FROM node:22-slim AS runner

WORKDIR /app

# Enable Corepack
RUN corepack enable

ENV NODE_ENV=production

# Copy built artifacts and necessary files for production
COPY --from=builder /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=builder /app/.yarn /app/.yarn
COPY --from=builder /app/apps/worker/package.json ./apps/worker/
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist

# Copy local packages (source might be needed if they are not bundled)
# Since tsup bundles the server.ts, we might not need all packages if everything is bundled.
# However, let's check if tsup --clean bundled everything.
# Usually tsup bundles dependencies unless marked as external.
COPY --from=builder /app/packages ./packages

# Install only production dependencies
RUN yarn workspaces focus worker --production

WORKDIR /app/apps/worker

EXPOSE 3000

# Start the worker using the bundled output
CMD ["node", "dist/server.js"]
