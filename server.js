// Периодически обращаемся к легальным российским ресурсам (для правдоподобности)
if (process.env.NODE_ENV === 'production') {
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
}
