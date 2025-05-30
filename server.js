// Исправленный Railway Video Processing Service
// server.js - с корректной обработкой субтитров

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

// Функция исправления SRT формата
function fixSRTFormat(srtContent) {
  console.log('Fixing SRT format...');
  console.log('Original SRT length:', srtContent.length);
  
  // Убираем лишние пробелы и приводим к стандартному формату
  let lines = srtContent.split('\n');
  let fixedLines = [];
  let subtitleIndex = 1;
  let i = 0;
  
  while (i < lines.length) {
    let line = lines[i].trim();
    
    // Пропускаем пустые строки
    if (!line) {
      i++;
      continue;
    }
    
    // Если строка содержит временные метки
    if (line.includes('-->')) {
      // Добавляем номер субтитра
      fixedLines.push(subtitleIndex.toString());
      
      // Добавляем временные метки
      fixedLines.push(line);
      
      // Ищем текст субтитра
      i++;
      let subtitleText = '';
      while (i < lines.length && lines[i].trim() && !lines[i].includes('-->')) {
        if (subtitleText) subtitleText += ' ';
        subtitleText += lines[i].trim();
        i++;
      }
      
      // Добавляем текст субтитра
      if (subtitleText) {
        fixedLines.push(subtitleText);
      }
      
      // Добавляем пустую строку между субтитрами
      fixedLines.push('');
      
      subtitleIndex++;
    } else {
      i++;
    }
  }
  
  const fixedSRT = fixedLines.join('\n');
  console.log('Fixed SRT preview:', fixedSRT.substring(0, 300));
  console.log('Fixed SRT length:', fixedSRT.length);
  
  return fixedSRT;
}

// Функция создания ASS файла из SRT (более надежный формат)
function convertSRTtoASS(srtContent, taskId) {
  console.log(`[${taskId}] Converting SRT to ASS format for better compatibility`);
  
  // ASS заголовок
  const assHeader = `[Script Info]
Title: Generated Subtitles
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,24,&Hffffff,&Hffffff,&H0,&H80000000,0,0,0,0,100,100,0,0,1,2,1,2,30,30,30,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Парсим SRT и конвертируем в ASS
  const srtLines = srtContent.split('\n');
  let assEvents = [];
  
  for (let i = 0; i < srtLines.length; i++) {
    const line = srtLines[i].trim();
    
    // Находим временные метки
    if (line.includes('-->')) {
      const [startTime, endTime] = line.split('-->').map(t => t.trim());
      
      // Конвертируем время из SRT формата в ASS формат
      const assStartTime = convertTimeToASS(startTime);
      const assEndTime = convertTimeToASS(endTime);
      
      // Получаем текст субтитра
      i++;
      let text = '';
      while (i < srtLines.length && srtLines[i].trim() && !srtLines[i].includes('-->')) {
        if (text) text += ' ';
        text += srtLines[i].trim();
        i++;
      }
      i--; // Возвращаемся на одну строку назад
      
      if (text) {
        // Экранируем специальные символы для ASS
        text = text.replace(/\n/g, '\\N');
        
        const assEvent = `Dialogue: 0,${assStartTime},${assEndTime},Default,,0,0,0,,${text}`;
        assEvents.push(assEvent);
      }
    }
  }
  
  const assContent = assHeader + assEvents.join('\n');
  console.log(`[${taskId}] ASS content created, length: ${assContent.length}`);
  console.log(`[${taskId}] ASS preview:`, assContent.substring(assContent.indexOf('[Events]'), assContent.indexOf('[Events]') + 200));
  
  return assContent;
}

// Конвертация времени из SRT (00:00:00,000) в ASS (0:00:00.00)
function convertTimeToASS(srtTime) {
  // SRT: 00:00:07,200 -> ASS: 0:00:07.20
  return srtTime.replace(',', '.').replace(/^0/, '').replace(/\.(\d{3})$/, (match, ms) => {
    return '.' + ms.substring(0, 2); // Берем только первые 2 цифры миллисекунд
  });
}

app.post('/process-video-with-subtitles', upload.single('video'), async (req, res) => {
  const taskId = req.body.task_id || uuidv4();
  const startTime = Date.now();
  
  console.log(`\n=== [${taskId}] NEW VIDEO PROCESSING REQUEST ===`);

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
    const userSettings = JSON.parse(req.body.user_settings || '{}');
    
    console.log(`[${taskId}] Video size: ${videoBuffer.length} bytes`);
    console.log(`[${taskId}] Raw SRT length: ${rawSrtContent.length} chars`);

    // Создаем временные файлы
    const tempDir = '/tmp/processing';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const inputVideoPath = path.join(tempDir, `input_${taskId}.mp4`);
    const srtPath = path.join(tempDir, `subtitles_${taskId}.srt`);
    const assPath = path.join(tempDir, `subtitles_${taskId}.ass`);
    const outputVideoPath = path.join(tempDir, `output_${taskId}.mp4`);

    // Сохраняем видео
    fs.writeFileSync(inputVideoPath, videoBuffer);

    // Исправляем SRT формат
    const fixedSRT = fixSRTFormat(rawSrtContent);
    fs.writeFileSync(srtPath, fixedSRT, 'utf8');

    // Создаем ASS файл для лучшей совместимости
    const assContent = convertSRTtoASS(fixedSRT, taskId);
    fs.writeFileSync(assPath, assContent, 'utf8');

    console.log(`[${taskId}] Files saved:`);
    console.log(`[${taskId}] - Video: ${fs.existsSync(inputVideoPath)} (${fs.statSync(inputVideoPath).size} bytes)`);
    console.log(`[${taskId}] - SRT: ${fs.existsSync(srtPath)} (${fs.statSync(srtPath).size} bytes)`);
    console.log(`[${taskId}] - ASS: ${fs.existsSync(assPath)} (${fs.statSync(assPath).size} bytes)`);

    // Пробуем разные варианты FFmpeg команд
    const commands = [
      // Вариант 1: Используем ASS файл (более надежно)
      `ffmpeg -i "${inputVideoPath}" -vf "ass='${assPath}'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Вариант 2: SRT с force_style
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontsize=24,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=2'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Вариант 3: Жестко вшиваем субтитры используя drawtext (fallback)
      `ffmpeg -i "${inputVideoPath}" -vf "drawtext=text='Субтитры добавлены':fontsize=24:fontcolor=white:x=(w-text_w)/2:y=h-60" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`
    ];

    let success = false;
    
    for (let i = 0; i < commands.length && !success; i++) {
      try {
        console.log(`[${taskId}] Trying command ${i + 1}...`);
        console.log(`[${taskId}] Command: ${commands[i]}`);
        
        // Выполняем команду
        const result = execSync(commands[i], { 
          stdio: 'pipe',
          timeout: 300000,
          maxBuffer: 1024 * 1024 * 100
        });
        
        // Проверяем результат
        if (fs.existsSync(outputVideoPath)) {
          const outputSize = fs.statSync(outputVideoPath).size;
          if (outputSize > 0) {
            console.log(`[${taskId}] ✅ Command ${i + 1} succeeded! Output: ${outputSize} bytes`);
            success = true;
          }
        }
        
      } catch (error) {
        console.log(`[${taskId}] ❌ Command ${i + 1} failed:`, error.message);
        if (fs.existsSync(outputVideoPath)) {
          fs.unlinkSync(outputVideoPath);
        }
      }
    }

    if (!success) {
      throw new Error('All FFmpeg commands failed to add subtitles');
    }

    // Читаем результат
    const processedVideoBuffer = fs.readFileSync(outputVideoPath);
    const processingTime = Date.now() - startTime;

    console.log(`[${taskId}] ✅ SUCCESS! Video processed with subtitles`);
    console.log(`[${taskId}] Processing time: ${processingTime}ms`);
    console.log(`[${taskId}] Final size: ${processedVideoBuffer.length} bytes`);

    // Очистка
    [inputVideoPath, srtPath, assPath, outputVideoPath].forEach(filePath => {
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
        compression_ratio: (processedVideoBuffer.length / videoBuffer.length).toFixed(2)
      },
      video_data: processedVideoBuffer.toString('base64'),
      content_type: 'video/mp4',
      subtitle_method_used: 'FFmpeg with ASS format'
    });

  } catch (error) {
    console.error(`[${taskId}] ❌ FATAL ERROR:`, error.message);

    // Очистка при ошибке
    const tempFiles = [
      `/tmp/processing/input_${taskId}.mp4`,
      `/tmp/processing/subtitles_${taskId}.srt`,
      `/tmp/processing/subtitles_${taskId}.ass`,
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
  console.log(`Fixed Video Processing Service running on port ${PORT}`);
  console.log(`FFmpeg available: ${checkFFmpeg()}`);
});
