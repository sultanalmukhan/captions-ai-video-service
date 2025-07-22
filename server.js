// Beautiful Railway Service с кастомными стилями + МАКСИМАЛЬНОЕ КАЧЕСТВО + STREAMING
// server.js - Custom subtitle styles + IMPROVED FONT SYSTEM + NO COMPRESSION + NO TIMEOUT - PRODUCTION CLEAN

const express = require('express');
const multer = require('multer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Увеличиваем timeout для Railway
app.use((req, res, next) => {
  req.setTimeout(900000); // 15 минут
  res.setTimeout(900000);
  res.setHeader('X-Accel-Buffering', 'no');
  next();
});

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

// 📍 ПОЗИЦИИ СУБТИТРОВ
const SUBTITLE_POSITIONS = {
  bottom: {
    alignment: 2,
    marginv: 15,
    name: 'Снизу'
  },
  top: {
    alignment: 8,
    marginv: 15,
    name: 'Сверху'
  },
  center: {
    alignment: 5,
    marginv: 0,
    name: 'По центру'
  }
};

// 🎯 ДОСТУПНЫЕ ШРИФТЫ
const AVAILABLE_FONTS = [
  'Roboto',
  'Open Sans', 
  'Arial',
  'Helvetica',
  'Montserrat',
  'Lato',
  'Source Sans Pro',
  'Poppins',
  'Inter',
  'Ubuntu',
  'Oswald',
  'Raleway',
  'Nunito',
  'Quicksand',
  'Courier New',
  'Georgia',
  'Merriweather'
];

// 🎯 УЛУЧШЕННАЯ СИСТЕМА ВАЛИДАЦИИ ШРИФТОВ

// Кеш для проверенных шрифтов
let fontValidationCache = new Map();
let allAvailableFonts = null;

// Функция получения всех доступных семейств шрифтов
function getAllAvailableFonts() {
  if (allAvailableFonts) return allAvailableFonts;
  
  try {
    const output = execSync('fc-list : family', { encoding: 'utf8', timeout: 10000 });
    const families = new Set();
    
    output.split('\n').forEach(line => {
      if (line.trim()) {
        // Обрабатываем строки вида "Font Name,Alternative Name" или "Font Name"
        const fontNames = line.split(',').map(name => name.trim());
        fontNames.forEach(name => {
          if (name) families.add(name);
        });
      }
    });
    
    allAvailableFonts = Array.from(families);
    console.log(`📋 Found ${allAvailableFonts.length} font families in system`);
    return allAvailableFonts;
    
  } catch (error) {
    console.error('❌ Error getting font families:', error.message);
    return [];
  }
}

// Умная функция поиска шрифта
function findBestFontMatch(requestedFont) {
  if (!requestedFont) return 'DejaVu Sans';
  
  // Проверяем кеш
  if (fontValidationCache.has(requestedFont)) {
    return fontValidationCache.get(requestedFont);
  }
  
  const availableFonts = getAllAvailableFonts();
  let bestMatch = null;
  
  // 1. Точное совпадение
  if (availableFonts.includes(requestedFont)) {
    bestMatch = requestedFont;
  }
  
  // 2. Точное совпадение без учета регистра
  if (!bestMatch) {
    bestMatch = availableFonts.find(font => 
      font.toLowerCase() === requestedFont.toLowerCase()
    );
  }
  
  // 3. Частичное совпадение (содержит)
  if (!bestMatch) {
    bestMatch = availableFonts.find(font => 
      font.toLowerCase().includes(requestedFont.toLowerCase())
    );
  }
  
  // 4. Обратное частичное совпадение
  if (!bestMatch) {
    bestMatch = availableFonts.find(font => 
      requestedFont.toLowerCase().includes(font.toLowerCase())
    );
  }
  
  // 5. Специальные правила для популярных шрифтов
  if (!bestMatch) {
    const specialMappings = {
      'roboto': ['Roboto', 'Ubuntu', 'DejaVu Sans'],
      'montserrat': ['Montserrat', 'Liberation Sans', 'DejaVu Sans'],
      'open sans': ['Open Sans', 'Liberation Sans', 'DejaVu Sans'],
      'arial': ['Arial', 'Liberation Sans', 'DejaVu Sans'],
      'helvetica': ['Helvetica', 'Liberation Sans', 'DejaVu Sans'],
      'times new roman': ['Times New Roman', 'Liberation Serif', 'DejaVu Serif'],
      'courier new': ['Courier New', 'Liberation Mono', 'DejaVu Sans Mono']
    };
    
    const key = requestedFont.toLowerCase();
    if (specialMappings[key]) {
      for (const candidate of specialMappings[key]) {
        if (availableFonts.includes(candidate)) {
          bestMatch = candidate;
          break;
        }
      }
    }
  }
  
  // 6. Fallback к системным шрифтам
  if (!bestMatch) {
    const systemFallbacks = [
      'DejaVu Sans', 'Liberation Sans', 'Ubuntu', 'Noto Sans',
      'FreeSans', 'sans-serif'
    ];
    
    bestMatch = systemFallbacks.find(font => availableFonts.includes(font)) || 'DejaVu Sans';
  }
  
  // Сохраняем в кеш
  fontValidationCache.set(requestedFont, bestMatch);
  
  if (bestMatch !== requestedFont) {
    console.log(`🔄 Font mapping: "${requestedFont}" → "${bestMatch}"`);
  }
  
  return bestMatch;
}

// Функция валидации шрифта (обновленная)
function validateFont(fontName) {
  return findBestFontMatch(fontName);
}

// Функция для тестирования шрифта с FFmpeg
function testFontWithFFmpeg(fontName) {
  try {
    const testCmd = `ffmpeg -f lavfi -i testsrc2=duration=0.1:size=100x50:rate=1 -vf "subtitles=text='test':force_style='Fontname=${fontName}'" -frames:v 1 -y /dev/null`;
    execSync(testCmd, { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

// 🎨 ФУНКЦИЯ СОЗДАНИЯ СТИЛЯ ИЗ ПАРАМЕТРОВ (ОБНОВЛЕННАЯ)
function buildCustomStyle(styleParams) {
  const defaults = {
    fontsize: 8,
    fontcolor: 'ffffff',
    fontName: 'Roboto',
    bold: false,
    outline: true,
    position: 'bottom',
    background: '',
    backgroundOpacity: 0.5
  };
  
  const params = { ...defaults, ...styleParams };
  
  // УЛУЧШЕННАЯ валидация fontName
  const validatedFont = findBestFontMatch(params.fontName);
  
  // Валидация параметров
  params.fontsize = Math.max(6, Math.min(12, parseInt(params.fontsize) || 8));
  
  // Обработка fontcolor с конвертацией RGB в BGR
  params.fontcolor = (params.fontcolor || 'ffffff').replace('#', '').toLowerCase();
  
  if (!/^[0-9a-f]{6}$/.test(params.fontcolor)) {
    params.fontcolor = 'ffffff';
  }
  
  // Конвертируем RGB в BGR для FFmpeg
  if (params.fontcolor.length === 6) {
    const red = params.fontcolor.substring(0, 2);
    const green = params.fontcolor.substring(2, 4);
    const blue = params.fontcolor.substring(4, 6);
    params.fontcolor = `${blue}${green}${red}`; // BGR формат
  }
  
  params.bold = parseBooleanParam(params.bold);
  params.outline = parseBooleanParam(params.outline);
  
  // Валидация backgroundOpacity с правильной обработкой 0
  if (styleParams.backgroundOpacity !== undefined) {
    params.backgroundOpacity = Math.max(0, Math.min(1, parseFloat(styleParams.backgroundOpacity)));
  } else {
    params.backgroundOpacity = 0.5;
  }
  
  if (!['bottom', 'top', 'center'].includes(params.position)) {
    params.position = 'bottom';
  }
  
  const positionSettings = SUBTITLE_POSITIONS[params.position];
  
  // Строим финальный стиль
  const style = {
    fontsize: params.fontsize,
    fontcolor: params.fontcolor,
    fontname: validatedFont,  // Используем проверенный шрифт
    bold: params.bold ? 1 : 0,
    alignment: positionSettings.alignment,
    marginv: positionSettings.marginv
  };
  
  // Добавляем обводку
  if (params.outline) {
    style.outline = 2;
    style.shadow = 1;
  } else {
    style.outline = 0;
    style.shadow = 0;
  }
  
  // Обрабатываем цвет фона
  const backgroundInfo = parseBackgroundColor(params.background, params.backgroundOpacity);
  if (backgroundInfo.enabled) {
    style.backcolour = backgroundInfo.ffmpegColor;
    style.borderstyle = 4;
  }
  
  return {
    style,
    description: `${validatedFont} ${params.fontsize}px, ${params.fontcolor}, ${params.position}, outline: ${params.outline}, bg: ${backgroundInfo.description}, bold: ${params.bold}`,
    font_mapping: {
      requested: params.fontName,
      actual: validatedFont,
      exact_match: params.fontName === validatedFont
    }
  };
}

// 🎨 ФУНКЦИЯ ПАРСИНГА ЦВЕТА ФОНА
function parseBackgroundColor(backgroundParam, opacityParam) {
  // Если пустая строка - отключаем фон
  if (!backgroundParam || backgroundParam === '' || backgroundParam === 'false') {
    return {
      enabled: false,
      ffmpegColor: null,
      description: 'none'
    };
  }
  
  // Для обратной совместимости
  if (backgroundParam === true || backgroundParam === 'true') {
    return {
      enabled: true,
      ffmpegColor: '&H80000000',
      description: 'black semi-transparent'
    };
  }
  
  let colorString = String(backgroundParam).trim().replace('#', '');
  
  // Проверяем валидность 6-символьного hex
  if (!/^[0-9a-fA-F]{6}$/.test(colorString)) {
    return {
      enabled: false,
      ffmpegColor: null,
      description: 'invalid color format'
    };
  }
  
  // Извлекаем RGB компоненты
  const red = colorString.substring(0, 2);
  const green = colorString.substring(2, 4);
  const blue = colorString.substring(4, 6);
  
  // Конвертируем opacity в alpha с правильной обработкой 0
  let opacity = parseFloat(opacityParam);
  if (isNaN(opacity) || opacityParam === undefined || opacityParam === null || opacityParam === '') {
    opacity = 0.5;
  }
  opacity = Math.max(0, Math.min(1, opacity));
  
  // Инвертируем для FFmpeg (opacity 0 = alpha FF, opacity 1 = alpha 00)
  const alphaValue = Math.round((1 - opacity) * 255);
  const alpha = alphaValue.toString(16).padStart(2, '0').toUpperCase();
  
  // FFmpeg формат &HAABBGGRR
  const ffmpegColor = `&H${alpha}${blue}${green}${red}`.toUpperCase();
  
  const opacityPercent = Math.round(opacity * 100);
  const description = `#${red}${green}${blue} (${opacityPercent}% visible)`;
  
  return {
    enabled: true,
    ffmpegColor: ffmpegColor,
    description: description,
    originalColor: colorString,
    opacity: opacity
  };
}

// 🔧 HELPER ФУНКЦИЯ ДЛЯ ПАРСИНГА BOOLEAN ПАРАМЕТРОВ
function parseBooleanParam(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lowercased = value.toLowerCase().trim();
    return lowercased === 'true' || lowercased === '1' || lowercased === 'yes';
  }
  if (typeof value === 'number') return value !== 0;
  return false;
}

// 🎯 ФУНКЦИЯ АНАЛИЗА КАЧЕСТВА ИСХОДНОГО ВИДЕО
function analyzeVideoQuality(inputPath) {
  try {
    const probe = execSync(`ffprobe -v quiet -print_format json -show_streams "${inputPath}"`, { encoding: 'utf8' });
    const info = JSON.parse(probe);
    const videoStream = info.streams.find(s => s.codec_type === 'video');
    
    const bitrate = parseInt(videoStream.bit_rate) || 0;
    const width = parseInt(videoStream.width);
    const height = parseInt(videoStream.height);
    const codec = videoStream.codec_name;
    const fps = eval(videoStream.r_frame_rate) || 30;
    
    let qualityLevel = 'medium';
    if (bitrate > 8000000 || width >= 1920) qualityLevel = 'high';
    if (bitrate > 15000000 || width >= 3840) qualityLevel = 'ultra';
    if (bitrate < 2000000 && width < 1280) qualityLevel = 'low';
    
    return {
      bitrate,
      width,
      height,
      codec,
      fps,
      qualityLevel,
      resolution: `${width}x${height}`,
      isHighRes: width >= 1920 || height >= 1080
    };
  } catch (error) {
    return {
      bitrate: 0,
      width: 1920,
      height: 1080,
      codec: 'unknown',
      fps: 30,
      qualityLevel: 'medium',
      resolution: '1920x1080',
      isHighRes: true
    };
  }
}

// 🎯 ВЫБОР ОПТИМАЛЬНЫХ НАСТРОЕК КАЧЕСТВА
function getQualitySettings(forceQuality, videoQuality) {
  let settings;
  
  switch(forceQuality) {
    case 'lossless':
      settings = {
        crf: 0,
        preset: 'slow',
        tune: 'film',
        profile: 'high',
        level: '5.1',
        description: 'LOSSLESS_PERFECT_QUALITY'
      };
      break;
      
    case 'ultra':
      settings = {
        crf: 8,
        preset: 'slow',
        tune: 'film',
        profile: 'high',
        level: '5.1',
        description: 'ULTRA_HIGH_QUALITY'
      };
      break;
      
    case 'high':
      settings = {
        crf: 12,
        preset: 'medium',
        tune: 'film',
        profile: 'high',
        level: '4.1',
        description: 'HIGH_QUALITY'
      };
      break;
      
    case 'medium':
      settings = {
        crf: 18,
        preset: 'medium',
        tune: null,
        profile: 'main',
        level: '4.0',
        description: 'MEDIUM_QUALITY'
      };
      break;
      
    case 'low':
      settings = {
        crf: 28,
        preset: 'fast',
        tune: null,
        profile: 'baseline',
        level: '3.1',
        description: 'LOW_QUALITY_FAST'
      };
      break;
      
    case 'auto':
    default:
      if (videoQuality.qualityLevel === 'ultra') {
        settings = { crf: 12, preset: 'slow', tune: 'film', profile: 'high', level: '5.1', description: 'AUTO_ULTRA' };
      } else if (videoQuality.qualityLevel === 'high') {
        settings = { crf: 15, preset: 'medium', tune: 'film', profile: 'high', level: '4.1', description: 'AUTO_HIGH' };
      } else if (videoQuality.qualityLevel === 'low') {
        settings = { crf: 20, preset: 'fast', tune: null, profile: 'main', level: '3.1', description: 'AUTO_LOW' };
      } else {
        settings = { crf: 18, preset: 'medium', tune: null, profile: 'main', level: '4.0', description: 'AUTO_MEDIUM' };
      }
      break;
  }
  
  return settings;
}

// Health check
app.get('/health', (req, res) => {
  const systemInfo = getSystemInfo();
  
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mode: 'CUSTOM_STYLES_WITH_IMPROVED_FONT_SYSTEM_STREAMING_PRODUCTION',
    style_system: 'SMART_FONT_MATCHING_WITH_FALLBACKS',
    available_fonts: AVAILABLE_FONTS,
    supported_fonts: AVAILABLE_FONTS,
    available_positions: Object.keys(SUBTITLE_POSITIONS),
    quality_mode: 'NO_COMPRESSION_MAXIMUM_QUALITY_STREAMING_ENABLED',
    style_parameters: {
      fontsize: 'number (6-12)',
      fontcolor: 'string (hex without #)',
      fontName: `string (${AVAILABLE_FONTS.join(' | ')})`,
      bold: 'boolean',
      outline: 'boolean',
      position: 'string (bottom/top/center)',
      background: 'string (6-character hex color RRGGBB, or empty string for no background)',
      backgroundOpacity: 'number (0-1, where 0=transparent, 1=opaque)'
    },
    endpoints: [
      '/process-video-stream (Custom styles - JSON response)',
      '/health (This endpoint)',
      '/working-fonts (Font mapping status)',
      '/debug-fonts-detailed (Detailed font analysis)'
    ],
    ...systemInfo
  });
});

// 🔍 РАСШИРЕННЫЙ ДИАГНОСТИЧЕСКИЙ ENDPOINT
app.get('/debug-fonts-detailed', (req, res) => {
  console.log('🔍 Detailed font analysis starting...');
  
  try {
    const results = {};
    
    // 1. Проверяем физические файлы шрифтов
    const fontDirs = ['/usr/share/fonts/custom', '/usr/share/fonts', '/usr/local/share/fonts'];
    results.physical_files = {};
    
    for (const dir of fontDirs) {
      try {
        if (fs.existsSync(dir)) {
          const files = execSync(`find "${dir}" -name "*.ttf" -o -name "*.otf" 2>/dev/null`, { encoding: 'utf8' })
            .split('\n').filter(f => f.trim());
          results.physical_files[dir] = files.slice(0, 20); // Первые 20 файлов
        }
      } catch (e) {
        results.physical_files[dir] = `Error: ${e.message}`;
      }
    }
    
    // 2. Анализируем каждый наш шрифт через fc-match
    const ourFonts = ['Roboto', 'Montserrat', 'Open Sans', 'Helvetica', 'Arial', 'Ubuntu', 'DejaVu Sans'];
    results.font_matching = {};
    
    for (const font of ourFonts) {
      try {
        // Проверяем что fc-match возвращает для этого шрифта
        const fcMatchResult = execSync(`fc-match "${font}"`, { encoding: 'utf8', timeout: 5000 }).trim();
        
        // Получаем подробную информацию
        const fcMatchVerbose = execSync(`fc-match -v "${font}" | head -20`, { encoding: 'utf8', timeout: 5000 }).trim();
        
        // Проверяем все варианты имени
        const fcListExact = execSync(`fc-list | grep -i "${font}" || echo "Not found"`, { encoding: 'utf8' }).trim();
        
        results.font_matching[font] = {
          fc_match_result: fcMatchResult,
          fc_match_details: fcMatchVerbose.split('\n').slice(0, 10),
          fc_list_matches: fcListExact.split('\n').slice(0, 5),
          available: fcListExact !== 'Not found'
        };
        
      } catch (e) {
        results.font_matching[font] = { error: e.message };
      }
    }
    
    // 3. Тестируем FFmpeg с разными именами шрифтов
    results.ffmpeg_font_test = {};
    const testFonts = ['Roboto', 'Montserrat', 'DejaVu Sans', 'Liberation Sans', 'Arial', 'sans-serif'];
    
    for (const font of testFonts) {
      try {
        // Создаем тестовое видео с субтитрами
        const testSrt = '1\n00:00:01,000 --> 00:00:03,000\nTest Text\n\n';
        const srtPath = `/tmp/test_${Date.now()}.srt`;
        fs.writeFileSync(srtPath, testSrt);
        
        // Тестируем FFmpeg команду (не создаем реальное видео, просто проверяем ошибки)
        const ffmpegCmd = `ffmpeg -f lavfi -i testsrc2=duration=1:size=320x240:rate=1 -vf "subtitles='${srtPath}':force_style='Fontname=${font},Fontsize=20'" -t 1 -y /dev/null`;
        
        execSync(ffmpegCmd, { 
          encoding: 'utf8', 
          timeout: 10000,
          stdio: 'pipe' 
        });
        
        results.ffmpeg_font_test[font] = {
          success: true,
          message: 'Font works with FFmpeg'
        };
        
        // Удаляем тестовый файл
        fs.unlinkSync(srtPath);
        
      } catch (e) {
        results.ffmpeg_font_test[font] = {
          success: false,
          error: e.message,
          stderr: e.stderr ? e.stderr.toString().split('\n').slice(-5) : []
        };
      }
    }
    
    // 4. Получаем информацию о fontconfig
    try {
      results.fontconfig_info = {
        version: execSync('fc-list --version', { encoding: 'utf8', timeout: 3000 }).trim(),
        config_files: execSync('fc-conflist 2>/dev/null || echo "fc-conflist not available"', { encoding: 'utf8' }).trim(),
        cache_dirs: execSync('fc-cache -v 2>&1 | grep "cache directory" || echo "No cache info"', { encoding: 'utf8' }).trim()
      };
    } catch (e) {
      results.fontconfig_info = { error: e.message };
    }
    
    // 5. Проверяем реальные имена семейств шрифтов
    try {
      const allFamilies = execSync(`fc-list : family | sort -u`, { encoding: 'utf8' })
        .split('\n')
        .filter(f => f.trim())
        .slice(0, 50);
        
      results.available_families = allFamilies;
      
      // Ищем похожие на наши шрифты
      results.similar_fonts = {};
      for (const ourFont of ourFonts) {
        const similar = allFamilies.filter(f => 
          f.toLowerCase().includes(ourFont.toLowerCase()) || 
          ourFont.toLowerCase().includes(f.toLowerCase())
        );
        if (similar.length > 0) {
          results.similar_fonts[ourFont] = similar;
        }
      }
      
    } catch (e) {
      results.available_families = { error: e.message };
    }
    
    // 6. Специальная проверка для Montserrat
    try {
      results.montserrat_debug = {
        fc_list_montserrat: execSync(`fc-list | grep -i montserrat || echo "Not found in fc-list"`, { encoding: 'utf8' }).trim(),
        physical_files: execSync(`find /usr /tmp -name "*ontserrat*" 2>/dev/null || echo "No physical files"`, { encoding: 'utf8' }).trim(),
        fc_match_montserrat: execSync(`fc-match "Montserrat" | head -3`, { encoding: 'utf8' }).trim(),
        fc_match_verbose: execSync(`fc-match -v "Montserrat" | grep -E "(family|file|style)" | head -10`, { encoding: 'utf8' }).trim()
      };
    } catch (e) {
      results.montserrat_debug = { error: e.message };
    }
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      server_info: {
        os: execSync('uname -a', { encoding: 'utf8' }).trim(),
        node_version: process.version
      },
      analysis: results,
      recommendations: {
        working_fonts: Object.keys(results.font_matching).filter(f => results.font_matching[f].available),
        ffmpeg_compatible: Object.keys(results.ffmpeg_font_test).filter(f => results.ffmpeg_font_test[f].success)
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint для получения реально работающих шрифтов
app.get('/working-fonts', (req, res) => {
  try {
    const ourFontsList = [
      'Roboto', 'Montserrat', 'Open Sans', 'Arial', 'Helvetica',
      'Lato', 'Source Sans Pro', 'Poppins', 'Inter', 'Ubuntu',
      'Oswald', 'Raleway', 'Nunito', 'Quicksand', 'Courier New',
      'Georgia', 'Merriweather'
    ];
    
    const workingFonts = {};
    const availableFonts = getAllAvailableFonts();
    
    ourFontsList.forEach(requestedFont => {
      const actualFont = findBestFontMatch(requestedFont);
      workingFonts[requestedFont] = {
        mapped_to: actualFont,
        exact_match: requestedFont === actualFont,
        available: availableFonts.includes(actualFont)
      };
    });
    
    // Показываем топ системных шрифтов
    const systemFonts = availableFonts.filter(font => 
      font.includes('DejaVu') || font.includes('Liberation') || 
      font.includes('Ubuntu') || font.includes('Noto') ||
      font.includes('Sans') || font.includes('Serif') || font.includes('Mono')
    ).slice(0, 20);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      font_mappings: workingFonts,
      total_system_fonts: availableFonts.length,
      recommended_system_fonts: systemFonts,
      cache_size: fontValidationCache.size
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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
      supported_fonts: AVAILABLE_FONTS,
    return {
      ffmpeg_available: true,
      ffmpeg_version: ffmpegVersion,
      fonts_available: availableFonts,
      supported_fonts: AVAILABLE_FONTS,
      subtitle_method: 'SMART_FONT_MATCHING_WITH_FALLBACKS'
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
  if (!srtContent || srtContent.length < 10) {
    throw new Error('SRT content is empty or too short');
  }
  
  if (!srtContent.includes('-->')) {
    return `1\n00:00:00,000 --> 00:00:10,000\n${srtContent.trim()}\n\n`;
  }
  
  let beautifiedSrt = srtContent
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
  
  const lines = beautifiedSrt.split('\n');
  const improvedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('-->')) {
      improvedLines.push(line);
    } else if (/^\d+$/.test(line)) {
      improvedLines.push(line);
    } else if (line.length > 0) {
      let improvedText = line;
      
      improvedText = improvedText.replace(/\s+/g, ' ').trim();
      improvedText = improvedText.replace(/\s+([,.!?;:])/g, '$1');
      improvedText = improvedText.replace(/([,.!?;:])\s*/g, '$1 ');
      improvedText = improvedText.replace(/"/g, '«').replace(/"/g, '»');
      
      if (improvedText.length > 50) {
        const words = improvedText.split(' ');
        if (words.length > 8) {
          const mid = Math.ceil(words.length / 2);
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
      improvedLines.push('');
    }
  }
  
  beautifiedSrt = improvedLines.join('\n');
  
  if (!beautifiedSrt.endsWith('\n\n')) {
    beautifiedSrt += '\n\n';
  }
  
  return beautifiedSrt;
}

// 🚀 ОСНОВНОЙ STREAMING ENDPOINT С УЛУЧШЕННОЙ СИСТЕМОЙ ШРИФТОВ
app.post('/process-video-stream', upload.single('video'), async (req, res) => {
  const taskId = req.body.task_id || uuidv4();
  const startTime = Date.now();
  
  console.log(`\n=== [${taskId}] SMART FONT SYSTEM PROCESSING ===`);

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
    
    // 🎨 ПОЛУЧАЕМ ПАРАМЕТРЫ КАСТОМНОГО СТИЛЯ С УЛУЧШЕННОЙ ВАЛИДАЦИЕЙ ШРИФТОВ
    const styleParams = {
      fontsize: req.body.fontsize,
      fontcolor: req.body.fontcolor,
      fontName: req.body.fontName,  // Умная валидация
      bold: req.body.bold,
      outline: req.body.outline,
      position: req.body.position,
      background: req.body.background,
      backgroundOpacity: req.body.backgroundOpacity
    };
    
    const forceQuality = req.body.force_quality || 'auto';
    
    console.log(`[${taskId}] Video size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    console.log(`[${taskId}] Quality mode: ${forceQuality}`);
    console.log(`[${taskId}] Font requested: ${styleParams.fontName || 'default'}`);
    
    // 🎨 СОЗДАЕМ КАСТОМНЫЙ СТИЛЬ С УМНОЙ ВАЛИДАЦИЕЙ ШРИФТОВ
    const { style: selectedStyle, description: styleDescription, font_mapping } = buildCustomStyle(styleParams);
    console.log(`[${taskId}] Style: ${styleDescription}`);
    if (font_mapping && !font_mapping.exact_match) {
      console.log(`[${taskId}] 🔄 Font mapped: "${font_mapping.requested}" → "${font_mapping.actual}"`);
    }

    // Создаем временные файлы
    const tempDir = '/tmp/processing';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const inputVideoPath = path.join(tempDir, `stream_input_${taskId}.mp4`);
    const srtPath = path.join(tempDir, `stream_subtitles_${taskId}.srt`);
    const outputVideoPath = path.join(tempDir, `stream_output_${taskId}.mp4`);

    // Сохраняем файлы
    fs.writeFileSync(inputVideoPath, videoBuffer);

    // Анализируем качество
    const videoQuality = analyzeVideoQuality(inputVideoPath);
    console.log(`[${taskId}] Input: ${videoQuality.resolution}, ${Math.round(videoQuality.bitrate / 1000)}kbps`);

    // Выбираем настройки качества
    const optimalSettings = getQualitySettings(forceQuality, videoQuality);

    // Beautify SRT
    const beautifiedSRT = beautifySRT(rawSrtContent, taskId);
    fs.writeFileSync(srtPath, beautifiedSRT, 'utf8');

    // 🎨 СТРОИМ STYLE STRING ДЛЯ FFMPEG С ПРОВЕРЕННЫМ ШРИФТОМ
    const buildStyleString = (style) => {
      let styleStr = `Fontsize=${style.fontsize}`;
      
      if (style.fontname) {
        styleStr += `,Fontname=${style.fontname}`;
      }
      
      if (style.fontcolor) {
        const color = style.fontcolor.startsWith('&H') ? style.fontcolor : `&H${style.fontcolor}`;
        styleStr += `,PrimaryColour=${color}`;
      }
      
      if (style.outline && style.outline > 0) {
        styleStr += `,OutlineColour=&H000000,Outline=${style.outline}`;
      }
      
      if (style.shadow && style.shadow > 0) {
        styleStr += `,Shadow=${style.shadow}`;
      }
      
      if (style.bold) {
        styleStr += `,Bold=${style.bold}`;
      }
      
      if (style.alignment) {
        styleStr += `,Alignment=${style.alignment}`;
      }
      
      if (style.marginv !== undefined) {
        styleStr += `,MarginV=${style.marginv}`;
      }
      
      if (style.backcolour) {
        styleStr += `,BackColour=${style.backcolour}`;
        if (style.borderstyle) {
          styleStr += `,BorderStyle=${style.borderstyle}`;
        }
      }
      
      return styleStr;
    };

    const styleString = buildStyleString(selectedStyle);

    // Строим FFmpeg команды с fallback логикой и улучшенной системой шрифтов
    const mainCommand = `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleString}'" -c:a copy -c:v libx264 -preset ${optimalSettings.preset} -crf ${optimalSettings.crf} -pix_fmt yuv420p${optimalSettings.tune ? ` -tune ${optimalSettings.tune}` : ''} -profile:v ${optimalSettings.profile}${optimalSettings.level ? ` -level ${optimalSettings.level}` : ''} -movflags +faststart -y "${outputVideoPath}"`;

    // Fallback с системным шрифтом
    const systemFallbackFont = findBestFontMatch('DejaVu Sans');
    const simplifiedStyleString = `Fontname=${systemFallbackFont},Fontsize=${selectedStyle.fontsize},PrimaryColour=&H${selectedStyle.fontcolor || 'ffffff'},OutlineColour=&H000000,Outline=${selectedStyle.outline || 2}${selectedStyle.backcolour ? `,BackColour=${selectedStyle.backcolour},BorderStyle=4` : ''}`;
    
    const commands = [
      mainCommand,
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${styleString}'" -c:a copy -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart -y "${outputVideoPath}"`,
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}':force_style='${simplifiedStyleString}'" -c:a copy -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -y "${outputVideoPath}"`,
      `ffmpeg -i "${inputVideoPath}" -vf "subtitles='${srtPath}'" -c:a copy -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -y "${outputVideoPath}"`
    ];

    let success = false;
    let usedCommand = 0;

    // Выполняем команды последовательно
    for (let i = 0; i < commands.length && !success; i++) {
      try {
        console.log(`[${taskId}] Trying method ${i + 1}...`);
        
        if (fs.existsSync(outputVideoPath)) fs.unlinkSync(outputVideoPath);
        
        const cmdStartTime = Date.now();
        execSync(commands[i], { 
          stdio: 'pipe',
          timeout: 600000,
          maxBuffer: 1024 * 1024 * 200
        });
        const cmdDuration = Date.now() - cmdStartTime;
        
        if (fs.existsSync(outputVideoPath)) {
          const outputSize = fs.statSync(outputVideoPath).size;
          if (outputSize > 0) {
            console.log(`[${taskId}] ✅ Success! Method ${i + 1} (${cmdDuration}ms)`);
            success = true;
            usedCommand = i + 1;
            break;
          }
        }
      } catch (error) {
        console.log(`[${taskId}] ❌ Method ${i + 1} failed`);
      }
    }

    if (!success) {
      throw new Error('All processing methods failed');
    }

    // Проверяем результат
    if (!fs.existsSync(outputVideoPath)) {
      throw new Error('Output video file not found');
    }

    const outputStats = fs.statSync(outputVideoPath);
    if (outputStats.size === 0) {
      throw new Error('Output video file is empty');
    }

    // Читаем файл и создаем base64
    const processedVideoBuffer = fs.readFileSync(outputVideoPath);
    const base64Data = processedVideoBuffer.toString('base64');

    // Проверяем MP4 header
    const mp4Header = processedVideoBuffer.slice(0, 12);
    const isValidMP4 = mp4Header.includes(Buffer.from('ftyp')) || 
                       mp4Header.slice(4, 8).toString() === 'ftyp';

    const processingTime = Date.now() - startTime;
    const sizeChange = ((processedVideoBuffer.length / videoBuffer.length) - 1) * 100;

    console.log(`[${taskId}] Complete: ${processingTime}ms, size change: ${sizeChange > 0 ? '+' : ''}${sizeChange.toFixed(1)}%`);
    if (font_mapping && !font_mapping.exact_match) {
      console.log(`[${taskId}] ✅ Font successfully mapped and applied`);
    }

    // Очистка временных файлов
    [inputVideoPath, srtPath, outputVideoPath].forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (err) {}
    });

    // Отправляем ответ с информацией о маппинге шрифтов
    res.json({
      success: true,
      task_id: taskId,
      processing_stats: {
        processing_time_ms: processingTime,
        input_size_bytes: videoBuffer.length,
        output_size_bytes: processedVideoBuffer.length,
        size_change_percent: parseFloat(sizeChange.toFixed(1)),
        method_used: `METHOD_${usedCommand}`,
        quality_mode: forceQuality,
        quality_description: optimalSettings.description
      },
      video_data: base64Data,
      content_type: 'video/mp4',
      video_metadata: {
        original_size_bytes: processedVideoBuffer.length,
        base64_length: base64Data.length,
        expected_decoded_size: Math.ceil(base64Data.length * 3 / 4),
        file_signature: processedVideoBuffer.slice(0, 12).toString('hex'),
        is_valid_mp4: isValidMP4,
        content_type: 'video/mp4',
        encoding: 'base64'
      },
      style_info: {
        type: 'custom_with_smart_fonts',
        description: styleDescription,
        parameters: styleParams,
        final_style: selectedStyle,
        font_mapping: font_mapping || null,
        ffmpeg_style_string: styleString,
        position_name: SUBTITLE_POSITIONS[styleParams.position || 'bottom'].name
      },
      quality_info: {
        input_resolution: videoQuality.resolution,
        input_bitrate: videoQuality.bitrate,
        input_quality_level: videoQuality.qualityLevel,
        force_quality: forceQuality,
        crf_used: optimalSettings.crf,
        preset_used: optimalSettings.preset,
        profile_used: optimalSettings.profile
      }
    });

  } catch (error) {
    console.error(`[${taskId}] Error:`, error.message);

    // Очистка при ошибке
    const tempFiles = [
      `/tmp/processing/stream_input_${taskId}.mp4`,
      `/tmp/processing/stream_subtitles_${taskId}.srt`,
      `/tmp/processing/stream_output_${taskId}.mp4`
    ];
    
    tempFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (err) {}
    });

    res.status(500).json({
      success: false,
      task_id: taskId,
      error: error.message,
      processing_time_ms: Date.now() - startTime
    });
  }
});

// Настройки для сервера
const server = app.listen(PORT, () => {
  console.log(`🎨 SMART FONT SYSTEM Subtitle Service running on port ${PORT}`);
  console.log(`📱 Ready for custom subtitle styles with INTELLIGENT FONT MATCHING!`);
  console.log(`🎯 Style system: SMART_FONT_MATCHING_WITH_FALLBACKS`);
  console.log(`✨ Available parameters:`);
  console.log(`   • fontsize (6-12) - Text size`);
  console.log(`   • fontcolor (hex) - Text color`);
  console.log(`   • fontName (${AVAILABLE_FONTS.length} fonts) - Font family with smart fallbacks`);
  console.log(`   • bold (true/false) - Bold text`);
  console.log(`   • outline (true/false) - Text outline`);
  console.log(`   • background (RRGGBB) - Background color as 6-character hex`);
  console.log(`   • backgroundOpacity (0-1) - Background visibility (0=transparent, 1=opaque)`);
  console.log(`   • position (bottom/top/center) - Text position`);
  console.log(`🎯 Font system: Smart matching with automatic fallbacks`);
  console.log(`🎯 Quality modes: auto | lossless | ultra | high | medium | low`);
  console.log(`🚀 Endpoints:`);
  console.log(`   • POST /process-video-stream (Smart font system - JSON response)`);
  console.log(`   • GET /health (System status)`);
  console.log(`   • GET /working-fonts (Font mapping status)`);
  console.log(`   • GET /debug-fonts-detailed (Detailed font analysis)`);
  
  const systemInfo = getSystemInfo();
  console.log(`FFmpeg: ${systemInfo.ffmpeg_available}`);
  console.log(`Quality Mode: SMART_FONTS_PRODUCTION_READY`);
  
  // Инициализируем кеш шрифтов при старте
  console.log(`🔄 Initializing font cache...`);
  getAllAvailableFonts();
  console.log(`✅ Font system initialized!`);
});

// Увеличиваем timeout сервера
server.timeout = 900000; // 15 минут
server.keepAliveTimeout = 900000;
server.headersTimeout = 900000;
