// 2025.8.3

const sizeMB = 10;
const timeout = 10000;
const downloadUrl = 'https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4';
const pingUrl = 'http://www.gstatic.com/generate_204';

function httpGet(url, method = 'GET', simulateError = null) {
  return new Promise((resolve, reject) => {
    if (simulateError === 'timeout') {
      setTimeout(() => reject('请求超时'), timeout);
      return;
    }
    if (simulateError === 'fail') {
      reject('请求失败');
      return;
    }

    const options = {
      url,
      method,
      headers: {
        Range: `bytes=0-${sizeMB * 1024 * 1024 - 1}`
      }
    };

    const timer = setTimeout(() => reject('请求超时'), timeout);
    $httpClient.get(options, (err, resp, data) => {
      clearTimeout(timer);
      if (err) reject(err);
      else resolve(data);
    });
  });
}

(async () => {
  let speedResult, pingResult, durationResult;

  try {
    const start = Date.now();
    await httpGet(downloadUrl, 'GET');
    const duration = (Date.now() - start) / 1000;
    const speed = (sizeMB * 8) / duration;
    speedResult = `速度: ${speed.toFixed(2)} Mbps`;
    durationResult = `耗时: ${duration.toFixed(1)} 秒`;
  } catch (e) {
    speedResult = `速度: 测试失败 (${e.message || e})`;
    durationResult = `耗时: -`;
  }

  try {
    const pingStart = Date.now();
    await httpGet(pingUrl, 'HEAD');
    const ping = Date.now() - pingStart;
    pingResult = `延迟: ${ping} ms`;
  } catch (e) {
    pingResult = `延迟: 测试失败 (${e.message || e})`;
  }

  $done({
    title: '网络测速',
    content: `${speedResult}\n${pingResult}\n${durationResult}`,
    icon: 'arrow.up.arrow.down.circle.fill',
    'icon-color': (speedResult.includes('失败') || pingResult.includes('失败'))
      ? '#FF0000'
      : (speedResult.match(/\d+(\.\d+)?/) && parseFloat(speedResult.match(/\d+(\.\d+)?/)[0]) < 50 ? '#FFA500' : '#1BF16E')
  });
})();
