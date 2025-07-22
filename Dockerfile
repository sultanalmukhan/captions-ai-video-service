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

# Скачиваем и устанавливаем Google Fonts
WORKDIR /tmp/fonts

# Roboto (основной шрифт)
RUN wget -q -O roboto.zip "https://fonts.google.com/download?family=Roboto" || \
    curl -L -o roboto.zip "https://fonts.google.com/download?family=Roboto" || true
RUN if [ -f roboto.zip ]; then \
        unzip -q roboto.zip -d roboto 2>/dev/null && \
        find roboto -name "*.ttf" -exec cp {} /usr/share/fonts/custom/ \; && \
        rm -rf roboto roboto.zip; \
    fi

# Montserrat
RUN wget -q -O montserrat.zip "https://fonts.google.com/download?family=Montserrat" || true
RUN if [ -f montserrat.zip ]; then \
        unzip -q montserrat.zip -d montserrat 2>/dev/null && \
        find montserrat -name "*.ttf" -exec cp {} /usr/share/fonts/custom/ \; && \
        rm -rf montserrat montserrat.zip; \
    fi

# Open Sans
RUN wget -q -O opensans.zip "https://fonts.google.com/download?family=Open+Sans" || true
RUN if [ -f opensans.zip ]; then \
        unzip -q opensans.zip -d opensans 2>/dev/null && \
        find opensans -name "*.ttf" -exec cp {} /usr/share/fonts/custom/ \; && \
        rm -rf opensans opensans.zip; \
    fi

# Lato
RUN wget -q -O lato.zip "https://fonts.google.com/download?family=Lato" || true
RUN if [ -f lato.zip ]; then \
        unzip -q lato.zip -d lato 2>/dev/null && \
        find lato -name "*.ttf" -exec cp {} /usr/share/fonts/custom/ \; && \
        rm -rf lato lato.zip; \
    fi

# Source Sans Pro
RUN wget -q -O sourcesanspro.zip "https://fonts.google.com/download?family=Source+Sans+Pro" || true
RUN if [ -f sourcesanspro.zip ]; then \
        unzip -q sourcesanspro.zip -d sourcesanspro 2>/dev/null && \
        find sourcesanspro -name "*.ttf" -exec cp {} /usr/share/fonts/custom/ \; && \
        rm -rf sourcesanspro sourcesanspro.zip; \
    fi

# Poppins
RUN wget -q -O poppins.zip "https://fonts.google.com/download?family=Poppins" || true
RUN if [ -f poppins.zip ]; then \
        unzip -q poppins.zip -d poppins 2>/dev/null && \
        find poppins -name "*.ttf" -exec cp {} /usr/share/fonts/custom/ \; && \
        rm -rf poppins poppins.zip; \
    fi

# Inter
RUN wget -q -O inter.zip "https://fonts.google.com/download?family=Inter" || true
RUN if [ -f inter.zip ]; then \
        unzip -q inter.zip -d inter 2>/dev/null && \
        find inter -name "*.ttf" -exec cp {} /usr/share/fonts/custom/ \; && \
        rm -rf inter inter.zip; \
    fi

# Oswald
RUN wget -q -O oswald.zip "https://fonts.google.com/download?family=Oswald" || true
RUN if [ -f oswald.zip ]; then \
        unzip -q oswald.zip -d oswald 2>/dev/null && \
        find oswald -name "*.ttf" -exec cp {} /usr/share/fonts/custom/ \; && \
        rm -rf oswald oswald.zip; \
    fi

# Raleway
RUN wget -q -O raleway.zip "https://fonts.google.com/download?family=Raleway" || true
RUN if [ -f raleway.zip ]; then \
        unzip -q raleway.zip -d raleway 2>/dev/null && \
        find raleway -name "*.ttf" -exec cp {} /usr/share/fonts/custom/ \; && \
        rm -rf raleway raleway.zip; \
    fi

# Nunito
RUN wget -q -O nunito.zip "https://fonts.google.com/download?family=Nunito" || true
RUN if [ -f nunito.zip ]; then \
        unzip -q nunito.zip -d nunito 2>/dev/null && \
        find nunito -name "*.ttf" -exec cp {} /usr/share/fonts/custom/ \; && \
        rm -rf nunito nunito.zip; \
    fi

# Quicksand
RUN wget -q -O quicksand.zip "https://fonts.google.com/download?family=Quicksand" || true
RUN if [ -f quicksand.zip ]; then \
        unzip -q quicksand.zip -d quicksand 2>/dev/null && \
        find quicksand -name "*.ttf" -exec cp {} /usr/share/fonts/custom/ \; && \
        rm -rf quicksand quicksand.zip; \
    fi

# Merriweather
RUN wget -q -O merriweather.zip "https://fonts.google.com/download?family=Merriweather" || true
RUN if [ -f merriweather.zip ]; then \
        unzip -q merriweather.zip -d merriweather 2>/dev/null && \
        find merriweather -name "*.ttf" -exec cp {} /usr/share/fonts/custom/ \; && \
        rm -rf merriweather merriweather.zip; \
    fi

# Альтернативный способ - через прямые ссылки на GitHub (fallback)
RUN curl -f -L -o /usr/share/fonts/custom/Roboto-Regular.ttf \
    "https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Regular.ttf" 2>/dev/null || true

RUN curl -f -L -o /usr/share/fonts/custom/Roboto-Bold.ttf \
    "https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Bold.ttf" 2>/dev/null || true

RUN curl -f -L -o /usr/share/fonts/custom/Montserrat-Regular.ttf \
    "https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat-Regular.ttf" 2>/dev/null || true

RUN curl -f -L -o /usr/share/fonts/custom/OpenSans-Regular.ttf \
    "https://github.com/google/fonts/raw/main/apache/opensans/OpenSans-Regular.ttf" 2>/dev/null || true

RUN curl -f -L -o /usr/share/fonts/custom/Lato-Regular.ttf \
    "https://github.com/google/fonts/raw/main/ofl/lato/Lato-Regular.ttf" 2>/dev/null || true

RUN curl -f -L -o /usr/share/fonts/custom/Inter-Regular.ttf \
    "https://github.com/google/fonts/raw/main/ofl/inter/Inter-Regular.ttf" 2>/dev/null || true

# Проверяем, какие файлы удалось скачать
RUN echo "=== Downloaded font files ===" && \
    ls -la /usr/share/fonts/custom/ || echo "Custom fonts directory is empty"

# Обновляем кэш шрифтов
RUN fc-cache -f -v

# Проверяем установленные шрифты (для дебага)
RUN echo "=== Available fonts check ===" && \
    fc-list | grep -E "(Roboto|Montserrat|Open Sans|Lato|Source Sans|Poppins|Inter|Oswald|Raleway|Nunito|Quicksand|Merriweather)" | head -10 || \
    echo "Custom fonts not found in fc-list, will use system fonts"

# Показываем системные шрифты как fallback
RUN echo "=== Available system fonts ===" && \
    fc-list | head -10

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
