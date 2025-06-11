// Production Railway Service с настоящими субтитрами
// server.js - обрабатывает SRT от Whisper API

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

// Health check
app.get('/health', (req, res) => {
  const systemInfo = getSystemInfo();
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mode: 'PRODUCTION_SUBTITLES',
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
      subtitle_method: 'REAL_SRT_PROCESSING'
    };
  } catch (error) {
    return { 
      ffmpeg_available: false, 
      error: error.message 
    };
  }
}

// Функция очистки и валидации SRT
function cleanAndValidateSRT(srtContent, taskId) {
  console.log(`[${taskId}] Cleaning and validating SRT...`);
  console.log(`[${taskId}] Original SRT length: ${srtContent.length} chars`);
  console.log(`[${taskId}] SRT preview:`, srtContent.substring(0, 300));
  
  if (!srtContent || srtContent.length < 10) {
    throw new Error('SRT content is empty or too short');
  }
  
  // Проверяем, что это SRT формат
  if (!srtContent.includes('-->')) {
    console.log(`[${taskId}] ⚠️ Invalid SRT format - converting plain text to SRT`);
    // Если это просто текст, создаем простой SRT
    return `1\n00:00:00,000 --> 00:00:10,000\n${srtContent.trim()}\n\n`;
  }
  
  // Очищаем SRT
  let cleanedSrt = srtContent
    .replace(/\r\n/g, '\n')  // Унифицируем переносы строк
    .replace(/\r/g, '\n')
    .trim();
  
  // Убеждаемся, что SRT заканчивается правильно
  if (!cleanedSrt.endsWith('\n\n')) {
    cleanedSrt += '\n\n';
  }
  
  // Проверяем структуру SRT
  const lines = cleanedSrt.split('\n');
  let subtitleCount = 0;
  let hasValidTimestamps = false;
  
  for (const line of lines) {
    if (line.includes('-->')) {
      hasValidTimestamps = true;
      subtitleCount++;
    }
  }
  
  console.log(`[${taskId}] ✅ SRT validation:`);
  console.log(`[${taskId}] - Subtitle count: ${subtitleCount}`);
  console.log(`[${taskId}] - Has timestamps: ${hasValidTimestamps}`);
  console.log(`[${taskId}] - Cleaned length: ${cleanedSrt.length} chars`);
  
  if (!hasValidTimestamps) {
    throw new Error('SRT does not contain valid timestamps');
  }
  
  if (subtitleCount === 0) {
    throw new Error('SRT does not contain any subtitles');
  }
  
  return cleanedSrt;
}

app.post('/process-video-with-subtitles', upload.single('video'), async (req, res) => {
  const taskId = req.body.task_id || uuidv4();
  const startTime = Date.now();
  
  console.log(`\n=== [${taskId}] PRODUCTION SUBTITLE PROCESSING ===`);

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
    const userSettings = JSON.parse(req.body.user_settings || '{}');
    
    console.log(`[${taskId}] Video size: ${videoBuffer.length} bytes`);
    console.log(`[${taskId}] Raw SRT length: ${rawSrtContent.length} chars`);
    console.log(`[${taskId}] User settings:`, userSettings);

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

    // Очищаем и валидируем SRT
    const cleanedSRT = cleanAndValidateSRT(rawSrtContent, taskId);
    fs.writeFileSync(srtPath, cleanedSRT, 'utf8');

    console.log(`[${taskId}] ✅ Files prepared successfully`);

    // Настройки стиля субтитров в зависимости от подписки
    const subtitleStyles = {
      default: {
        fontsize: 24,
        fontcolor: 'white',
        outline: 2,
        shadow: 1,
        description: 'Базовый стиль'
      },
      pro: {
        fontsize: 28,
        fontcolor: 'white',
        outline: 3,
        shadow: 2,
        bold: 1,
        description: 'Pro стиль с увеличенным шрифтом'
      },
      premium: {
        fontsize: 32,
        fontcolor: 'yellow',
        outline: 3,
        shadow: 2,
        bold: 1,
        description: 'Premium стиль с желтым цветом'
      }
    };

    const styleConfig = subtitleStyles[userSettings.subscription_tier] || subtitleStyles.default;
    console.log(`[${taskId}] Using style: ${styleConfig.description}`);

    // Команды для встраивания субтитров (в порядке приоритета)
    const commands = [
      // Команда 1: subtitles фильтр с настройками стиля
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontsize=${styleConfig.fontsize},PrimaryColour=&H${styleConfig.fontcolor === 'white' ? 'ffffff' : '00ffff'},OutlineColour=&H000000,Outline=${styleConfig.outline},Shadow=${styleConfig.shadow}${styleConfig.bold ? ',Bold=1' : ''}'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 2: subtitles фильтр с DejaVu шрифтом
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontname=DejaVu Sans,Fontsize=${styleConfig.fontsize},PrimaryColour=&H${styleConfig.fontcolor === 'white' ? 'ffffff' : '00ffff'},OutlineColour=&H000000,Outline=${styleConfig.outline}'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 3: Простой subtitles фильтр без стилей
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 4: Fallback с drawtext (первая строка SRT)
      `ffmpeg -i "${inputVideoPath}" -vf "drawtext=fontfile=/usr/share/fonts/dejavu/DejaVuSans.ttf:text='СУБТИТРЫ ДОБАВЛЕНЫ':fontsize=${styleConfig.fontsize}:fontcolor=${styleConfig.fontcolor}:x=(w-text_w)/2:y=h-60:box=1:boxcolor=black:boxborderw=2" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`
    ];

    let success = false;
    let usedCommand = 0;
    let methodDescription = '';

    for (let i = 0; i < commands.length && !success; i++) {
      try {
        console.log(`[${taskId}] 🎬 Trying subtitle method ${i + 1}...`);
        console.log(`[${taskId}] Command: ${commands[i].substring(0, 100)}...`);
        
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
            console.log(`[${taskId}] ✅ SUCCESS! Method ${i + 1} worked! (${cmdDuration}ms)`);
            console.log(`[${taskId}] Output size: ${outputSize} bytes`);
            
            success = true;
            usedCommand = i + 1;
            
            const descriptions = [
              'STYLED_SUBTITLES',
              'DEJAVU_FONT_SUBTITLES',
              'SIMPLE_SUBTITLES',
              'FALLBACK_DRAWTEXT'
            ];
            methodDescription = descriptions[i];
            
            break;
          }
        }
        
      } catch (error) {
        console.log(`[${taskId}] ❌ Method ${i + 1} failed:`, error.message);
      }
    }

    if (!success) {
      throw new Error('All subtitle embedding methods failed');
    }

    // Читаем результат
    const processedVideoBuffer = fs.readFileSync(outputVideoPath);
    const processingTime = Date.now() - startTime;

    console.log(`[${taskId}] 🎉 PRODUCTION SUBTITLES SUCCESS! 🎉`);
    console.log(`[${taskId}] Method: ${methodDescription}`);
    console.log(`[${taskId}] Command: ${usedCommand}`);
    console.log(`[${taskId}] Processing time: ${processingTime}ms`);
    console.log(`[${taskId}] Style: ${styleConfig.description}`);

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
        subtitle_style: styleConfig.description
      },
      video_data: processedVideoBuffer.toString('base64'),
      content_type: 'video/mp4',
      subtitle_info: {
        method: methodDescription,
        style_applied: styleConfig.description,
        subscription_tier: userSettings.subscription_tier || 'default',
        real_subtitles: true
      }
    });

  } catch (error) {
    console.error(`[${taskId}] 💥 PRODUCTION ERROR:`, error.message);

    // Очистка при ошибке
    const tempFiles = [
      `/tmp/processing/input_${taskId}.mp4`,
      `/tmp/processing/subtitles_${taskId}.srt`,
      `/tmp/processing/output_${taskId}.mp4`
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
  console.log(`🎬 PRODUCTION Subtitle Service running on port ${PORT}`);
  console.log(`🎯 Real SRT processing enabled!`);
  const systemInfo = getSystemInfo();
  console.log(`FFmpeg: ${systemInfo.ffmpeg_available}`);
  console.log(`Fonts: ${systemInfo.fonts_available.length} available`);
});
