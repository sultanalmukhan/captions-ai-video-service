# Dockerfile для Railway Video Processing Service с расширенным набором шрифтов
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
    font-noto \
    font-ubuntu \
    wget \
    unzip \
    curl \
    && rm -rf /var/cache/apk/*

# Создаем директорию для кастомных шрифтов
RUN mkdir -p /usr/share/fonts/custom

# Скачиваем шрифты напрямую из GitHub (более надежно)
WORKDIR /tmp/fonts

# Скачиваем основные шрифты через GitHub raw ссылки
RUN echo "Downloading fonts from GitHub..." && \
    curl -f -L -o /usr/share/fonts/custom/Roboto-Regular.ttf \
    "https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Regular.ttf" || \
    echo "Failed to download Roboto-Regular.ttf"

RUN curl -f -L -o /usr/share/fonts/custom/Roboto-Bold.ttf \
    "https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Bold.ttf" || \
    echo "Failed to download Roboto-Bold.ttf"

RUN curl -f -L -o /usr/share/fonts/custom/Roboto-Italic.ttf \
    "https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Italic.ttf" || true

RUN curl -f -L -o /usr/share/fonts/custom/Montserrat-Regular.ttf \
    "https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat-Regular.ttf" || \
    echo "Failed to download Montserrat-Regular.ttf"

RUN curl -f -L -o /usr/share/fonts/custom/Montserrat-Bold.ttf \
    "https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat-Bold.ttf" || true

RUN curl -f -L -o /usr/share/fonts/custom/OpenSans-Regular.ttf \
    "https://github.com/google/fonts/raw/main/apache/opensans/OpenSans-Regular.ttf" || \
    echo "Failed to download OpenSans-Regular.ttf"

RUN curl -f -L -o /usr/share/fonts/custom/OpenSans-Bold.ttf \
    "https://github.com/google/fonts/raw/main/apache/opensans/OpenSans-Bold.ttf" || true

RUN curl -f -L -o /usr/share/fonts/custom/Lato-Regular.ttf \
    "https://github.com/google/fonts/raw/main/ofl/lato/Lato-Regular.ttf" || \
    echo "Failed to download Lato-Regular.ttf"

RUN curl -f -L -o /usr/share/fonts/custom/Lato-Bold.ttf \
    "https://github.com/google/fonts/raw/main/ofl/lato/Lato-Bold.ttf" || true

RUN curl -f -L -o /usr/share/fonts/custom/SourceSansPro-Regular.ttf \
    "https://github.com/google/fonts/raw/main/ofl/sourcesanspro/SourceSansPro-Regular.ttf" || \
    echo "Failed to download SourceSansPro-Regular.ttf"

RUN curl -f -L -o /usr/share/fonts/custom/Poppins-Regular.ttf \
    "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf" || \
    echo "Failed to download Poppins-Regular.ttf"

RUN curl -f -L -o /usr/share/fonts/custom/Inter-Regular.ttf \
    "https://github.com/google/fonts/raw/main/ofl/inter/Inter-Regular.ttf" || \
    echo "Failed to download Inter-Regular.ttf"

RUN curl -f -L -o /usr/share/fonts/custom/Oswald-Regular.ttf \
    "https://github.com/google/fonts/raw/main/ofl/oswald/Oswald-Regular.ttf" || \
    echo "Failed to download Oswald-Regular.ttf"

RUN curl -f -L -o /usr/share/fonts/custom/Raleway-Regular.ttf \
    "https://github.com/google/fonts/raw/main/ofl/raleway/Raleway-Regular.ttf" || \
    echo "Failed to download Raleway-Regular.ttf"

RUN curl -f -L -o /usr/share/fonts/custom/Nunito-Regular.ttf \
    "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito-Regular.ttf" || \
    echo "Failed to download Nunito-Regular.ttf"

RUN curl -f -L -o /usr/share/fonts/custom/Quicksand-Regular.ttf \
    "https://github.com/google/fonts/raw/main/ofl/quicksand/Quicksand-Regular.ttf" || \
    echo "Failed to download Quicksand-Regular.ttf"

RUN curl -f -L -o /usr/share/fonts/custom/Merriweather-Regular.ttf \
    "https://github.com/google/fonts/raw/main/ofl/merriweather/Merriweather-Regular.ttf" || \
    echo "Failed to download Merriweather-Regular.ttf"

# Проверяем, какие файлы удалось скачать
RUN echo "=== Downloaded font files ===" && \
    ls -la /usr/share/fonts/custom/ && \
    echo "Total fonts downloaded: $(ls -1 /usr/share/fonts/custom/*.ttf 2>/dev/null | wc -l)" || \
    echo "Custom fonts directory is empty, using system fonts"

# Обновляем кэш шрифтов
RUN fc-cache -f -v

# Проверяем установленные шрифты (для дебага)
RUN echo "=== Available fonts check ===" && \
    fc-list | grep -i -E "(roboto|montserrat|open.?sans|lato|source.?sans|poppins|inter|oswald|raleway|nunito|quicksand|merriweather)" || \
    echo "Custom fonts not found in fc-list, checking system fonts..."

# Показываем системные шрифты как fallback
RUN echo "=== Available system fonts (first 15) ===" && \
    fc-list | head -15

# Очищаем временные файлы
RUN rm -rf /tmp/fonts

# Создаем рабочую директорию
WORKDIR /app

# Копируем package.json
COPY package.json ./

# Устанавливаем зависимости (используем npm install вместо npm ci)
RUN npm install --only=production && npm cache clean --force

# Копируем исходный код
COPY . .

# Создаем директории для временных файлов
RUN mkdir -p /tmp/uploads /tmp/processing

# Устанавливаем права доступа
RUN chown -R node:node /app /tmp/uploads /tmp/processing

# Устанавливаем права на шрифты для node пользователя
RUN chown -R node:node /usr/share/fonts/custom || true

# Переключаемся на non-root пользователя
USER node

# Открываем порт
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Запускаем приложение
CMD ["npm", "start"]
