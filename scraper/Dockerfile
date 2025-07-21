# Dockerfile
FROM oven/bun:latest

WORKDIR /app
# copy everything, install deps
COPY . .
RUN bun install

# expose your port
EXPOSE 3000

# launch your app
ENTRYPOINT ["bun", "run", "index.ts"]