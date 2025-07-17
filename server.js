// Beautiful Railway Service с кастомными стилями + МАКСИМАЛЬНОЕ КАЧЕСТВО + STREAMING
// server.js - Custom subtitle styles + NO COMPRESSION + NO TIMEOUT

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

// 📍 ПОЗИЦИИ СУБТИТРОВ
const SUBTITLE_POSITIONS = {
  bottom: {
    alignment: 2,     // По центру внизу
    marginv: 15,      // Отступ снизу
    name: 'Снизу'
  },
  top: {
    alignment: 8,     // По центру вверху  
    marginv: 15,      // Отступ сверху
    name: 'Сверху'
  },
  center: {
    alignment: 5,     // По центру экрана
    marginv: 0,       // Без отступов
    name: 'По центру'
  }
};

// 🎯 ДОСТУПНЫЕ ШРИФТЫ (с fallback)
const AVAILABLE_FONTS = [
  'DejaVu Sans',
  'Ubuntu', 
  'Liberation Sans',
  'Noto Sans',
  'Roboto',
  'Open Sans'
];

// 🎨 УПРОЩЕННАЯ ФУНКЦИЯ ДЛЯ ОБРАБОТКИ ПАРАМЕТРА BACKGROUND
function processBackgroundParam(backgroundValue) {
  console.log(`[DEBUG] processBackgroundParam called with: "${backgroundValue}" (type: ${typeof backgroundValue})`);
  
  // Если пустая строка, null, undefined, false - отключаем фон
  if (!backgroundValue || backgroundValue === "") {
    console.log(`[DEBUG] Background disabled (empty or false)`);
    return {
      enabled: false,
      color: null,
      description: 'disabled'
    };
  }
  
  // Если строка с цветом - обрабатываем как HEX цвет
  if (typeof backgroundValue === 'string' && backgroundValue.trim().length > 0) {
    console.log(`[DEBUG] Processing background as HEX color: "${backgroundValue.trim()}"`);
    const processedColor = processBackgroundColor(backgroundValue.trim());
    console.log(`[DEBUG] Background color processed result:`, processedColor);
    return processedColor;
  }
  
  console.log(`[DEBUG] Invalid background value, disabling`);
  return {
    enabled: false,
    color: null,
    description: 'disabled (invalid value)'
  };
}

// 🎨 УПРОЩЕННАЯ ФУНКЦИЯ ДЛЯ ОБРАБОТКИ ЦВЕТОВ ФОНА
function processBackgroundColor(colorString) {
  console.log(`[DEBUG] processBackgroundColor called with: "${colorString}"`);
  
  // Убираем # если есть
  let cleanColor = colorString.replace('#', '').toLowerCase();
  console.log(`[DEBUG] Cleaned color: "${cleanColor}"`);
  
  // Обрабатываем только HEX цвета
  if (/^[0-9a-f]{6}$/i.test(cleanColor)) {
    // 6-значный HEX: ff0000 -> BGR формат для ASS
    const r = cleanColor.substring(0, 2);
    const g = cleanColor.substring(2, 4);
    const b = cleanColor.substring(4, 6);
    // ASS использует BGR формат, не RGB!
    const assColor = `&H${b}${g}${r}`.toUpperCase();
    console.log(`[DEBUG] 6-digit HEX "${cleanColor}" -> RGB(${r},${g},${b}) -> ASS BGR: ${assColor}`);
    return {
      enabled: true,
      color: assColor,
      description: `#${cleanColor} (solid BGR)`
    };
  }
  
  if (/^[0-9a-f]{3}$/i.test(cleanColor)) {
    // 3-значный HEX: f00 -> ff0000
    const expandedHex = cleanColor.split('').map(char => char + char).join('');
    const r = expandedHex.substring(0, 2);
    const g = expandedHex.substring(2, 4);
    const b = expandedHex.substring(4, 6);
    // ASS использует BGR формат
    const assColor = `&H${b}${g}${r}`.toUpperCase();
    console.log(`[DEBUG] 3-digit HEX "${cleanColor}" expanded to "${expandedHex}" -> ASS BGR: ${assColor}`);
    return {
      enabled: true,
      color: assColor,
      description: `#${expandedHex} (solid BGR)`
    };
  }
  
  // Обрабатываем HEX с альфа-каналом
  if (/^[0-9a-f]{8}$/i.test(cleanColor)) {
    // 8-значный HEX с альфой: ff000080
    const r = cleanColor.substring(0, 2);
    const g = cleanColor.substring(2, 4);
    const b = cleanColor.substring(4, 6);
    const alpha = cleanColor.substring(6, 8);
    // ASS: ALPHA + BGR формат
    const assColor = `&H${alpha}${b}${g}${r}`.toUpperCase();
    console.log(`[DEBUG] 8-digit HEX with alpha "${cleanColor}" -> RGBA(${r},${g},${b},${alpha}) -> ASS ABGR: ${assColor}`);
    return {
      enabled: true,
      color: assColor,
      description: `#${r}${g}${b} (${Math.round(parseInt(alpha, 16) / 255 * 100)}% opacity BGR)`
    };
  }
  
  console.log(`[DEBUG] Invalid HEX color format "${colorString}", disabling background`);
  return {
    enabled: false,
    color: null,
    description: 'disabled (invalid HEX format)'
  };
}

// 🔧 HELPER ФУНКЦИЯ ДЛЯ ПАРСИНГА BOOLEAN ПАРАМЕТРОВ
function parseBooleanParam(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowercased = value.toLowerCase().trim();
    return lowercased === 'true' || lowercased === '1' || lowercased === 'yes';
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return false;
}

// 🎨 ФУНКЦИЯ СОЗДАНИЯ СТИЛЯ ИЗ ПАРАМЕТРОВ (ОБНОВЛЕННАЯ)
function buildCustomStyle(styleParams) {
  console.log(`[DEBUG] buildCustomStyle called with:`, styleParams);
  
  // Значения по умолчанию
  const defaults = {
    fontsize: 8,
    fontcolor: 'ffffff',
    bold: false,
    outline: true,
    position: 'bottom',
    background: ""  // пустая строка = без фона
  };
  
  // Объединяем с пользовательскими параметрами
  const params = { ...defaults, ...styleParams };
  
  console.log(`[DEBUG] After applying defaults:`, params);
  
  // Валидация параметров
  params.fontsize = Math.max(6, Math.min(12, parseInt(params.fontsize) || 8));
  params.fontcolor = (params.fontcolor || 'ffffff').replace('#', '').toLowerCase();
  
  // Обработка boolean параметров
  console.log(`[DEBUG] Before boolean parsing: bold="${params.bold}", outline="${params.outline}"`);
  params.bold = parseBooleanParam(params.bold);
  params.outline = parseBooleanParam(params.outline);
  console.log(`[DEBUG] After boolean parsing: bold=${params.bold}, outline=${params.outline}`);
  
  // Обработка цвета фона
  console.log(`[DEBUG] Processing background parameter: "${params.background}" (type: ${typeof params.background})`);
  let backgroundData = processBackgroundParam(params.background);
  console.log(`[DEBUG] Background processing result:`, backgroundData);
  
  if (!['bottom', 'top', 'center'].includes(params.position)) {
    console.log(`[DEBUG] Invalid position "${params.position}", using default "bottom"`);
    params.position = 'bottom';
  }
  
  console.log(`[DEBUG] Final params after validation:`, { ...params, background: backgroundData });
  
  // Применяем позицию
  const positionSettings = SUBTITLE_POSITIONS[params.position];
  
  // Строим финальный стиль
  const style = {
    fontsize: params.fontsize,
    fontcolor: params.fontcolor,
    fontname: AVAILABLE_FONTS[0],
    fontnames: AVAILABLE_FONTS,
    bold: params.bold ? 1 : 0,
    alignment: positionSettings.alignment,
    marginv: positionSettings.marginv
  };
  
  console.log(`[DEBUG] Base style created:`, style);
  
  // Добавляем обводку если включена
  if (params.outline) {
    style.outline = 2;
    style.shadow = 1;
    console.log(`[DEBUG] ✅ OUTLINE ENABLED: Added outline=2, shadow=1`);
  } else {
    style.outline = 0;
    style.shadow = 0;
    console.log(`[DEBUG] ❌ OUTLINE DISABLED: outline=0, shadow=0`);
  }
  
  // Добавляем фон если включен
  if (backgroundData.enabled) {
    style.backcolour = backgroundData.color;
    console.log(`[DEBUG] ✅ BACKGROUND ENABLED: Added backcolour=${backgroundData.color} (${backgroundData.description})`);
  } else {
    console.log(`[DEBUG] ❌ BACKGROUND DISABLED: no backcolour (${backgroundData.description})`);
  }
  
  console.log(`[DEBUG] Final style object:`, style);
  
  return {
    style,
    description: `Custom style: ${params.fontsize}px, ${params.fontcolor}, ${params.position}, outline: ${params.outline}, bg: ${backgroundData.description}, bold: ${params.bold}`
  };
}

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
  let settings;
  
  switch(forceQuality) {
    case 'lossless':
      settings = {
        crf: 0,
        preset: 'slow',
        tune: 'film',
        profile: 'high',
        level: '5.1',
        description: 'LOSSLESS_PERFECT_QUALITY'
      };
      break;
      
    case 'ultra':
      settings = {
        crf: 8,
        preset: 'slow',
        tune: 'film',
        profile: 'high',
        level: '5.1',
        description: 'ULTRA_HIGH_QUALITY'
      };
      break;
      
    case 'high':
      settings = {
        crf: 12,
        preset: 'medium',
        tune: 'film',
        profile: 'high',
        level: '4.1',
        description: 'HIGH_QUALITY'
      };
      break;
      
    case 'medium':
      settings = {
        crf: 18,
        preset: 'medium',
        tune: null,
        profile: 'main',
        level: '4.0',
        description: 'MEDIUM_QUALITY'
      };
      break;
      
    case 'low':
      settings = {
        crf: 28,
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
  
  return settings;
}

// Health check
app.get('/health', (req, res) => {
  const systemInfo = getSystemInfo();
  
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mode: 'CUSTOM_STYLES_WITH_MAXIMUM_QUALITY_STREAMING',
    style_system: 'CUSTOM_PARAMETERS_WITH_HEX_BACKGROUND',
    available_fonts: AVAILABLE_FONTS,
    available_positions: Object.keys(SUBTITLE_POSITIONS),
    quality_mode: 'NO_COMPRESSION_MAXIMUM_QUALITY_STREAMING_ENABLED',
    style_parameters: {
      fontsize: 'number (6-12)',
      fontcolor: 'string (hex without #)',
      bold: 'boolean',
      outline: 'boolean',
      position: 'string (bottom/top/center)',
      background: 'string (hex color) or empty string to disable'
    },
    background_color_formats: {
      disabled: '""  (empty string)',
      hex_6digit: '"ff0000", "00ff00", "0000ff"',
      hex_3digit: '"f00", "0f0", "00f"', 
      hex_8digit_with_alpha: '"ff000080" (color + alpha channel)'
    },
    background_examples: {
      no_background: 'background: ""',
      red_solid: 'background: "ff0000"',
      green_solid: 'background: "00ff00"',
      blue_solid: 'background: "0000ff"',
      red_transparent: 'background: "ff000080"',
      custom_color: 'background: "ff8040"'
    },
    endpoints: [
      '/process-video-stream (Custom styles with HEX color background)',
      '/health (This endpoint)'
    ],
    ...systemInfo
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
      subtitle_method: 'CUSTOM_STYLES_WITH_HEX_BACKGROUND'
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
  
  return beautifiedSrt;
}

// 🚀 ОСНОВНОЙ STREAMING ENDPOINT С КАСТОМНЫМИ СТИЛЯМИ
app.post('/process-video-stream', upload.single('video'), async (req, res) => {
  const taskId = req.body.task_id || uuidv4();
  const startTime = Date.now();
  
  console.log(`\n=== [${taskId}] CUSTOM STYLE PROCESSING WITH HEX BACKGROUND ===`);

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
    
    // 🎨 ПОЛУЧАЕМ ПАРАМЕТРЫ КАСТОМНОГО СТИЛЯ
    const styleParams = {
      fontsize: req.body.fontsize,
      fontcolor: req.body.fontcolor,
      bold: req.body.bold,
      outline: req.body.outline,
      position: req.body.position,
      background: req.body.background
    };
    
    const forceQuality = req.body.force_quality || 'auto';
    
    console.log(`[${taskId}] Video size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    console.log(`[${taskId}] 🎨 RAW INCOMING STYLE PARAMS:`);
    console.log(`[${taskId}]   fontsize: "${styleParams.fontsize}" (type: ${typeof styleParams.fontsize})`);
    console.log(`[${taskId}]   fontcolor: "${styleParams.fontcolor}" (type: ${typeof styleParams.fontcolor})`);
    console.log(`[${taskId}]   bold: "${styleParams.bold}" (type: ${typeof styleParams.bold})`);
    console.log(`[${taskId}]   outline: "${styleParams.outline}" (type: ${typeof styleParams.outline})`);
    console.log(`[${taskId}]   position: "${styleParams.position}" (type: ${typeof styleParams.position})`);
    console.log(`[${taskId}]   background: "${styleParams.background}" (type: ${typeof styleParams.background})`);
    console.log(`[${taskId}] 🎯 Quality mode: ${forceQuality}`);
    
    // 🎨 СОЗДАЕМ КАСТОМНЫЙ СТИЛЬ
    const { style: selectedStyle, description: styleDescription } = buildCustomStyle(styleParams);
    console.log(`[${taskId}] ✅ Built custom style: ${styleDescription}`);

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

    // 🎨 СТРОИМ STYLE STRING ДЛЯ FFMPEG
    const buildStyleString = (style) => {
      let styleStr = `Fontsize=${style.fontsize}`;
      console.log(`[${taskId}] 🎨 Building FFmpeg style string...`);
      console.log(`[${taskId}] 🎨 Input style object:`, style);
      
      if (style.fontname) {
        styleStr += `,Fontname=${style.fontname}`;
        console.log(`[${taskId}] 🎨 Added fontname: ${style.fontname}`);
      }
      
      if (style.fontcolor) {
        const color = style.fontcolor.startsWith('&H') ? style.fontcolor : `&H${style.fontcolor}`;
        styleStr += `,PrimaryColour=${color}`;
        console.log(`[${taskId}] 🎨 Added fontcolor: ${color}`);
      }
      
      if (style.outline && style.outline > 0) {
        styleStr += `,OutlineColour=&H000000,Outline=${style.outline}`;
        console.log(`[${taskId}] 🎨 Added outline: ${style.outline}`);
      }
      
      if (style.shadow && style.shadow > 0) {
        styleStr += `,Shadow=${style.shadow}`;
        console.log(`[${taskId}] 🎨 Added shadow: ${style.shadow}`);
      }
      
      if (style.bold) {
        styleStr += `,Bold=${style.bold}`;
        console.log(`[${taskId}] 🎨 Added bold: ${style.bold}`);
      }
      
      if (style.alignment) {
        styleStr += `,Alignment=${style.alignment}`;
        console.log(`[${taskId}] 🎨 Added alignment: ${style.alignment}`);
      }
      
      if (style.marginv !== undefined) {
        styleStr += `,MarginV=${style.marginv}`;
        console.log(`[${taskId}] 🎨 Added marginv: ${style.marginv}`);
      }
      
      if (style.backcolour) {
        styleStr += `,BackColour=${style.backcolour}`;
        console.log(`[${taskId}] 🎨 ✅ Added backcolour: ${style.backcolour}`);
      } else {
        console.log(`[${taskId}] 🎨 ❌ No backcolour in style object`);
      }
      
      console.log(`[${taskId}] 🎨 Final FFmpeg style string: ${styleStr}`);
      return styleStr;
    };

    const styleString = buildStyleString(selectedStyle);
    console.log(`[${taskId}] 🎨 FFmpeg style string: ${styleString}`);

    // Строим FFmpeg команды с fallback логикой
    const mainCommand = `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleString}'" -c:a copy -c:v libx264 -preset ${optimalSettings.preset} -crf ${optimalSettings.crf} -pix_fmt yuv420p${optimalSettings.tune ? ` -tune ${optimalSettings.tune}` : ''} -profile:v ${optimalSettings.profile}${optimalSettings.level ? ` -level ${optimalSettings.level}` : ''} -movflags +faststart -y "${outputVideoPath}"`;

    // Создаем fallback команды с упрощенными стилями
    const simplifiedStyleString = `Fontname=DejaVu Sans,Fontsize=${selectedStyle.fontsize},PrimaryColour=&H${selectedStyle.fontcolor || 'ffffff'},OutlineColour=&H000000,Outline=${selectedStyle.outline || 2}`;
    
    const commands = [
      mainCommand,
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleString}'" -c:a copy -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart -y "${outputVideoPath}"`,
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${simplifiedStyleString}'" -c:a copy -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -y "${outputVideoPath}"`,
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}'" -c:a copy -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -y "${outputVideoPath}"`
    ];

    let success = false;
    let usedCommand = 0;

    // Выполняем команды ПОСЛЕДОВАТЕЛЬНО
    for (let i = 0; i < commands.length && !success; i++) {
      try {
        console.log(`[${taskId}] 🎨 Trying custom style method ${i + 1}...`);
        
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
            console.log(`[${taskId}] ✅ CUSTOM STYLE SUCCESS! Method ${i + 1} worked! (${cmdDuration}ms)`);
            console.log(`[${taskId}] Output size: ${(outputSize / 1024 / 1024).toFixed(2)}MB`);
            success = true;
            usedCommand = i + 1;
            break;
          }
        }
      } catch (error) {
        console.log(`[${taskId}] ❌ Custom style method ${i + 1} failed:`, error.message);
      }
    }

    if (!success) {
      throw new Error('All custom style methods failed');
    }

    // ВАЛИДАЦИЯ И СОЗДАНИЕ ОТВЕТА
    console.log(`[${taskId}] 🎉 CUSTOM STYLE PROCESSING SUCCESS! 🚀`);
    
    // Проверяем что файл существует и имеет правильный размер
    if (!fs.existsSync(outputVideoPath)) {
      throw new Error('Output video file not found');
    }

    const outputStats = fs.statSync(outputVideoPath);
    if (outputStats.size === 0) {
      throw new Error('Output video file is empty');
    }

    console.log(`[${taskId}] 📹 Video file validated: ${outputStats.size} bytes`);

    // Читаем файл как binary buffer
    const processedVideoBuffer = fs.readFileSync(outputVideoPath);

    // Проверяем MP4 header
    const mp4Header = processedVideoBuffer.slice(0, 12);
    const isValidMP4 = mp4Header.includes(Buffer.from('ftyp')) || 
                       mp4Header.slice(4, 8).toString() === 'ftyp';
    
    if (!isValidMP4) {
      console.warn(`[${taskId}] ⚠️ Warning: File may not be valid MP4`);
    } else {
      console.log(`[${taskId}] ✅ Valid MP4 header detected`);
    }

    // Создаем Base64 с explicit encoding
    const base64Data = processedVideoBuffer.toString('base64');

    // Валидируем Base64
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(base64Data)) {
      throw new Error('Invalid Base64 data generated');
    }

    const processingTime = Date.now() - startTime;
    const sizeChange = ((processedVideoBuffer.length / videoBuffer.length) - 1) * 100;

    console.log(`[${taskId}] Processing time: ${processingTime}ms`);
    console.log(`[${taskId}] Size change: ${sizeChange > 0 ? '+' : ''}${sizeChange.toFixed(1)}%`);
    console.log(`[${taskId}] Quality mode: ${optimalSettings.description}`);

    // Очистка временных файлов
    [inputVideoPath, srtPath, outputVideoPath].forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn(`[${taskId}] Failed to delete: ${filePath}`);
      }
    });

    // Создаем ответ с метаданными кастомного стиля
    const responseData = {
      success: true,
      task_id: taskId,
      processing_stats: {
        processing_time_ms: processingTime,
        input_size_bytes: videoBuffer.length,
        output_size_bytes: processedVideoBuffer.length,
        size_change_percent: parseFloat(sizeChange.toFixed(1)),
        method_used: `CUSTOM_STYLE_METHOD_${usedCommand}`,
        quality_mode: forceQuality,
        quality_description: optimalSettings.description
      },
      video_data: base64Data,
      content_type: 'video/mp4',
      // Добавляем метаданные для валидации на клиенте
      video_metadata: {
        original_size_bytes: processedVideoBuffer.length,
        base64_length: base64Data.length,
        expected_decoded_size: Math.ceil(base64Data.length * 3 / 4), // Base64 overhead
        file_signature: processedVideoBuffer.slice(0, 12).toString('hex'), // MP4 magic bytes
        is_valid_mp4: isValidMP4,
        content_type: 'video/mp4',
        encoding: 'base64'
      },
      style_info: {
        type: 'custom',
        description: styleDescription,
        parameters: styleParams,
        final_style: selectedStyle,
        ffmpeg_style_string: styleString,
        position_name: SUBTITLE_POSITIONS[styleParams.position || 'bottom'].name
      },
      quality_info: {
        input_resolution: videoQuality.resolution,
        input_bitrate: videoQuality.bitrate,
        input_quality_level: videoQuality.qualityLevel,
        force_quality: forceQuality,
        crf_used: optimalSettings.crf,
        preset_used: optimalSettings.preset,
        profile_used: optimalSettings.profile
      }
    };

    console.log(`[${taskId}] 📤 Sending JSON response with custom styled video data...`);

    // Отправляем ответ
    res.json(responseData);

  } catch (error) {
    console.error(`[${taskId}] 💥 CUSTOM STYLE ERROR:`, error.message);

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

// Настройки для сервера
const server = app.listen(PORT, () => {
  console.log(`🎨 CUSTOM STYLE Subtitle Service running on port ${PORT} 🎨`);
  console.log(`📱 Ready for custom subtitle styles with MAXIMUM QUALITY!`);
  console.log(`🎯 Style system: CUSTOM_PARAMETERS_WITH_HEX_BACKGROUND`);
  console.log(`✨ Available parameters:`);
  console.log(`   • fontsize (6-12) - Text size`);
  console.log(`   • fontcolor (hex) - Text color`);
  console.log(`   • bold (true/false) - Bold text`);
  console.log(`   • outline (true/false) - Text outline`);
  console.log(`   • position (bottom/top/center) - Text position`);
  console.log(`   • background (hex color or empty) - Background color`);
  console.log(`🎯 Background examples:`);
  console.log(`   • "" - No background`);
  console.log(`   • "ff0000" - Red solid background`);
  console.log(`   • "00ff0080" - Green with 50% transparency`);
  console.log(`🎯 Quality modes available:`);
  console.log(`   • auto - Adaptive quality based on input analysis`);
  console.log(`   • lossless - Perfect quality preservation (CRF 0)`);
  console.log(`   • ultra - Ultra high quality (CRF 8)`);
  console.log(`   • high - High quality (CRF 12)`);
  console.log(`   • medium - Medium quality (CRF 18)`);
  console.log(`   • low - Low quality for testing (CRF 28)`);
  console.log(`🚀 Endpoints available:`);
  console.log(`   • POST /process-video-stream (Custom styles - HEX background)`);
  console.log(`   • GET /health (System status)`);
  const systemInfo = getSystemInfo();
  console.log(`FFmpeg: ${systemInfo.ffmpeg_available}`);
  console.log(`Quality Mode: CUSTOM_STYLES_WITH_HEX_BACKGROUND_SUPPORT`);
});

// Увеличиваем timeout сервера
server.timeout = 900000; // 15 минут
server.keepAliveTimeout = 900000;
server.headersTimeout = 900000;
