// Улучшенный Railway Video Processing Service
// server.js - с лучшей диагностикой и обработкой субтитров

const express = require('express');
const multer = require('multer');
const { execSync, spawn } = require('child_process');
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

// Health check с дополнительной информацией
app.get('/health', (req, res) => {
  const ffmpegAvailable = checkFFmpeg();
  const ffmpegVersion = ffmpegAvailable ? getFFmpegVersion() : 'Not available';
  
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    ffmpeg_available: ffmpegAvailable,
    ffmpeg_version: ffmpegVersion,
    temp_dir_writable: checkTempDir()
  });
});

function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function getFFmpegVersion() {
  try {
    const output = execSync('ffmpeg -version', { encoding: 'utf8' });
    const versionMatch = output.match(/ffmpeg version ([^\s]+)/);
    return versionMatch ? versionMatch[1] : 'Unknown';
  } catch (error) {
    return 'Error getting version';
  }
}

function checkTempDir() {
  try {
    const tempDir = '/tmp/processing';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const testFile = path.join(tempDir, 'test.txt');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return true;
  } catch (error) {
    return false;
  }
}

// Функция валидации и очистки SRT
function validateAndCleanSRT(srtContent) {
  console.log('Validating SRT content...');
  console.log('SRT length:', srtContent.length);
  console.log('SRT preview:', srtContent.substring(0, 300));
  
  // Проверяем, что это действительно SRT формат
  if (!srtContent.includes('-->')) {
    console.log('SRT не содержит временных меток, преобразуем...');
    // Если это просто текст, создаем простой SRT
    return `1\n00:00:00,000 --> 00:00:10,000\n${srtContent.trim()}\n\n`;
  }
  
  // Очищаем SRT от возможных проблем
  let cleanedSrt = srtContent
    .replace(/\r\n/g, '\n')  // Унифицируем переносы строк
    .replace(/\r/g, '\n')
    .trim();
  
  // Убеждаемся, что SRT заканчивается двумя переносами
  if (!cleanedSrt.endsWith('\n\n')) {
    cleanedSrt += '\n\n';
  }
  
  console.log('SRT cleaned, final length:', cleanedSrt.length);
  return cleanedSrt;
}

// Функция выполнения FFmpeg с подробным логированием
function executeFFmpegWithLogging(command, taskId) {
  return new Promise((resolve, reject) => {
    console.log(`[${taskId}] Executing FFmpeg:`);
    console.log(command);
    
    const process = spawn('sh', ['-c', command], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`[${taskId}] FFmpeg stdout:`, data.toString().trim());
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
      const output = data.toString().trim();
      
      // FFmpeg выводит прогресс в stderr
      if (output.includes('time=') || output.includes('frame=')) {
        console.log(`[${taskId}] FFmpeg progress:`, output);
      } else {
        console.log(`[${taskId}] FFmpeg stderr:`, output);
      }
    });
    
    process.on('close', (code) => {
      console.log(`[${taskId}] FFmpeg process exited with code:`, code);
      
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        console.error(`[${taskId}] FFmpeg failed with code ${code}`);
        console.error(`[${taskId}] Full stderr:`, stderr);
        reject(new Error(`FFmpeg process failed with code ${code}. Error: ${stderr}`));
      }
    });
    
    process.on('error', (error) => {
      console.error(`[${taskId}] FFmpeg process error:`, error);
      reject(error);
    });
    
    // Timeout
    const timer = setTimeout(() => {
      console.log(`[${taskId}] FFmpeg timeout, killing process`);
      process.kill('SIGKILL');
      reject(new Error('FFmpeg process timed out'));
    }, 300000); // 5 минут
    
    process.on('close', () => {
      clearTimeout(timer);
    });
  });
}

app.post('/process-video-with-subtitles', upload.single('video'), async (req, res) => {
  const taskId = req.body.task_id || uuidv4();
  const startTime = Date.now();
  
  console.log(`\n=== [${taskId}] NEW VIDEO PROCESSING REQUEST ===`);
  console.log(`[${taskId}] Request body keys:`, Object.keys(req.body));
  console.log(`[${taskId}] Has video file:`, !!req.file);

  try {
    // Валидация
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

    // Валидируем и очищаем SRT
    const srtContent = validateAndCleanSRT(rawSrtContent);

    // Создаем временные файлы
    const tempDir = '/tmp/processing';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const inputVideoPath = path.join(tempDir, `input_${taskId}.mp4`);
    const srtPath = path.join(tempDir, `subtitles_${taskId}.srt`);
    const outputVideoPath = path.join(tempDir, `output_${taskId}.mp4`);

    // Сохраняем файлы
    fs.writeFileSync(inputVideoPath, videoBuffer);
    fs.writeFileSync(srtPath, srtContent, 'utf8');

    // Проверяем файлы
    console.log(`[${taskId}] Input video exists:`, fs.existsSync(inputVideoPath));
    console.log(`[${taskId}] SRT file exists:`, fs.existsSync(srtPath));
    console.log(`[${taskId}] SRT file size:`, fs.statSync(srtPath).size, 'bytes');

    // Проверяем содержимое SRT файла
    const srtCheck = fs.readFileSync(srtPath, 'utf8');
    console.log(`[${taskId}] SRT file content (first 200 chars):`, srtCheck.substring(0, 200));

    // Пробуем несколько вариантов FFmpeg команд
    const ffmpegCommands = [
      // Вариант 1: Простой subtitles фильтр
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Вариант 2: С force_style
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontsize=24,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=2'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Вариант 3: Абсолютный путь
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles=${srtPath}" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`
    ];

    let ffmpegSuccess = false;
    let lastError = null;

    for (let i = 0; i < ffmpegCommands.length && !ffmpegSuccess; i++) {
      try {
        console.log(`[${taskId}] Trying FFmpeg command variant ${i + 1}...`);
        await executeFFmpegWithLogging(ffmpegCommands[i], taskId);
        
        // Проверяем, создался ли выходной файл
        if (fs.existsSync(outputVideoPath)) {
          const outputStats = fs.statSync(outputVideoPath);
          if (outputStats.size > 0) {
            console.log(`[${taskId}] ✅ FFmpeg variant ${i + 1} succeeded! Output size: ${outputStats.size} bytes`);
            ffmpegSuccess = true;
          } else {
            console.log(`[${taskId}] ❌ FFmpeg variant ${i + 1} created empty file`);
          }
        } else {
          console.log(`[${taskId}] ❌ FFmpeg variant ${i + 1} didn't create output file`);
        }
      } catch (error) {
        console.log(`[${taskId}] ❌ FFmpeg variant ${i + 1} failed:`, error.message);
        lastError = error;
        
        // Удаляем неудачный выходной файл если есть
        if (fs.existsSync(outputVideoPath)) {
          fs.unlinkSync(outputVideoPath);
        }
      }
    }

    if (!ffmpegSuccess) {
      throw new Error(`All FFmpeg variants failed. Last error: ${lastError?.message || 'Unknown'}`);
    }

    // Читаем результат
    const processedVideoBuffer = fs.readFileSync(outputVideoPath);
    const processingTime = Date.now() - startTime;

    console.log(`[${taskId}] ✅ Processing completed successfully!`);
    console.log(`[${taskId}] Processing time: ${processingTime}ms`);
    console.log(`[${taskId}] Output size: ${processedVideoBuffer.length} bytes`);

    // Очистка временных файлов
    [inputVideoPath, srtPath, outputVideoPath].forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (err) {
        console.warn(`[${taskId}] Failed to delete: ${filePath}`);
      }
    });

    // Возвращаем результат
    res.json({
      success: true,
      task_id: taskId,
      processing_stats: {
        processing_time_ms: processingTime,
        input_size_bytes: videoBuffer.length,
        output_size_bytes: processedVideoBuffer.length,
        compression_ratio: (processedVideoBuffer.length / videoBuffer.length).toFixed(2),
        ffmpeg_attempts: ffmpegCommands.length
      },
      video_data: processedVideoBuffer.toString('base64'),
      content_type: 'video/mp4',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error(`[${taskId}] ❌ Processing error:`, error.message);

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
  console.log(`Improved Video Processing Service running on port ${PORT}`);
  console.log(`FFmpeg available: ${checkFFmpeg()}`);
  console.log(`FFmpeg version: ${getFFmpegVersion()}`);
  console.log(`Temp directory writable: ${checkTempDir()}`);
});
