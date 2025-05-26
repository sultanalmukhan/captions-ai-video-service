// server.js - Video Processing Service для Captions AI
const express = require('express');
const multer = require('multer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS для n8n запросов
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

// Настройка multer для обработки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = '/tmp/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.mp4`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 500 * 1024 * 1024, // 500MB
    fieldSize: 10 * 1024 * 1024   // 10MB для SRT контента
  }
});

// Стили субтитров
const SUBTITLE_STYLES = {
  default: 'FontSize=24,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=2,Alignment=2',
  bold: 'FontSize=28,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=3,Bold=1,Alignment=2',
  colored: 'FontSize=24,PrimaryColour=&H00ffff,OutlineColour=&H000000,Outline=2,Alignment=2',
  large: 'FontSize=32,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=3,Alignment=2',
  yellow: 'FontSize=24,PrimaryColour=&H00ffff,OutlineColour=&H000000,Outline=2,Alignment=2'
};

// Основной endpoint для обработки видео
app.post('/process-video', upload.single('video'), async (req, res) => {
  console.log('🎬 Starting video processing...');
  
  const startTime = Date.now();
  let tempFiles = [];
  
  try {
    // Валидация входных данных
    const { srt_content, subtitle_style = 'default' } = req.body;
    const videoFile = req.file;
    
    if (!videoFile) {
      return res.status(400).json({ 
        error: 'Video file is required',
        code: 'MISSING_VIDEO'
      });
    }
    
    if (!srt_content) {
      return res.status(400).json({ 
        error: 'SRT content is required', 
        code: 'MISSING_SRT'
      });
    }
    
    console.log(`📁 Processing video: ${videoFile.filename} (${(videoFile.size / 1024 / 1024).toFixed(2)}MB)`);
    console.log(`📝 SRT length: ${srt_content.length} characters`);
    console.log(`🎨 Style: ${subtitle_style}`);
    
    // Создаем временные файлы
    const timestamp = Date.now();
    const srtPath = path.join('/tmp', `subtitles_${timestamp}.srt`);
    const outputPath = path.join('/tmp', `output_${timestamp}.mp4`);
    
    tempFiles.push(videoFile.path, srtPath, outputPath);
    
    // Сохраняем SRT файл
    fs.writeFileSync(srtPath, srt_content, 'utf8');
    console.log(`💾 SRT file saved: ${srtPath}`);
    
    // Проверяем доступность FFmpeg
    try {
      execSync('ffmpeg -version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('FFmpeg not available');
    }
    
    // Получаем стиль субтитров
    const styleString = SUBTITLE_STYLES[subtitle_style] || SUBTITLE_STYLES.default;
    
    // FFmpeg команда для вшивания субтитров
    const ffmpegCommand = [
      'ffmpeg',
      '-i', `"${videoFile.path}"`,
      '-vf', `"subtitles='${srtPath}':force_style='${styleString}'"`,
      '-c:a', 'copy',
      '-y', // перезаписать выходной файл
      `"${outputPath}"`
    ].join(' ');
    
    console.log(`🔧 FFmpeg command: ${ffmpegCommand}`);
    
    // Выполняем FFmpeg с таймаутом
    const ffmpegStartTime = Date.now();
    execSync(ffmpegCommand, { 
      stdio: 'pipe', 
      timeout: 300000, // 5 минут
      maxBuffer: 50 * 1024 * 1024 // 50MB буфер
    });
    
    const ffmpegTime = Date.now() - ffmpegStartTime;
    console.log(`✅ FFmpeg completed in ${ffmpegTime}ms`);
    
    // Проверяем что выходной файл создался
    if (!fs.existsSync(outputPath)) {
      throw new Error('Output video file was not created');
    }
    
    // Читаем результат
    const processedVideo = fs.readFileSync(outputPath);
    const outputSizeMB = (processedVideo.length / 1024 / 1024).toFixed(2);
    
    console.log(`📊 Output video size: ${outputSizeMB}MB`);
    
    // Очистка временных файлов
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
    
    const totalTime = Date.now() - startTime;
    console.log(`🎉 Video processing completed in ${totalTime}ms`);
    
    // Отправляем результат
    res.set({
      'Content-Type': 'video/mp4',
      'Content-Disposition': 'attachment; filename="video_with_subtitles.mp4"',
      'X-Processing-Time': totalTime.toString(),
      'X-Output-Size': outputSizeMB
    });
    
    res.send(processedVideo);
    
  } catch (error) {
    console.error('❌ Video processing error:', error.message);
    
    // Очистка временных файлов в случае ошибки
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError.message);
        }
      }
    });
    
    // Определяем тип ошибки
    let errorCode = 'PROCESSING_ERROR';
    let statusCode = 500;
    
    if (error.message.includes('FFmpeg not available')) {
      errorCode = 'FFMPEG_NOT_FOUND';
      statusCode = 503;
    } else if (error.message.includes('timeout')) {
      errorCode = 'PROCESSING_TIMEOUT';
      statusCode = 408;
    } else if (error.message.includes('No space left')) {
      errorCode = 'INSUFFICIENT_STORAGE';
      statusCode = 507;
    }
    
    res.status(statusCode).json({ 
      error: 'Video processing failed', 
      details: error.message,
      code: errorCode,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    ffmpeg: checkFFmpeg(),
    disk_space: checkDiskSpace()
  };
  
  res.json(health);
});

// Проверка доступности FFmpeg
function checkFFmpeg() {
  try {
    const output = execSync('ffmpeg -version 2>&1', { encoding: 'utf8' });
    const version = output.split('\n')[0];
    return { available: true, version };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

// Проверка свободного места на диске
function checkDiskSpace() {
  try {
    const output = execSync('df -h /tmp', { encoding: 'utf8' });
    return output.split('\n')[1].split(/\s+/);
  } catch (error) {
    return { error: error.message };
  }
}

// Endpoint для получения доступных стилей
app.get('/styles', (req, res) => {
  res.json({
    available_styles: Object.keys(SUBTITLE_STYLES),
    default_style: 'default'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    available_endpoints: [
      'POST /process-video',
      'GET /health',
      'GET /styles'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Video Processing Service running on port ${port}`);
  console.log(`🔧 FFmpeg status:`, checkFFmpeg());
  console.log(`📁 Upload directory: /tmp/uploads`);
});
