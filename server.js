// Beautiful Railway Service с готовыми стилями для соц.сетей + ВЫСОКОЕ КАЧЕСТВО ТЕКСТА
// server.js - готовые шаблоны стилей TikTok/Instagram + HQ рендеринг

const express = require('express');
const multer = require('multer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 500 * 1024 * 1024,
    fieldSize: 50 * 1024 * 1024
  }
});

// 🎨 ГОТОВЫЕ СТИЛИ ДЛЯ СОЦИАЛЬНЫХ СЕТЕЙ (КОМПАКТНЫЕ РАЗМЕРЫ + УМНЫЕ FALLBACK ШРИФТЫ)
const SUBTITLE_STYLES = {
  // TikTok стили - оптимальные размеры
  tiktok_classic: {
    fontsize: 8,  // Возвращено к исходному размеру
    fontcolor: 'ffffff',
    fontname: 'DejaVu Sans-Bold',
    fontnames: ['Ubuntu-Bold', 'Liberation Sans-Bold', 'DejaVu Sans-Bold'],
    outline: 2,   // Возвращено к исходному
    shadow: 1,    // Возвращено к исходному
    bold: 1,
    alignment: 2,
    marginv: 15,  // Возвращено к исходному
    backcolour: '&H80000000',
    name: 'TikTok Classic',
    description: 'Классический TikTok - белый жирный текст с черным фоном'
  },
  
  tiktok_neon: {
    fontsize: 9,  // Возвращено к исходному
    fontcolor: '00ffff',
    fontname: 'Liberation Sans-Bold',
    fontnames: ['Roboto-Bold', 'Liberation Sans-Bold', 'Noto Sans-Bold'],
    outline: 2,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 13,  // Возвращено к исходному
    name: 'TikTok Neon',
    description: 'Неоновый TikTok стиль - яркий голубой с сильной обводкой'
  },
  
  tiktok_yellow: {
    fontsize: 9,  // Возвращено к исходному
    fontcolor: 'ffff00',
    fontname: 'Ubuntu-Bold',
    fontnames: ['Ubuntu-Bold', 'Open Sans-Bold', 'DejaVu Sans-Bold'],
    outline: 2,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 15,
    name: 'TikTok Yellow',
    description: 'Желтый TikTok стиль - как у популярных блогеров'
  },
  
  // Instagram стили - оптимальные размеры
  instagram_clean: {
    fontsize: 8,  // Возвращено к исходному
    fontcolor: 'ffffff',
    fontname: 'Noto Sans-Bold',
    fontnames: ['Noto Sans-Bold', 'Open Sans-Bold', 'Liberation Sans-Bold'],
    outline: 1,
    shadow: 1,
    alignment: 2,
    marginv: 18,  // Возвращено к исходному
    backcolour: '&H40000000',
    name: 'Instagram Clean',
    description: 'Чистый Instagram стиль - элегантный белый текст'
  },
  
  instagram_story: {
    fontsize: 7,  // Возвращено к исходному
    fontcolor: 'ffffff',
    fontname: 'Roboto-Bold',
    fontnames: ['Roboto-Bold', 'Noto Sans-Bold', 'DejaVu Sans-Bold'],
    outline: 1,
    shadow: 1,
    alignment: 2,
    marginv: 20,  // Возвращено к исходному
    name: 'Instagram Story',
    description: 'Стиль Instagram Stories - тонкий и изящный'
  },
  
  instagram_reel: {
    fontsize: 8,  // Возвращено к исходному
    fontcolor: 'ffffff',
    fontname: 'Open Sans-Bold',
    fontnames: ['Open Sans-Bold', 'Liberation Sans-Bold', 'DejaVu Sans-Bold'],
    outline: 2,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 15,
    backcolour: '&H60000000',
    name: 'Instagram Reel',
    description: 'Стиль Instagram Reels - жирный и контрастный'
  },
  
  // YouTube стили - оптимальные размеры
  youtube_classic: {
    fontsize: 7,  // Возвращено к исходному
    fontcolor: 'ffffff',
    fontname: 'Liberation Sans-Bold',
    fontnames: ['Source Sans Pro-Bold', 'Liberation Sans-Bold', 'Noto Sans-Bold'],
    outline: 1,
    shadow: 1,
    alignment: 2,
    marginv: 13,  // Возвращено к исходному
    name: 'YouTube Classic',
    description: 'Классический YouTube - стандартные субтитры'
  },
  
  youtube_gaming: {
    fontsize: 8,  // Возвращено к исходному
    fontcolor: '00ff00',
    fontname: 'DejaVu Sans-Bold',
    fontnames: ['Ubuntu-Bold', 'DejaVu Sans-Bold', 'Liberation Sans-Bold'],
    outline: 1,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 14,
    name: 'YouTube Gaming',
    description: 'Игровой стиль YouTube - зеленый геймерский'
  },
  
  // Современные трендовые стили - оптимальные размеры
  modern_gradient: {
    fontsize: 9,  // Возвращено к исходному
    fontcolor: 'ff69b4',
    fontname: 'Open Sans-Bold',
    fontnames: ['Montserrat-Bold', 'Open Sans-Bold', 'Liberation Sans-Bold'],
    outline: 2,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 15,
    name: 'Modern Pink',
    description: 'Модерн розовый - трендовый цвет 2024'
  },
  
  retro_vhs: {
    fontsize: 8,  // Возвращено к исходному
    fontcolor: 'ff00ff',
    fontname: 'DejaVu Sans-Bold',
    fontnames: ['Ubuntu-Bold', 'DejaVu Sans-Bold', 'Liberation Sans-Bold'],
    outline: 1,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 14,
    name: 'Retro VHS',
    description: 'Ретро VHS стиль - фиолетовый винтаж'
  },
  
  minimal_black: {
    fontsize: 7,  // Возвращено к исходному
    fontcolor: '000000',
    fontname: 'Noto Sans-Bold',
    fontnames: ['Roboto-Bold', 'Noto Sans-Bold', 'Liberation Sans-Bold'],
    outline: 0,
    shadow: 0,
    alignment: 2,
    marginv: 10,
    backcolour: '&H80ffffff',
    name: 'Minimal Black',
    description: 'Минималистичный - черный текст на белом фоне'
  },
  
  // Премиум стили - оптимальные размеры
  luxury_gold: {
    fontsize: 9,  // Возвращено к исходному
    fontcolor: 'ffd700',
    fontname: 'DejaVu Sans-Bold',
    fontnames: ['Ubuntu-Bold', 'DejaVu Sans-Bold', 'Liberation Sans-Bold'],
    outline: 2,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 16,
    backcolour: '&H80000000',
    name: 'Luxury Gold',
    description: 'Премиум золотой - роскошный стиль'
  },
  
  neon_purple: {
    fontsize: 9,  // Возвращено к исходному
    fontcolor: '9400d3',
    fontname: 'Liberation Sans-Bold',
    fontnames: ['Open Sans-Bold', 'Liberation Sans-Bold', 'Noto Sans-Bold'],
    outline: 2,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 15,
    name: 'Neon Purple',
    description: 'Неоновый фиолетовый - киберпанк стиль'
  }
};

// 📍 ПОЗИЦИИ СУБТИТРОВ
const SUBTITLE_POSITIONS = {
  bottom: {
    alignment: 2,     // По центру
    marginv: 15,      // Возвращено к исходному размеру
    name: 'Снизу',
    description: 'Субтитры внизу экрана (стандарт)'
  },
  top: {
    alignment: 8,     // По центру вверху  
    marginv: 15,      // Возвращено к исходному размеру
    name: 'Сверху',
    description: 'Субтитры вверху экрана'
  },
  center: {
    alignment: 5,     // По центру экрана
    marginv: 0,       // Без отступов
    name: 'По центру',
    description: 'Субтитры в центре экрана'
  }
};

// 🎯 ФУНКЦИЯ ОПРЕДЕЛЕНИЯ ФОРМАТА ВИДЕО
function detectVideoFormat(inputPath) {
  try {
    const probe = execSync(`ffprobe -v quiet -print_format json -show_streams "${inputPath}"`, { encoding: 'utf8' });
    const info = JSON.parse(probe);
    const videoStream = info.streams.find(s => s.codec_type === 'video');
    
    const width = parseInt(videoStream.width);
    const height = parseInt(videoStream.height);
    const ratio = width / height;
    
    if (ratio < 0.7) return 'vertical';    // 9:16 или более вертикальный
    if (ratio > 1.5) return 'horizontal'; // 16:9 или более горизонтальный
    return 'square';                      // Примерно 1:1
  } catch (error) {
    return 'unknown';
  }
}

// 🎯 ФУНКЦИЯ ДЛЯ СОЗДАНИЯ ВЫСОКОКАЧЕСТВЕННЫХ СТИЛЕЙ
function buildHighQualityStyle(style) {
  // Увеличиваем все размеры в 1.5 раза для лучшего качества
  let styleStr = `Fontsize=${Math.round(style.fontsize * 1.5)}`;
  
  // Добавляем сглаживание шрифтов - пробуем жирную версию
  if (style.fontname) {
    styleStr += `,Fontname=${style.fontname}`;
  }
  
  // Цвет с правильным форматированием
  if (style.fontcolor) {
    const color = style.fontcolor.startsWith('&H') ? style.fontcolor : `&H${style.fontcolor}`;
    styleStr += `,PrimaryColour=${color}`;
  }
  
  // Увеличенная обводка для четкости
  if (style.outline) {
    styleStr += `,OutlineColour=&H000000,Outline=${Math.round(style.outline * 1.5)}`;
  }
  
  // Мягкая тень для глубины
  if (style.shadow) {
    styleStr += `,Shadow=${Math.round(style.shadow * 1.5)}`;
  }
  
  // Всегда включаем жирность для мобильных
  styleStr += `,Bold=1`;
  
  // Выравнивание
  if (style.alignment) {
    styleStr += `,Alignment=${style.alignment}`;
  }
  
  // Увеличенные отступы
  if (style.marginv) {
    styleStr += `,MarginV=${Math.round(style.marginv * 1.2)}`;
  }
  
  // Фон с прозрачностью
  if (style.backcolour) {
    styleStr += `,BackColour=${style.backcolour}`;
  }
  
  return styleStr;
}

// 🎯 ФУНКЦИЯ ДЛЯ СОЗДАНИЯ ТЕКСТОВОГО ФАЙЛА ИЗ SRT
function createTextFile(srtContent, taskId) {
  const textPath = `/tmp/processing/text_${taskId}.txt`;
  
  // Извлекаем только текст из SRT (без временных меток)
  const textOnly = srtContent
    .replace(/^\d+$/gm, '')  // Убираем номера
    .replace(/\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/g, '') // Убираем временные метки
    .replace(/\n\n+/g, ' ')  // Заменяем множественные переносы на пробелы
    .trim();
  
  fs.writeFileSync(textPath, textOnly, 'utf8');
  return textPath;
}

// Health check с информацией о доступных стилях
app.get('/health', (req, res) => {
  const systemInfo = getSystemInfo();
  const availableStyles = Object.keys(SUBTITLE_STYLES).map(key => ({
    id: key,
    name: SUBTITLE_STYLES[key].name,
    description: SUBTITLE_STYLES[key].description
  }));
  
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mode: 'HIGH_QUALITY_SOCIAL_MEDIA_STYLES',
    available_styles: availableStyles,
    total_styles: availableStyles.length,
    ...systemInfo
  });
});

// Новый endpoint для получения всех стилей и позиций
app.get('/styles', (req, res) => {
  const stylesWithPreview = Object.keys(SUBTITLE_STYLES).map(key => {
    const style = SUBTITLE_STYLES[key];
    return {
      id: key,
      name: style.name,
      description: style.description,
      preview: {
        fontsize: style.fontsize,
        fontcolor: style.fontcolor,
        has_background: !!style.backcolour,
        has_bold: !!style.bold,
        category: key.split('_')[0] // tiktok, instagram, youtube, etc.
      }
    };
  });
  
  // Группируем по категориям
  const groupedStyles = stylesWithPreview.reduce((acc, style) => {
    const category = style.preview.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(style);
    return acc;
  }, {});

  // Добавляем информацию о позициях
  const availablePositions = Object.keys(SUBTITLE_POSITIONS).map(key => ({
    id: key,
    name: SUBTITLE_POSITIONS[key].name,
    description: SUBTITLE_POSITIONS[key].description
  }));
  
  res.json({
    success: true,
    styles: stylesWithPreview,
    grouped_styles: groupedStyles,
    positions: availablePositions,
    total_styles: stylesWithPreview.length,
    default_style: 'tiktok_classic',
    default_position: 'bottom',
    quality_mode: 'HIGH_QUALITY_RENDERING'
  });
});

function getSystemInfo() {
  try {
    const ffmpegVersion = execSync('ffmpeg -version', { encoding: 'utf8' }).split('\n')[0];
    
    let availableFonts = [];
    try {
      const fontList = execSync('fc-list', { encoding: 'utf8' });
      availableFonts = fontList.split('\n').slice(0, 5);
    } catch (err) {
      availableFonts = ['Font check failed'];
    }
    
    return {
      ffmpeg_available: true,
      ffmpeg_version: ffmpegVersion,
      fonts_available: availableFonts,
      subtitle_method: 'HIGH_QUALITY_SOCIAL_MEDIA_STYLES'
    };
  } catch (error) {
    return { 
      ffmpeg_available: false, 
      error: error.message 
    };
  }
}

// Функция очистки и красивого форматирования SRT
function beautifySRT(srtContent, taskId) {
  console.log(`[${taskId}] Beautifying SRT text...`);
  console.log(`[${taskId}] Original SRT length: ${srtContent.length} chars`);
  
  if (!srtContent || srtContent.length < 10) {
    throw new Error('SRT content is empty or too short');
  }
  
  // Проверяем, что это SRT формат
  if (!srtContent.includes('-->')) {
    console.log(`[${taskId}] ⚠️ Invalid SRT format - converting plain text to SRT`);
    return `1\n00:00:00,000 --> 00:00:10,000\n${srtContent.trim()}\n\n`;
  }
  
  // Очищаем SRT
  let beautifiedSrt = srtContent
    .replace(/\r\n/g, '\n')  // Унифицируем переносы строк
    .replace(/\r/g, '\n')
    .trim();
  
  // Улучшаем форматирование текста
  const lines = beautifiedSrt.split('\n');
  const improvedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('-->')) {
      // Временные метки оставляем как есть
      improvedLines.push(line);
    } else if (/^\d+$/.test(line)) {
      // Номера субтитров оставляем как есть
      improvedLines.push(line);
    } else if (line.length > 0) {
      // Улучшаем текст субтитров
      let improvedText = line;
      
      // Убираем лишние пробелы
      improvedText = improvedText.replace(/\s+/g, ' ').trim();
      
      // Исправляем пунктуацию
      improvedText = improvedText.replace(/\s+([,.!?;:])/g, '$1');
      improvedText = improvedText.replace(/([,.!?;:])\s*/g, '$1 ');
      
      // Добавляем красивые кавычки если нужно
      improvedText = improvedText.replace(/"/g, '«').replace(/"/g, '»');
      
      // Если текст очень длинный, добавляем переносы в естественных местах
      if (improvedText.length > 50) {
        const words = improvedText.split(' ');
        if (words.length > 8) {
          const mid = Math.ceil(words.length / 2);
          // Ищем хорошее место для переноса (после запятой, точки и т.д.)
          let splitPoint = mid;
          for (let j = mid - 2; j <= mid + 2 && j < words.length; j++) {
            if (j > 0 && (words[j-1].endsWith(',') || words[j-1].endsWith('.') || words[j-1].endsWith('!'))) {
              splitPoint = j;
              break;
            }
          }
          const firstLine = words.slice(0, splitPoint).join(' ');
          const secondLine = words.slice(splitPoint).join(' ');
          improvedText = firstLine + '\n' + secondLine;
        }
      }
      
      improvedLines.push(improvedText);
    } else {
      // Пустые строки
      improvedLines.push('');
    }
  }
  
  beautifiedSrt = improvedLines.join('\n');
  
  // Убеждаемся, что SRT заканчивается правильно
  if (!beautifiedSrt.endsWith('\n\n')) {
    beautifiedSrt += '\n\n';
  }
  
  console.log(`[${taskId}] ✅ SRT beautification complete`);
  console.log(`[${taskId}] Beautified length: ${beautifiedSrt.length} chars`);
  console.log(`[${taskId}] Preview:`, beautifiedSrt.substring(0, 300));
  
  return beautifiedSrt;
}

app.post('/process-video-with-subtitles', upload.single('video'), async (req, res) => {
  const taskId = req.body.task_id || uuidv4();
  const startTime = Date.now();
  
  console.log(`\n=== [${taskId}] HIGH QUALITY SOCIAL MEDIA SUBTITLE PROCESSING ===`);

  try {
    // Валидация входных данных
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Video file is required',
        task_id: taskId
      });
    }

    if (!req.body.srt_content) {
      return res.status(400).json({
        success: false,
        error: 'SRT content is required',
        task_id: taskId
      });
    }

    const videoBuffer = req.file.buffer;
    const rawSrtContent = req.body.srt_content;
    
    // 🎨 НОВАЯ ЛОГИКА: получаем style_id и position из запроса
    const styleId = req.body.style_id || 'tiktok_classic'; // По умолчанию TikTok Classic
    const position = req.body.position || 'bottom'; // По умолчанию снизу
    const customStyle = req.body.custom_style ? JSON.parse(req.body.custom_style) : null;
    const enableHighQuality = req.body.high_quality !== 'false'; // По умолчанию включено
    
    console.log(`[${taskId}] Video size: ${videoBuffer.length} bytes`);
    console.log(`[${taskId}] Raw SRT length: ${rawSrtContent.length} chars`);
    console.log(`[${taskId}] Requested style: ${styleId}`);
    console.log(`[${taskId}] 📍 Position: ${position}`);
    console.log(`[${taskId}] 🎯 High Quality Mode: ${enableHighQuality}`);
    
    // Выбираем стиль
    let selectedStyle;
    if (customStyle) {
      selectedStyle = customStyle;
      console.log(`[${taskId}] Using CUSTOM style:`, customStyle);
    } else if (SUBTITLE_STYLES[styleId]) {
      selectedStyle = SUBTITLE_STYLES[styleId];
      console.log(`[${taskId}] Using predefined style: ${selectedStyle.name}`);
    } else {
      selectedStyle = SUBTITLE_STYLES.tiktok_classic;
      console.log(`[${taskId}] Style not found, using default: ${selectedStyle.name}`);
    }

    // 📍 Применяем позицию субтитров
    if (SUBTITLE_POSITIONS[position]) {
      const positionSettings = SUBTITLE_POSITIONS[position];
      selectedStyle.alignment = positionSettings.alignment;
      selectedStyle.marginv = positionSettings.marginv;
      console.log(`[${taskId}] 📍 Applied position: ${positionSettings.name} (alignment: ${positionSettings.alignment})`);
    } else {
      console.log(`[${taskId}] ⚠️ Invalid position '${position}', using default 'bottom'`);
    }

    // Создаем временные файлы
    const tempDir = '/tmp/processing';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const inputVideoPath = path.join(tempDir, `input_${taskId}.mp4`);
    const srtPath = path.join(tempDir, `subtitles_${taskId}.srt`);
    const outputVideoPath = path.join(tempDir, `output_${taskId}.mp4`);

    // Сохраняем видео
    fs.writeFileSync(inputVideoPath, videoBuffer);

    // 🎯 Определяем формат видео для оптимизации
    console.log(`[${taskId}] 🎯 Detecting video format for optimal quality...`);
    const videoFormat = detectVideoFormat(inputVideoPath);
    console.log(`[${taskId}] 📱 Video format detected: ${videoFormat}`);

    // Beautify SRT
    const beautifiedSRT = beautifySRT(rawSrtContent, taskId);
    fs.writeFileSync(srtPath, beautifiedSRT, 'utf8');

    console.log(`[${taskId}] ✅ Files prepared with HQ style: ${selectedStyle.name || 'Custom'}`);

    // Строим FFmpeg команды с выбранным стилем
    const buildStyleString = (style) => {
      let styleStr = `Fontsize=${style.fontsize}`;
      
      // Название шрифта
      if (style.fontname) {
        styleStr += `,Fontname=${style.fontname}`;
      }
      
      // Цвет текста
      if (style.fontcolor) {
        const color = style.fontcolor.startsWith('&H') ? style.fontcolor : `&H${style.fontcolor}`;
        styleStr += `,PrimaryColour=${color}`;
      }
      
      // Обводка
      if (style.outline) {
        styleStr += `,OutlineColour=&H000000,Outline=${style.outline}`;
      }
      
      // Тень
      if (style.shadow) {
        styleStr += `,Shadow=${style.shadow}`;
      }
      
      // Жирность
      if (style.bold) {
        styleStr += `,Bold=${style.bold}`;
      }
      
      // Выравнивание
      if (style.alignment) {
        styleStr += `,Alignment=${style.alignment}`;
      }
      
      // Отступ
      if (style.marginv) {
        styleStr += `,MarginV=${style.marginv}`;
      }
      
      // Фон
      if (style.backcolour) {
        styleStr += `,BackColour=${style.backcolour}`;
      }
      
      return styleStr;
    };

    const styleString = buildStyleString(selectedStyle);
    const hqStyleString = buildHighQualityStyle(selectedStyle);
    console.log(`[${taskId}] Style string: ${styleString}`);
    console.log(`[${taskId}] HQ Style string: ${hqStyleString}`);

    // 🎯 ВЫСОКОКАЧЕСТВЕННЫЕ КОМАНДЫ FFMPEG - ЧЕТКИЙ ТЕКСТ БЕЗ ПИКСЕЛЕЙ
    const commands = [
      // Команда 1: МАКСИМАЛЬНОЕ КАЧЕСТВО - 4K рендеринг с downscale
      `ffmpeg -i "${inputVideoPath}" -vf "scale=iw*2:ih*2,subtitles='${srtPath}':force_style='${hqStyleString}',scale=iw/2:ih/2:flags=lanczos" -c:a copy -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart -y "${outputVideoPath}"`,
      
      // Команда 2: ВЫСОКОЕ КАЧЕСТВО - увеличенные размеры шрифтов + антиалиасинг
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${hqStyleString}'" -c:a copy -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -movflags +faststart -y "${outputVideoPath}"`,
      
      // Команда 3: УЛУЧШЕННАЯ БАЗОВАЯ - с лучшими настройками кодирования
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontname=DejaVu Sans-Bold,Fontsize=${selectedStyle.fontsize * 2},PrimaryColour=&H${selectedStyle.fontcolor || 'ffffff'},OutlineColour=&H000000,Outline=${(selectedStyle.outline || 3) * 2},Bold=1'" -c:a copy -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -y "${outputVideoPath}"`,
      
      // Команда 4: СТАНДАРТНОЕ КАЧЕСТВО - обычный рендеринг
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleString}'" -c:a copy -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p -y "${outputVideoPath}"`,
      
      // Команда 5: FALLBACK - базовый метод
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`
    ];

    // 🎯 МОБИЛЬНО-ОПТИМИЗИРОВАННЫЕ КОМАНДЫ ДЛЯ РАЗНЫХ ФОРМАТОВ
    const mobileOptimizedCommands = {
      vertical: `ffmpeg -i "${inputVideoPath}" -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,subtitles='${srtPath}':force_style='Fontsize=${selectedStyle.fontsize * 2.5},PrimaryColour=&H${selectedStyle.fontcolor || 'ffffff'},OutlineColour=&H000000,Outline=${(selectedStyle.outline || 3) * 2},Bold=1,Alignment=${selectedStyle.alignment},MarginV=${selectedStyle.marginv * 2}'" -c:a copy -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -movflags +faststart -y "${outputVideoPath}"`,
      
      horizontal: `ffmpeg -i "${inputVideoPath}" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,subtitles='${srtPath}':force_style='Fontsize=${selectedStyle.fontsize * 2.2},PrimaryColour=&H${selectedStyle.fontcolor || 'ffffff'},OutlineColour=&H000000,Outline=${(selectedStyle.outline || 3) * 2},Bold=1,Alignment=${selectedStyle.alignment},MarginV=${selectedStyle.marginv * 1.8}'" -c:a copy -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -movflags +faststart -y "${outputVideoPath}"`,
      
      square: `ffmpeg -i "${inputVideoPath}" -vf "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2,subtitles='${srtPath}':force_style='Fontsize=${selectedStyle.fontsize * 2.3},PrimaryColour=&H${selectedStyle.fontcolor || 'ffffff'},OutlineColour=&H000000,Outline=${(selectedStyle.outline || 3) * 2},Bold=1,Alignment=${selectedStyle.alignment},MarginV=${selectedStyle.marginv * 1.9}'" -c:a copy -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -movflags +faststart -y "${outputVideoPath}"`
    };

    // Если включена мобильная оптимизация, добавляем специальную команду в начало
    if (req.body.mobile_optimized === 'true' && mobileOptimizedCommands[videoFormat]) {
      commands.unshift(mobileOptimizedCommands[videoFormat]);
      console.log(`[${taskId}] 📱 Added mobile-optimized command for ${videoFormat} format`);
    }

    let success = false;
    let usedCommand = 0;
    let methodDescription = '';

    for (let i = 0; i < commands.length && !success; i++) {
      try {
        console.log(`[${taskId}] 🎨 Trying HQ style method ${i + 1}...`);
        console.log(`[${taskId}] Command preview: ${commands[i].substring(0, 150)}...`);
        
        // Удаляем предыдущий файл
        if (fs.existsSync(outputVideoPath)) {
          fs.unlinkSync(outputVideoPath);
        }
        
        const cmdStartTime = Date.now();
        execSync(commands[i], { 
          stdio: 'pipe',
          timeout: 300000,
          maxBuffer: 1024 * 1024 * 100
        });
        const cmdDuration = Date.now() - cmdStartTime;
        
        // Проверяем результат
        if (fs.existsSync(outputVideoPath)) {
          const outputSize = fs.statSync(outputVideoPath).size;
          if (outputSize > 0) {
            console.log(`[${taskId}] ✅ SUCCESS! HQ method ${i + 1} worked! (${cmdDuration}ms)`);
            console.log(`[${taskId}] Output size: ${outputSize} bytes`);
            
            success = true;
            usedCommand = i + 1;
            
            const descriptions = [
              req.body.mobile_optimized === 'true' ? `MOBILE_OPTIMIZED_${videoFormat.toUpperCase()}` : 'SUPER_HQ_4K_DOWNSCALE',
              'HIGH_QUALITY_ENHANCED_FONTS',
              'IMPROVED_BASIC_HQ',
              'STANDARD_QUALITY',
              'FALLBACK_BASIC'
            ];
            methodDescription = descriptions[req.body.mobile_optimized === 'true' ? 0 : i];
            
            break;
          }
        }
        
      } catch (error) {
        console.log(`[${taskId}] ❌ HQ method ${i + 1} failed:`, error.message);
      }
    }

    if (!success) {
      throw new Error('All HQ style methods failed');
    }

    // Читаем результат
    const processedVideoBuffer = fs.readFileSync(outputVideoPath);
    const processingTime = Date.now() - startTime;

    console.log(`[${taskId}] 🎉 HIGH QUALITY STYLED SUBTITLES SUCCESS! 🎨✨`);
    console.log(`[${taskId}] Style: ${selectedStyle.name || 'Custom'}`);
    console.log(`[${taskId}] Video Format: ${videoFormat}`);
    console.log(`[${taskId}] Method: ${methodDescription}`);
    console.log(`[${taskId}] Command: ${usedCommand}`);
    console.log(`[${taskId}] Processing time: ${processingTime}ms`);

    // Очистка временных файлов
    [inputVideoPath, srtPath, outputVideoPath].forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (err) {
        console.warn(`[${taskId}] Failed to delete: ${filePath}`);
      }
    });

    res.json({
      success: true,
      task_id: taskId,
      processing_stats: {
        processing_time_ms: processingTime,
        input_size_bytes: videoBuffer.length,
        output_size_bytes: processedVideoBuffer.length,
        compression_ratio: (processedVideoBuffer.length / videoBuffer.length).toFixed(2),
        method_used: methodDescription,
        command_number: usedCommand,
        video_format: videoFormat,
        high_quality_mode: enableHighQuality
      },
      video_data: processedVideoBuffer.toString('base64'),
      content_type: 'video/mp4',
      style_info: {
        style_id: customStyle ? 'custom' : styleId,
        style_name: selectedStyle.name || 'Custom Style',
        style_description: selectedStyle.description || 'Custom user style',
        position: position,
        position_name: SUBTITLE_POSITIONS[position]?.name || 'Снизу',
        applied_settings: selectedStyle,
        quality_mode: 'HIGH_QUALITY_RENDERING'
      }
    });

  } catch (error) {
    console.error(`[${taskId}] 💥 HQ STYLE ERROR:`, error.message);

    // Очистка при ошибке
    const tempFiles = [
      `/tmp/processing/input_${taskId}.mp4`,
      `/tmp/processing/subtitles_${taskId}.srt`,
      `/tmp/processing/output_${taskId}.mp4`,
      `/tmp/processing/text_${taskId}.txt`
    ];
    
    tempFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (err) {
        // Игнорируем ошибки очистки
      }
    });

    res.status(500).json({
      success: false,
      task_id: taskId,
      error: error.message,
      processing_time_ms: Date.now() - startTime
    });
  }
});

app.listen(PORT, () => {
  console.log(`🎨 HIGH QUALITY SOCIAL MEDIA Subtitle Service running on port ${PORT} 🎨`);
  console.log(`📱 Ready for TikTok, Instagram, YouTube styles with CRYSTAL CLEAR text!`);
  console.log(`🎬 Total available HQ styles: ${Object.keys(SUBTITLE_STYLES).length}`);
  console.log(`🎯 Features: 4K downscale, mobile optimization, smart font fallbacks`);
  const systemInfo = getSystemInfo();
  console.log(`FFmpeg: ${systemInfo.ffmpeg_available}`);
  console.log(`Quality Mode: HIGH_QUALITY_RENDERING`);
});
