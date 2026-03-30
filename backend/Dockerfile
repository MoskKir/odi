# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build all NestJS apps
RUN npx nest build gateway && \
    npx nest build auth && \
    npx nest build game && \
    npx nest build ai && \
    npx nest build chat

# ---- Production stage ----
FROM node:20-alpine AS production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

# Copy env example as fallback (real env comes from docker-compose)
COPY .env.example .env.example

EXPOSE 3000
