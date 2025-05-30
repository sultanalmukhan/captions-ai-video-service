# Dockerfile для Railway Video Processing Service
FROM node:18-alpine

# Устанавливаем FFmpeg, шрифты и другие зависимости
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++ \
    fontconfig \
    ttf-dejavu \
    ttf-liberation \
    ttf-ubuntu-font-family \
    && rm -rf /var/cache/apk/*

# Обновляем кэш шрифтов
RUN fc-cache -f -v

# Создаем рабочую директорию
WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем npm dependencies
RUN npm ci --only=production && npm cache clean --force

# Копируем исходный код
COPY . .

# Создаем директории для временных файлов
RUN mkdir -p /tmp/uploads /tmp/processing

# Устанавливаем права доступа
RUN chown -R node:node /app /tmp/uploads /tmp/processing

# Переключаемся на non-root пользователя
USER node

# Открываем порт
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Запускаем приложение
CMD ["npm", "start"]
