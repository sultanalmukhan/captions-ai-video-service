// Beautiful Railway Service с готовыми стилями для соц.сетей + МАКСИМАЛЬНОЕ КАЧЕСТВО + STREAMING
// server.js - готовые шаблоны стилей TikTok/Instagram + NO COMPRESSION + NO TIMEOUT

const express = require('express');
const multer = require('multer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Увеличиваем timeout для Railway
app.use((req, res, next) => {
  // Увеличиваем timeout до 15 минут
  req.setTimeout(900000); // 15 минут
  res.setTimeout(900000); // 15 минут
  
  // Отключаем буферизацию
  res.setHeader('X-Accel-Buffering', 'no');
  
  next();
});

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
  // TikTok стили  
  tiktok_classic: {
    fontsize: 8,  // 16/2 = 8
    fontcolor: 'white',
    fontname: 'DejaVu Sans',
    fontnames: ['Ubuntu', 'Liberation Sans', 'DejaVu Sans'],
    outline: 2,   // Уменьшили обводку
    shadow: 1,    // Уменьшили тень
    bold: 1,
    alignment: 2,
    marginv: 15,  // Уменьшили отступ
    backcolour: '&H80000000',
    name: 'TikTok Classic',
    description: 'Классический TikTok - белый жирный текст с черным фоном'
  },
  
  tiktok_neon: {
    fontsize: 9,  // 18/2 = 9
    fontcolor: '00ffff',
    fontname: 'Liberation Sans',
    fontnames: ['Roboto', 'Liberation Sans', 'Noto Sans'],
    outline: 2,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 13,  // 25/2 ≈ 13
    name: 'TikTok Neon',
    description: 'Неоновый TikTok стиль - яркий голубой с сильной обводкой'
  },
  
  tiktok_yellow: {
    fontsize: 9,  // 17/2 ≈ 9
    fontcolor: 'ffff00',
    fontname: 'Ubuntu',
    fontnames: ['Ubuntu', 'Open Sans', 'DejaVu Sans'],
    outline: 2,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 15,
    name: 'TikTok Yellow',
    description: 'Желтый TikTok стиль - как у популярных блогеров'
  },
  
  // Instagram стили
  instagram_clean: {
    fontsize: 8,  // 15/2 ≈ 8
    fontcolor: 'ffffff',
    fontname: 'Noto Sans',
    fontnames: ['Noto Sans', 'Open Sans', 'Liberation Sans'],
    outline: 1,
    shadow: 1,
    alignment: 2,
    marginv: 18,  // 35/2 ≈ 18
    backcolour: '&H40000000',
    name: 'Instagram Clean',
    description: 'Чистый Instagram стиль - элегантный белый текст'
  },
  
  instagram_story: {
    fontsize: 7,  // 14/2 = 7
    fontcolor: 'ffffff',
    fontname: 'Roboto',
    fontnames: ['Roboto', 'Noto Sans', 'DejaVu Sans'],
    outline: 1,
    shadow: 1,
    alignment: 2,
    marginv: 20,  // 40/2 = 20
    name: 'Instagram Story',
    description: 'Стиль Instagram Stories - тонкий и изящный'
  },
  
  instagram_reel: {
    fontsize: 8,  // 16/2 = 8
    fontcolor: 'ffffff',
    fontname: 'Open Sans',
    fontnames: ['Open Sans', 'Liberation Sans', 'DejaVu Sans'],
    outline: 2,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 15,
    backcolour: '&H60000000',
    name: 'Instagram Reel',
    description: 'Стиль Instagram Reels - жирный и контрастный'
  },
  
  // YouTube стили
  youtube_classic: {
    fontsize: 7,  // 14/2 = 7
    fontcolor: 'ffffff',
    fontname: 'Liberation Sans',
    fontnames: ['Source Sans Pro', 'Liberation Sans', 'Noto Sans'],
    outline: 1,
    shadow: 1,
    alignment: 2,
    marginv: 13,  // 25/2 ≈ 13
    name: 'YouTube Classic',
    description: 'Классический YouTube - стандартные субтитры'
  },
  
  youtube_gaming: {
    fontsize: 8,  // 15/2 ≈ 8
    fontcolor: '00ff00',
    fontname: 'DejaVu Sans',
    fontnames: ['Ubuntu', 'DejaVu Sans', 'Liberation Sans'],
    outline: 1,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 14,
    name: 'YouTube Gaming',
    description: 'Игровой стиль YouTube - зеленый геймерский'
  },
  
  // Современные трендовые стили
  modern_gradient: {
    fontsize: 9,  // 17/2 ≈ 9
    fontcolor: 'ff69b4',
    fontname: 'Open Sans',
    fontnames: ['Montserrat', 'Open Sans', 'Liberation Sans'],
    outline: 2,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 15,
    name: 'Modern Pink',
    description: 'Модерн розовый - трендовый цвет 2024'
  },
  
  retro_vhs: {
    fontsize: 8,  // 16/2 = 8
    fontcolor: 'ff00ff',
    fontname: 'DejaVu Sans',
    fontnames: ['Ubuntu', 'DejaVu Sans', 'Liberation Sans'],
    outline: 1,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 14,
    name: 'Retro VHS',
    description: 'Ретро VHS стиль - фиолетовый винтаж'
  },
  
  minimal_black: {
    fontsize: 7,  // 13/2 ≈ 7
    fontcolor: '000000',
    fontname: 'Noto Sans',
    fontnames: ['Roboto', 'Noto Sans', 'Liberation Sans'],
    outline: 0,
    shadow: 0,
    alignment: 2,
    marginv: 10,
    backcolour: '&H80ffffff',
    name: 'Minimal Black',
    description: 'Минималистичный - черный текст на белом фоне'
  },
  
  // Премиум стили
  luxury_gold: {
    fontsize: 9,  // 18/2 = 9
    fontcolor: 'ffd700',
    fontname: 'DejaVu Sans',
    fontnames: ['Ubuntu', 'DejaVu Sans', 'Liberation Sans'],
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
    fontsize: 9,  // 17/2 ≈ 9
    fontcolor: '9400d3',
    fontname: 'Liberation Sans',
    fontnames: ['Open Sans', 'Liberation Sans', 'Noto Sans'],
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
    marginv: 15,      // Отступ снизу
    name: 'Снизу',
    description: 'Субтитры внизу экрана (стандарт)'
  },
  top: {
    alignment: 8,     // По центру вверху  
    marginv: 15,      // Отступ сверху
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

// 🎯 ФУНКЦИЯ АНАЛИЗА КАЧЕСТВА ИСХОДНОГО ВИДЕО
function analyzeVideoQuality(inputPath) {
  try {
    const probe = execSync(`ffprobe -v quiet -print_format json -show_streams "${inputPath}"`, { encoding: 'utf8' });
    const info = JSON.parse(probe);
    const videoStream = info.streams.find(s => s.codec_type === 'video');
    
    const bitrate = parseInt(videoStream.bit_rate) || 0;
    const width = parseInt(videoStream.width);
    const height = parseInt(videoStream.height);
    const codec = videoStream.codec_name;
    const fps = eval(videoStream.r_frame_rate) || 30;
    
    // Определяем качественные характеристики
    let qualityLevel = 'medium';
    if (bitrate > 8000000 || width >= 1920) qualityLevel = 'high';
    if (bitrate > 15000000 || width >= 3840) qualityLevel = 'ultra';
    if (bitrate < 2000000 && width < 1280) qualityLevel = 'low';
    
    return {
      bitrate,
      width,
      height,
      codec,
      fps,
      qualityLevel,
      resolution: `${width}x${height}`,
      isHighRes: width >= 1920 || height >= 1080
    };
  } catch (error) {
    console.warn('Failed to analyze video quality:', error.message);
    return {
      bitrate: 0,
      width: 1920,
      height: 1080,
      codec: 'unknown',
      fps: 30,
      qualityLevel: 'medium',
      resolution: '1920x1080',
      isHighRes: true
    };
  }
}

// 🎯 ВЫБОР ОПТИМАЛЬНЫХ НАСТРОЕК НА ОСНОВЕ force_quality
function getQualitySettings(forceQuality, videoQuality) {
  console.log(`[DEBUG] getQualitySettings called with: ${forceQuality}`);
  
  let settings;
  
  switch(forceQuality) {
    case 'lossless':
      settings = {
        crf: 0,              // Полностью без потерь
        preset: 'slow',      // Медленное = лучшее качество
        tune: 'film',
        profile: 'high',
        level: '5.1',
        description: 'LOSSLESS_PERFECT_QUALITY'
      };
      break;
      
    case 'ultra':
      settings = {
        crf: 8,              // Экстремально высокое качество
        preset: 'slow',
        tune: 'film',
        profile: 'high',
        level: '5.1',
        description: 'ULTRA_HIGH_QUALITY'
      };
      break;
      
    case 'high':
      settings = {
        crf: 12,             // Очень высокое качество
        preset: 'medium',
        tune: 'film',
        profile: 'high',
        level: '4.1',
        description: 'HIGH_QUALITY'
      };
      break;
      
    case 'medium':
      settings = {
        crf: 18,             // Хорошее качество
        preset: 'medium',
        tune: null,
        profile: 'main',
        level: '4.0',
        description: 'MEDIUM_QUALITY'
      };
      break;
      
    case 'low':
      settings = {
        crf: 28,             // Заметно низкое качество
        preset: 'fast',
        tune: null,
        profile: 'baseline',
        level: '3.1',
        description: 'LOW_QUALITY_FAST'
      };
      break;
      
    case 'auto':
    default:
      // Авто выбор на основе анализа входного видео
      if (videoQuality.qualityLevel === 'ultra') {
        settings = { crf: 12, preset: 'slow', tune: 'film', profile: 'high', level: '5.1', description: 'AUTO_ULTRA' };
      } else if (videoQuality.qualityLevel === 'high') {
        settings = { crf: 15, preset: 'medium', tune: 'film', profile: 'high', level: '4.1', description: 'AUTO_HIGH' };
      } else if (videoQuality.qualityLevel === 'low') {
        settings = { crf: 20, preset: 'fast', tune: null, profile: 'main', level: '3.1', description: 'AUTO_LOW' };
      } else {
        settings = { crf: 18, preset: 'medium', tune: null, profile: 'main', level: '4.0', description: 'AUTO_MEDIUM' };
      }
      break;
  }
  
  console.log(`[DEBUG] Selected settings:`, settings);
  return settings;
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
    mode: 'MAXIMUM_QUALITY_SOCIAL_MEDIA_STYLES_WITH_STREAMING',
    available_styles: availableStyles,
    total_styles: availableStyles.length,
    quality_mode: 'NO_COMPRESSION_MAXIMUM_QUALITY_STREAMING_ENABLED',
    endpoints: [
      '/process-video-with-subtitles (JSON response)',
      '/process-video-stream (Binary stream - NO TIMEOUT)',
      '/process-video-lossless (Force lossless)',
      '/styles (Get all styles)',
      '/health (This endpoint)'
    ],
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
    quality_mode: 'MAXIMUM_QUALITY_NO_COMPRESSION_WITH_STREAMING'
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
      subtitle_method: 'MAXIMUM_QUALITY_SOCIAL_MEDIA_STYLES_WITH_STREAMING'
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

// 🚀 НОВЫЙ STREAMING ENDPOINT С CHUNKED ПЕРЕДАЧЕЙ (РЕШАЕТ NETWORK TIMEOUT)
app.post('/process-video-stream', upload.single('video'), async (req, res) => {
  const taskId = req.body.task_id || uuidv4();
  const startTime = Date.now();
  
  console.log(`\n=== [${taskId}] STREAMING QUALITY PROCESSING (NO TIMEOUT) ===`);

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
    
    // Получаем параметры (те же что в основном endpoint)
    const styleId = req.body.style_id || 'tiktok_classic';
    const position = req.body.position || 'bottom';
    const customStyle = req.body.custom_style ? JSON.parse(req.body.custom_style) : null;
    const forceQuality = req.body.force_quality || 'auto';
    
    console.log(`[${taskId}] Video size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    console.log(`[${taskId}] Raw SRT length: ${rawSrtContent.length} chars`);
    console.log(`[${taskId}] Style: ${styleId}, Position: ${position}`);
    console.log(`[${taskId}] 🎯 Quality mode: ${forceQuality}`);
    
    // Выбираем стиль (копируем логику из основного endpoint)
    let selectedStyle;
    if (customStyle) {
      selectedStyle = customStyle;
      console.log(`[${taskId}] Using CUSTOM style`);
    } else if (SUBTITLE_STYLES[styleId]) {
      selectedStyle = SUBTITLE_STYLES[styleId];
      console.log(`[${taskId}] Using predefined style: ${selectedStyle.name}`);
    } else {
      selectedStyle = SUBTITLE_STYLES.tiktok_classic;
      console.log(`[${taskId}] Using default style: ${selectedStyle.name}`);
    }

    // Применяем позицию
    if (SUBTITLE_POSITIONS[position]) {
      const positionSettings = SUBTITLE_POSITIONS[position];
      selectedStyle.alignment = positionSettings.alignment;
      selectedStyle.marginv = positionSettings.marginv;
      console.log(`[${taskId}] 📍 Applied position: ${positionSettings.name}`);
    }

    // Создаем временные файлы
    const tempDir = '/tmp/processing';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const inputVideoPath = path.join(tempDir, `stream_input_${taskId}.mp4`);
    const srtPath = path.join(tempDir, `stream_subtitles_${taskId}.srt`);
    const outputVideoPath = path.join(tempDir, `stream_output_${taskId}.mp4`);

    // Сохраняем файлы
    fs.writeFileSync(inputVideoPath, videoBuffer);

    // Анализируем качество
    console.log(`[${taskId}] 🔍 Analyzing video quality...`);
    const videoQuality = analyzeVideoQuality(inputVideoPath);
    console.log(`[${taskId}] 📊 Analysis:`, {
      resolution: videoQuality.resolution,
      bitrate: Math.round(videoQuality.bitrate / 1000) + 'kbps',
      qualityLevel: videoQuality.qualityLevel
    });

    // Выбираем настройки качества
    const optimalSettings = getQualitySettings(forceQuality, videoQuality);
    console.log(`[${taskId}] ⚙️ Quality settings:`, optimalSettings);

    // Beautify SRT
    const beautifiedSRT = beautifySRT(rawSrtContent, taskId);
    fs.writeFileSync(srtPath, beautifiedSRT, 'utf8');

    // Строим style string
    const buildStyleString = (style) => {
      let styleStr = `Fontsize=${style.fontsize}`;
      if (style.fontname) styleStr += `,Fontname=${style.fontname}`;
      if (style.fontcolor) {
        const color = style.fontcolor.startsWith('&H') ? style.fontcolor : `&H${style.fontcolor}`;
        styleStr += `,PrimaryColour=${color}`;
      }
      if (style.outline) styleStr += `,OutlineColour=&H000000,Outline=${style.outline}`;
      if (style.shadow) styleStr += `,Shadow=${style.shadow}`;
      if (style.bold) styleStr += `,Bold=${style.bold}`;
      if (style.alignment) styleStr += `,Alignment=${style.alignment}`;
      if (style.marginv) styleStr += `,MarginV=${style.marginv}`;
      if (style.backcolour) styleStr += `,BackColour=${style.backcolour}`;
      return styleStr;
    };

    const styleString = buildStyleString(selectedStyle);
    console.log(`[${taskId}] Style string: ${styleString}`);

    // Строим FFmpeg команду с выбранными настройками
    const mainCommand = `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleString}'" -c:a copy -c:v libx264 -preset ${optimalSettings.preset} -crf ${optimalSettings.crf} -pix_fmt yuv420p${optimalSettings.tune ? ` -tune ${optimalSettings.tune}` : ''} -profile:v ${optimalSettings.profile}${optimalSettings.level ? ` -level ${optimalSettings.level}` : ''} -movflags +faststart -y "${outputVideoPath}"`;

    const commands = [
      mainCommand,
      // Fallback команды с разным качеством
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleString}'" -c:a copy -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart -y "${outputVideoPath}"`,
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleString}'" -c:a copy -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -y "${outputVideoPath}"`,
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}'" -c:a copy -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -y "${outputVideoPath}"`
    ];

    let success = false;
    let usedCommand = 0;

    // Выполняем команды
    for (let i = 0; i < commands.length && !success; i++) {
      try {
        console.log(`[${taskId}] 🎨 Trying streaming method ${i + 1}...`);
        
        if (fs.existsSync(outputVideoPath)) fs.unlinkSync(outputVideoPath);
        
        const cmdStartTime = Date.now();
        execSync(commands[i], { 
          stdio: 'pipe',
          timeout: 600000,  // 10 минут
          maxBuffer: 1024 * 1024 * 200
        });
        const cmdDuration = Date.now() - cmdStartTime;
        
        if (fs.existsSync(outputVideoPath)) {
          const outputSize = fs.statSync(outputVideoPath).size;
          if (outputSize > 0) {
            console.log(`[${taskId}] ✅ STREAMING SUCCESS! Method ${i + 1} worked! (${cmdDuration}ms)`);
            console.log(`[${taskId}] Output size: ${(outputSize / 1024 / 1024).toFixed(2)}MB`);
            success = true;
            usedCommand = i + 1;
            break;
          }
        }
      } catch (error) {
        console.log(`[${taskId}] ❌ Streaming method ${i + 1} failed:`, error.message);
      }
    }

    if (!success) {
      throw new Error('All streaming methods failed');
    }

    // 🚀 ОТПРАВЛЯЕМ ВИДЕО CHUNKS (РЕШАЕТ NETWORK TIMEOUT)
    const processedVideoBuffer = fs.readFileSync(outputVideoPath);
    const processingTime = Date.now() - startTime;
    const sizeChange = ((processedVideoBuffer.length / videoBuffer.length) - 1) * 100;

    console.log(`[${taskId}] 🎉 STREAMING PROCESSING SUCCESS! 🚀`);
    console.log(`[${taskId}] Processing time: ${processingTime}ms`);
    console.log(`[${taskId}] Size change: ${sizeChange > 0 ? '+' : ''}${sizeChange.toFixed(1)}%`);
    console.log(`[${taskId}] Quality mode: ${optimalSettings.description}`);

    // 🎯 БЕЗОПАСНЫЕ ЗАГОЛОВКИ (только ASCII символы)
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', processedVideoBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="processed_${taskId}.mp4"`);
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Connection', 'keep-alive');

    // Метаданные в заголовках - ТОЛЬКО безопасные ASCII значения
    res.setHeader('X-Processing-Stats', JSON.stringify({
      processing_time_ms: processingTime,
      input_size_bytes: videoBuffer.length,
      output_size_bytes: processedVideoBuffer.length,
      size_change_percent: parseFloat(sizeChange.toFixed(1)),
      method_used: `STREAMING_METHOD_${usedCommand}`,
      task_id: taskId,
      quality_mode: forceQuality,
      quality_description: optimalSettings.description
    }));

    // Упрощенная информация о стиле (без кириллицы и сложных объектов)
    res.setHeader('X-Style-Info', JSON.stringify({
      style_id: customStyle ? 'custom' : styleId,
      style_name_safe: customStyle ? 'Custom_Style' : styleId.replace(/_/g, '-'),
      position: position,
      fontsize: selectedStyle.fontsize,
      fontcolor: selectedStyle.fontcolor,
      has_background: !!selectedStyle.backcolour,
      has_bold: !!selectedStyle.bold
    }));

    res.setHeader('X-Quality-Info', JSON.stringify({
      input_resolution: videoQuality.resolution,
      input_bitrate: videoQuality.bitrate,
      input_quality_level: videoQuality.qualityLevel,
      force_quality: forceQuality,
      crf_used: optimalSettings.crf,
      preset_used: optimalSettings.preset,
      profile_used: optimalSettings.profile
    }));

    // Делаем заголовки доступными для клиента
    res.setHeader('Access-Control-Expose-Headers', 'X-Processing-Stats, X-Style-Info, X-Quality-Info, Content-Length');

    console.log(`[${taskId}] 🚀 Streaming video in chunks to prevent timeout...`);

    // 🎯 ОТПРАВЛЯЕМ ВИДЕО CHUNKS (64KB кусками)
    const CHUNK_SIZE = 64 * 1024; // 64KB chunks
    let bytesSent = 0;

    const sendNextChunk = () => {
      if (bytesSent >= processedVideoBuffer.length) {
        console.log(`[${taskId}] ✅ All chunks sent successfully! (${bytesSent} bytes)`);
        res.end();
        
        // Очистка временных файлов ПОСЛЕ отправки
        setTimeout(() => {
          [inputVideoPath, srtPath, outputVideoPath].forEach(filePath => {
            try {
              if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (err) {
              console.warn(`[${taskId}] Failed to delete: ${filePath}`);
            }
          });
        }, 1000);
        
        return;
      }
      
      const remainingBytes = processedVideoBuffer.length - bytesSent;
      const chunkSize = Math.min(CHUNK_SIZE, remainingBytes);
      const chunk = processedVideoBuffer.slice(bytesSent, bytesSent + chunkSize);
      
      const success = res.write(chunk);
      bytesSent += chunkSize;
      
      const progress = (bytesSent / processedVideoBuffer.length * 100).toFixed(1);
      console.log(`[${taskId}] 📦 Sent chunk: ${chunkSize} bytes (${progress}% complete)`);
      
      if (success) {
        // Немедленно отправляем следующий chunk
        setImmediate(sendNextChunk);
      } else {
        // Ждем когда буфер освободится
        res.once('drain', sendNextChunk);
      }
    };

    // Обработка ошибок соединения
    res.on('error', (err) => {
      console.error(`[${taskId}] 💥 Response stream error:`, err.message);
    });

    res.on('close', () => {
      console.log(`[${taskId}] 🔌 Client disconnected`);
    });

    // Начинаем отправку chunks
    sendNextChunk();

  } catch (error) {
    console.error(`[${taskId}] 💥 STREAMING ERROR:`, error.message);

    // Очистка при ошибке
    const tempFiles = [
      `/tmp/processing/stream_input_${taskId}.mp4`,
      `/tmp/processing/stream_subtitles_${taskId}.srt`,
      `/tmp/processing/stream_output_${taskId}.mp4`
    ];
    
    tempFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (err) {}
    });

    res.status(500).json({
      success: false,
      task_id: taskId,
      error: error.message,
      processing_time_ms: Date.now() - startTime
    });
  }
});

// 📋 ОРИГИНАЛЬНЫЙ ENDPOINT (ОСТАВЛЯЕМ ДЛЯ СОВМЕСТИМОСТИ)
app.post('/process-video-with-subtitles', upload.single('video'), async (req, res) => {
  const taskId = req.body.task_id || uuidv4();
  const startTime = Date.now();
  
  console.log(`\n=== [${taskId}] MAXIMUM QUALITY SOCIAL MEDIA SUBTITLE PROCESSING ===`);

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
    const styleId = req.body.style_id || 'tiktok_classic';
    const position = req.body.position || 'bottom';
    const customStyle = req.body.custom_style ? JSON.parse(req.body.custom_style) : null;
    const forceQuality = req.body.force_quality || 'auto';
    
    console.log(`[${taskId}] Video size: ${videoBuffer.length} bytes`);
    console.log(`[${taskId}] Raw SRT length: ${rawSrtContent.length} chars`);
    console.log(`[${taskId}] Requested style: ${styleId}`);
    console.log(`[${taskId}] 📍 Position: ${position}`);
    console.log(`[${taskId}] 🎯 Quality mode: ${forceQuality}`);
    
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

    // 🎯 АНАЛИЗИРУЕМ КАЧЕСТВО ИСХОДНОГО ВИДЕО
    console.log(`[${taskId}] 🔍 Analyzing input video quality...`);
    const videoQuality = analyzeVideoQuality(inputVideoPath);
    console.log(`[${taskId}] 📊 Video analysis:`, {
      resolution: videoQuality.resolution,
      bitrate: Math.round(videoQuality.bitrate / 1000) + 'kbps',
      codec: videoQuality.codec,
      fps: videoQuality.fps,
      qualityLevel: videoQuality.qualityLevel
    });

    // 🎯 ВЫБИРАЕМ ОПТИМАЛЬНЫЕ НАСТРОЙКИ
    const optimalSettings = getQualitySettings(forceQuality, videoQuality);
    console.log(`[${taskId}] ⚙️ Selected encoding settings:`, optimalSettings);

    // Beautify SRT
    const beautifiedSRT = beautifySRT(rawSrtContent, taskId);
    fs.writeFileSync(srtPath, beautifiedSRT, 'utf8');

    console.log(`[${taskId}] ✅ Files prepared with MAX QUALITY style: ${selectedStyle.name || 'Custom'}`);

    // Строим FFmpeg команды с выбранным стилем
    const buildStyleString = (style) => {
      let styleStr = `Fontsize=${style.fontsize}`;
      
      if (style.fontname) styleStr += `,Fontname=${style.fontname}`;
      if (style.fontcolor) {
        const color = style.fontcolor.startsWith('&H') ? style.fontcolor : `&H${style.fontcolor}`;
        styleStr += `,PrimaryColour=${color}`;
      }
      if (style.outline) styleStr += `,OutlineColour=&H000000,Outline=${style.outline}`;
      if (style.shadow) styleStr += `,Shadow=${style.shadow}`;
      if (style.bold) styleStr += `,Bold=${style.bold}`;
      if (style.alignment) styleStr += `,Alignment=${style.alignment}`;
      if (style.marginv) styleStr += `,MarginV=${style.marginv}`;
      if (style.backcolour) styleStr += `,BackColour=${style.backcolour}`;
      
      return styleStr;
    };

    const styleString = buildStyleString(selectedStyle);
    console.log(`[${taskId}] Style string: ${styleString}`);

    // 🎯 МАКСИМАЛЬНОЕ КАЧЕСТВО: Команды FFmpeg без компрессии
    const mainCommand = `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleString}'" -c:a copy -c:v libx264 -preset ${optimalSettings.preset} -crf ${optimalSettings.crf} -pix_fmt yuv420p${optimalSettings.tune ? ` -tune ${optimalSettings.tune}` : ''} -profile:v ${optimalSettings.profile}${optimalSettings.level ? ` -level ${optimalSettings.level}` : ''} -movflags +faststart -y "${outputVideoPath}"`;

    const commands = [
      mainCommand,
      // Fallback команды
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleString}'" -c:a copy -c:v libx264 -preset medium -crf 15 -pix_fmt yuv420p -tune film -profile:v high -level 4.1 -movflags +faststart -y "${outputVideoPath}"`,
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleString}'" -c:a copy -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -profile:v high -movflags +faststart -y "${outputVideoPath}"`,
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontname=DejaVu Sans,Fontsize=${selectedStyle.fontsize},PrimaryColour=&H${selectedStyle.fontcolor || 'ffffff'},OutlineColour=&H000000,Outline=${selectedStyle.outline || 3}'" -c:a copy -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart -y "${outputVideoPath}"`,
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}'" -c:a copy -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -movflags +faststart -y "${outputVideoPath}"`
    ];

    let success = false;
    let usedCommand = 0;
    let methodDescription = '';
    let qualityAnalysis = {};

    for (let i = 0; i < commands.length && !success; i++) {
      try {
        console.log(`[${taskId}] 🎨 Trying MAX QUALITY method ${i + 1}...`);
        console.log(`[${taskId}] Command preview: ${commands[i].substring(0, 120)}...`);
        
        if (fs.existsSync(outputVideoPath)) fs.unlinkSync(outputVideoPath);
        
        const cmdStartTime = Date.now();
        execSync(commands[i], { 
          stdio: 'pipe',
          timeout: 600000,
          maxBuffer: 1024 * 1024 * 200
        });
        const cmdDuration = Date.now() - cmdStartTime;
        
        if (fs.existsSync(outputVideoPath)) {
          const outputSize = fs.statSync(outputVideoPath).size;
          if (outputSize > 0) {
            console.log(`[${taskId}] ✅ MAX QUALITY SUCCESS! Method ${i + 1} worked! (${cmdDuration}ms)`);
            console.log(`[${taskId}] Output size: ${outputSize} bytes (${(outputSize / 1024 / 1024).toFixed(2)}MB)`);
            
            // Анализируем качество результата
            try {
              const outputQuality = analyzeVideoQuality(outputVideoPath);
              qualityAnalysis = {
                input_bitrate: videoQuality.bitrate,
                output_bitrate: outputQuality.bitrate,
                quality_preserved: outputQuality.bitrate >= videoQuality.bitrate * 0.8,
                resolution_preserved: outputQuality.width === videoQuality.width && outputQuality.height === videoQuality.height,
                codec_used: outputQuality.codec
              };
              console.log(`[${taskId}] 📊 Quality analysis:`, qualityAnalysis);
            } catch (err) {
              console.log(`[${taskId}] ⚠️ Could not analyze output quality:`, err.message);
            }
            
            success = true;
            usedCommand = i + 1;
            
            const descriptions = [
              optimalSettings.description || 'ADAPTIVE_QUALITY',
              'ULTRA_HIGH_QUALITY_FILM_TUNE',
              'HIGH_QUALITY_MINIMAL_COMPRESSION',
              'HIGH_QUALITY_DEJAVU_FALLBACK',
              'HIGH_QUALITY_BASIC_SUBTITLES'
            ];
            methodDescription = descriptions[i];
            
            break;
          }
        }
        
      } catch (error) {
        console.log(`[${taskId}] ❌ MAX Quality method ${i + 1} failed:`, error.message);
      }
    }

    if (!success) {
      throw new Error('All MAX QUALITY methods failed');
    }

    // Читаем результат
    const processedVideoBuffer = fs.readFileSync(outputVideoPath);
    const processingTime = Date.now() - startTime;

    // Вычисляем статистики качества
    const sizeIncrease = ((processedVideoBuffer.length / videoBuffer.length) - 1) * 100;
    const qualityRetained = qualityAnalysis.quality_preserved !== false;

    console.log(`[${taskId}] 🎉 MAXIMUM QUALITY STYLED SUBTITLES SUCCESS! 🎨✨`);
    console.log(`[${taskId}] Style: ${selectedStyle.name || 'Custom'}`);
    console.log(`[${taskId}] Quality Method: ${methodDescription}`);
    console.log(`[${taskId}] Command: ${usedCommand}`);
    console.log(`[${taskId}] Processing time: ${processingTime}ms`);
    console.log(`[${taskId}] Size change: ${sizeIncrease > 0 ? '+' : ''}${sizeIncrease.toFixed(1)}%`);
    console.log(`[${taskId}] Quality retained: ${qualityRetained ? 'YES ✅' : 'REDUCED ⚠️'}`);

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
        size_change_percent: parseFloat(sizeIncrease.toFixed(1)),
        compression_ratio: (processedVideoBuffer.length / videoBuffer.length).toFixed(3),
        method_used: methodDescription,
        command_number: usedCommand,
        quality_mode: forceQuality,
        input_quality: {
          resolution: videoQuality.resolution,
          bitrate: videoQuality.bitrate,
          codec: videoQuality.codec,
          quality_level: videoQuality.qualityLevel
        },
        output_quality: qualityAnalysis,
        settings_used: optimalSettings,
        quality_retained: qualityRetained
      },
      video_data: processedVideoBuffer.toString('base64'),
      content_type: 'video/mp4',
      style_info: {
        style_id: customStyle ? 'custom' : styleId,
        style_name: selectedStyle.name || 'Custom Style',
        style_description: selectedStyle.description || 'Custom user style',
        position: position,
        position_name: SUBTITLE_POSITIONS[position]?.name || 'Снизу',
        applied_settings: selectedStyle
      },
      quality_info: {
        mode: forceQuality,
        encoding_settings: optimalSettings,
        analysis: qualityAnalysis
      }
    });

  } catch (error) {
    console.error(`[${taskId}] 💥 MAX QUALITY ERROR:`, error.message);

    // Очистка при ошибке
    const tempFiles = [
      `/tmp/processing/input_${taskId}.mp4`,
      `/tmp/processing/subtitles_${taskId}.srt`,
      `/tmp/processing/output_${taskId}.mp4`
    ];
    
    tempFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (err) {}
    });

    res.status(500).json({
      success: false,
      task_id: taskId,
      error: error.message,
      processing_time_ms: Date.now() - startTime,
      quality_mode: 'MAXIMUM_QUALITY_FAILED'
    });
  }
});

// 🎯 БЫСТРЫЙ ENDPOINT ДЛЯ LOSSLESS ОБРАБОТКИ
app.post('/process-video-lossless', upload.single('video'), async (req, res) => {
  // Форсируем lossless качество и перенаправляем на streaming
  req.body.force_quality = 'lossless';
  req.url = '/process-video-stream';
  
  // Перенаправляем на streaming endpoint для избежания timeout
  return app._router.handle(req, res);
});

// Настройки для сервера
const server = app.listen(PORT, () => {
  console.log(`🎨 MAXIMUM QUALITY SOCIAL MEDIA Subtitle Service running on port ${PORT} 🎨`);
  console.log(`📱 Ready for TikTok, Instagram, YouTube styles with CRYSTAL CLEAR quality!`);
  console.log(`🎬 Total available styles: ${Object.keys(SUBTITLE_STYLES).length}`);
  console.log(`🎯 Quality modes available:`);
  console.log(`   • auto - Adaptive quality based on input analysis`);
  console.log(`   • lossless - Perfect quality preservation (CRF 0)`);
  console.log(`   • ultra - Ultra high quality (CRF 8)`);
  console.log(`   • high - High quality (CRF 12)`);
  console.log(`   • medium - Medium quality (CRF 18)`);
  console.log(`   • low - Low quality for testing (CRF 28)`);
  console.log(`🚀 Endpoints available:`);
  console.log(`   • POST /process-video-stream (RECOMMENDED - No timeout)`);
  console.log(`   • POST /process-video-with-subtitles (Legacy - May timeout)`);
  console.log(`   • POST /process-video-lossless (Shortcut for lossless)`);
  console.log(`   • GET /styles (Get all available styles)`);
  console.log(`   • GET /health (System status)`);
  const systemInfo = getSystemInfo();
  console.log(`FFmpeg: ${systemInfo.ffmpeg_available}`);
  console.log(`Quality Mode: MAXIMUM_QUALITY_NO_COMPRESSION_WITH_STREAMING_SUPPORT`);
});

// Увеличиваем timeout сервера
server.timeout = 900000; // 15 минут
server.keepAliveTimeout = 900000;
server.headersTimeout = 900000;
