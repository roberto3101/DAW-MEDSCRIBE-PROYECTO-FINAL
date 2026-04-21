# Multi-stage: build Angular, serve with nginx
FROM node:20-alpine AS builder
WORKDIR /build
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npx ng build --configuration production

FROM nginx:alpine
COPY --from=builder /build/dist/cliente-web/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
