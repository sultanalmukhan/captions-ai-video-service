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

// Health check
app.get('/health', (req, res) => {
  const systemInfo = getSystemInfo();
  
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mode: 'MAXIMUM_QUALITY_SOCIAL_MEDIA_STYLES_WITH_STREAMING',
    total_styles: Object.keys(SUBTITLE_STYLES).length,
    quality_mode: 'NO_COMPRESSION_MAXIMUM_QUALITY_STREAMING_ENABLED',
    endpoints: [
      '/process-video-stream (JSON response - NO TIMEOUT)',
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
      subtitle_method: 'MAXIMUM_QUALITY_SOCIAL_MEDIA_STYLES_WITH_JSON_RESPONSE'
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

// 🚀 ОСНОВНОЙ STREAMING ENDPOINT С VALIDATED BASE64 RESPONSE
app.post('/process-video-stream', upload.single('video'), async (req, res) => {
  const taskId = req.body.task_id || uuidv4();
  const startTime = Date.now();
  
  console.log(`\n=== [${taskId}] STREAMING QUALITY PROCESSING (VALIDATED JSON) ===`);

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
    
    // Получаем параметры
    const styleId = req.body.style_id || 'tiktok_classic';
    const position = req.body.position || 'bottom';
    const customStyle = req.body.custom_style ? JSON.parse(req.body.custom_style) : null;
    const forceQuality = req.body.force_quality || 'auto';
    
    console.log(`[${taskId}] Video size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    console.log(`[${taskId}] Raw SRT length: ${rawSrtContent.length} chars`);
    console.log(`[${taskId}] Style: ${styleId}, Position: ${position}`);
    console.log(`[${taskId}] 🎯 Quality mode: ${forceQuality}`);
    
    // Выбираем стиль
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

    // Строим FFmpeg команду
    const mainCommand = `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleString}'" -c:a copy -c:v libx264 -preset ${optimalSettings.preset} -crf ${optimalSettings.crf} -pix_fmt yuv420p${optimalSettings.tune ? ` -tune ${optimalSettings.tune}` : ''} -profile:v ${optimalSettings.profile}${optimalSettings.level ? ` -level ${optimalSettings.level}` : ''} -movflags +faststart -y "${outputVideoPath}"`;

    const commands = [
      mainCommand,
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleString}'" -c:a copy -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart -y "${outputVideoPath}"`,
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleString}'" -c:a copy -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -y "${outputVideoPath}"`,
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}'" -c:a copy -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -y "${outputVideoPath}"`
    ];

    let success = false;
    let usedCommand = 0;

    // Выполняем команды ПОСЛЕДОВАТЕЛЬНО
    for (let i = 0; i < commands.length && !success; i++) {
      try {
        console.log(`[${taskId}] 🎨 Trying streaming method ${i + 1}...`);
        
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

    // ВАЛИДАЦИЯ И СОЗДАНИЕ ОТВЕТА
    console.log(`[${taskId}] 🎉 STREAMING PROCESSING SUCCESS! 🚀`);
    
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

    // Создаем ответ с дополнительными метаданными для валидации
    const responseData = {
      success: true,
      task_id: taskId,
      processing_stats: {
        processing_time_ms: processingTime,
        input_size_bytes: videoBuffer.length,
        output_size_bytes: processedVideoBuffer.length,
        size_change_percent: parseFloat(sizeChange.toFixed(1)),
        method_used: `STREAMING_METHOD_${usedCommand}`,
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
        style_id: customStyle ? 'custom' : styleId,
        style_name_safe: customStyle ? 'Custom_Style' : styleId.replace(/_/g, '-'),
        position: position,
        fontsize: selectedStyle.fontsize,
        fontcolor: selectedStyle.fontcolor,
        has_background: !!selectedStyle.backcolour,
        has_bold: !!selectedStyle.bold
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

    console.log(`[${taskId}] 📤 Sending JSON response with validated video data...`);

    // Отправляем ответ
    res.json(responseData);

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
  console.log(`   • POST /process-video-stream (Main endpoint - Validated JSON)`);
  console.log(`   • GET /health (System status)`);
  const systemInfo = getSystemInfo();
  console.log(`FFmpeg: ${systemInfo.ffmpeg_available}`);
  console.log(`Quality Mode: VALIDATED_JSON_RESPONSE_WITH_MP4_VERIFICATION`);
});

// Увеличиваем timeout сервера
server.timeout = 900000; // 15 минут
server.keepAliveTimeout = 900000;
server.headersTimeout = 900000;
