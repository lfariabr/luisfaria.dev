FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --force

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
# Set build-time environment variables (NEXT_PUBLIC_* must be present at build time)
ARG NEXT_PUBLIC_GRAPHQL_URL=https://luisfaria.dev/graphql
ENV NEXT_PUBLIC_GRAPHQL_URL=${NEXT_PUBLIC_GRAPHQL_URL}
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Set the environment variable for runtime as well
ENV NEXT_PUBLIC_GRAPHQL_URL=https://luisfaria.dev/graphql

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copiando arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create cache directory with proper ownership (fixes "permission denied, mkdir '/app/.next/cache'")
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]