// 🔧 ИСПРАВЛЕННАЯ ЧАСТЬ STREAMING ENDPOINT
// Замените блок с заголовками в вашем /process-video-stream endpoint на этот:

    // 🎯 УСТАНАВЛИВАЕМ ЗАГОЛОВКИ ДЛЯ STREAMING (ИСПРАВЛЕННАЯ ВЕРСИЯ)
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', processedVideoBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="processed_${taskId}.mp4"`);
    
    // Безопасное кодирование метаданных в заголовки (Base64)
    const processingStats = {
      processing_time_ms: processingTime,
      input_size_bytes: videoBuffer.length,
      output_size_bytes: processedVideoBuffer.length,
      size_change_percent: parseFloat(sizeChange.toFixed(1)),
      method_used: `STREAMING_METHOD_${usedCommand}`,
      task_id: taskId,
      quality_mode: forceQuality,
      quality_description: optimalSettings.description
    };
    
    const styleInfo = {
      style_id: customStyle ? 'custom' : styleId,
      style_name: selectedStyle.name || 'Custom Style',
      position: position,
      applied_settings: {
        fontsize: selectedStyle.fontsize,
        fontcolor: selectedStyle.fontcolor,
        outline: selectedStyle.outline,
        shadow: selectedStyle.shadow,
        bold: selectedStyle.bold
      }
    };

    const qualityInfo = {
      input_quality: {
        resolution: videoQuality.resolution,
        bitrate: videoQuality.bitrate,
        qualityLevel: videoQuality.qualityLevel
      },
      encoding_settings: {
        crf: optimalSettings.crf,
        preset: optimalSettings.preset,
        profile: optimalSettings.profile
      },
      force_quality: forceQuality
    };
    
    // 🔧 КОДИРУЕМ В BASE64 ДЛЯ БЕЗОПАСНОСТИ HTTP ЗАГОЛОВКОВ
    try {
      const statsBase64 = Buffer.from(JSON.stringify(processingStats), 'utf8').toString('base64');
      const styleBase64 = Buffer.from(JSON.stringify(styleInfo), 'utf8').toString('base64');
      const qualityBase64 = Buffer.from(JSON.stringify(qualityInfo), 'utf8').toString('base64');
      
      res.setHeader('X-Processing-Stats', statsBase64);
      res.setHeader('X-Style-Info', styleBase64);
      res.setHeader('X-Quality-Info', qualityBase64);
      res.setHeader('X-Encoding', 'base64'); // Указываем что данные в base64
      
      console.log(`[${taskId}] ✅ Headers set safely with base64 encoding`);
    } catch (headerError) {
      // Fallback: минимальные заголовки если что-то пошло не так
      res.setHeader('X-Task-ID', taskId);
      res.setHeader('X-Processing-Time', processingTime.toString());
      res.setHeader('X-Quality-Mode', forceQuality);
      res.setHeader('X-Size-Change', sizeChange.toFixed(1));
      
      console.log(`[${taskId}] ⚠️ Fallback to simple headers due to:`, headerError.message);
    }

    // Делаем заголовки доступными для клиента
    res.setHeader('Access-Control-Expose-Headers', 'X-Processing-Stats, X-Style-Info, X-Quality-Info, X-Encoding, X-Task-ID, X-Processing-Time, X-Quality-Mode, X-Size-Change, Content-Length');

    console.log(`[${taskId}] 🚀 Streaming video directly to client...`);
    
    // 🎯 ОТПРАВЛЯЕМ ВИДЕО КАК BINARY STREAM
    res.end(processedVideoBuffer);
