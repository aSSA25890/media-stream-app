// Медиа сервер с WebSocket компонентом
const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Главная - выглядит как панель управления медиа
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Media Stream Dashboard</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #000; color: #fff; }
        .dashboard { max-width: 1000px; margin: 0 auto; }
        .header { background: linear-gradient(90deg, #667eea, #764ba2); padding: 30px; border-radius: 15px; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #1a1a2e; padding: 20px; border-radius: 10px; }
        .live-indicator { width: 12px; height: 12px; background: #00ff88; border-radius: 50%; display: inline-block; margin-right: 8px; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      </style>
    </head>
    <body>
      <div class="dashboard">
        <div class="header">
          <h1><span class="live-indicator"></span> Media Stream Dashboard</h1>
          <p>Real-time streaming status monitor</p>
        </div>
        
        <div class="stats">
          <div class="stat-card">
            <h3>Connection Status</h3>
            <p style="color: #00ff88; font-size: 24px;">ACTIVE</p>
            <p>WebSocket: <span id="wsStatus">Connecting...</span></p>
          </div>
          
          <div class="stat-card">
            <h3>Server Info</h3>
            <p>Port: ${PORT}</p>
            <p>Time: ${new Date().toLocaleTimeString()}</p>
            <p>Uptime: <span id="uptime">00:00:00</span></p>
          </div>
        </div>
        
        <div class="stat-card">
          <h3>WebSocket Test</h3>
          <p>Open browser console and run:</p>
          <code style="background: #2d3748; padding: 10px; display: block; border-radius: 5px; margin: 10px 0;">
            const ws = new WebSocket('wss://' + window.location.host + '/stream');
          </code>
          <button onclick="testWebSocket()" style="background: #4299e1; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Test Connection</button>
        </div>
      </div>
      
      <script>
        let startTime = Date.now();
        function updateUptime() {
          const diff = Date.now() - startTime;
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          document.getElementById('uptime').textContent = 
            \`\${hours.toString().padStart(2, '0')}:\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
        }
        setInterval(updateUptime, 1000);
        
        function testWebSocket() {
          const ws = new WebSocket('wss://' + window.location.host + '/stream');
          ws.onopen = () => {
            document.getElementById('wsStatus').textContent = 'Connected ✓';
            ws.send('ping');
            setTimeout(() => ws.close(), 2000);
          };
          ws.onerror = () => {
            document.getElementById('wsStatus').textContent = 'Error';
          };
        }
        
        // Auto-test on load
        setTimeout(testWebSocket, 1000);
      </script>
    </body>
    </html>
  `);
});

// Health endpoint (но называем его иначе)
app.get('/status', (req, res) => {
  res.json({
    service: "media-stream-server",
    status: "operational",
    timestamp: new Date().toISOString(),
    features: ["websocket", "real-time", "dashboard"]
  });
});

// WebSocket сервер
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (message) => {
    if (message.toString() === 'ping') {
      ws.send('pong');
    }
  });
  
  // Отправляем данные каждые 5 секунд
  const interval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
        type: 'heartbeat',
        timestamp: Date.now(),
        data: Math.random().toString(36).substr(2, 9)
      }));
    }
  }, 5000);
  
  ws.on('close', () => {
    clearInterval(interval);
    console.log('WebSocket connection closed');
  });
});

server.listen(PORT, () => {
  console.log(\`🎬 Media Stream Dashboard running on port \${PORT}\`);
  console.log(\`📡 WebSocket available at ws://localhost:\${PORT}/stream\`);
});
