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

// 🎨 ГОТОВЫЕ СТИЛИ ДЛЯ СОЦИАЛЬНЫХ СЕТЕЙ (ВЫСОКОЕ КАЧЕСТВО + УМНЫЕ FALLBACK ШРИФТЫ)
const SUBTITLE_STYLES = {
  // TikTok стили - ВЫСОКОЕ КАЧЕСТВО
  tiktok_classic: {
    fontsize: 16,  // Увеличено с 8 до 16
    fontcolor: 'ffffff',
    fontname: 'DejaVu Sans-Bold',
    fontnames: ['Ubuntu-Bold', 'Liberation Sans-Bold', 'DejaVu Sans-Bold'],
    outline: 4,   // Увеличено с 2 до 4
    shadow: 2,    // Увеличено с 1 до 2
    bold: 1,
    alignment: 2,
    marginv: 30,  // Увеличено с 15 до 30
    backcolour: '&H80000000',
    name: 'TikTok Classic HQ',
    description: 'Классический TikTok - белый жирный текст с черным фоном (высокое качество)'
  },
  
  tiktok_neon: {
    fontsize: 18,  // Увеличено с 9 до 18
    fontcolor: '00ffff',
    fontname: 'Liberation Sans-Bold',
    fontnames: ['Roboto-Bold', 'Liberation Sans-Bold', 'Noto Sans-Bold'],
    outline: 5,
    shadow: 3,
    bold: 1,
    alignment: 2,
    marginv: 35,  // Увеличено
    name: 'TikTok Neon HQ',
    description: 'Неоновый TikTok стиль - яркий голубой с сильной обводкой (HQ)'
  },
  
  tiktok_yellow: {
    fontsize: 18,  // Увеличено
    fontcolor: 'ffff00',
    fontname: 'Ubuntu-Bold',
    fontnames: ['Ubuntu-Bold', 'Open Sans-Bold', 'DejaVu Sans-Bold'],
    outline: 5,
    shadow: 3,
    bold: 1,
    alignment: 2,
    marginv: 30,
    name: 'TikTok Yellow HQ',
    description: 'Желтый TikTok стиль - как у популярных блогеров (HQ)'
  },
  
  // Instagram стили - ВЫСОКОЕ КАЧЕСТВО
  instagram_clean: {
    fontsize: 15,  // Увеличено с 8 до 15
    fontcolor: 'ffffff',
    fontname: 'Noto Sans-Bold',
    fontnames: ['Noto Sans-Bold', 'Open Sans-Bold', 'Liberation Sans-Bold'],
    outline: 3,
    shadow: 2,
    alignment: 2,
    marginv: 40,  // Увеличено
    backcolour: '&H60000000',
    name: 'Instagram Clean HQ',
    description: 'Чистый Instagram стиль - элегантный белый текст (HQ)'
  },
  
  instagram_story: {
    fontsize: 14,  // Увеличено с 7 до 14
    fontcolor: 'ffffff',
    fontname: 'Roboto-Bold',
    fontnames: ['Roboto-Bold', 'Noto Sans-Bold', 'DejaVu Sans-Bold'],
    outline: 3,
    shadow: 2,
    alignment: 2,
    marginv: 45,  // Увеличено
    name: 'Instagram Story HQ',
    description: 'Стиль Instagram Stories - тонкий и изящный (HQ)'
  },
  
  instagram_reel: {
    fontsize: 16,  // Увеличено с 8 до 16
    fontcolor: 'ffffff',
    fontname: 'Open Sans-Bold',
    fontnames: ['Open Sans-Bold', 'Liberation Sans-Bold', 'DejaVu Sans-Bold'],
    outline: 4,
    shadow: 3,
    bold: 1,
    alignment: 2,
    marginv: 30,
    backcolour: '&H80000000',
    name: 'Instagram Reel HQ',
    description: 'Стиль Instagram Reels - жирный и контрастный (HQ)'
  },
  
  // YouTube стили - ВЫСОКОЕ КАЧЕСТВО
  youtube_classic: {
    fontsize: 14,  // Увеличено с 7 до 14
    fontcolor: 'ffffff',
    fontname: 'Liberation Sans-Bold',
    fontnames: ['Source Sans Pro-Bold', 'Liberation Sans-Bold', 'Noto Sans-Bold'],
    outline: 3,
    shadow: 2,
    alignment: 2,
    marginv: 35,  // Увеличено
    name: 'YouTube Classic HQ',
    description: 'Классический YouTube - стандартные субтитры (HQ)'
  },
  
  youtube_gaming: {
    fontsize: 16,  // Увеличено с 8 до 16
    fontcolor: '00ff00',
    fontname: 'DejaVu Sans-Bold',
    fontnames: ['Ubuntu-Bold', 'DejaVu Sans-Bold', 'Liberation Sans-Bold'],
    outline: 4,
    shadow: 3,
    bold: 1,
    alignment: 2,
    marginv: 32,
    name: 'YouTube Gaming HQ',
    description: 'Игровой стиль YouTube - зеленый геймерский (HQ)'
  },
  
  // Современные трендовые стили - ВЫСОКОЕ КАЧЕСТВО
  modern_gradient: {
    fontsize: 18,  // Увеличено
    fontcolor: 'ff69b4',
    fontname: 'Open Sans-Bold',
    fontnames: ['Montserrat-Bold', 'Open Sans-Bold', 'Liberation Sans-Bold'],
    outline: 5,
    shadow: 3,
    bold: 1,
    alignment: 2,
    marginv: 30,
    name: 'Modern Pink HQ',
    description: 'Модерн розовый - трендовый цвет 2024 (HQ)'
  },
  
  retro_vhs: {
    fontsize: 16,  // Увеличено
    fontcolor: 'ff00ff',
    fontname: 'DejaVu Sans-Bold',
    fontnames: ['Ubuntu-Bold', 'DejaVu Sans-Bold', 'Liberation Sans-Bold'],
    outline: 4,
    shadow: 3,
    bold: 1,
    alignment: 2,
    marginv: 32,
    name: 'Retro VHS HQ',
    description: 'Ретро VHS стиль - фиолетовый винтаж (HQ)'
  },
  
  minimal_black: {
    fontsize: 14,  // Увеличено
    fontcolor: '000000',
    fontname: 'Noto Sans-Bold',
    fontnames: ['Roboto-Bold', 'Noto Sans-Bold', 'Liberation Sans-Bold'],
    outline: 0,
    shadow: 0,
    alignment: 2,
    marginv: 25,
    backcolour: '&H80ffffff',
    name: 'Minimal Black HQ',
    description: 'Минималистичный - черный текст на белом фоне (HQ)'
  },
  
  // Премиум стили - ВЫСОКОЕ КАЧЕСТВО
  luxury_gold: {
    fontsize: 18,  // Увеличено
    fontcolor: 'ffd700',
    fontname: 'DejaVu Sans-Bold',
    fontnames: ['Ubuntu-Bold', 'DejaVu Sans-Bold', 'Liberation Sans-Bold'],
    outline: 5,
    shadow: 3,
    bold: 1,
    alignment: 2,
    marginv: 35,
    backcolour: '&H80000000',
    name: 'Luxury Gold HQ',
    description: 'Премиум золотой - роскошный стиль (HQ)'
  },
  
  neon_purple: {
    fontsize: 18,  // Увеличено
    fontcolor: '9400d3',
    fontname: 'Liberation Sans-Bold',
    fontnames: ['Open Sans-Bold', 'Liberation Sans-Bold', 'Noto Sans-Bold'],
    outline: 5,
    shadow: 3,
    bold: 1,
    alignment: 2,
    marginv: 30,
    name: 'Neon Purple HQ',
    description: 'Неоновый фиолетовый - киберпанк стиль (HQ)'
  }
};

// 📍 ПОЗИЦИИ СУБТИТРОВ
const SUBTITLE_POSITIONS = {
  bottom: {
    alignment: 2,     // По центру
    marginv: 30,      // Увеличенный отступ снизу
    name: 'Снизу',
    description: 'Субтитры внизу экрана (стандарт)'
  },
  top: {
    alignment: 8,     // По центру вверху  
    marginv: 30,      // Увеличенный отступ сверху
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
      
      // Команда 4: СТАНДАРТНОЕ
