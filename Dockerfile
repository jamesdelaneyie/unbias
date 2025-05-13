    # ---- Builder Stage ----
    FROM node:22.14.0-alpine AS builder

    WORKDIR /usr/src/app

    # Install dependencies
    # Copy package.json and package-lock.json (or npm-shrinkwrap.json)
    COPY package*.json ./
    # Install all dependencies, including devDependencies needed for build
    RUN npm ci

    # Copy the rest of the application code
    COPY . .

    # Build the application
    # This runs 'npx tsc' as per your package.json
    RUN npm run build

    # Prune devDependencies for a cleaner production install
    RUN npm prune --production

    # ---- Production Stage ----
    FROM node:22.14.0-alpine

    WORKDIR /usr/src/app

    # Copy built artifacts and production node_modules from the builder stage
    COPY --from=builder /usr/src/app/dist ./dist
    COPY --from=builder /usr/src/app/node_modules ./node_modules\
    # Needed for npm to know how to run, and for metadata

    COPY package*.json ./ 
    # Expose the port your application runs on
    # You'll need to replace 3000 with the actual port your server listens on.
    # This might be defined in src/server/instance.ts or via an environment variable.
    EXPOSE 3000

    # Command to run the application
    # Replace 'dist/server/instance.js' with the actual path to your compiled server entry point.
    CMD [ "node", "dist/server/instance.js" ]