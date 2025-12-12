const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Настройки для МТС
const TARGET_URL = process.env.TARGET_URL || 'https://yandex.ru';
const MASK_DOMAIN = process.env.MASK_DOMAIN || 'yandex.net';

// Middleware - минимизируем логи
app.use(express.json());
app.use((req, res, next) => {
  // Убираем все отладочные заголовки
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  next();
});

// 1. ГЛАВНАЯ - выглядит как сервис Яндекса
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>Yandex Services API</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: 'YS Text', Arial, sans-serif; margin: 0; padding: 20px; background: #fff; color: #000; }
        .yandex-header { background: #ffcc00; padding: 20px; margin: -20px -20px 30px -20px; }
        .service-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 15px 0; }
        .api-endpoint { font-family: monospace; background: #f5f5f6; padding: 10px; border-radius: 4px; margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="yandex-header">
        <h1 style="margin:0; color:#000;">🔧 Яндекс.Сервисы API</h1>
        <p>Внутренний API для интеграции сервисов Яндекс</p>
      </div>
      
      <div class="service-card">
        <h3>Статус системы</h3>
        <p><strong>Сервис:</strong> Яндекс.ПроксиГейт v2.1</p>
        <p><strong>Статус:</strong> <span style="color:green">Работает в штатном режиме</span></p>
        <p><strong>Назначение:</strong> Маршрутизация трафика между сервисами Яндекса</p>
      </div>
      
      <div class="service-card">
        <h3>Доступные эндпоинты:</h3>
        <div class="api-endpoint">GET /api/yandex/health</div>
        <div class="api-endpoint">GET /api/yandex/metrics</div>
        <div class="api-endpoint">WebSocket /ws/yandex/data</div>
        <div class="api-endpoint">POST /api/yandex/route</div>
      </div>
      
      <div style="margin-top: 30px; font-size: 12px; color: #999;">
        <p>© 2025 Яндекс. Использование этого API регулируется соглашением.</p>
      </div>
    </body>
    </html>
  `);
});

// 2. Health check - как у Яндекс API
app.get('/api/yandex/health', (req, res) => {
  res.json({
    service: "yandex-proxygate",
    version: "2.1.0",
    status: "operational",
    region: "ru-central1",
    timestamp: new Date().toISOString()
  });
});

// 3. WebSocket для МТС - имитируем Яндекс.Такси стрим
app.use('/ws/yandex/data', createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  ws: true,
  pathRewrite: { '^/ws/yandex/data': '' },
  logLevel: 'silent',
  onProxyReq: (proxyReq, req, res) => {
    // Ключевые заголовки для МТС
    proxyReq.setHeader('X-Yandex-API-Key', 'internal-' + Math.random().toString(36).substr(2, 12));
    proxyReq.setHeader('X-Yandex-Service', 'taxi-stream');
    proxyReq.setHeader('X-Real-IP', req.ip || '8.8.8.8');
    proxyReq.setHeader('User-Agent', 'YandexTaxi/5.25 (iPhone; iOS 17.1; Scale/3.00)');
  }
}));

// 4. Основной прокси-эндпоинт для МТС
app.use('/api/yandex/route', createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/yandex/route': '' },
  logLevel: 'silent',
  onProxyReq: (proxyReq, req, res) => {
    // Заголовки как у легального Яндекс трафика
    proxyReq.setHeader('X-Yandex-Request-ID', Math.random().toString(36).substr(2, 16));
    proxyReq.setHeader('X-Forwarded-For', req.ip || '8.8.8.8');
    proxyReq.setHeader('X-Forwarded-Host', MASK_DOMAIN);
    proxyReq.setHeader('X-Yandex-Service', 'maps-api');
    proxyReq.setHeader('Accept', 'application/json, text/html');
    proxyReq.setHeader('Accept-Language', 'ru-RU,ru;q=0.9');
    
    // Убираем подозрительные заголовки
    proxyReq.removeHeader('via');
    proxyReq.removeHeader('x-forwarded-proto');
  },
  onProxyRes: (proxyRes, req, res) => {
    // Очищаем ответ
    delete proxyRes.headers['x-powered-by'];
    delete proxyRes.headers['server'];
    proxyRes.headers['server'] = 'yandex';
  }
}));

// 5. Фоновые запросы к российским сайтам (обязательно для МТС)
setInterval(async () => {
  try {
    const russianSites = [
      'https://yandex.ru',
      'https://mail.ru', 
      'https://vk.com',
      'https://sberbank.ru',
      'https://gosuslugi.ru',
      'https://rt.ru'
    ];
    
    const site = russianSites[Math.floor(Math.random() * russianSites.length)];
    const response = await fetch(site, { 
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 3000 
    });
    
    console.log(`[МТС Шум] Запрос к ${site}: ${response.status}`);
  } catch (err) {
    // Игнорируем ошибки
  }
}, 45000); // Каждые 45 секунд

// 6. Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Яндекс.ПроксиГейт запущен на порту ${PORT}`);
  console.log(`🎯 Целевой URL: ${TARGET_URL}`);
  console.log(`🎭 Маскировка под: ${MASK_DOMAIN}`);
});
