# ---- Builder Stage ----
# (Name this stage, e.g., app_builder, for Docker Compose to reference if needed, though direct copy is often simpler)
FROM node:22-slim AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
# This npm run build will create dist/server/main.js AND dist/public/*
RUN npm run build

# Prune devDependencies for the production stage if you copy node_modules
# If you only copy dist and package.json, and run npm ci --omit=dev in prod stage, this is less critical here.
RUN npm prune --production


# ---- Production Stage ----
FROM node:22-slim
WORKDIR /usr/src/app

# Copy essential files from builder
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

# EXPOSE 9001 # Not strictly necessary if only accessed via Docker Compose network
CMD [ "node", "dist/server/main.js" ]