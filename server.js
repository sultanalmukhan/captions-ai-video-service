// Railway Diagnostic Service
// server.js - диагностика и альтернативные методы встроенных субтитров

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

// Enhanced health check
app.get('/health', (req, res) => {
  const ffmpegInfo = getFFmpegInfo();
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    ffmpeg_available: ffmpegInfo.available,
    ffmpeg_version: ffmpegInfo.version,
    ffmpeg_filters: ffmpegInfo.filters,
    system_info: getSystemInfo()
  });
});

function getFFmpegInfo() {
  try {
    const versionOutput = execSync('ffmpeg -version', { encoding: 'utf8' });
    const filtersOutput = execSync('ffmpeg -filters 2>/dev/null | grep -E "(subtitles|drawtext|ass)"', { encoding: 'utf8' });
    
    return {
      available: true,
      version: versionOutput.split('\n')[0],
      filters: filtersOutput.split('\n').filter(line => line.trim())
    };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

function getSystemInfo() {
  try {
    const osInfo = execSync('cat /etc/os-release', { encoding: 'utf8' });
    return osInfo.split('\n')[0];
  } catch (error) {
    return 'Unknown OS';
  }
}

app.post('/process-video-with-subtitles', upload.single('video'), async (req, res) => {
  const taskId = req.body.task_id || uuidv4();
  const startTime = Date.now();
  
  console.log(`\n=== [${taskId}] DIAGNOSTIC VIDEO PROCESSING ===`);

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Video file is required',
        task_id: taskId
      });
    }

    const videoBuffer = req.file.buffer;
    console.log(`[${taskId}] Video size: ${videoBuffer.length} bytes`);

    // Диагностика системы
    console.log(`[${taskId}] System diagnostic:`);
    const ffmpegInfo = getFFmpegInfo();
    console.log(`[${taskId}] FFmpeg version:`, ffmpegInfo.version);
    console.log(`[${taskId}] Available filters:`, ffmpegInfo.filters);

    // Создаем временные файлы
    const tempDir = '/tmp/processing';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const inputVideoPath = path.join(tempDir, `input_${taskId}.mp4`);
    const outputVideoPath = path.join(tempDir, `output_${taskId}.mp4`);

    // Сохраняем видео
    fs.writeFileSync(inputVideoPath, videoBuffer);

    // ТЕСТ 1: Простой drawtext без файлов
    console.log(`[${taskId}] 🧪 TEST 1: Simple drawtext (no external files)`);
    
    const drawTextCommands = [
      // Базовый drawtext
      `ffmpeg -i "${inputVideoPath}" -vf "drawtext=text='ТЕСТ 1 - ПРОСТОЙ DRAWTEXT':fontsize=36:fontcolor=red:x=50:y=50" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Drawtext с фоном
      `ffmpeg -i "${inputVideoPath}" -vf "drawtext=text='ТЕСТ 2 - ТЕКСТ С ФОНОМ':fontsize=32:fontcolor=white:x=(w-text_w)/2:y=h-100:box=1:boxcolor=black:boxborderw=10" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Множественный drawtext
      `ffmpeg -i "${inputVideoPath}" -vf "drawtext=text='ТЕСТ 3 - ВЕРХ':fontsize=28:fontcolor=yellow:x=(w-text_w)/2:y=50,drawtext=text='ТЕСТ 3 - НИЗ':fontsize=28:fontcolor=lime:x=(w-text_w)/2:y=h-50" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Мигающий текст (изменяется каждую секунду)
      `ffmpeg -i "${inputVideoPath}" -vf "drawtext=text='МИГАЮЩИЙ ТЕСТ %{pts\\:hms}':fontsize=40:fontcolor=red:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=white" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`
    ];

    let success = false;
    let usedMethod = '';
    let diagnosticResults = [];

    // Пробуем каждый drawtext метод
    for (let i = 0; i < drawTextCommands.length && !success; i++) {
      try {
        console.log(`[${taskId}] Trying drawtext method ${i + 1}...`);
        console.log(`[${taskId}] Command: ${drawTextCommands[i]}`);
        
        // Удаляем предыдущий файл
        if (fs.existsSync(outputVideoPath)) {
          fs.unlinkSync(outputVideoPath);
        }
        
        const startCmdTime = Date.now();
        execSync(drawTextCommands[i], { 
          stdio: 'pipe',
          timeout: 300000,
          maxBuffer: 1024 * 1024 * 100
        });
        const cmdDuration = Date.now() - startCmdTime;
        
        // Проверяем результат
        if (fs.existsSync(outputVideoPath)) {
          const outputSize = fs.statSync(outputVideoPath).size;
          const compressionRatio = (outputSize / videoBuffer.length).toFixed(3);
          
          if (outputSize > 0) {
            console.log(`[${taskId}] ✅ Drawtext method ${i + 1} SUCCESS!`);
            console.log(`[${taskId}] - Processing time: ${cmdDuration}ms`);
            console.log(`[${taskId}] - Output size: ${outputSize} bytes`);
            console.log(`[${taskId}] - Compression ratio: ${compressionRatio}`);
            
            success = true;
            usedMethod = `DRAWTEXT_METHOD_${i + 1}`;
            
            diagnosticResults.push({
              method: i + 1,
              success: true,
              duration_ms: cmdDuration,
              output_size: outputSize,
              compression_ratio: compressionRatio
            });
            
            break;
          } else {
            diagnosticResults.push({
              method: i + 1,
              success: false,
              error: 'Empty output file'
            });
          }
        } else {
          diagnosticResults.push({
            method: i + 1,
            success: false,
            error: 'No output file created'
          });
        }
        
      } catch (error) {
        console.log(`[${taskId}] ❌ Drawtext method ${i + 1} failed:`, error.message);
        diagnosticResults.push({
          method: i + 1,
          success: false,
          error: error.message
        });
      }
    }

    if (!success) {
      // ТЕСТ 2: Проверяем основные кодеки
      console.log(`[${taskId}] 🧪 TEST 2: Basic video reencoding (no text)`);
      
      try {
        const basicCommand = `ffmpeg -i "${inputVideoPath}" -c:v libx264 -preset fast -crf 23 -c:a copy -y "${outputVideoPath}"`;
        console.log(`[${taskId}] Basic reencoding command: ${basicCommand}`);
        
        execSync(basicCommand, { stdio: 'pipe', timeout: 300000 });
        
        if (fs.existsSync(outputVideoPath) && fs.statSync(outputVideoPath).size > 0) {
          console.log(`[${taskId}] ✅ Basic reencoding works - FFmpeg is functional`);
          success = true;
          usedMethod = 'BASIC_REENCODING_ONLY';
        }
      } catch (error) {
        console.log(`[${taskId}] ❌ Even basic reencoding failed:`, error.message);
      }
    }

    if (!success) {
      throw new Error('All methods failed - FFmpeg may not be working properly');
    }

    // Читаем результат
    const processedVideoBuffer = fs.readFileSync(outputVideoPath);
    const processingTime = Date.now() - startTime;

    console.log(`[${taskId}] 🎉 DIAGNOSTIC COMPLETE! 🎉`);
    console.log(`[${taskId}] Used method: ${usedMethod}`);
    console.log(`[${taskId}] Total processing time: ${processingTime}ms`);

    // Очистка
    [inputVideoPath, outputVideoPath].forEach(filePath => {
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
        method_used: usedMethod
      },
      video_data: processedVideoBuffer.toString('base64'),
      content_type: 'video/mp4',
      diagnostic_info: {
        ffmpeg_version: ffmpegInfo.version,
        available_filters: ffmpegInfo.filters,
        method_results: diagnosticResults,
        subtitle_status: usedMethod.includes('DRAWTEXT') ? 'GUARANTEED_VISIBLE' : 'NO_TEXT_ADDED'
      }
    });

  } catch (error) {
    console.error(`[${taskId}] 💥 DIAGNOSTIC ERROR:`, error.message);

    // Очистка при ошибке
    const tempFiles = [
      `/tmp/processing/input_${taskId}.mp4`,
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
  console.log(`Diagnostic Video Processing Service running on port ${PORT}`);
  console.log(`System info:`, getSystemInfo());
  console.log(`FFmpeg info:`, getFFmpegInfo());
});
