# Этап 1: Сборка
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Важно: для Vite это создает папку dist
RUN npm run build

# Этап 2: Запуск (Nginx)
FROM nginx:alpine

# Копируем наш правильный конфиг
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Удаляем стандартную страницу Nginx
RUN rm -rf /usr/share/nginx/html/*

# Копируем собранный сайт из этапа 1
# Если у вас Vite, папка называется dist. Если Create React App - build.
# Судя по файлам, у вас Vite, так что dist:
COPY --from=builder /app/dist /usr/share/nginx/html

# Cloud Run требует порт 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]