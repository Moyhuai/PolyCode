# syntax=docker/dockerfile:1

# ---------- 前端构建 ----------
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build

# ---------- 运行镜像 ----------
# 同时支持 x86_64 与 ARM64（Oracle 永久免费实例为 ARM A1）
FROM node:24-slim
WORKDIR /app

# 内置各语言运行时：Python / C / C++ / Java / Go / PHP / Ruby（JS/TS 由 Node 24 提供）
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 \
    python-is-python3 \
    gcc \
    g++ \
    default-jdk-headless \
    golang-go \
    php-cli \
    ruby \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PORT=8787 \
    GOCACHE=/tmp/go-build \
    GOPATH=/tmp/go \
    GOTMPDIR=/tmp

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server ./server
COPY --from=build /app/dist ./dist

# 分享数据目录，容器内属于 node 用户；预置 .keep 让命名卷首次挂载时继承属主
RUN mkdir -p /app/.data \
  && touch /app/.data/.keep \
  && chown -R node:node /app
USER node

EXPOSE 8787

CMD ["node", "server/index.mjs"]
