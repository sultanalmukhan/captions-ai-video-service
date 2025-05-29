// Railway Video Processing Service
// server.js

const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Multer для обработки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = '/tmp/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}_${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Основной endpoint для обработки видео с субтитрами
app.post('/process-video', async (req, res) => {
  const { task_id, video_url, srt_content, style_config, processing_options } = req.body;
  
  if (!task_id || !srt_content) {
    return res.status(400).json({
      error: 'Missing required fields: task_id, srt_content'
    });
  }

  if (!video_url) {
    return res.status(400).json({
      error: 'Video file is required - provide video_url'
    });
  }

  console.log(`[${task_id}] Starting video processing`);
  const startTime = Date.now();

  try {
    // Создаем временные пути для файлов
    const tempDir = '/tmp/processing';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const inputVideoPath = path.join(tempDir, `input_${task_id}.mp4`);
    const srtPath = path.join(tempDir, `subtitles_${task_id}.srt`);
    const outputVideoPath = path.join(tempDir, `output_${task_id}.mp4`);

    // Скачиваем видео файл
    console.log(`[${task_id}] Downloading video from: ${video_url}`);
    const videoResponse = await fetch(video_url);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }
    
    const videoBuffer = await videoResponse.buffer();
    fs.writeFileSync(inputVideoPath, videoBuffer);

    // Сохраняем SRT файл
    fs.writeFileSync(srtPath, srt_content, 'utf8');

    // Настройки стиля субтитров
    const defaultStyle = "Fontsize=24,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=2,Shadow=1";
    const subtitleStyle = style_config?.subtitle_style || defaultStyle;

    // Обрабатываем видео с FFmpeg
    console.log(`[${task_id}] Starting FFmpeg processing`);
    
    await new Promise((resolve, reject) => {
      ffmpeg(inputVideoPath)
        .videoFilters([
          {
            filter: 'subtitles',
            options: {
              filename: srtPath,
              force_style: subtitleStyle
            }
          }
        ])
        .videoCodec(processing_options?.video_codec || 'libx264')
        .audioCodec(processing_options?.audio_codec || 'copy')
        .addOptions([
          '-preset', processing_options?.preset || 'fast',
          '-crf', processing_options?.crf || '23',
          '-movflags', '+faststart' // Для быстрого старта воспроизведения
        ])
        .output(outputVideoPath)
        .on('start', (cmd) => {
          console.log(`[${task_id}] FFmpeg command: ${cmd}`);
        })
        .on('progress', (progress) => {
          console.log(`[${task_id}] Processing: ${Math.round(progress.percent)}% done`);
        })
        .on('end', () => {
          console.log(`[${task_id}] FFmpeg processing completed`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`[${task_id}] FFmpeg error:`, err);
          reject(err);
        })
        .run();
    });

    // Читаем готовое видео
    const processedVideoBuffer = fs.readFileSync(outputVideoPath);
    
    // Получаем статистику файлов
    const inputStats = fs.statSync(inputVideoPath);
    const outputStats = fs.statSync(outputVideoPath);
    const processingTime = Date.now() - startTime;

    // Очищаем временные файлы
    [inputVideoPath, srtPath, outputVideoPath].forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn(`[${task_id}] Failed to delete temp file: ${filePath}`);
      }
    });

    console.log(`[${task_id}] Video processing completed in ${processingTime}ms`);

    // Возвращаем обработанное видео
    res.json({
      success: true,
      task_id: task_id,
      processing_stats: {
        processing_time: processingTime,
        input_size: inputStats.size,
        output_size: outputStats.size,
        compression_ratio: (outputStats.size / inputStats.size).toFixed(2)
      },
      video_data: processedVideoBuffer.toString('base64'),
      content_type: 'video/mp4'
    });

  } catch (error) {
    console.error(`[${task_id}] Processing error:`, error);

    // Очистка в случае ошибки
    const tempFiles = [
      `/tmp/processing/input_${task_id}.mp4`,
      `/tmp/processing/subtitles_${task_id}.srt`,
      `/tmp/processing/output_${task_id}.mp4`
    ];
    
    tempFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupErr) {
        console.warn(`Failed to cleanup: ${filePath}`);
      }
    });

    res.status(500).json({
      success: false,
      task_id: task_id,
      error: 'Video processing failed',
      error_details: error.message,
      processing_time: Date.now() - startTime
    });
  }
});

// Endpoint для проверки статуса задачи (если нужен асинхронный режим)
app.get('/status/:task_id', (req, res) => {
  const { task_id } = req.params;
  
  // Здесь можно добавить логику проверки статуса из базы данных
  // Пока возвращаем простой ответ
  res.json({
    task_id: task_id,
    status: 'processing',
    message: 'Use synchronous /process-video endpoint for immediate results'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

app.listen(PORT, () => {
  console.log(`Video Processing Service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
