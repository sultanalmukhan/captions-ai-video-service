// Railway Service с исправленными шрифтами
// server.js - с указанием конкретных шрифтов

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

// Enhanced health check with font information
app.get('/health', (req, res) => {
  const systemInfo = getSystemInfo();
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    ...systemInfo
  });
});

function getSystemInfo() {
  try {
    // Проверяем FFmpeg
    const ffmpegVersion = execSync('ffmpeg -version', { encoding: 'utf8' }).split('\n')[0];
    
    // Проверяем доступные шрифты
    let availableFonts = [];
    try {
      const fontList = execSync('fc-list', { encoding: 'utf8' });
      availableFonts = fontList.split('\n').slice(0, 10); // Первые 10 шрифтов
    } catch (err) {
      availableFonts = ['Font check failed'];
    }
    
    // Проверяем фильтры FFmpeg
    let drawTextSupport = false;
    try {
      const filters = execSync('ffmpeg -filters 2>/dev/null | grep drawtext', { encoding: 'utf8' });
      drawTextSupport = filters.includes('drawtext');
    } catch (err) {
      drawTextSupport = false;
    }
    
    return {
      ffmpeg_available: true,
      ffmpeg_version: ffmpegVersion,
      fonts_available: availableFonts,
      drawtext_support: drawTextSupport,
      font_paths: [
        '/usr/share/fonts/',
        '/usr/share/fonts/dejavu/',
        '/usr/share/fonts/liberation/',
        '/usr/share/fonts/noto/'
      ]
    };
  } catch (error) {
    return { 
      ffmpeg_available: false, 
      error: error.message 
    };
  }
}

// Создание тестового SRT
function createTestSRT(duration, taskId) {
  console.log(`[${taskId}] Creating test SRT for ${duration} seconds`);
  
  let srtContent = '';
  const intervalSeconds = 3;
  let subtitleIndex = 1;
  
  for (let startTime = 0; startTime < duration; startTime += intervalSeconds) {
    const endTime = Math.min(startTime + intervalSeconds, duration);
    
    const startSRT = formatTimeToSRT(startTime);
    const endSRT = formatTimeToSRT(endTime);
    
    srtContent += `${subtitleIndex}\n`;
    srtContent += `${startSRT} --> ${endSRT}\n`;
    srtContent += `ТЕСТ ${subtitleIndex} - ${Math.floor(startTime)}с\n\n`;
    
    subtitleIndex++;
  }
  
  return srtContent;
}

function formatTimeToSRT(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

app.post('/process-video-with-subtitles', upload.single('video'), async (req, res) => {
  const taskId = req.body.task_id || uuidv4();
  const startTime = Date.now();
  
  console.log(`\n=== [${taskId}] FIXED FONTS VIDEO PROCESSING ===`);

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Video file is required',
        task_id: taskId
      });
    }

    const videoBuffer = req.file.buffer;
    const rawSrtContent = req.body.srt_content || '';
    
    console.log(`[${taskId}] Video size: ${videoBuffer.length} bytes`);
    console.log(`[${taskId}] SRT provided: ${rawSrtContent.length > 0}`);

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

    // Создаем SRT (используем предоставленный или тестовый)
    let srtContent = rawSrtContent;
    if (!srtContent || srtContent.length < 10) {
      console.log(`[${taskId}] Creating test SRT...`);
      srtContent = createTestSRT(50, taskId);
    }
    fs.writeFileSync(srtPath, srtContent, 'utf8');

    console.log(`[${taskId}] SRT preview:`, srtContent.substring(0, 200));

    // Команды с указанием конкретных шрифтов
    const commands = [
      // Команда 1: drawtext с DejaVu шрифтом
      `ffmpeg -i "${inputVideoPath}" -vf "drawtext=fontfile=/usr/share/fonts/dejavu/DejaVuSans.ttf:text='🎯 ТЕСТ DEJAVU ШРИФТ 🎯':fontsize=32:fontcolor=red:x=(w-text_w)/2:y=h-80:box=1:boxcolor=white:boxborderw=5" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 2: drawtext с Liberation шрифтом
      `ffmpeg -i "${inputVideoPath}" -vf "drawtext=fontfile=/usr/share/fonts/liberation/LiberationSans-Regular.ttf:text='✅ LIBERATION FONT TEST ✅':fontsize=28:fontcolor=lime:x=(w-text_w)/2:y=50:box=1:boxcolor=black:boxborderw=3" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 3: drawtext с Noto шрифтом
      `ffmpeg -i "${inputVideoPath}" -vf "drawtext=fontfile=/usr/share/fonts/noto/NotoSans-Regular.ttf:text='📱 NOTO FONT РАБОТАЕТ 📱':fontsize=30:fontcolor=blue:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=yellow:boxborderw=4" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 4: subtitles фильтр с принудительным шрифтом
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontname=DejaVu Sans,Fontsize=28,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=2,Bold=1'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 5: subtitles без force_style (простейший)
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`
    ];

    let success = false;
    let usedCommand = 0;
    let methodDescription = '';

    for (let i = 0; i < commands.length && !success; i++) {
      try {
        console.log(`[${taskId}] 🎬 TRYING COMMAND ${i + 1} 🎬`);
        console.log(`[${taskId}] Command: ${commands[i]}`);
        
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
            console.log(`[${taskId}] ✅ SUCCESS! Command ${i + 1} worked! (${cmdDuration}ms)`);
            console.log(`[${taskId}] Output size: ${outputSize} bytes`);
            
            success = true;
            usedCommand = i + 1;
            
            // Описание метода
            const descriptions = [
              'DRAWTEXT_DEJAVU_FONT',
              'DRAWTEXT_LIBERATION_FONT', 
              'DRAWTEXT_NOTO_FONT',
              'SUBTITLES_WITH_FORCED_FONT',
              'SIMPLE_SUBTITLES'
            ];
            methodDescription = descriptions[i];
            
            break;
          }
        }
        
      } catch (error) {
        console.log(`[${taskId}] ❌ Command ${i + 1} failed:`, error.message);
      }
    }

    if (!success) {
      throw new Error('All font methods failed - check font installation');
    }

    // Читаем результат
    const processedVideoBuffer = fs.readFileSync(outputVideoPath);
    const processingTime = Date.now() - startTime;

    console.log(`[${taskId}] 🎉 FONTS FIXED! SUCCESS! 🎉`);
    console.log(`[${taskId}] Method: ${methodDescription}`);
    console.log(`[${taskId}] Command: ${usedCommand}`);
    console.log(`[${taskId}] Processing time: ${processingTime}ms`);

    // Очистка
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
        command_number: usedCommand
      },
      video_data: processedVideoBuffer.toString('base64'),
      content_type: 'video/mp4',
      subtitle_info: {
        fonts_fixed: true,
        method: methodDescription,
        guaranteed_visible: usedCommand <= 3 // drawtext методы
      }
    });

  } catch (error) {
    console.error(`[${taskId}] 💥 FONTS ERROR:`, error.message);

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
        // Игнорируем
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
  console.log(`Fixed Fonts Video Processing Service running on port ${PORT}`);
  const systemInfo = getSystemInfo();
  console.log(`FFmpeg available: ${systemInfo.ffmpeg_available}`);
  console.log(`DrawText support: ${systemInfo.drawtext_support}`);
  console.log(`Available fonts: ${systemInfo.fonts_available.length}`);
});
