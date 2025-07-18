// Beautiful Railway Service с кастомными стилями + МАКСИМАЛЬНОЕ КАЧЕСТВО + STREAMING
// server.js - Custom subtitle styles + NO COMPRESSION + NO TIMEOUT - PRODUCTION

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
  req.setTimeout(900000); // 15 минут
  res.setTimeout(900000);
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
    alignment: 2,
    marginv: 15,
    name: 'Снизу'
  },
  top: {
    alignment: 8,
    marginv: 15,
    name: 'Сверху'
  },
  center: {
    alignment: 5,
    marginv: 0,
    name: 'По центру'
  }
};

// 🎯 ДОСТУПНЫЕ ШРИФТЫ
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
  const defaults = {
    fontsize: 8,
    fontcolor: 'ffffff',
    bold: false,
    outline: true,
    position: 'bottom',
    background: ''
  };
  
  const params = { ...defaults, ...styleParams };
  
  // Валидация параметров
  params.fontsize = Math.max(6, Math.min(12, parseInt(params.fontsize) || 8));
  params.fontcolor = (params.fontcolor || 'ffffff').replace('#', '').toLowerCase();
  params.bold = parseBooleanParam(params.bold);
  params.outline = parseBooleanParam(params.outline);
  
  if (!['bottom', 'top', 'center'].includes(params.position)) {
    params.position = 'bottom';
  }
  
  const positionSettings = SUBTITLE_POSITIONS[params.position];
  
  // Строим финальный стиль
  const style = {
    fontsize: params.fontsize,
    fontcolor: params.fontcolor,
    fontname: AVAILABLE_FONTS[0],
    bold: params.bold ? 1 : 0,
    alignment: positionSettings.alignment,
    marginv: positionSettings.marginv
  };
  
  // Добавляем обводку
  if (params.outline) {
    style.outline = 2;
    style.shadow = 1;
  } else {
    style.outline = 0;
    style.shadow = 0;
  }
  
  // Обрабатываем цвет фона
  const backgroundInfo = parseBackgroundColor(params.background);
  if (backgroundInfo.enabled) {
    style.backcolour = backgroundInfo.ffmpegColor;
    // ЭКСПЕРИМЕНТ: Попробуем BorderStyle=3 (может быть он все-таки нужен)
    style.borderstyle = 3;
  }
  
  return {
    style,
    description: `Custom style: ${params.fontsize}px, ${params.fontcolor}, ${params.position}, outline: ${params.outline}, bg: ${backgroundInfo.description}, bold: ${params.bold}`
  };
}

// 🎨 ФУНКЦИЯ ПАРСИНГА ЦВЕТА ФОНА
function parseBackgroundColor(backgroundParam) {
  console.log(`[DEBUG] parseBackgroundColor called with: "${backgroundParam}"`);
  
  // Если пустая строка, null, undefined или false - отключаем фон
  if (!backgroundParam || backgroundParam === '' || backgroundParam === 'false') {
    return {
      enabled: false,
      ffmpegColor: null,
      description: 'none'
    };
  }
  
  // Для обратной совместимости: если передали true или "true" - используем черный полупрозрачный
  if (backgroundParam === true || backgroundParam === 'true') {
    return {
      enabled: true,
      ffmpegColor: '&H80000000',
      description: 'black semi-transparent'
    };
  }
  
  let colorString = String(backgroundParam).trim();
  
  // Убираем # если есть
  colorString = colorString.replace('#', '');
  
  console.log(`[DEBUG] Processing color string: "${colorString}"`);
  
  // Проверяем валидность hex
  if (!/^[0-9a-fA-F]{6}$|^[0-9a-fA-F]{8}$/.test(colorString)) {
    console.warn(`Invalid background color: ${backgroundParam}, using default black semi-transparent`);
    return {
      enabled: true,
      ffmpegColor: '&H80000000',
      description: 'black semi-transparent (fallback)'
    };
  }
  
  let alpha, red, green, blue;
  
  if (colorString.length === 6) {
    // RRGGBB - добавляем ПОЛНУЮ НЕПРОЗРАЧНОСТЬ по умолчанию
    alpha = 'FF'; // 100% непрозрачность вместо 80 (50%)
    red = colorString.substring(0, 2);
    green = colorString.substring(2, 4);
    blue = colorString.substring(4, 6);
    console.log(`[DEBUG] 6-char color: R=${red}, G=${green}, B=${blue}, A=${alpha}`);
  } else {
    // AARRGGBB или RRGGBBAA
    if (isAlphaFirst(colorString)) {
      // AARRGGBB формат
      alpha = colorString.substring(0, 2);
      red = colorString.substring(2, 4);
      green = colorString.substring(4, 6);
      blue = colorString.substring(6, 8);
      console.log(`[DEBUG] 8-char AARRGGBB: A=${alpha}, R=${red}, G=${green}, B=${blue}`);
    } else {
      // RRGGBBAA формат (более популярный)
      red = colorString.substring(0, 2);
      green = colorString.substring(2, 4);
      blue = colorString.substring(4, 6);
      alpha = colorString.substring(6, 8);
      console.log(`[DEBUG] 8-char RRGGBBAA: R=${red}, G=${green}, B=${blue}, A=${alpha}`);
    }
  }
  
  // СПЕЦИАЛЬНАЯ ОБРАБОТКА ДЛЯ ЧЕРНОГО ЦВЕТА
  let finalColor;
  const isBlack = (red === '00' && green === '00' && blue === '00');
  
  if (isBlack && alpha === 'FF') {
    console.log(`[DEBUG] SPECIAL: Pure black detected, trying multiple approaches`);
    
    // Попробуем несколько вариантов для черного цвета
    const blackVariants = [
      '&HFF010101', // Почти черный RGB(1,1,1)
      '&HFF000001', // Почти черный RGB(0,0,1) 
      '&HFF101010', // Темно-серый RGB(16,16,16)
      '&HE0000000', // Черный с 88% непрозрачностью
      '&HC0000000', // Черный с 75% непрозрачностью
    ];
    
    finalColor = blackVariants[0]; // Используем первый вариант по умолчанию
    console.log(`[DEBUG] Using black variant: ${finalColor}`);
  } else {
    // FFmpeg использует формат &HAABBGGRR (обратный порядок + альфа в начале)
    finalColor = `&H${alpha}${blue}${green}${red}`.toUpperCase();
    console.log(`[DEBUG] Standard color: ${finalColor}`);
  }
  
  const alphaPercent = Math.round((parseInt(alpha, 16) / 255) * 100);
  const description = isBlack ? 
    `black variant (${alphaPercent}% opacity)` : 
    `#${red}${green}${blue} (${alphaPercent}% opacity)`;
  
  console.log(`[DEBUG] Final result: enabled=true, color=${finalColor}, description="${description}"`);
  
  return {
    enabled: true,
    ffmpegColor: finalColor,
    description: description,
    isBlackVariant: isBlack,
    originalHex: `${red}${green}${blue}${alpha}`
  };
}

// 🔧 HELPER ФУНКЦИЯ ДЛЯ ОПРЕДЕЛЕНИЯ ФОРМАТА АЛЬФЫ
function isAlphaFirst(colorString) {
  // Простая эвристика: если первые два символа дают значение > 128 в hex,
  // вероятно это альфа канал в начале (обычно высокие значения для видимости)
  const firstTwo = parseInt(colorString.substring(0, 2), 16);
  const lastTwo = parseInt(colorString.substring(6, 8), 16);
  
  // Если первые два символа больше 128 (80 в hex), скорее всего это альфа
  // Если последние два больше 128, скорее всего альфа в конце
  if (firstTwo > 128 && lastTwo <= 128) return true;
  if (lastTwo > 128 && firstTwo <= 128) return false;
  
  // По умолчанию считаем что альфа в конце (RRGGBBAA)
  return false;
}

// 🔧 HELPER ФУНКЦИЯ ДЛЯ ПАРСИНГА BOOLEAN ПАРАМЕТРОВ
function parseBooleanParam(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lowercased = value.toLowerCase().trim();
    return lowercased === 'true' || lowercased === '1' || lowercased === 'yes';
  }
  if (typeof value === 'number') return value !== 0;
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

// 🎯 ВЫБОР ОПТИМАЛЬНЫХ НАСТРОЕК КАЧЕСТВА
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
    style_system: 'CUSTOM_PARAMETERS_ONLY',
    available_fonts: AVAILABLE_FONTS,
    available_positions: Object.keys(SUBTITLE_POSITIONS),
    quality_mode: 'NO_COMPRESSION_MAXIMUM_QUALITY_STREAMING_ENABLED',
    style_parameters: {
      fontsize: 'number (6-12)',
      fontcolor: 'string (hex without #)',
      bold: 'boolean',
      outline: 'boolean',
      position: 'string (bottom/top/center)',
      background: 'string (hex color with optional alpha: RRGGBB, RRGGBBAA, AARRGGBB or empty string for no background)'
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
  if (!srtContent || srtContent.length < 10) {
    throw new Error('SRT content is empty or too short');
  }
  
  if (!srtContent.includes('-->')) {
    return `1\n00:00:00,000 --> 00:00:10,000\n${srtContent.trim()}\n\n`;
  }
  
  let beautifiedSrt = srtContent
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
  
  const lines = beautifiedSrt.split('\n');
  const improvedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('-->')) {
      improvedLines.push(line);
    } else if (/^\d+$/.test(line)) {
      improvedLines.push(line);
    } else if (line.length > 0) {
      let improvedText = line;
      
      improvedText = improvedText.replace(/\s+/g, ' ').trim();
      improvedText = improvedText.replace(/\s+([,.!?;:])/g, '$1');
      improvedText = improvedText.replace(/([,.!?;:])\s*/g, '$1 ');
      improvedText = improvedText.replace(/"/g, '«').replace(/"/g, '»');
      
      if (improvedText.length > 50) {
        const words = improvedText.split(' ');
        if (words.length > 8) {
          const mid = Math.ceil(words.length / 2);
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
      improvedLines.push('');
    }
  }
  
  beautifiedSrt = improvedLines.join('\n');
  
  if (!beautifiedSrt.endsWith('\n\n')) {
    beautifiedSrt += '\n\n';
  }
  
  return beautifiedSrt;
}

// 🚀 ОСНОВНОЙ STREAMING ENDPOINT С КАСТОМНЫМИ СТИЛЯМИ
app.post('/process-video-stream', upload.single('video'), async (req, res) => {
  const taskId = req.body.task_id || uuidv4();
  const startTime = Date.now();
  
  console.log(`\n=== [${taskId}] CUSTOM STYLE PROCESSING ===`);

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
    console.log(`[${taskId}] Quality mode: ${forceQuality}`);
    
    // 🎨 СОЗДАЕМ КАСТОМНЫЙ СТИЛЬ
    const { style: selectedStyle, description: styleDescription } = buildCustomStyle(styleParams);
    console.log(`[${taskId}] Style: ${styleDescription}`);

    // 🎨 ПОЛУЧАЕМ ИНФОРМАЦИЮ О ФОНЕ ДЛЯ ДАЛЬНЕЙШЕГО ИСПОЛЬЗОВАНИЯ
    const backgroundInfo = parseBackgroundColor(styleParams.background);

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
    const videoQuality = analyzeVideoQuality(inputVideoPath);
    console.log(`[${taskId}] Input: ${videoQuality.resolution}, ${Math.round(videoQuality.bitrate / 1000)}kbps`);

    // Выбираем настройки качества
    const optimalSettings = getQualitySettings(forceQuality, videoQuality);

    // Beautify SRT
    const beautifiedSRT = beautifySRT(rawSrtContent, taskId);
    fs.writeFileSync(srtPath, beautifiedSRT, 'utf8');

    // 🎨 СТРОИМ STYLE STRING ДЛЯ FFMPEG
    const buildStyleString = (style) => {
      let styleStr = `Fontsize=${style.fontsize}`;
      
      if (style.fontname) {
        styleStr += `,Fontname=${style.fontname}`;
      }
      
      if (style.fontcolor) {
        const color = style.fontcolor.startsWith('&H') ? style.fontcolor : `&H${style.fontcolor}`;
        styleStr += `,PrimaryColour=${color}`;
      }
      
      if (style.outline && style.outline > 0) {
        styleStr += `,OutlineColour=&H000000,Outline=${style.outline}`;
      }
      
      if (style.shadow && style.shadow > 0) {
        styleStr += `,Shadow=${style.shadow}`;
      }
      
      if (style.bold) {
        styleStr += `,Bold=${style.bold}`;
      }
      
      if (style.alignment) {
        styleStr += `,Alignment=${style.alignment}`;
      }
      
      if (style.marginv !== undefined) {
        styleStr += `,MarginV=${style.marginv}`;
      }
      
      if (style.backcolour) {
        styleStr += `,BackColour=${style.backcolour}`;
        // ИСПРАВЛЕНИЕ: BorderStyle=4 для чистого прямоугольного фона
        if (style.borderstyle) {
          styleStr += `,BorderStyle=${style.borderstyle}`;
        }
      }
      
      return styleStr;
    };

    const styleString = buildStyleString(selectedStyle);

    // Строим FFmpeg команды с fallback логикой
    const mainCommand = `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleString}'" -c:a copy -c:v libx264 -preset ${optimalSettings.preset} -crf ${optimalSettings.crf} -pix_fmt yuv420p${optimalSettings.tune ? ` -tune ${optimalSettings.tune}` : ''} -profile:v ${optimalSettings.profile}${optimalSettings.level ? ` -level ${optimalSettings.level}` : ''} -movflags +faststart -y "${outputVideoPath}"`;

    // Создаем массив команд
    let commands = [mainCommand];
    
    // Если это черный фон, добавляем специальные fallback варианты с разными BorderStyle
    if (selectedStyle.backcolour && backgroundInfo.isBlackVariant) {
      console.log(`[${taskId}] Adding special black background fallbacks...`);
      
      const testCombinations = [
        { color: '&HFF010101', border: 3, desc: 'Almost black + BorderStyle=3' },
        { color: '&HFF010101', border: 4, desc: 'Almost black + BorderStyle=4' },
        { color: '&HFF101010', border: 3, desc: 'Dark gray + BorderStyle=3' },
        { color: '&HFF101010', border: 4, desc: 'Dark gray + BorderStyle=4' },
        { color: '&HE0000000', border: 3, desc: 'Black 88% + BorderStyle=3' },
        { color: '&HC0000000', border: 3, desc: 'Black 75% + BorderStyle=3' },
        { color: '&H80000000', border: 3, desc: 'Black 50% + BorderStyle=3' },
        { color: '&HFF202020', border: 3, desc: 'Very dark gray + BorderStyle=3' },
      ];
      
      testCombinations.forEach((combo, index) => {
        const testStyleString = styleString
          .replace(selectedStyle.backcolour, combo.color)
          .replace(/BorderStyle=\d+/, `BorderStyle=${combo.border}`);
        const testCommand = `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${testStyleString}'" -c:a copy -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart -y "${outputVideoPath}"`;
        commands.push(testCommand);
        console.log(`[${taskId}] Test ${index + 1}: ${combo.desc} -> ${combo.color},BorderStyle=${combo.border}`);
      });
    }

    const simplifiedStyleString = `Fontname=DejaVu Sans,Fontsize=${selectedStyle.fontsize},PrimaryColour=&H${selectedStyle.fontcolor || 'ffffff'},OutlineColour=&H000000,Outline=${selectedStyle.outline || 2}${selectedStyle.backcolour ? `,BackColour=${selectedStyle.backcolour},BorderStyle=3` : ''}`;
    
    // Добавляем стандартные fallback команды + эксперименты с фоном
    commands.push(
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleString}'" -c:a copy -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart -y "${outputVideoPath}"`,
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${simplifiedStyleString}'" -c:a copy -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -y "${outputVideoPath}"`
    );
    
    // Добавляем эксперименты с BorderStyle для любого фона (не только черного)
    if (selectedStyle.backcolour) {
      console.log(`[${taskId}] Adding comprehensive background experiments...`);
      
      // Эксперимент 1: Попробуем совсем другой синтаксис для фона
      const alternativeSyntaxTests = [
        {
          style: `Fontsize=${selectedStyle.fontsize},PrimaryColour=&H${selectedStyle.fontcolor},BackColour=&H80000000,BorderStyle=3`,
          desc: 'Simple black background test'
        },
        {
          style: `Fontsize=${selectedStyle.fontsize},PrimaryColour=&H${selectedStyle.fontcolor},BackColour=&HFF000000,BorderStyle=3`,
          desc: 'Full black background test'
        },
        {
          style: `Fontsize=${selectedStyle.fontsize},PrimaryColour=&H${selectedStyle.fontcolor},BackColour=&H40808080,BorderStyle=3`,
          desc: 'Gray background test'
        },
        {
          style: `Fontsize=${selectedStyle.fontsize},PrimaryColour=&H${selectedStyle.fontcolor},SecondaryColour=&H80000000,BorderStyle=3`,
          desc: 'SecondaryColour instead of BackColour'
        },
        {
          style: `Fontsize=${selectedStyle.fontsize},PrimaryColour=&H${selectedStyle.fontcolor},BackColour=&H80000000,BorderStyle=4,Shadow=0`,
          desc: 'Background with BorderStyle=4 and no shadow'
        }
      ];
      
      alternativeSyntaxTests.forEach((test, index) => {
        const testCommand = `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${test.style}'" -c:a copy -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -y "${outputVideoPath}"`;
        commands.push(testCommand);
        console.log(`[${taskId}] Alternative ${index + 1}: ${test.desc}`);
        console.log(`[${taskId}]   Style: ${test.style}`);
      });
      
      // Эксперимент 2: Попробуем без Outline (может конфликтует)
      const noOutlineTests = [
        {
          style: `Fontsize=${selectedStyle.fontsize},PrimaryColour=&H${selectedStyle.fontcolor},BackColour=&H80000000,BorderStyle=3,Outline=0`,
          desc: 'Background without outline'
        },
        {
          style: `Fontsize=${selectedStyle.fontsize},PrimaryColour=&H${selectedStyle.fontcolor},BackColour=&H80000000,BorderStyle=3,Outline=0,Shadow=0`,
          desc: 'Background without outline and shadow'
        }
      ];
      
      noOutlineTests.forEach((test, index) => {
        const testCommand = `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${test.style}'" -c:a copy -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -y "${outputVideoPath}"`;
        commands.push(testCommand);
        console.log(`[${taskId}] No-outline ${index + 1}: ${test.desc}`);
      });
      
      // Эксперимент 3: Попробуем вообще другой подход через ASS стили
      const assStyleTests = [
        `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='BackColour=&H80000000,BorderStyle=3'" -c:a copy -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -y "${outputVideoPath}"`,
        `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontsize=8,BackColour=&H40FF0000,BorderStyle=3'" -c:a copy -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -y "${outputVideoPath}"` // Красный фон для теста
      ];
      
      assStyleTests.forEach((testCommand, index) => {
        commands.push(testCommand);
        console.log(`[${taskId}] ASS-style ${index + 1}: ${index === 0 ? 'Black background only' : 'Red background test'}`);
      });
    }
    
    // Финальный fallback без кастомных стилей
    commands.push(
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}'" -c:a copy -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -y "${outputVideoPath}"`
    );

    let success = false;
    let usedCommand = 0;

    // Выполняем команды последовательно
    for (let i = 0; i < commands.length && !success; i++) {
      try {
        console.log(`[${taskId}] Trying method ${i + 1}...`);
        
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
            console.log(`[${taskId}] ✅ Success! Method ${i + 1} (${cmdDuration}ms)`);
            success = true;
            usedCommand = i + 1;
            break;
          }
        }
      } catch (error) {
        console.log(`[${taskId}] ❌ Method ${i + 1} failed`);
      }
    }

    if (!success) {
      throw new Error('All processing methods failed');
    }

    // Проверяем результат
    if (!fs.existsSync(outputVideoPath)) {
      throw new Error('Output video file not found');
    }

    const outputStats = fs.statSync(outputVideoPath);
    if (outputStats.size === 0) {
      throw new Error('Output video file is empty');
    }

    // Читаем файл и создаем base64
    const processedVideoBuffer = fs.readFileSync(outputVideoPath);
    const base64Data = processedVideoBuffer.toString('base64');

    // Проверяем MP4 header
    const mp4Header = processedVideoBuffer.slice(0, 12);
    const isValidMP4 = mp4Header.includes(Buffer.from('ftyp')) || 
                       mp4Header.slice(4, 8).toString() === 'ftyp';

    const processingTime = Date.now() - startTime;
    const sizeChange = ((processedVideoBuffer.length / videoBuffer.length) - 1) * 100;

    console.log(`[${taskId}] Complete: ${processingTime}ms, size change: ${sizeChange > 0 ? '+' : ''}${sizeChange.toFixed(1)}%`);

    // Очистка временных файлов
    [inputVideoPath, srtPath, outputVideoPath].forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (err) {}
    });

    // Отправляем ответ
    res.json({
      success: true,
      task_id: taskId,
      processing_stats: {
        processing_time_ms: processingTime,
        input_size_bytes: videoBuffer.length,
        output_size_bytes: processedVideoBuffer.length,
        size_change_percent: parseFloat(sizeChange.toFixed(1)),
        method_used: `METHOD_${usedCommand}`,
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
      }
    });

  } catch (error) {
    console.error(`[${taskId}] Error:`, error.message);

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
  console.log(`🎨 CUSTOM STYLE Subtitle Service running on port ${PORT}`);
  console.log(`📱 Ready for custom subtitle styles with MAXIMUM QUALITY!`);
  console.log(`🎯 Style system: CUSTOM_PARAMETERS_ONLY`);
  console.log(`✨ Available parameters:`);
  console.log(`   • fontsize (6-12) - Text size`);
  console.log(`   • fontcolor (hex) - Text color`);
  console.log(`   • bold (true/false) - Bold text`);
  console.log(`   • outline (true/false) - Text outline`);
  console.log(`   • background (hex color) - Background color with alpha (RRGGBB, RRGGBBAA, AARRGGBB, or empty for none)`);
  console.log(`   • position (bottom/top/center) - Text position`);
  console.log(`🎯 Quality modes: auto | lossless | ultra | high | medium | low`);
  console.log(`🚀 Endpoints:`);
  console.log(`   • POST /process-video-stream (Custom styles - JSON response)`);
  console.log(`   • GET /health (System status)`);
  
  const systemInfo = getSystemInfo();
  console.log(`FFmpeg: ${systemInfo.ffmpeg_available}`);
  console.log(`Quality Mode: CUSTOM_STYLES_WITH_MP4_VERIFICATION`);
});

// Увеличиваем timeout сервера
server.timeout = 900000; // 15 минут
server.keepAliveTimeout = 900000;
server.headersTimeout = 900000;
