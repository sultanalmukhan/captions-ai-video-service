// Debug Railway Video Processing Service
// server.js - с принудительно видимыми субтитрами

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

// Простая функция создания очень заметных субтитров
function createVisibleSRT(originalSRT, taskId) {
  console.log(`[${taskId}] Creating highly visible SRT...`);
  
  // Парсим оригинальный SRT и делаем субтитры ОЧЕНЬ заметными
  const lines = originalSRT.split('\n');
  let result = [];
  let subtitleNum = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('-->')) {
      // Добавляем номер
      result.push(subtitleNum.toString());
      
      // Добавляем время (оставляем как есть)
      result.push(line);
      
      // Ищем текст
      i++;
      let text = '';
      while (i < lines.length && lines[i].trim() && !lines[i].includes('-->')) {
        if (text) text += ' ';
        text += lines[i].trim();
        i++;
      }
      i--; // Возвращаемся назад
      
      // Делаем текст ОЧЕНЬ заметным
      if (text) {
        const visibleText = `>>> ${text.toUpperCase()} <<<`;
        result.push(visibleText);
      }
      
      result.push(''); // Пустая строка
      subtitleNum++;
    }
  }
  
  const visibleSRT = result.join('\n');
  console.log(`[${taskId}] Visible SRT created, length: ${visibleSRT.length}`);
  console.log(`[${taskId}] Visible SRT preview:`, visibleSRT.substring(0, 300));
  
  return visibleSRT;
}

app.post('/process-video-with-subtitles', upload.single('video'), async (req, res) => {
  const taskId = req.body.task_id || uuidv4();
  const startTime = Date.now();
  
  console.log(`\n=== [${taskId}] DEBUG VIDEO PROCESSING REQUEST ===`);

  try {
    if (!req.file || !req.body.srt_content) {
      return res.status(400).json({
        success: false,
        error: 'Video file and SRT content are required',
        task_id: taskId
      });
    }

    const videoBuffer = req.file.buffer;
    const rawSrtContent = req.body.srt_content;
    
    console.log(`[${taskId}] Video size: ${videoBuffer.length} bytes`);
    console.log(`[${taskId}] Raw SRT length: ${rawSrtContent.length} chars`);

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

    // Создаем ОЧЕНЬ заметный SRT
    const visibleSRT = createVisibleSRT(rawSrtContent, taskId);
    fs.writeFileSync(srtPath, visibleSRT, 'utf8');

    console.log(`[${taskId}] Files created successfully`);

    // Пробуем разные FFmpeg команды с максимально заметными субтитрами
    const commands = [
      // Команда 1: Большие желтые субтитры с черной обводкой
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontsize=36,PrimaryColour=&H00ffff,OutlineColour=&H000000,Outline=3,Shadow=2,Bold=1'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 2: Простой drawtext для первого субтитра (для теста)
      `ffmpeg -i "${inputVideoPath}" -vf "drawtext=text='ТЕСТ СУБТИТРОВ - ВИДНО ЛИ МЕНЯ?':fontsize=32:fontcolor=yellow:x=(w-text_w)/2:y=h-80:box=1:boxcolor=black:boxborderw=5" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 3: subtitles фильтр без force_style
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 4: Принудительный белый текст на черном фоне
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontsize=28,PrimaryColour=&Hffffff,BackColour=&H80000000,Outline=2,Shadow=1'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`
    ];

    let success = false;
    let usedCommand = 0;
    
    for (let i = 0; i < commands.length && !success; i++) {
      try {
        console.log(`[${taskId}] === TRYING COMMAND ${i + 1} ===`);
        console.log(`[${taskId}] Command: ${commands[i]}`);
        
        // Удаляем предыдущий выходной файл если есть
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
            console.log(`[${taskId}] ✅ Command ${i + 1} succeeded! Output: ${outputSize} bytes`);
            success = true;
            usedCommand = i + 1;
            
            // Для команды 2 (drawtext) - это точно должно быть видно
            if (i === 1) {
              console.log(`[${taskId}] 🎯 USED DRAWTEXT - SUBTITLES SHOULD BE DEFINITELY VISIBLE!`);
            }
          } else {
            console.log(`[${taskId}] ❌ Command ${i + 1} created empty file`);
          }
        } else {
          console.log(`[${taskId}] ❌ Command ${i + 1} didn't create output file`);
        }
        
      } catch (error) {
        console.log(`[${taskId}] ❌ Command ${i + 1} failed:`, error.message);
      }
    }

    if (!success) {
      throw new Error('All FFmpeg commands failed');
    }

    // Читаем результат
    const processedVideoBuffer = fs.readFileSync(outputVideoPath);
    const processingTime = Date.now() - startTime;

    console.log(`[${taskId}] ✅ SUCCESS! Video processed with command ${usedCommand}`);
    console.log(`[${taskId}] Processing time: ${processingTime}ms`);
    console.log(`[${taskId}] Final size: ${processedVideoBuffer.length} bytes`);

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
        ffmpeg_command_used: usedCommand,
        subtitle_method: usedCommand === 2 ? 'drawtext_test' : 'subtitles_filter'
      },
      video_data: processedVideoBuffer.toString('base64'),
      content_type: 'video/mp4',
      debug_info: {
        command_used: usedCommand,
        subtitle_visibility: usedCommand === 2 ? 'GUARANTEED_VISIBLE' : 'FILTER_BASED'
      }
    });

  } catch (error) {
    console.error(`[${taskId}] ❌ FATAL ERROR:`, error.message);

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
  console.log(`Debug Video Processing Service running on port ${PORT}`);
  console.log(`FFmpeg available: ${checkFFmpeg()}`);
});
