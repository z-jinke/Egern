// 2025.8.1

(async () => {
  try {
    const mb = 1;
    const bytes = mb * 1024 * 1024;
    const timeLimit = 5000;
    const startTotal = Date.now();
    let peakSpeed = 0;
    let minPing = Infinity;
    let rounds = 0;

    while ((Date.now() - startTotal) < timeLimit) {
      rounds++;

      const start = Date.now();
      try {
        await httpGet({ url: `https://speed.cloudflare.com/__down?bytes=${bytes}` }, timeLimit - (Date.now() - startTotal));
        const duration = (Date.now() - start) / 1000;
        const speed = round(mb / duration * 8, 2);
        if (speed > peakSpeed) peakSpeed = speed;
      } catch (err) {
        break;
      }

      const pingStart = Date.now();
      try {
        await httpGet({ url: `http://1.1.1.1/generate_204` }, timeLimit - (Date.now() - startTotal));
        const ping = Date.now() - pingStart;
        if (ping < minPing) minPing = ping;
      } catch (err) {
        break;
      }
    }

    const totalDuration = (Date.now() - startTotal) / 1000;

    const result = {
      title: "网络速率",
      content: `峰值速率: ${peakSpeed || '无数据'} Mbps\n最低延迟: ${minPing === Infinity ? '无数据' : minPing + ' ms'}\n总共耗时: ${round(totalDuration, 2)} 秒\n测试次数: ${rounds}`,
      icon: "arrow.up.arrow.down",
      "icon-color": "3cb371"
    };

    console.log(result);
    $done(result);

  } catch (e) {
    const error = e.message || e;
    console.log(`错误: ${error}`);
    $done({ title: '网络测速失败', content: error });
  }
})();

function httpGet(options, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('请求超时')), timeoutMs);
    $httpClient.get(options, (err, resp, body) => {
      clearTimeout(timeout);
      err ? reject(err) : resolve(resp);
    });
  });
}

function round(number, precision = 0) {
  const factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}
