// Railway Video Processing Service
// server.js

const express = require('express');
const multer = require('multer');
const { execSync, spawn } = require('child_process');
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

// Функция для выполнения FFmpeg команд
function executeFFmpeg(command, timeout = 300000) {
  return new Promise((resolve, reject) => {
    console.log('Executing FFmpeg command:', command);
    
    const process = spawn('sh', ['-c', command], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
      // FFmpeg выводит прогресс в stderr
      if (data.toString().includes('time=')) {
        console.log('FFmpeg progress:', data.toString().trim());
      }
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}\nStderr: ${stderr}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
    
    // Timeout
    const timer = setTimeout(() => {
      process.kill('SIGKILL');
      reject(new Error('FFmpeg process timed out'));
    }, timeout);
    
    process.on('close', () => {
      clearTimeout(timer);
    });
  });
}

// Основной endpoint для обработки видео с субтитрами
app.post('/process-video', async (req, res) => {
  const { task_id, video_source, video_data, srt_content, style_config, processing_options } = req.body;
  
  if (!task_id || !srt_content) {
    return res.status(400).json({
      error: 'Missing required fields: task_id, srt_content'
    });
  }

  if (!video_data) {
    return res.status(400).json({
      error: 'Video data is required - provide video_data (URL or base64)'
    });
  }

  console.log(`[${task_id}] Starting video processing, source: ${video_source}`);
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

    // Получаем видео файл в зависимости от источника
    let videoBuffer;
    
    if (video_source === 'url') {
      // Скачиваем видео по URL
      console.log(`[${task_id}] Downloading video from URL`);
      const videoResponse = await fetch(video_data);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
      }
      videoBuffer = await videoResponse.buffer();
    } 
    else if (video_source === 'binary') {
      // Декодируем base64
      console.log(`[${task_id}] Decoding base64 video data`);
      videoBuffer = Buffer.from(video_data, 'base64');
    } 
    else {
      throw new Error(`Unknown video_source: ${video_source}`);
    }

    // Сохраняем видео файл
    fs.writeFileSync(inputVideoPath, videoBuffer);
    console.log(`[${task_id}] Video file saved, size: ${videoBuffer.length} bytes`);

    // Сохраняем SRT файл
    fs.writeFileSync(srtPath, srt_content, 'utf8');
    console.log(`[${task_id}] SRT file saved, size: ${srt_content.length} chars`);

    // Настройки стиля субтитров
    const defaultStyle = "Fontsize=24,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=2,Shadow=1";
    const subtitleStyle = style_config?.subtitle_style || defaultStyle;

    // Обрабатываем видео с FFmpeg напрямую
    console.log(`[${task_id}] Starting FFmpeg processing`);
    
    // Экранируем пути файлов для bash
    const escapedInputPath = inputVideoPath.replace(/'/g, "'\"'\"'");
    const escapedSrtPath = srtPath.replace(/'/g, "'\"'\"'");
    const escapedOutputPath = outputVideoPath.replace(/'/g, "'\"'\"'");
    const escapedStyle = subtitleStyle.replace(/'/g, "'\"'\"'");
    
    const ffmpegCommand = `ffmpeg -i '${escapedInputPath}' -vf "subtitles='${escapedSrtPath}':force_style='${escapedStyle}'" -c:a ${processing_options?.audio_codec || 'copy'} -c:v ${processing_options?.video_codec || 'libx264'} -preset ${processing_options?.preset || 'fast'} -crf ${processing_options?.crf || '23'} -movflags +faststart -y '${escapedOutputPath}'`;
    
    await executeFFmpeg(ffmpegCommand, processing_options?.timeout * 1000 || 300000);

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
