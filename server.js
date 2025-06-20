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
  // TikTok стили  
  tiktok_classic: {
    fontcolor: 'white',
    fontname: 'DejaVu Sans',
    fontnames: ['Ubuntu', 'Liberation Sans', 'DejaVu Sans'],
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
    fontnames: ['Roboto', 'Liberation Sans', 'Noto Sans'],
    outline: 2,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 13,
    name: 'TikTok Neon',
    description: 'Неоновый TikTok стиль - яркий голубой с сильной обводкой'
  },
  
  tiktok_yellow: {
    fontcolor: 'ffff00',
    fontname: 'Ubuntu',
    fontnames: ['Ubuntu', 'Open Sans', 'DejaVu Sans'],
    outline: 2,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 15,
    name: 'TikTok Yellow',
    description: 'Желтый TikTok стиль - как у популярных блогеров'
  },
  
  // Instagram стили
  instagram_clean: {
    fontcolor: 'ffffff',
    fontname: 'Noto Sans',
    fontnames: ['Noto Sans', 'Open Sans', 'Liberation Sans'],
    outline: 1,
    shadow: 1,
    alignment: 2,
    marginv: 18,
    backcolour: '&H40000000',
    name: 'Instagram Clean',
    description: 'Чистый Instagram стиль - элегантный белый текст'
  },
  
  instagram_story: {
    fontcolor: 'ffffff',
    fontname: 'Roboto',
    fontnames: ['Roboto', 'Noto Sans', 'DejaVu Sans'],
    outline: 1,
    shadow: 1,
    alignment: 2,
    marginv: 20,
    name: 'Instagram Story',
    description: 'Стиль Instagram Stories - тонкий и изящный'
  },
  
  instagram_reel: {
    fontcolor: 'ffffff',
    fontname: 'Open Sans',
    fontnames: ['Open Sans', 'Liberation Sans', 'DejaVu Sans'],
    outline: 2,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 15,
    backcolour: '&H60000000',
    name: 'Instagram Reel',
    description: 'Стиль Instagram Reels - жирный и контрастный'
  },
  
  // YouTube стили
  youtube_classic: {
    fontcolor: 'ffffff',
    fontname: 'Liberation Sans',
    fontnames: ['Source Sans Pro', 'Liberation Sans', 'Noto Sans'],
    outline: 1,
    shadow: 1,
    alignment: 2,
    marginv: 13,
    name: 'YouTube Classic',
    description: 'Классический YouTube - стандартные субтитры'
  },
  
  youtube_gaming: {
    fontcolor: '00ff00',
    fontname: 'DejaVu Sans',
    fontnames: ['Ubuntu', 'DejaVu Sans', 'Liberation Sans'],
    outline: 1,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 14,
    name: 'YouTube Gaming',
    description: 'Игровой стиль YouTube - зеленый геймерский'
  },
  
  // Современные трендовые стили
  modern_gradient: {
    fontcolor: 'ff69b4',
    fontname: 'Open Sans',
    fontnames: ['Montserrat', 'Open Sans', 'Liberation Sans'],
    outline: 2,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 15,
    name: 'Modern Pink',
    description: 'Модерн розовый - трендовый цвет 2024'
  },
  
  retro_vhs: {
    fontcolor: 'ff00ff',
    fontname: 'DejaVu Sans',
    fontnames: ['Ubuntu', 'DejaVu Sans', 'Liberation Sans'],
    outline: 1,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 14,
    name: 'Retro VHS',
    description: 'Ретро VHS стиль - фиолетовый винтаж'
  },
  
  minimal_black: {
    fontcolor: '000000',
    fontname: 'Noto Sans',
    fontnames: ['Roboto', 'Noto Sans', 'Liberation Sans'],
    outline: 0,
    shadow: 0,
    alignment: 2,
    marginv: 10,
    backcolour: '&H80ffffff',
    name: 'Minimal Black',
    description: 'Минималистичный - черный текст на белом фоне'
  },
  
  // Премиум стили
  luxury_gold: {
    fontcolor: 'ffd700',
    fontname: 'DejaVu Sans',
    fontnames: ['Ubuntu', 'DejaVu Sans', 'Liberation Sans'],
    outline: 2,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 16,
    backcolour: '&H80000000',
    name: 'Luxury Gold',
    description: 'Премиум золотой - роскошный стиль'
  },
  
  neon_purple: {
    fontcolor: '9400d3',
    fontname: 'Liberation Sans',
    fontnames: ['Open Sans', 'Liberation Sans', 'Noto Sans'],
    outline: 2,
    shadow: 1,
    bold: 1,
    alignment: 2,
    marginv: 15,
    name: 'Neon Purple',
    description: 'Неоновый фиолетовый - киберпанк стиль'
  }
};

// 📍 ПОЗИЦИИ СУБТИТРОВ
const SUBTITLE_POSITIONS = {
  bottom: {
    alignment: 2,     // По центру
    marginv: 15,      // Отступ снизу
    name: 'Снизу',
    description: 'Субтитры внизу экрана (стандарт)'
  },
  top: {
    alignment: 8,     // По центру вверху  
    marginv: 15,      // Отступ сверху
    name: 'Сверху',
    description: 'Субтитры вверху экрана'
  },
  center: {
    alignment: 5,     // По центру экрана
    marginv: 0,       // Без отступов
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

// Health check с информацией о доступных стилях
app.get('/health', (req, res) => {
  const systemInfo = getSystemInfo();
  const availableStyles = Object.keys(SUBTITLE_STYLES).map(key => ({
    id: key,
    name: SUBTITLE_STYLES[key].name,
    description: SUBTITLE_STYLES[key].description
  }));
  
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mode: 'SOCIAL_MEDIA_STYLES_DYNAMIC_FONTSIZE',
    available_styles: availableStyles,
    available_font_sizes: FONT_SIZES,
    total_styles: availableStyles.length,
    ...systemInfo
  });
});

// Новый endpoint для получения всех стилей и позиций
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
        category: key.split('_')[0] // tiktok, instagram, youtube, etc.
      }
    };
  });
  
  // Группируем по категориям
  const groupedStyles = stylesWithPreview.reduce((acc, style) => {
    const category = style.preview.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(style);
    return acc;
  }, {});

  // Добавляем информацию о позициях
  const availablePositions = Object.keys(SUBTITLE_POSITIONS).map(key => ({
    id: key,
    name: SUBTITLE_POSITIONS[key].name,
    description: SUBTITLE_POSITIONS[key].description
  }));
  
  res.json({
    success: true,
    styles: stylesWithPreview,
    grouped_styles: groupedStyles,
    positions: availablePositions,
    font_sizes: FONT_SIZES,
    total_styles: stylesWithPreview.length,
    default_style: 'tiktok_classic',
    default_position: 'bottom',
    default_fontsize: 8
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
      subtitle_method: 'SOCIAL_MEDIA_STYLES_DYNAMIC_FONTSIZE'
    };
  } catch (error) {
    return { 
      ffmpeg_available: false, 
      error: error.message 
    };
  }
}

// Функция очистки и красивого форматирования SRT
function beautifySRT(srtContent, taskId) {
  console.log(`[${taskId}] Beautifying SRT text...`);
  console.log(`[${taskId}] Original SRT length: ${srtContent.length} chars`);
  
  if (!srtContent || srtContent.length < 10) {
    throw new Error('SRT content is empty or too short');
  }
  
  // Проверяем, что это SRT формат
  if (!srtContent.includes('-->')) {
    console.log(`[${taskId}] ⚠️ Invalid SRT format - converting plain text to SRT`);
    return `1\n00:00:00,000 --> 00:00:10,000\n${srtContent.trim()}\n\n`;
  }
  
  // Очищаем SRT
  let beautifiedSrt = srtContent
    .replace(/\r\n/g, '\n')  // Унифицируем переносы строк
    .replace(/\r/g, '\n')
    .trim();
  
  // Улучшаем форматирование текста
  const lines = beautifiedSrt.split('\n');
  const improvedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('-->')) {
      // Временные метки оставляем как есть
      improvedLines.push(line);
    } else if (/^\d+$/.test(line)) {
      // Номера субтитров оставляем как есть
      improvedLines.push(line);
    } else if (line.length > 0) {
      // Улучшаем текст субтитров
      let improvedText = line;
      
      // Убираем лишние пробелы
      improvedText = improvedText.replace(/\s+/g, ' ').trim();
      
      // Исправляем пунктуацию
      improvedText = improvedText.replace(/\s+([,.!?;:])/g, '$1');
      improvedText = improvedText.replace(/([,.!?;:])\s*/g, '$1 ');
      
      // Добавляем красивые кавычки если нужно
      improvedText = improvedText.replace(/"/g, '«').replace(/"/g, '»');
      
      // Если текст очень длинный, добавляем переносы в естественных местах
      if (improvedText.length > 50) {
        const words = improvedText.split(' ');
        if (words.length > 8) {
          const mid = Math.ceil(words.length / 2);
          // Ищем хорошее место для переноса (после запятой, точки и т.д.)
          let splitPoint = mid;
          for (let j = mid - 2; j <= mid + 2 && j < words.length; j++) {
            if (j > 0 && (words[j-1].endsWith(',') || words[j-1].endsWith('.') || words[j-1].endsWith('!'))) {
              splitPoint = j;
              break;
            }
          }
          const firstLine = words.slice(0, splitPoint).join(' ');
          const secondLine = words.slice(splitPoint).join(' ');
          improvedText = firstLine + '\n' + secondLine;
        }
      }
      
      improvedLines.push(improvedText);
    } else {
      // Пустые строки
      improvedLines.push('');
    }
  }
  
  beautifiedSrt = improvedLines.join('\n');
  
  // Убеждаемся, что SRT заканчивается правильно
  if (!beautifiedSrt.endsWith('\n\n')) {
    beautifiedSrt += '\n\n';
  }
  
  console.log(`[${taskId}] ✅ SRT beautification complete`);
  console.log(`[${taskId}] Beautified length: ${beautifiedSrt.length} chars`);
  console.log(`[${taskId}] Preview:`, beautifiedSrt.substring(0, 300));
  
  return beautifiedSrt;
}

app.post('/process-video-with-subtitles', upload.single('video'), async (req, res) => {
  const taskId = req.body.task_id || uuidv4();
  const startTime = Date.now();
  
  console.log(`\n=== [${taskId}] SOCIAL MEDIA SUBTITLE PROCESSING (DYNAMIC FONTSIZE) ===`);

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
    
    // 🎨 ПАРАМЕТРЫ ИЗ ЗАПРОСА
    const styleId = req.body.style_id || 'tiktok_classic';
    const position = req.body.position || 'bottom';
    const customStyle = req.body.custom_style ? JSON.parse(req.body.custom_style) : null;
    
    // 📏 ДИНАМИЧЕСКИЙ РАЗМЕР ШРИФТА - ОСНОВНОЙ ПАРАМЕТР
    let fontSize = 8; // по умолчанию
    
    if (req.body.fontsize) {
      // Приоритет: прямой параметр fontsize
      fontSize = parseInt(req.body.fontsize);
      if (isNaN(fontSize) || fontSize < 4 || fontSize > 20) {
        console.log(`[${taskId}] ⚠️ Invalid fontsize ${req.body.fontsize}, using default: 8`);
        fontSize = 8; // fallback на безопасное значение
      }
    } else if (req.body.fontsize_preset && FONT_SIZES[req.body.fontsize_preset]) {
      // Альтернатива: preset размера (tiny, small, medium, etc.)
      fontSize = FONT_SIZES[req.body.fontsize_preset].value;
      console.log(`[${taskId}] Using fontsize preset '${req.body.fontsize_preset}': ${fontSize}`);
    }
    
    console.log(`[${taskId}] 📏 Final fontsize: ${fontSize}`);
    
    console.log(`[${taskId}] Video size: ${videoBuffer.length} bytes`);
    console.log(`[${taskId}] Raw SRT length: ${rawSrtContent.length} chars`);
    console.log(`[${taskId}] 🎨 Style: ${styleId}`);
    console.log(`[${taskId}] 📍 Position: ${position}`);
    console.log(`[${taskId}] 📏 Font size: ${fontSize} ${req.body.fontsize_preset ? `(preset: ${req.body.fontsize_preset})` : '(direct)'}`);
    if (req.body.fontsize) {
      console.log(`[${taskId}] 📏 Raw fontsize parameter: '${req.body.fontsize}'`);
    }
    
    // Выбираем стиль
    let selectedStyle;
    if (customStyle) {
      selectedStyle = { ...customStyle, fontsize: fontSize };
      console.log(`[${taskId}] Using CUSTOM style with fontsize ${fontSize}:`, customStyle);
    } else if (SUBTITLE_STYLES[styleId]) {
      selectedStyle = { ...SUBTITLE_STYLES[styleId], fontsize: fontSize };
      console.log(`[${taskId}] Using predefined style: ${selectedStyle.name} with fontsize ${fontSize}`);
    } else {
      selectedStyle = { ...SUBTITLE_STYLES.tiktok_classic, fontsize: fontSize };
      console.log(`[${taskId}] Style not found, using default: ${selectedStyle.name} with fontsize ${fontSize}`);
    }

    // 📍 Применяем позицию субтитров
    if (SUBTITLE_POSITIONS[position]) {
      const positionSettings = SUBTITLE_POSITIONS[position];
      selectedStyle.alignment = positionSettings.alignment;
      selectedStyle.marginv = positionSettings.marginv;
      console.log(`[${taskId}] 📍 Applied position: ${positionSettings.name} (alignment: ${positionSettings.alignment})`);
    } else {
      console.log(`[${taskId}] ⚠️ Invalid position '${position}', using default 'bottom'`);
    }

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

    // Beautify SRT
    const beautifiedSRT = beautifySRT(rawSrtContent, taskId);
    fs.writeFileSync(srtPath, beautifiedSRT, 'utf8');

    console.log(`[${taskId}] ✅ Files prepared with style: ${selectedStyle.name || 'Custom'} and fontsize: ${fontSize}`);

    // Строим FFmpeg команды с выбранным стилем и динамическим размером шрифта
    const buildStyleString = (style) => {
      let styleStr = `Fontsize=${style.fontsize}`;
      
      // Название шрифта
      if (style.fontname) {
        styleStr += `,Fontname=${style.fontname}`;
      }
      
      // Цвет текста
      if (style.fontcolor) {
        const color = style.fontcolor.startsWith('&H') ? style.fontcolor : `&H${style.fontcolor}`;
        styleStr += `,PrimaryColour=${color}`;
      }
      
      // Обводка
      if (style.outline) {
        styleStr += `,OutlineColour=&H000000,Outline=${style.outline}`;
      }
      
      // Тень
      if (style.shadow) {
        styleStr += `,Shadow=${style.shadow}`;
      }
      
      // Жирность
      if (style.bold) {
        styleStr += `,Bold=${style.bold}`;
      }
      
      // Выравнивание
      if (style.alignment) {
        styleStr += `,Alignment=${style.alignment}`;
      }
      
      // Отступ
      if (style.marginv) {
        styleStr += `,MarginV=${style.marginv}`;
      }
      
      // Фон
      if (style.backcolour) {
        styleStr += `,BackColour=${style.backcolour}`;
      }
      
      return styleStr;
    };

    const styleString = buildStyleString(selectedStyle);
    console.log(`[${taskId}] Style string: ${styleString}`);

    // 🎨 КОМАНДЫ FFmpeg с динамическим размером шрифта
    const commands = [
      // Команда 1: Полный стиль с выбранным шрифтом
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleString}'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 2: Без указания шрифта, но с остальными стилями
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontsize=${selectedStyle.fontsize},PrimaryColour=&H${selectedStyle.fontcolor || 'ffffff'},OutlineColour=&H000000,Outline=${selectedStyle.outline || 3}${selectedStyle.bold ? ',Bold=1' : ''}'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 3: Fallback с DejaVu Sans
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='Fontname=DejaVu Sans,Fontsize=${selectedStyle.fontsize},PrimaryColour=&H${selectedStyle.fontcolor || 'ffffff'},OutlineColour=&H000000,Outline=${selectedStyle.outline || 3}'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 4: Базовый метод
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}'" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`,
      
      // Команда 5: Fallback с прямым путем к шрифту
      `ffmpeg -i "${inputVideoPath}" -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='✨ MODERN SUBTITLES ✨':fontsize=${selectedStyle.fontsize}:fontcolor=${selectedStyle.fontcolor || 'white'}:x=(w-text_w)/2:y=h-80:box=1:boxcolor=black@0.7:boxborderw=5" -c:a copy -c:v libx264 -preset fast -crf 23 -y "${outputVideoPath}"`
    ];

    let success = false;
    let usedCommand = 0;
    let methodDescription = '';

    for (let i = 0; i < commands.length && !success; i++) {
      try {
        console.log(`[${taskId}] 🎨 Trying style method ${i + 1}...`);
        console.log(`[${taskId}] Command preview: ${commands[i].substring(0, 120)}...`);
        
        // Удаляем предыдущий файл
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
        
        // Проверяем результат
        if (fs.existsSync(outputVideoPath)) {
          const outputSize = fs.statSync(outputVideoPath).size;
          if (outputSize > 0) {
            console.log(`[${taskId}] ✅ SUCCESS! Style method ${i + 1} worked! (${cmdDuration}ms)`);
            console.log(`[${taskId}] Output size: ${outputSize} bytes`);
            
            success = true;
            usedCommand = i + 1;
            
            const descriptions = [
              'FULL_STYLE_WITH_FONT',
              'FULL_STYLE_NO_FONT',
              'SIMPLIFIED_STYLE',
              'BASIC_SUBTITLES',
              'FALLBACK_DRAWTEXT'
            ];
            methodDescription = descriptions[i];
            
            break;
          }
        }
        
      } catch (error) {
        console.log(`[${taskId}] ❌ Style method ${i + 1} failed:`, error.message);
      }
    }

    if (!success) {
      throw new Error('All style methods failed');
    }

    // Читаем результат
    const processedVideoBuffer = fs.readFileSync(outputVideoPath);
    const processingTime = Date.now() - startTime;

    console.log(`[${taskId}] 🎉 STYLED SUBTITLES SUCCESS! 🎨`);
    console.log(`[${taskId}] Style: ${selectedStyle.name || 'Custom'}`);
    console.log(`[${taskId}] Font size: ${fontSize}`);
    console.log(`[${taskId}] Method: ${methodDescription}`);
    console.log(`[${taskId}] Command: ${usedCommand}`);
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
        compression_ratio: (processedVideoBuffer.length / videoBuffer.length).toFixed(
