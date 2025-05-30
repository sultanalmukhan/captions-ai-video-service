// Test Railway Video Processing Service
// server.js - с тестовыми субтитрами на ВСЁ видео

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
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    ffmpeg_available: checkFFmpeg()
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

// Получение длительности видео
function getVideoDuration(videoPath, taskId) {
  try {
    console.log(`[${taskId}] Getting video duration...`);
    const output = execSync(`ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`, { encoding: 'utf8' });
    const duration = parseFloat(output.trim());
    console.log(`[${taskId}] Video duration: ${duration} seconds`);
    return duration;
  } catch (error) {
    console.log(`[${taskId}] Failed to get duration, using default 60s`);
    return 60; // Default 60 seconds if detection fails
  }
}

// Создание тестовых субтитров на всю длину видео
function createFullLengthTestSRT(videoDuration, taskId) {
  console.log(`[${taskId}] Creating test SRT for ${videoDuration} seconds`);
  
  const testTexts = [
    "🎯 ТЕСТ СУБТИТРОВ - ВИДИТЕ ЛИ ВЫ ЭТОТ ТЕКСТ?",
    "📺 ЭТО ТЕСТОВЫЕ СУБТИТРЫ ОТ CAPTIONS AI",
    "⭐ ЕСЛИ ВЫ ВИДИТЕ ЭТОТ ТЕКСТ - СУБТИТРЫ РАБОТАЮТ!",
    "🚀 АВТОМАТИЧЕСКИЕ СУБТИТРЫ УСПЕШНО ДОБАВЛЕНЫ",
    "✅ СИСТЕМА ОБРАБОТКИ ВИДЕО ФУНКЦИОНИРУЕТ"
  ];
  
  let srtContent = '';
  let subtitleIndex = 1;
  const intervalSeconds = 5; // Каждые 5 секунд новый субтитр
  
  for (let startTime = 0; startTime < videoDuration; startTime += intervalSeconds) {
    const endTime = Math.min(startTime + intervalSeconds, videoDuration);
    
    // Форматируем время в SRT формат
    const startSRT = formatTimeToSRT(startTime);
    const endSRT = formatTimeToSRT(endTime);
    
    // Выбираем текст циклично
    const text = testTexts[(subtitleIndex - 1) % testTexts.length];
    
    srtContent += `${subtitleIndex}\n`;
    srtContent += `${startSRT} --> ${endSRT}\n`;
    srtContent += `${text}\n\n`;
    
    subtitleIndex++;
  }
  
  console.log(`[${taskId}] Created ${subtitleIndex - 1} test subtitles`);
  console.log(`[${taskId}] Test SRT preview:`, srtContent.substring(0, 300));
  
  return srtContent;
}

// Форматирование времени в SRT формат
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
  
  console.log(`\n=== [${taskId}] TEST VIDEO PROCESSING WITH FULL-LENGTH SUBTITLES ===`);

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

    // Создаем временные файлы
    const tempDir = '/tmp/processing';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const inputVideoPath = path.join(tempDir, `input_${taskId}.mp4`);
    const srtPath = path.join(tempDir, `test_subtitles_${taskId}.srt`);
    const outputVideoPath = path.join(tempDir, `output_${taskId}.mp4`);

    // Сохраняем видео
    fs.writeFileSync(inputVideoPath, videoBuffer);
    console.log(`[${taskId}] Video saved to: ${inputVideoPath}`);

    // Получаем длительность видео
    const videoDuration = getVideoDuration(inputVideoPath, taskId);

    // Создаем тестовые субтитры на всю длину видео
    const testSRT = createFullLengthTestSRT(videoDuration, taskId);
    fs.writeFileSync(srtPath, testSRT, 'utf8');
    
    console.log(`[${taskId}] Test SRT saved to: ${srtPath}`);
    console.log(`[${taskId}] SRT file size: ${fs.statSync(srtPath).size} bytes`);

    // Множественные варианты FFmpeg команд для максимальной видимости
    const commands = [
      // Команда 1: Большие красные субтитры по центру
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontsize=40,PrimaryColour=&H0000ff,OutlineColour=&Hffffff,Outline=3,Shadow=2,Bold=1,Alignment=2'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 2: Желтые субтитры с черным фоном
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontsize=36,PrimaryColour=&H00ffff,BackColour=&H80000000,Outline=2,Bold=1'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 3: Простой drawtext с фиксированным текстом (гарантированно видимый)
      `ffmpeg -i "${inputVideoPath}" -vf "drawtext=text='🎯 CAPTIONS AI ТЕСТ - СУБТИТРЫ РАБОТАЮТ! 🎯':fontsize=36:fontcolor=red:x=(w-text_w)/2:y=h-100:box=1:boxcolor=white:boxborderw=10" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 4: Белые субтитры с толстой черной обводкой
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontsize=32,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=4,Shadow=3'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`
    ];

    let success = false;
    let usedCommand = 0;
    let lastError = null;
    
    for (let i = 0; i < commands.length && !success; i++) {
      try {
        console.log(`[${taskId}] 🎬 TRYING COMMAND ${i + 1} 🎬`);
        console.log(`[${taskId}] Command: ${commands[i]}`);
        
        // Удаляем предыдущий файл
        if (fs.existsSync(outputVideoPath)) {
          fs.unlinkSync(outputVideoPath);
        }
        
        // Выполняем команду
        const result = execSync(commands[i], { 
          stdio: 'pipe',
          timeout: 300000,
          maxBuffer: 1024 * 1024 * 100
        });
        
        console.log(`[${taskId}] FFmpeg completed for command ${i + 1}`);
        
        // Проверяем результат
        if (fs.existsSync(outputVideoPath)) {
          const outputSize = fs.statSync(outputVideoPath).size;
          if (outputSize > 0) {
            console.log(`[${taskId}] ✅ SUCCESS! Command ${i + 1} worked! Output: ${outputSize} bytes`);
            success = true;
            usedCommand = i + 1;
            
            // Особо отмечаем команду 3 (drawtext)
            if (i === 2) {
              console.log(`[${taskId}] 🔥 USED DRAWTEXT COMMAND - SUBTITLES ARE DEFINITELY VISIBLE! 🔥`);
            }
            
            break;
          } else {
            console.log(`[${taskId}] ❌ Command ${i + 1} created empty file`);
          }
        } else {
          console.log(`[${taskId}] ❌ Command ${i + 1} didn't create output file`);
        }
        
      } catch (error) {
        console.log(`[${taskId}] ❌ Command ${i + 1} failed:`, error.message);
        lastError = error;
      }
    }

    if (!success) {
      throw new Error(`All commands failed. Last error: ${lastError?.message || 'Unknown'}`);
    }

    // Читаем результат
    const processedVideoBuffer = fs.readFileSync(outputVideoPath);
    const processingTime = Date.now() - startTime;

    console.log(`[${taskId}] 🎉 FINAL SUCCESS! 🎉`);
    console.log(`[${taskId}] Used command: ${usedCommand}`);
    console.log(`[${taskId}] Processing time: ${processingTime}ms`);
    console.log(`[${taskId}] Input size: ${videoBuffer.length} bytes`);
    console.log(`[${taskId}] Output size: ${processedVideoBuffer.length} bytes`);
    console.log(`[${taskId}] Video duration: ${videoDuration} seconds`);

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
        video_duration_seconds: videoDuration,
        ffmpeg_command_used: usedCommand,
        subtitle_method: usedCommand === 3 ? 'DRAWTEXT_GUARANTEED_VISIBLE' : 'SUBTITLES_FILTER'
      },
      video_data: processedVideoBuffer.toString('base64'),
      content_type: 'video/mp4',
      test_info: {
        full_length_subtitles: true,
        subtitle_intervals: '5 seconds',
        guaranteed_visible: usedCommand === 3,
        test_message: usedCommand === 3 ? 'RED TEXT WITH WHITE BACKGROUND' : 'STYLED SUBTITLES'
      }
    });

  } catch (error) {
    console.error(`[${taskId}] 💥 FATAL ERROR:`, error.message);

    // Очистка при ошибке
    const tempFiles = [
      `/tmp/processing/input_${taskId}.mp4`,
      `/tmp/processing/test_subtitles_${taskId}.srt`,
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
  console.log(`Test Video Processing Service running on port ${PORT}`);
  console.log(`FFmpeg available: ${checkFFmpeg()}`);
  console.log(`Ready to add FULL-LENGTH test subtitles!`);
});
