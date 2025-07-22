FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

# 6) Copy code & install JS deps
COPY --chown=pptruser . .
RUN npm ci

# 7) Expose port & launch
EXPOSE 3000
ENTRYPOINT ["npx", "tsx", "index.ts"]