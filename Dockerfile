FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Keep npm and its build-time dependency tree out of the runtime image.
# The original single-stage image included vulnerable npm CLI dependencies
# (brace-expansion, pacote, sigstore, etc.) which our application never uses.
FROM alpine:3.24
# Alpine patches must be picked up on rebuilds; do not freeze a vulnerable
# libstdc++ patch revision just to appease the image linter.
# hadolint ignore=DL3018
RUN apk add --no-cache libstdc++ \
    && addgroup -S -g 1000 node \
    && adduser -S -D -u 1000 -G node node
WORKDIR /app
COPY --from=dependencies /usr/local/bin/node /usr/local/bin/node
COPY --from=dependencies /app/node_modules ./node_modules
COPY src ./src
COPY migrations ./migrations
ENV NODE_ENV=production
ENV PORT=3000
# The runtime Alpine stage explicitly creates the `node` account with UID 1000.
# A numeric UID makes the runtime identity explicit to container policy tools.
USER 1000
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/health').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))"]
CMD ["node", "src/server.mjs"]
