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
# 代码通过云端接口执行，镜像只需 Node 运行时；同时支持 x86_64 与 ARM64
FROM node:24-slim
WORKDIR /app

ENV NODE_ENV=production \
    PORT=8787

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
