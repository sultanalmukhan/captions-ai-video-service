// Beautiful Railway Service с готовыми стилями для соц.сетей
// server.js - готовые шаблоны стилей TikTok/Instagram + Dynamic Font Size

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

// 🎨 ГОТОВЫЕ СТИЛИ ДЛЯ СОЦИАЛЬНЫХ СЕТЕЙ (БЕЗ FONTSIZE - ТЕПЕРЬ ДИНАМИЧЕСКИЙ)
const SUBTITLE_STYLES = {
  tiktok_classic: {
    fontcolor: 'white',
    fontname: 'DejaVu Sans',
    outline: 2,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 15,
    backcolour: '&H80000000',
    name: 'TikTok Classic',
    description: 'Классический TikTok - белый жирный текст с черным фоном'
  },
  tiktok_neon: {
    fontcolor: '00ffff',
    fontname: 'Liberation Sans',
    outline: 2,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 13,
    name: 'TikTok Neon',
    description: 'Неоновый TikTok стиль - яркий голубой с сильной обводкой'
  },
  instagram_clean: {
    fontcolor: 'ffffff',
    fontname: 'Noto Sans',
    outline: 1,
    shadow: 1,
    alignment: 2,
    marginv: 18,
    backcolour: '&H40000000',
    name: 'Instagram Clean',
    description: 'Чистый Instagram стиль - элегантный белый текст'
  }
};

// 📍 ПОЗИЦИИ СУБТИТРОВ
const SUBTITLE_POSITIONS = {
  bottom: {
    alignment: 2,
    marginv: 15,
    name: 'Снизу',
    description: 'Субтитры внизу экрана (стандарт)'
  },
  top: {
    alignment: 8,
    marginv: 15,
    name: 'Сверху',
    description: 'Субтитры вверху экрана'
  },
  center: {
    alignment: 5,
    marginv: 0,
    name: 'По центру',
    description: 'Субтитры в центре экрана'
  }
};

// 📏 ПРЕДУСТАНОВЛЕННЫЕ РАЗМЕРЫ ШРИФТОВ
const FONT_SIZES = {
  tiny: { value: 6, name: 'Крошечный', description: 'Очень маленький текст' },
  small: { value: 7, name: 'Маленький', description: 'Компактный размер' },
  medium: { value: 8, name: 'Средний', description: 'Стандартный размер' },
  large: { value: 9, name: 'Большой', description: 'Крупный текст' },
  huge: { value: 11, name: 'Огромный', description: 'Очень большой текст' },
  giant: { value: 13, name: 'Гигантский', description: 'Максимальный размер' }
};

function getSystemInfo() {
  try {
    const ffmpegVersion = execSync('ffmpeg -version', { encoding: 'utf8' }).split('\n')[0];
    return {
      ffmpeg_available: true,
      ffmpeg_version: ffmpegVersion,
      subtitle_method: 'SOCIAL_MEDIA_STYLES_DYNAMIC_FONTSIZE'
    };
  } catch (error) {
    return { 
      ffmpeg_available: false, 
      error: error.message 
    };
  }
}

// Health check
app.get('/health', (req, res) => {
  const systemInfo = getSystemInfo();
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mode: 'SOCIAL_MEDIA_STYLES_DYNAMIC_FONTSIZE',
    total_styles: Object.keys(SUBTITLE_STYLES).length,
    ...systemInfo
  });
});

// Styles endpoint
app.get('/styles', (req, res) => {
  const stylesWithPreview = Object.keys(SUBTITLE_STYLES).map(key => {
    const style = SUBTITLE_STYLES[key];
    return {
      id: key,
      name: style.name,
      description: style.description,
      preview: {
        fontcolor: style.fontcolor,
        has_background: !!style.backcolour,
        has_bold: !!style.bold,
        has_outline: !!style.outline,
        category: key.split('_')[0]
      }
    };
  });
  
  const availablePositions = Object.keys(SUBTITLE_POSITIONS).map(key => ({
    id: key,
    name: SUBTITLE_POSITIONS[key].name,
    description: SUBTITLE_POSITIONS[key].description
  }));
  
  res.json({
    success: true,
    styles: stylesWithPreview,
    positions: availablePositions,
    font_sizes: FONT_SIZES,
    total_styles: stylesWithPreview.length,
    default_style: 'tiktok_classic',
    default_position: 'bottom',
    default_fontsize: 8
  });
});

function beautifySRT(srtContent, taskId) {
  console.log(`[${taskId}] Beautifying SRT text...`);
  
  if (!srtContent || srtContent.length < 10) {
    throw new Error('SRT content is empty or too short');
  }
  
  if (!srtContent.includes('-->')) {
    console.log(`[${taskId}] ⚠️ Invalid SRT format - converting plain text to SRT`);
    return `1\n00:00:00,000 --> 00:00:10,000\n${srtContent.trim()}\n\n`;
  }
  
  let beautifiedSrt = srtContent
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
  
  if (!beautifiedSrt.endsWith('\n\n')) {
    beautifiedSrt += '\n\n';
  }
  
  console.log(`[${taskId}] ✅ SRT beautification complete`);
  return beautifiedSrt;
}

app.post('/process-video-with-subtitles', upload.single('video'), async (req, res) => {
  const taskId = req.body.task_id || uuidv4();
  const startTime = Date.now();
  
  console.log(`\n=== [${taskId}] PROCESSING START ===`);

  try {
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
    const styleId = req.body.style_id || 'tiktok_classic';
    const position = req.body.position || 'bottom';
    
    // 📏 ДИНАМИЧЕСКИЙ РАЗМЕР ШРИФТА
    let fontSize = 8;
    
    if (req.body.fontsize) {
      fontSize = parseInt(req.body.fontsize);
      if (isNaN(fontSize) || fontSize < 4 || fontSize > 20) {
        console.log(`[${taskId}] ⚠️ Invalid fontsize ${req.body.fontsize}, using default: 8`);
        fontSize = 8;
      }
    } else if (req.body.fontsize_preset && FONT_SIZES[req.body.fontsize_preset]) {
      fontSize = FONT_SIZES[req.body.fontsize_preset].value;
    }
    
    console.log(`[${taskId}] Style: ${styleId}, Position: ${position}, FontSize: ${fontSize}`);
    
    // Выбираем стиль
    let selectedStyle;
    if (SUBTITLE_STYLES[styleId]) {
      selectedStyle = { ...SUBTITLE_STYLES[styleId], fontsize: fontSize };
    } else {
      selectedStyle = { ...SUBTITLE_STYLES.tiktok_classic, fontsize: fontSize };
    }

    // Применяем позицию
    if (SUBTITLE_POSITIONS[position]) {
      const positionSettings = SUBTITLE_POSITIONS[position];
      selectedStyle.alignment = positionSettings.alignment;
      selectedStyle.marginv = positionSettings.marginv;
    }

    // Создаем временные файлы
    const tempDir = '/tmp/processing';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const inputVideoPath = path.join(tempDir, `input_${taskId}.mp4`);
    const srtPath = path.join(tempDir, `subtitles_${taskId}.srt`);
    const outputVideoPath = path.join(tempDir, `output_${taskId}.mp4`);

    fs.writeFileSync(inputVideoPath, videoBuffer);
    const beautifiedSRT = beautifySRT(rawSrtContent, taskId);
    fs.writeFileSync(srtPath, beautifiedSRT, 'utf8');

    // Строим стиль
    const buildStyleString = (style) => {
      let styleStr = `Fontsize=${style.fontsize}`;
      
      if (style.fontname) {
        styleStr += `,Fontname=${style.fontname}`;
      }
      
      if (style.fontcolor) {
        const color = style.fontcolor.startsWith('&H') ? style.fontcolor : `&H${style.fontcolor}`;
        styleStr += `,PrimaryColour=${color}`;
      }
      
      if (style.outline) {
        styleStr += `,OutlineColour=&H000000,Outline=${style.outline}`;
      }
      
      if (style.shadow) {
        styleStr += `,Shadow=${style.shadow}`;
      }
      
      if (style.bold) {
        styleStr += `,Bold=${style.bold}`;
      }
      
      if (style.alignment) {
        styleStr += `,Alignment=${style.alignment}`;
      }
      
      if (style.marginv) {
        styleStr += `,MarginV=${style.marginv}`;
      }
      
      if (style.backcolour) {
        styleStr += `,BackColour=${style.backcolour}`;
      }
      
      return styleStr;
    };

    const styleString = buildStyleString(selectedStyle);
    console.log(`[${taskId}] Style string: ${styleString}`);

    // FFmpeg команды
    const commands = [
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleString}'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontsize=${selectedStyle.fontsize},PrimaryColour=&H${selectedStyle.fontcolor || 'ffffff'},OutlineColour=&H000000,Outline=${selectedStyle.outline || 3}'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`
    ];

    let success = false;
    let usedCommand = 0;

    for (let i = 0; i < commands.length && !success; i++) {
      try {
        console.log(`[${taskId}] Trying method ${i + 1}...`);
        
        if (fs.existsSync(outputVideoPath)) {
          fs.unlinkSync(outputVideoPath);
        }
        
        execSync(commands[i], { 
          stdio: 'pipe',
          timeout: 300000,
          maxBuffer: 1024 * 1024 * 100
        });
        
        if (fs.existsSync(outputVideoPath)) {
          const outputSize = fs.statSync(outputVideoPath).size;
          if (outputSize > 0) {
            console.log(`[${taskId}] ✅ SUCCESS with method ${i + 1}!`);
            success = true;
            usedCommand = i + 1;
            break;
          }
        }
        
      } catch (error) {
        console.log(`[${taskId}] ❌ Method ${i + 1} failed:`, error.message);
      }
    }

    if (!success) {
      throw new Error('All processing methods failed');
    }

    const processedVideoBuffer = fs.readFileSync(outputVideoPath);
    const processingTime = Date.now() - startTime;

    console.log(`[${taskId}] 🎉 SUCCESS! Processing time: ${processingTime}ms`);

    // Очистка файлов
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
        method_used: `METHOD_${usedCommand}`,
        command_number: usedCommand
      },
      video_data: processedVideoBuffer.toString('base64'),
      content_type: 'video/mp4',
      style_info: {
        style_id: styleId,
        style_name: selectedStyle.name || 'Custom Style',
        style_description: selectedStyle.description || 'Custom user style',
        position: position,
        position_name: SUBTITLE_POSITIONS[position]?.name || 'Снизу',
        fontsize: fontSize,
        fontsize_source: req.body.fontsize ? 'direct' : (req.body.fontsize_preset ? 'preset' : 'default'),
        applied_settings: selectedStyle
      }
    });

  } catch (error) {
    console.error(`[${taskId}] 💥 ERROR:`, error.message);

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
  console.log(`🎨 Social Media Subtitle Service running on port ${PORT}`);
  console.log(`📱 Ready for TikTok, Instagram, YouTube styles!`);
  console.log(`🎬 Total available styles: ${Object.keys(SUBTITLE_STYLES).length}`);
  const systemInfo = getSystemInfo();
  console.log(`FFmpeg: ${systemInfo.ffmpeg_available}`);
});
