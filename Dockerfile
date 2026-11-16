FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY src ./src
COPY migrations ./migrations
ENV NODE_ENV=production
ENV PORT=3000
# Official Node Alpine images create the `node` account with UID/GID 1000.
# A numeric UID makes the runtime identity explicit to container policy tools.
USER 1000
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/health').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))"]
CMD ["node", "src/server.mjs"]
