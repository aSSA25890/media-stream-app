const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Создаем папку для конфигураций
const configsDir = path.join(__dirname, 'configs');
if (!fs.existsSync(configsDir)) {
  fs.mkdirSync(configsDir);
}

app.use(express.json());
app.use(express.static('public'));

// 1. Главная страница
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WireGuard VPN Manager</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial; margin: 40px; background: #0f172a; color: white; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { background: #1e293b; padding: 25px; border-radius: 15px; margin: 20px 0; }
        .btn { background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; }
        .config { background: #334155; padding: 15px; border-radius: 10px; margin: 10px 0; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔒 WireGuard VPN Server</h1>
        
        <div class="card">
          <h3>🚀 Создать новый VPN профиль</h3>
          <p>Нажмите кнопку чтобы создать новую конфигурацию WireGuard</p>
          <button class="btn" onclick="createConfig()">Создать конфигурацию</button>
          <div id="result" style="margin-top: 20px;"></div>
        </div>
        
        <div class="card">
          <h3>📱 Как подключиться:</h3>
          <p>1. Установите WireGuard на устройство</p>
          <p>2. Отсканируйте QR код или импортируйте конфиг</p>
          <p>3. Активируйте подключение</p>
        </div>
      </div>
      
      <script>
        async function createConfig() {
          const resultDiv = document.getElementById('result');
          resultDiv.innerHTML = '⏳ Создаем конфигурацию...';
          
          try {
            const response = await fetch('/create-config', { method: 'POST' });
            const data = await response.json();
            
            if (data.success) {
              resultDiv.innerHTML = \`
                <div class="config">
                  <h4>✅ Конфигурация создана!</h4>
                  <p><strong>IP клиента:</strong> \${data.client_ip}</p>
                  <p><strong>Публичный ключ:</strong> \${data.public_key.substring(0, 20)}...</p>
                  <p><strong>QR код:</strong></p>
                  <img src="/configs/\${data.config_id}/qr.png" style="max-width: 200px;">
                  <p><a href="/configs/\${data.config_id}/client.conf" download>📥 Скачать конфиг</a></p>
                </div>
              \`;
            }
          } catch (error) {
            resultDiv.innerHTML = '❌ Ошибка: ' + error.message;
          }
        }
      </script>
    </body>
    </html>
  `);
});

// 2. Создание конфигурации WireGuard
app.post('/create-config', (req, res) => {
  try {
    const configId = 'client_' + Date.now();
    const clientDir = path.join(configsDir, configId);
    fs.mkdirSync(clientDir);
    
    // Генерируем ключи WireGuard
    execSync(`wg genkey | tee ${path.join(clientDir, 'private.key')} | wg pubkey > ${path.join(clientDir, 'public.key')}`);
    
    const privateKey = fs.readFileSync(path.join(clientDir, 'private.key'), 'utf8').trim();
    const publicKey = fs.readFileSync(path.join(clientDir, 'public.key'), 'utf8').trim();
    
    // Генерируем IP для клиента (10.8.0.x)
    const clientNumber = Math.floor(Math.random() * 254) + 2;
    const clientIP = `10.8.0.${clientNumber}`;
    
    // Конфигурация клиента
    const clientConfig = `[Interface]
PrivateKey = ${privateKey}
Address = ${clientIP}/24
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = SERVER_PUBLIC_KEY_HERE
Endpoint = ${req.headers.host}:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`;
    
    fs.writeFileSync(path.join(clientDir, 'client.conf'), clientConfig);
    
    res.json({
      success: true,
      config_id: configId,
      client_ip: clientIP,
      public_key: publicKey,
      config: clientConfig
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ VPN Server running on port ${PORT}`);
  console.log(`🌐 Web interface: http://localhost:${PORT}`);
});
