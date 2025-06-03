// Optimized Railway Service с читаемыми субтитрами
// server.js - ограничивает количество слов в кадре

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
  const systemInfo = getSystemInfo();
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mode: 'OPTIMIZED_SUBTITLES',
    ...systemInfo
  });
});

function getSystemInfo() {
  try {
    const ffmpegVersion = execSync('ffmpeg -version', { encoding: 'utf8' }).split('\n')[0];
    
    let availableFonts = [];
    try {
      const fontList = execSync('fc-list', { encoding: 'utf8' });
      availableFonts = fontList.split('\n').slice(0, 5);
    } catch (err) {
      availableFonts = ['Font check failed'];
    }
    
    return {
      ffmpeg_available: true,
      ffmpeg_version: ffmpegVersion,
      fonts_available: availableFonts,
      subtitle_method: 'OPTIMIZED_WORD_SPLITTING'
    };
  } catch (error) {
    return { 
      ffmpeg_available: false, 
      error: error.message 
    };
  }
}

// Функция оптимизации SRT для лучшей читаемости
function optimizeSRTForReadability(srtContent, taskId, maxWordsPerLine = 6, maxCharsPerLine = 50) {
  console.log(`[${taskId}] Optimizing SRT for readability...`);
  console.log(`[${taskId}] Max words per line: ${maxWordsPerLine}`);
  console.log(`[${taskId}] Max chars per line: ${maxCharsPerLine}`);
  
  const lines = srtContent.split('\n');
  const optimizedLines = [];
  let subtitleIndex = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Если строка содержит временные метки
    if (line.includes('-->')) {
      const timeLine = line;
      const [startTime, endTime] = timeLine.split('-->').map(t => t.trim());
      
      // Получаем текст субтитра (следующие строки до пустой)
      i++;
      let subtitleText = '';
      while (i < lines.length && lines[i].trim() && !lines[i].includes('-->')) {
        if (subtitleText) subtitleText += ' ';
        subtitleText += lines[i].trim();
        i++;
      }
      i--; // Возвращаемся на шаг назад
      
      if (subtitleText) {
        // Разбиваем длинный текст на читаемые части
        const optimizedSubtitles = splitTextIntoReadableParts(
          subtitleText, 
          startTime, 
          endTime, 
          maxWordsPerLine, 
          maxCharsPerLine,
          taskId
        );
        
        // Добавляем оптимизированные субтитры
        optimizedSubtitles.forEach(sub => {
          optimizedLines.push(subtitleIndex.toString());
          optimizedLines.push(`${sub.startTime} --> ${sub.endTime}`);
          optimizedLines.push(sub.text);
          optimizedLines.push(''); // Пустая строка
          subtitleIndex++;
        });
      }
    }
  }
  
  const optimizedSRT = optimizedLines.join('\n');
  
  console.log(`[${taskId}] ✅ SRT optimization complete:`);
  console.log(`[${taskId}] - Original subtitles: ${srtContent.split('-->').length - 1}`);
  console.log(`[${taskId}] - Optimized subtitles: ${subtitleIndex - 1}`);
  console.log(`[${taskId}] - Size change: ${srtContent.length} → ${optimizedSRT.length} chars`);
  
  return optimizedSRT;
}

// Разбивка текста на читаемые части
function splitTextIntoReadableParts(text, startTime, endTime, maxWords, maxChars, taskId) {
  const words = text.split(' ');
  const parts = [];
  
  // Парсим время
  const startSeconds = parseTimeToSeconds(startTime);
  const endSeconds = parseTimeToSeconds(endTime);
  const totalDuration = endSeconds - startSeconds;
  
  console.log(`[${taskId}] Splitting: "${text}" (${words.length} words, ${totalDuration.toFixed(1)}s)`);
  
  // Если текст короткий - оставляем как есть
  if (words.length <= maxWords && text.length <= maxChars) {
    return [{
      text: text,
      startTime: startTime,
      endTime: endTime
    }];
  }
  
  // Разбиваем на части
  let currentPart = [];
  let partIndex = 0;
  
  for (let i = 0; i < words.length; i++) {
    currentPart.push(words[i]);
    const currentText = currentPart.join(' ');
    
    // Проверяем лимиты
    const shouldSplit = currentPart.length >= maxWords || 
                       currentText.length >= maxChars ||
                       (i < words.length - 1 && currentText.length + words[i + 1].length + 1 > maxChars);
    
    if (shouldSplit || i === words.length - 1) {
      // Вычисляем время для этой части
      const partDuration = totalDuration / Math.ceil(words.length / maxWords);
      const partStartSeconds = startSeconds + (partIndex * partDuration);
      const partEndSeconds = Math.min(partStartSeconds + partDuration, endSeconds);
      
      parts.push({
        text: currentText,
        startTime: formatSecondsToTime(partStartSeconds),
        endTime: formatSecondsToTime(partEndSeconds)
      });
      
      console.log(`[${taskId}] Part ${partIndex + 1}: "${currentText}" (${currentPart.length} words)`);
      
      currentPart = [];
      partIndex++;
    }
  }
  
  return parts;
}

// Парсинг времени SRT в секунды
function parseTimeToSeconds(timeString) {
  // Формат: 00:00:07,200
  const [time, ms] = timeString.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds + (parseInt(ms) / 1000);
}

// Форматирование секунд обратно в SRT время
function formatSecondsToTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

// Функция очистки и валидации SRT
function cleanAndValidateSRT(srtContent, taskId) {
  console.log(`[${taskId}] Cleaning and validating SRT...`);
  
  if (!srtContent || srtContent.length < 10) {
    throw new Error('SRT content is empty or too short');
  }
  
  if (!srtContent.includes('-->')) {
    console.log(`[${taskId}] ⚠️ Invalid SRT format - converting plain text to SRT`);
    return `1\n00:00:00,000 --> 00:00:10,000\n${srtContent.trim()}\n\n`;
  }
  
  let cleanedSrt = srtContent
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
  
  if (!cleanedSrt.endsWith('\n\n')) {
    cleanedSrt += '\n\n';
  }
  
  return cleanedSrt;
}

app.post('/process-video-with-subtitles', upload.single('video'), async (req, res) => {
  const taskId = req.body.task_id || uuidv4();
  const startTime = Date.now();
  
  console.log(`\n=== [${taskId}] OPTIMIZED SUBTITLE PROCESSING ===`);

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

    const videoBuffer = req.file.buffer;
    const rawSrtContent = req.body.srt_content;
    const userSettings = JSON.parse(req.body.user_settings || '{}');
    
    // Настройки читаемости (можно настроить по подпискам)
    const readabilitySettings = {
      default: { maxWords: 6, maxChars: 50 },
      pro: { maxWords: 8, maxChars: 60 },
      premium: { maxWords: 10, maxChars: 70 }
    };
    
    const readabilityConfig = readabilitySettings[userSettings.subscription_tier] || readabilitySettings.default;
    
    console.log(`[${taskId}] Video size: ${videoBuffer.length} bytes`);
    console.log(`[${taskId}] Raw SRT length: ${rawSrtContent.length} chars`);
    console.log(`[${taskId}] Readability config:`, readabilityConfig);

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

    // Очищаем и оптимизируем SRT
    const cleanedSRT = cleanAndValidateSRT(rawSrtContent, taskId);
    const optimizedSRT = optimizeSRTForReadability(
      cleanedSRT, 
      taskId, 
      readabilityConfig.maxWords, 
      readabilityConfig.maxChars
    );
    
    fs.writeFileSync(srtPath, optimizedSRT, 'utf8');

    console.log(`[${taskId}] ✅ Files prepared with optimization`);
    console.log(`[${taskId}] Optimized SRT preview:`, optimizedSRT.substring(0, 300));

    // Настройки стиля субтитров
    const subtitleStyles = {
      default: {
        fontsize: 26, // Немного увеличили для лучшей читаемости
        fontcolor: 'white',
        outline: 2,
        shadow: 1,
        description: 'Читаемый базовый стиль'
      },
      pro: {
        fontsize: 30,
        fontcolor: 'white',
        outline: 3,
        shadow: 2,
        bold: 1,
        description: 'Pro стиль с крупным шрифтом'
      },
      premium: {
        fontsize: 34,
        fontcolor: 'yellow',
        outline: 3,
        shadow: 2,
        bold: 1,
        description: 'Premium стиль с желтым цветом'
      }
    };

    const styleConfig = subtitleStyles[userSettings.subscription_tier] || subtitleStyles.default;
    console.log(`[${taskId}] Using style: ${styleConfig.description}`);

    // Команды для встраивания оптимизированных субтитров
    const commands = [
      // Команда 1: Оптимизированные стилизованные субтитры
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontsize=${styleConfig.fontsize},PrimaryColour=&H${styleConfig.fontcolor === 'white' ? 'ffffff' : '00ffff'},OutlineColour=&H000000,Outline=${styleConfig.outline},Shadow=${styleConfig.shadow}${styleConfig.bold ? ',Bold=1' : ''},Alignment=2'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 2: С DejaVu шрифтом и центрированием
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontname=DejaVu Sans,Fontsize=${styleConfig.fontsize},PrimaryColour=&H${styleConfig.fontcolor === 'white' ? 'ffffff' : '00ffff'},OutlineColour=&H000000,Outline=${styleConfig.outline},Alignment=2'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 3: Простой метод
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`
    ];

    let success = false;
    let usedCommand = 0;
    let methodDescription = '';

    for (let i = 0; i < commands.length && !success; i++) {
      try {
        console.log(`[${taskId}] 🎬 Trying optimized method ${i + 1}...`);
        
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
        
        if (fs.existsSync(outputVideoPath)) {
          const outputSize = fs.statSync(outputVideoPath).size;
          if (outputSize > 0) {
            console.log(`[${taskId}] ✅ SUCCESS! Optimized method ${i + 1} worked! (${cmdDuration}ms)`);
            
            success = true;
            usedCommand = i + 1;
            
            const descriptions = [
              'OPTIMIZED_STYLED_SUBTITLES',
              'OPTIMIZED_DEJAVU_SUBTITLES',
              'OPTIMIZED_SIMPLE_SUBTITLES'
            ];
            methodDescription = descriptions[i];
            
            break;
          }
        }
        
      } catch (error) {
        console.log(`[${taskId}] ❌ Optimized method ${i + 1} failed:`, error.message);
      }
    }

    if (!success) {
      throw new Error('All optimized subtitle methods failed');
    }

    // Читаем результат
    const processedVideoBuffer = fs.readFileSync(outputVideoPath);
    const processingTime = Date.now() - startTime;

    console.log(`[${taskId}] 🎉 OPTIMIZED SUBTITLES SUCCESS! 🎉`);
    console.log(`[${taskId}] Method: ${methodDescription}`);
    console.log(`[${taskId}] Readability: ${readabilityConfig.maxWords} words, ${readabilityConfig.maxChars} chars max`);
    console.log(`[${taskId}] Processing time: ${processingTime}ms`);

    // Очистка временных файлов
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
        command_number: usedCommand,
        subtitle_style: styleConfig.description
      },
      video_data: processedVideoBuffer.toString('base64'),
      content_type: 'video/mp4',
      subtitle_info: {
        method: methodDescription,
        style_applied: styleConfig.description,
        subscription_tier: userSettings.subscription_tier || 'default',
        optimized_for_readability: true,
        max_words_per_line: readabilityConfig.maxWords,
        max_chars_per_line: readabilityConfig.maxChars
      }
    });

  } catch (error) {
    console.error(`[${taskId}] 💥 OPTIMIZED ERROR:`, error.message);

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
  console.log(`🎯 OPTIMIZED Subtitle Service running on port ${PORT}`);
  console.log(`📖 Readability optimization enabled!`);
  console.log(`📏 Word limits: Default=6, Pro=8, Premium=10`);
  const systemInfo = getSystemInfo();
  console.log(`FFmpeg: ${systemInfo.ffmpeg_available}`);
});
