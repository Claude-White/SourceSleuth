# 1. Use official Node.js image as the base
FROM node:20-alpine AS builder

# 2. Set working directory
WORKDIR /app

# 3. Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# 4. Copy the rest of the source code
COPY . .

# 5. Build the app (if using TypeScript)
RUN npm run build

# 6. Use a smaller image for production
FROM node:20-alpine AS runner

WORKDIR /app

# 7. Copy only the built output and necessary files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# 8. Expose the port your Hono app listens on (default 3000)
EXPOSE 3000

# 9. Set the command to run your app
CMD ["node", "dist/index.js"]
