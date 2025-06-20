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
      // Номера суб
