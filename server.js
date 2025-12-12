const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Ключевая настройка: на какой легальный сервис маскируемся
const TARGET_URL = process.env.TARGET_URL || 'https://play.geforcenow.com';
const MASK_DOMAIN = process.env.MASK_DOMAIN || 'cloudflare.com';

// Middleware
app.use(express.json());

// 1. ГЛАВНАЯ СТРАНИЦА - выглядит как CDN или сервис доставки контента
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CDN Edge Node ${MASK_DOMAIN}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="description" content="Content Delivery Network Edge Node">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f7; color: #1d1d1f; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 0 0 20px 20px; margin: -20px -20px 30px -20px; }
        .card { background: white; padding: 25px; border-radius: 18px; margin: 20px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .status-dot { width: 12px; height: 12px; background: #34c759; border-radius: 50%; display: inline-block; margin-right: 8px; }
        .endpoint { font-family: 'SF Mono', Menlo, monospace; background: #f2f2f7; padding: 12px; border-radius: 8px; margin: 8px 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🛜 CDN Edge Node</h1>
        <p>Content Delivery Network • ${MASK_DOMAIN} • Performance Optimized</p>
      </div>
      
      <div class="card">
        <h3><span class="status-dot"></span> Operational Status</h3>
        <p><strong>Node ID:</strong> RND-${Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
        <p><strong>Location:</strong> Global Edge Network</p>
        <p><strong>Uptime:</strong> 99.95%</p>
        <p><strong>Load:</strong> <span id="load">${(Math.random() * 30 + 10).toFixed(1)}%</span></p>
      </div>
      
      <div class="card">
        <h3>📊 Network Endpoints</h3>
        <div class="endpoint">GET /api/cdn/v1/health</div>
        <div class="endpoint">GET /api/cdn/v1/metrics</div>
        <div class="endpoint">WebSocket /ws/cdn/stream</div>
        <div class="endpoint">POST /api/cdn/v1/logs</div>
      </div>
      
      <div class="card">
        <p style="font-size: 13px; color: #8e8e93;">
          This edge node is part of a global content delivery network.
          All connections are encrypted with TLS 1.3 and optimized for low latency.
        </p>
      </div>
      
      <script>
        // Динамическое обновление нагрузки
        setInterval(() => {
          document.getElementById('load').textContent = 
            (Math.random() * 30 + 10).toFixed(1) + '%';
        }, 5000);
      </script>
    </body>
    </html>
  `);
});

// 2. Health check - как у настоящего CDN
app.get('/api/cdn/v1/health', (req, res) => {
  res.json({
    status: "healthy",
    service: "cdn_edge_node",
    region: "global",
    timestamp: new Date().toISOString(),
    metrics: {
      connections: Math.floor(Math.random() * 500) + 100,
      bandwidth: (Math.random() * 1000 + 100).toFixed(1) + " Mbps",
      latency: Math.floor(Math.random() * 50) + 10
    }
  });
});

// 3. WebSocket маскировка под стриминг данных
app.use('/ws/cdn/stream', createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  ws: true,
  pathRewrite: { '^/ws/cdn/stream': '' },
  logLevel: 'silent',
  onProxyReq: (proxyReq, req, res) => {
    // Маскируем заголовки под легитимный трафик
    proxyReq.setHeader('X-CDN-Node', 'edge-' + Math.random().toString(36).substr(2, 8));
    proxyReq.setHeader('X-Forwarded-Host', MASK_DOMAIN);
  }
}));

// 4. HTTP прокси с маскировкой
app.use('/api/cdn/v1/proxy', createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/cdn/v1/proxy': '' },
  logLevel: 'silent',
  onProxyReq: (proxyReq, req, res) => {
    // Ключевая маскировка: добавляем заголовки как у легального сервиса
    proxyReq.setHeader('X-CDN-Request-ID', Math.random().toString(36).substr(2, 12));
    proxyReq.setHeader('X-Forwarded-For', req.ip || '');
    proxyReq.setHeader('X-Real-IP', req.ip || '');
    proxyReq.setHeader('User-Agent', 'CDN-Edge-Node/1.0');
    
    // Если маскируемся под конкретный сервис
    if (MASK_DOMAIN.includes('cloudflare')) {
      proxyReq.setHeader('CF-Connecting-IP', req.ip || '');
    }
    if (MASK_DOMAIN.includes('yandex')) {
      proxyReq.setHeader('X-Yandex-Cloud-Request-ID', Math.random().toString(36).substr(2, 16));
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Очищаем ответ от следов прокси
    delete proxyRes.headers['x-powered-by'];
    delete proxyRes.headers['server'];
  }
}));

// 5. Метрики (для правдоподобности)
app.get('/api/cdn/v1/metrics', (req, res) => {
  res.json({
    node_type: "edge",
    requests_per_minute: Math.floor(Math.random() * 1000) + 500,
    cache_hit_rate: (Math.random() * 30 + 70).toFixed(1) + "%",
    bandwidth_used: (Math.random() * 500 + 100).toFixed(1) + " GB"
  });
});

// 6. Периодически обращаемся к легальным российским ресурсам (для правдоподобности)
setInterval(async () => {
  try {
    // Список легальных ресурсов для "фоновых запросов"
    const legitSites = [
      'https://yandex.ru',
      'https://sberbank.ru',
      'https://gosuslugi.ru',
      'https://vk.com'
    ];
    
    const randomSite = legitSites[Math.floor(Math.random() * legitSites.length)];
    const response = await fetch(randomSite, { 
      method: 'HEAD',
      timeout: 5000 
    });
    console.log(`[CDN Noise] Ping to ${randomSite}: ${response.status}`);
  } catch (err) {
    // Игнорируем ошибки - это просто "шум"
  }
}, 60000); // Каждую минуту

// 7. 404 handler - тоже маскируем
app.use((req, res) => {
  res.status(404).json({
    error: "cdn_endpoint_not_found",
    message: "The requested CDN endpoint does not exist",
    documentation: "https://developer." + MASK_DOMAIN + "/docs/cdn-api"
  });
});

// 8. Запуск сервера с привязкой к 0.0.0.0 (ВАЖНО ДЛЯ RENDER!)
const SERVER_PORT = process.env.PORT || 3000;
app.listen(SERVER_PORT, '0.0.0.0', () => {
  console.log("🛜 CDN Edge Node running on port " + SERVER_PORT + " (0.0.0.0)");
  console.log("🎯 Target: " + TARGET_URL);
  console.log("🎭 Masking as: " + MASK_DOMAIN);
});
