// Beautiful Railway Service с кастомными стилями + МАКСИМАЛЬНОЕ КАЧЕСТВО + STREAMING
// server.js - Custom subtitle styles + NO COMPRESSION + NO TIMEOUT + BACKGROUND DEBUG

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

// 🎨 ФУНКЦИЯ СОЗДАНИЯ СТИЛЯ ИЗ ПАРАМЕТРОВ
function buildCustomStyle(styleParams) {
  console.log(`[DEBUG] buildCustomStyle called with:`, styleParams);
  
  // Значения по умолчанию
  const defaults = {
    fontsize: 8,
    fontcolor: 'ffffff',
    bold: false,
    outline: true,
    position: 'bottom',
    background: false
  };
  
  // Объединяем с пользовательскими параметрами
  const params = { ...defaults, ...styleParams };
  
  console.log(`[DEBUG] After applying defaults:`, params);
  
  // Валидация параметров
  params.fontsize = Math.max(6, Math.min(12, parseInt(params.fontsize) || 8));
  params.fontcolor = (params.fontcolor || 'ffffff').replace('#', '').toLowerCase();
  
  // ✅ ИСПРАВЛЕНИЕ: Правильная обработка boolean параметров из строк
  console.log(`[DEBUG] Before boolean parsing: bold="${params.bold}", outline="${params.outline}", background="${params.background}"`);
  
  params.bold = parseBooleanParam(params.bold);
  params.outline = parseBooleanParam(params.outline);
  params.background = parseBooleanParam(params.background);
  
  console.log(`[DEBUG] After boolean parsing: bold=${params.bold}, outline=${params.outline}, background=${params.background}`);
  
  if (!['bottom', 'top', 'center'].includes(params.position)) {
    console.log(`[DEBUG] Invalid position "${params.position}", using default "bottom"`);
    params.position = 'bottom';
  }
  
  console.log(`[DEBUG] Final params after validation:`, params);
  
  // Применяем позицию
  const positionSettings = SUBTITLE_POSITIONS[params.position];
  
  // Строим финальный стиль
  const style = {
    fontsize: params.fontsize,
    fontcolor: params.fontcolor,
    fontname: AVAILABLE_FONTS[0], // Используем первый доступный шрифт
    fontnames: AVAILABLE_FONTS,   // Список для fallback
    bold: params.bold ? 1 : 0,
    alignment: positionSettings.alignment,
    marginv: positionSettings.marginv
  };
  
  console.log(`[DEBUG] Base style created:`, style);
  
  // Добавляем обводку если включена
  if (params.outline) {
    style.outline = 2;  // Фиксированная толщина 2px
    style.shadow = 1;   // Легкая тень для лучшей читаемости
    console.log(`[DEBUG] ✅ OUTLINE ENABLED: Added outline=2, shadow=1`);
  } else {
    style.outline = 0;
    style.shadow = 0;
    console.log(`[DEBUG] ❌ OUTLINE DISABLED: outline=0, shadow=0`);
  }
  
  // 🔥 ДОБАВЛЯЕМ ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ДЛЯ ФОНА
  console.log(`[DEBUG] 🎨 BACKGROUND PROCESSING START:`);
  console.log(`[DEBUG] 🎨   params.background value: "${params.background}"`);
  console.log(`[DEBUG] 🎨   params.background type: ${typeof params.background}`);
  console.log(`[DEBUG] 🎨   Boolean evaluation: ${!!params.background}`);
  
  if (params.background) {
    // Попробуем разные варианты цвета фона
    const backgroundOptions = [
      '&H80000000',  // Черный с 50% прозрачностью (оригинал)
      '&H00000000',  // Черный непрозрачный
      '&HFF000000',  // Черный с полной альфой
      '&H80808080',  // Серый полупрозрачный
      '&H000000'     // Простой черный без альфы
    ];
    
    style.backcolour = backgroundOptions[0]; // Используем первый вариант
    style.borderstyle = 3; // Добавляем borderstyle для гарантии
    style.backgroundType = 'semi_transparent_black';
    
    console.log(`[DEBUG] 🎨 ✅ BACKGROUND ENABLED:`);
    console.log(`[DEBUG] 🎨   Added backcolour: ${style.backcolour}`);
    console.log(`[DEBUG] 🎨   Added borderstyle: ${style.borderstyle}`);
    console.log(`[DEBUG] 🎨   Background type: ${style.backgroundType}`);
    console.log(`[DEBUG] 🎨   All background options: ${backgroundOptions.join(', ')}`);
  } else {
    style.backgroundType = 'none';
    console.log(`[DEBUG] 🎨 ❌ BACKGROUND DISABLED: no backcolour`);
  }
  
  console.log(`[DEBUG] Final style object:`, style);
  
  return {
    style,
    description: `Custom style: ${params.fontsize}px, ${params.fontcolor}, ${params.position}, outline: ${params.outline}, bg: ${params.background}, bold: ${params.bold}`
  };
}

// 🔧 HELPER ФУНКЦИЯ ДЛЯ ПАРСИНГА BOOLEAN ПАРАМЕТРОВ
function parseBooleanParam(value) {
  console.log(`[DEBUG] parseBooleanParam called with: "${value}" (type: ${typeof value})`);
  
  if (typeof value === 'boolean') {
    console.log(`[DEBUG] Already boolean: ${value}`);
    return value;
  }
  if (typeof value === 'string') {
    const lowercased = value.toLowerCase().trim();
    const result = lowercased === 'true' || lowercased === '1' || lowercased === 'yes';
    console.log(`[DEBUG] String "${value}" -> lowercased "${lowercased}" -> result: ${result}`);
    return result;
  }
  if (typeof value === 'number') {
    const result = value !== 0;
    console.log(`[DEBUG] Number ${value} -> result: ${result}`);
    return result;
  }
  console.log(`[DEBUG] Unknown type, defaulting to false`);
  return false;
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

// Health check
app.get('/health', (req, res) => {
  const systemInfo = getSystemInfo();
  
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mode: 'CUSTOM_STYLES_WITH_MAXIMUM_QUALITY_STREAMING_DEBUG',
    style_system: 'CUSTOM_PARAMETERS_ONLY',
    available_fonts: AVAILABLE_FONTS,
    available_positions: Object.keys(SUBTITLE_POSITIONS),
    quality_mode: 'NO_COMPRESSION_MAXIMUM_QUALITY_STREAMING_ENABLED',
    debug_mode: 'BACKGROUND_DEBUGGING_ENABLED',
    style_parameters: {
      fontsize: 'number (6-12)',
      fontcolor: 'string (hex without #)',
      bold: 'boolean',
      outline: 'boolean',
      position: 'string (bottom/top/center)',
      background: 'boolean'
    },
    endpoints: [
      '/process-video-stream (Custom styles - JSON response)',
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
      subtitle_method: 'CUSTOM_STYLES_WITH_JSON_RESPONSE'
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

// 🚀 ОСНОВНОЙ STREAMING ENDPOINT С КАСТОМНЫМИ СТИЛЯМИ
app.post('/process-video-stream', upload.single('video'), async (req, res) => {
  const taskId = req.body.task_id || uuidv4();
  const startTime = Date.now();
  
  console.log(`\n=== [${taskId}] CUSTOM STYLE PROCESSING (VALIDATED JSON + BACKGROUND DEBUG) ===`);

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
    console.log(`[${taskId}] Raw SRT length: ${rawSrtContent.length} chars`);
    console.log(`[${taskId}] 🎨 RAW INCOMING STYLE PARAMS:`);
    console.log(`[${taskId}]   fontsize: "${styleParams.fontsize}" (type: ${typeof styleParams.fontsize})`);
    console.log(`[${taskId}]   fontcolor: "${styleParams.fontcolor}" (type: ${typeof styleParams.fontcolor})`);
    console.log(`[${taskId}]   bold: "${styleParams.bold}" (type: ${typeof styleParams.bold})`);
    console.log(`[${taskId}]   outline: "${styleParams.outline}" (type: ${typeof styleParams.outline})`);
    console.log(`[${taskId}]   position: "${styleParams.position}" (type: ${typeof styleParams.position})`);
    console.log(`[${taskId}] 🔥 BACKGROUND: "${styleParams.background}" (type: ${typeof styleParams.background})`);
    console.log(`[${taskId}] 🎯 Quality mode: ${forceQuality}`);
    
    // 🎨 СОЗДАЕМ КАСТОМНЫЙ СТИЛЬ
    const { style: selectedStyle, description: styleDescription } = buildCustomStyle(styleParams);
    console.log(`[${taskId}] ✅ Built custom style: ${styleDescription}`);
    console.log(`[${taskId}] 📋 Final style:`, selectedStyle);

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

    // 🎨 СТРОИМ STYLE STRING ДЛЯ FFMPEG С ДЕТАЛЬНЫМ ЛОГИРОВАНИЕМ
    const buildStyleString = (style) => {
      console.log(`[${taskId}] 🔧 Building FFmpeg style string...`);
      console.log(`[${taskId}] 🔧 Input style object:`, style);
      
      let styleStr = `Fontsize=${style.fontsize}`;
      console.log(`[${taskId}] 🔧 Added fontsize: ${styleStr}`);
      
      if (style.fontname) {
        styleStr += `,Fontname=${style.fontname}`;
        console.log(`[${taskId}] 🔧 Added fontname: current string = ${styleStr}`);
      }
      
      if (style.fontcolor) {
        const color = style.fontcolor.startsWith('&H') ? style.fontcolor : `&H${style.fontcolor}`;
        styleStr += `,PrimaryColour=${color}`;
        console.log(`[${taskId}] 🔧 Added color: ${color}, current string = ${styleStr}`);
      }
      
      if (style.outline && style.outline > 0) {
        styleStr += `,OutlineColour=&H000000,Outline=${style.outline}`;
        console.log(`[${taskId}] 🔧 Added outline: current string = ${styleStr}`);
      }
      
      if (style.shadow && style.shadow > 0) {
        styleStr += `,Shadow=${style.shadow}`;
        console.log(`[${taskId}] 🔧 Added shadow: current string = ${styleStr}`);
      }
      
      if (style.bold) {
        styleStr += `,Bold=${style.bold}`;
        console.log(`[${taskId}] 🔧 Added bold: current string = ${styleStr}`);
      }
      
      if (style.alignment) {
        styleStr += `,Alignment=${style.alignment}`;
        console.log(`[${taskId}] 🔧 Added alignment: current string = ${styleStr}`);
      }
      
      if (style.marginv !== undefined) {
        styleStr += `,MarginV=${style.marginv}`;
        console.log(`[${taskId}] 🔧 Added marginV: current string = ${styleStr}`);
      }
      
      // 🔥 ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ФОНА
      console.log(`[${taskId}] 🔥 BACKGROUND PROCESSING IN buildStyleString:`);
      console.log(`[${taskId}] 🔥   style.backcolour: "${style.backcolour}"`);
      console.log(`[${taskId}] 🔥   style.borderstyle: "${style.borderstyle}"`);
      console.log(`[${taskId}] 🔥   style.backgroundType: "${style.backgroundType}"`);
      
      if (style.backcolour) {
        styleStr += `,BackColour=${style.backcolour}`;
        console.log(`[${taskId}] 🔥 ✅ BACKGROUND ADDED TO STYLE STRING!`);
        console.log(`[${taskId}] 🔥   Added BackColour=${style.backcolour}`);
        console.log(`[${taskId}] 🔥   Current string = ${styleStr}`);
        
        // Добавляем BorderStyle для гарантии работы фона
        if (style.borderstyle) {
          styleStr += `,BorderStyle=${style.borderstyle}`;
          console.log(`[${taskId}] 🔥   Added BorderStyle=${style.borderstyle}`);
          console.log(`[${taskId}] 🔥   Final string with border = ${styleStr}`);
        }
      } else {
        console.log(`[${taskId}] 🔥 ❌ NO BACKGROUND in style object`);
      }
      
      console.log(`[${taskId}] 🔧 Final style string: ${styleStr}`);
      return styleStr;
    };

    const styleString = buildStyleString(selectedStyle);
    console.log(`[${taskId}] 🎨 FFmpeg style string: ${styleString}`);

    // 🔥 ДОПОЛНИТЕЛЬНОЕ ЛОГИРОВАНИЕ ДЛЯ АНАЛИЗА ПРОБЛЕМЫ
    console.log(`[${taskId}] 🔍 BACKGROUND DEBUGGING SUMMARY:`);
    console.log(`[${taskId}] 🔍   Original background param: "${styleParams.background}"`);
    console.log(`[${taskId}] 🔍   Parsed background param: ${selectedStyle.backgroundType !== 'none'}`);
    console.log(`[${taskId}] 🔍   Style contains backcolour: ${!!selectedStyle.backcolour}`);
    console.log(`[${taskId}] 🔍   BackColour value: "${selectedStyle.backcolour}"`);
    console.log(`[${taskId}] 🔍   Style string contains BackColour: ${styleString.includes('BackColour')}`);
    console.log(`[${taskId}] 🔍   Final FFmpeg style: ${styleString}`);

    // Строим FFmpeg команды с fallback логикой и альтернативными вариантами фона
    const createCommands = (style, optimalSettings) => {
      const baseStyle = styleString;
      
      // Создаем альтернативные варианты для фона если он включен
      const backgroundVariants = selectedStyle.backcolour ? [
        baseStyle, // Оригинальный стиль
        baseStyle.replace('BackColour=&H80000000', 'BackColour=&H00000000'), // Черный непрозрачный
        baseStyle.replace('BackColour=&H80000000', 'BackColour=&HFF000000'), // Черный с полной альфой
        baseStyle + ',BorderStyle=3', // Добавляем BorderStyle принудительно
        baseStyle.replace('BackColour=&H80000000', 'BackColour=&H80808080'), // Серый полупрозрачный
      ] : [baseStyle];
      
      console.log(`[${taskId}] 🔥 Created ${backgroundVariants.length} background variants:`);
      backgroundVariants.forEach((variant, index) => {
        console.log(`[${taskId}] 🔥   Variant ${index + 1}: ${variant}`);
      });
      
      const commands = [];
      
      // Для каждого варианта стиля создаем команду с оптимальными настройками
      backgroundVariants.forEach((styleVariant, index) => {
        const command = `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleVariant}'" -c:a copy -c:v libx264 -preset ${optimalSettings.preset} -crf ${optimalSettings.crf} -pix_fmt yuv420p${optimalSettings.tune ? ` -tune ${optimalSettings.tune}` : ''} -profile:v ${optimalSettings.profile}${optimalSettings.level ? ` -level ${optimalSettings.level}` : ''} -movflags +faststart -y "${outputVideoPath}"`;
        commands.push({
          command,
          description: `Style variant ${index + 1} with ${optimalSettings.description}`,
          styleVariant,
          isBackgroundTest: selectedStyle.backcolour && index > 0
        });
      });
      
      // Добавляем упрощенные fallback команды
      const simplifiedStyleString = `Fontname=DejaVu Sans,Fontsize=${selectedStyle.fontsize},PrimaryColour=&H${selectedStyle.fontcolor || 'ffffff'},OutlineColour=&H000000,Outline=${selectedStyle.outline || 2}`;
      
      // Если фон включен, добавляем альтернативные команды для тестирования
      if (selectedStyle.backcolour) {
        const backgroundTestCommands = [
          `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${simplifiedStyleString},BackColour=&H80000000,BorderStyle=3'" -c:a copy -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart -y "${outputVideoPath}"`,
          `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${simplifiedStyleString},BackColour=&H00000000'" -c:a copy -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -y "${outputVideoPath}"`,
          `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontsize=${selectedStyle.fontsize},BackColour=&H80000000,BorderStyle=3'" -c:a copy -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -y "${outputVideoPath}"`,
        ];
        
        backgroundTestCommands.forEach((cmd, index) => {
          commands.push({
            command: cmd,
            description: `Background test method ${index + 1}`,
            styleVariant: `background_test_${index + 1}`,
            isBackgroundTest: true
          });
        });
      }
      
      // Добавляем базовые fallback команды
      commands.push(
        {
          command: `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${simplifiedStyleString}'" -c:a copy -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart -y "${outputVideoPath}"`,
          description: 'Simplified style fallback',
          styleVariant: simplifiedStyleString,
          isBackgroundTest: false
        },
        {
          command: `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}'" -c:a copy -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -y "${outputVideoPath}"`,
          description: 'Basic subtitle fallback',
          styleVariant: 'default',
          isBackgroundTest: false
        }
      );
      
      return commands;
    };

    const commands = createCommands(selectedStyle, optimalSettings);
    console.log(`[${taskId}] 🎯 Created ${commands.length} total commands (including background tests)`);

    let success = false;
    let usedCommand = 0;
    let usedMethod = '';

    // Выполняем команды ПОСЛЕДОВАТЕЛЬНО
    for (let i = 0; i < commands.length && !success; i++) {
      try {
        const cmdInfo = commands[i];
        console.log(`[${taskId}] 🎨 Trying method ${i + 1}: ${cmdInfo.description}`);
        console.log(`[${taskId}] 🎨   Style variant: ${cmdInfo.styleVariant.substring(0, 100)}...`);
        console.log(`[${taskId}] 🎨   Is background test: ${cmdInfo.isBackgroundTest}`);
        
        if (fs.existsSync(outputVideoPath)) fs.unlinkSync(outputVideoPath);
        
        const cmdStartTime = Date.now();
        console.log(`[${taskId}] 🔧 Executing FFmpeg command...`);
        
        execSync(cmdInfo.command, { 
          stdio: 'pipe',
          timeout: 600000,
          maxBuffer: 1024 * 1024 * 200
        });
        
        const cmdDuration = Date.now() - cmdStartTime;
        
        if (fs.existsSync(outputVideoPath)) {
          const outputSize = fs.statSync(outputVideoPath).size;
          if (outputSize > 0) {
            console.log(`[${taskId}] ✅ SUCCESS! Method ${i + 1} worked! (${cmdDuration}ms)`);
            console.log(`[${taskId}] ✅ Description: ${cmdInfo.description}`);
            console.log(`[${taskId}] ✅ Output size: ${(outputSize / 1024 / 1024).toFixed(2)}MB`);
            console.log(`[${taskId}] ✅ Background test: ${cmdInfo.isBackgroundTest}`);
            console.log(`[${taskId}] ✅ Style used: ${cmdInfo.styleVariant}`);
            
            success = true;
            usedCommand = i + 1;
            usedMethod = cmdInfo.description;
            
            // Если это успешный тест фона, логируем дополнительную информацию
            if (cmdInfo.isBackgroundTest) {
              console.log(`[${taskId}] 🔥 BACKGROUND TEST SUCCESS!`);
              console.log(`[${taskId}] 🔥   This means background styling CAN work`);
              console.log(`[${taskId}] 🔥   Working style: ${cmdInfo.styleVariant}`);
            }
            
            break;
          }
        }
      } catch (error) {
        console.log(`[${taskId}] ❌ Method ${i + 1} failed:`, error.message);
        if (commands[i].isBackgroundTest) {
          console.log(`[${taskId}] 🔥 Background test ${i + 1} failed - this helps narrow down the issue`);
        }
      }
    }

    if (!success) {
      throw new Error('All methods failed including background tests');
    }

    // ВАЛИДАЦИЯ И СОЗДАНИЕ ОТВЕТА
    console.log(`[${taskId}] 🎉 PROCESSING SUCCESS! 🚀`);
    
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
    console.log(`[${taskId}] 📖 File read successfully: ${processedVideoBuffer.length} bytes`);

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
    console.log(`[${taskId}] 🔢 Base64 created: ${base64Data.length} chars`);

    // Валидируем Base64
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(base64Data)) {
      throw new Error('Invalid Base64 data generated');
    }

    console.log(`[${taskId}] ✅ Base64 validation passed`);

    const processingTime = Date.now() - startTime;
    const sizeChange = ((processedVideoBuffer.length / videoBuffer.length) - 1) * 100;

    console.log(`[${taskId}] Processing time: ${processingTime}ms`);
    console.log(`[${taskId}] Size change: ${sizeChange > 0 ? '+' : ''}${sizeChange.toFixed(1)}%`);
    console.log(`[${taskId}] Quality mode: ${optimalSettings.description}`);
    console.log(`[${taskId}] Method used: ${usedMethod}`);
    console.log(`[${taskId}] 🚀 Sending validated JSON response...`);

    // Очистка временных файлов
    [inputVideoPath, srtPath, outputVideoPath].forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[${taskId}] 🗑️ Deleted: ${path.basename(filePath)}`);
        }
      } catch (err) {
        console.warn(`[${taskId}] Failed to delete: ${filePath}`);
      }
    });

    // Создаем ответ с метаданными кастомного стиля и отладочной информацией
    const responseData = {
      success: true,
      task_id: taskId,
      processing_stats: {
        processing_time_ms: processingTime,
        input_size_bytes: videoBuffer.length,
        output_size_bytes: processedVideoBuffer.length,
        size_change_percent: parseFloat(sizeChange.toFixed(1)),
        method_used: `METHOD_${usedCommand}`,
        method_description: usedMethod,
        quality_mode: forceQuality,
        quality_description: optimalSettings.description
      },
      video_data: base64Data,
      content_type: 'video/mp4',
      video_metadata: {
        original_size_bytes: processedVideoBuffer.length,
        base64_length: base64Data.length,
        expected_decoded_size: Math.ceil(base64Data.length * 3 / 4),
        file_signature: processedVideoBuffer.slice(0, 12).toString('hex'),
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
      },
      // 🔥 ДОБАВЛЯЕМ ОТЛАДОЧНУЮ ИНФОРМАЦИЮ ДЛЯ ФОНА
      background_debug: {
        background_requested: !!styleParams.background,
        background_parsed: selectedStyle.backgroundType !== 'none',
        background_in_style: !!selectedStyle.backcolour,
        backcolour_value: selectedStyle.backcolour || 'none',
        style_contains_background: styleString.includes('BackColour'),
        ffmpeg_style_final: styleString,
        total_methods_tested: commands.length,
        successful_method: usedCommand,
        successful_method_description: usedMethod,
        background_variants_tested: commands.filter(cmd => cmd.isBackgroundTest).length
      }
    };

    console.log(`[${taskId}] 📤 Sending JSON response with debug info...`);
    console.log(`[${taskId}] 🔥 Background debug summary:`, responseData.background_debug);

    // Отправляем ответ
    res.json(responseData);

  } catch (error) {
    console.error(`[${taskId}] 💥 ERROR:`, error.message);

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
  console.log(`🔥 BACKGROUND DEBUGGING MODE ENABLED`);
  console.log(`🎯 Style system: CUSTOM_PARAMETERS_ONLY`);
  console.log(`✨ Available parameters:`);
  console.log(`   • fontsize (6-12) - Text size`);
  console.log(`   • fontcolor (hex) - Text color`);
  console.log(`   • bold (true/false) - Bold text`);
  console.log(`   • outline (true/false) - Text outline`);
  console.log(`   • background (true/false) - Black transparent background [DEBUG MODE]`);
  console.log(`   • position (bottom/top/center) - Text position`);
  console.log(`🎯 Quality modes available:`);
  console.log(`   • auto - Adaptive quality based on input analysis`);
  console.log(`   • lossless - Perfect quality preservation (CRF 0)`);
  console.log(`   • ultra - Ultra high quality (CRF 8)`);
  console.log(`   • high - High quality (CRF 12)`);
  console.log(`   • medium - Medium quality (CRF 18)`);
  console.log(`   • low - Low quality for testing (CRF 28)`);
  console.log(`🚀 Endpoints available:`);
  console.log(`   • POST /process-video-stream (Custom styles - Validated JSON + Background Debug)`);
  console.log(`   • GET /health (System status)`);
  const systemInfo = getSystemInfo();
  console.log(`FFmpeg: ${systemInfo.ffmpeg_available}`);
  console.log(`Quality Mode: CUSTOM_STYLES_WITH_MP4_VERIFICATION_AND_BACKGROUND_DEBUG`);
});

// Увеличиваем timeout сервера
server.timeout = 900000; // 15 минут
server.keepAliveTimeout = 900000;
server.headersTimeout = 900000;
