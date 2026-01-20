# Этап 1: Сборка (Build)
FROM node:20-alpine as builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Этап 2: Запуск (Production)
FROM nginx:alpine
# Копируем собранный сайт из первого этапа
COPY --from=builder /app/dist /usr/share/nginx/html
# Копируем настройки Nginx (см. ниже)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]