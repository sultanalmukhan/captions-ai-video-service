// Railway Direct Video Processing Service
// server.js - принимает запросы напрямую от iOS

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

// CORS для iOS приложения
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

// Multer для обработки multipart/form-data от iOS
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 500 * 1024 * 1024, // 500MB
    fieldSize: 50 * 1024 * 1024   // 50MB для SRT в поле формы
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    ffmpeg_available: checkFFmpeg()
  });
});

// Проверка FFmpeg
function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Основной endpoint для iOS - принимает видео файл + SRT
app.post('/process-video-with-subtitles', upload.single('video'), async (req, res) => {
  const taskId = req.body.task_id || uuidv4();
  const startTime = Date.now();
  
  console.log(`[${taskId}] Received video processing request from iOS`);
  console.log(`[${taskId}] Request body keys:`, Object.keys(req.body));
  console.log(`[${taskId}] Has video file:`, !!req.file);

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

    // Получаем данные
    const videoBuffer = req.file.buffer;
    const srtContent = req.body.srt_content;
    const userSettings = JSON.parse(req.body.user_settings || '{}');
    
    console.log(`[${taskId}] Video size: ${videoBuffer.length} bytes`);
    console.log(`[${taskId}] SRT length: ${srtContent.length} chars`);
    console.log(`[${taskId}] User settings:`, userSettings);

    // Создаём временные файлы
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

    console.log(`[${taskId}] Files saved, starting FFmpeg processing`);

    // Настройки стиля субтитров
    const subtitleStyles = {
      default: "Fontsize=24,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=2,Shadow=1",
      pro: "Fontsize=28,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=3,Bold=1,Shadow=2",
      premium: "Fontsize=32,PrimaryColour=&H00ffff,OutlineColour=&H000000,Outline=3,Bold=1,Shadow=2,BackColour=&H80000000"
    };

    const selectedStyle = subtitleStyles[userSettings.subscription_tier] || subtitleStyles.default;

    // FFmpeg команда
    const ffmpegCmd = `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${selectedStyle}'" -c:a copy -c:v libx264 -preset fast -crf 23 -movflags +faststart -y "${outputVideoPath}"`;
    
    console.log(`[${taskId}] Executing FFmpeg...`);
    
    // Выполняем FFmpeg
    try {
      execSync(ffmpegCmd, { 
        stdio: 'pipe',
        timeout: 300000, // 5 минут
        maxBuffer: 1024 * 1024 * 100 // 100MB buffer
      });
    } catch (ffmpegError) {
      console.error(`[${taskId}] FFmpeg error:`, ffmpegError.message);
      throw new Error(`Video processing failed: ${ffmpegError.message}`);
    }

    // Проверяем результат
    if (!fs.existsSync(outputVideoPath)) {
      throw new Error('Processed video file was not created');
    }

    const processedVideoBuffer = fs.readFileSync(outputVideoPath);
    const processingTime = Date.now() - startTime;

    console.log(`[${taskId}] Processing completed in ${processingTime}ms`);
    console.log(`[${taskId}] Output size: ${processedVideoBuffer.length} bytes`);

    // Очистка временных файлов
    [inputVideoPath, srtPath, outputVideoPath].forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (err) {
        console.warn(`Failed to delete: ${filePath}`);
      }
    });

    // Возвращаем результат iOS приложению
    res.json({
      success: true,
      task_id: taskId,
      processing_stats: {
        processing_time_ms: processingTime,
        input_size_bytes: videoBuffer.length,
        output_size_bytes: processedVideoBuffer.length,
        compression_ratio: (processedVideoBuffer.length / videoBuffer.length).toFixed(2)
      },
      // Возвращаем видео как base64 (или можно сохранить в хранилище и вернуть URL)
      video_data: processedVideoBuffer.toString('base64'),
      content_type: 'video/mp4',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 часа
    });

  } catch (error) {
    console.error(`[${taskId}] Processing error:`, error.message);

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

// Альтернативный endpoint с URL вместо файла (если нужно)
app.post('/process-video-url', async (req, res) => {
  const { task_id, video_url, srt_content, user_settings } = req.body;
  
  console.log(`[${task_id}] Processing video from URL:`, video_url);

  try {
    // Скачиваем видео
    const fetch = require('node-fetch');
    const response = await fetch(video_url);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }
    const videoBuffer = await response.buffer();

    // Создаём новый запрос как будто пришёл файл
    const mockReq = {
      body: { task_id, srt_content, user_settings: JSON.stringify(user_settings || {}) },
      file: { buffer: videoBuffer }
    };

    // Используем ту же логику обработки
    // (можно вынести в отдельную функцию для переиспользования)
    
    res.json({ success: true, message: 'URL processing not implemented yet' });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      task_id
    });
  }
});

app.listen(PORT, () => {
  console.log(`Direct Video Processing Service running on port ${PORT}`);
  console.log(`FFmpeg available: ${checkFFmpeg()}`);
  console.log('Ready to receive requests from iOS app');
});
