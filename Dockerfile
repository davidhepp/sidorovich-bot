FROM oven/bun:1

WORKDIR /app
ENV NODE_ENV=production

# install deps (cached if lockfile unchanged)
COPY bun.lockb package.json ./
RUN bun install --frozen-lockfile

# copy source code
COPY . .

# default: run the bot
CMD ["bun", "run", "start"]
