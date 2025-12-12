const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. ГЛАВНАЯ СТРАНИЦА
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Media Stream App</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #0f172a; color: #e2e8f0; }
        .container { max-width: 800px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 15px; }
        .status { background: #2d3748; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .btn { background: #4299e1; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎬 Media Stream App</h1>
        <div class="status">
          <p><strong>Status:</strong> <span style="color:#00ff88">Online</span></p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>URL:</strong> ${req.protocol}://${req.get('host')}</p>
        </div>
        <p>This is a media streaming dashboard application.</p>
        <p><a href="/status"><button class="btn">Check Server Status</button></a></p>
      </div>
    </body>
    </html>
  `);
});

// 2. СТАТУС СЕРВЕРА
app.get('/status', (req, res) => {
  res.json({
    service: "media-stream-app",
    status: "operational",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 3. ЗАПУСК СЕРВЕРА
app.listen(PORT, () => {
  console.log("🎬 Media Stream App running on port " + PORT);
});
