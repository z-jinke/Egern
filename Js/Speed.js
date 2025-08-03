const $ = new Env();

(async () => {
  try {
    const singleSizeMB = 5;
    const concurrency = 3;
    const testDuration = 5000;
    const timeoutMs = 6000;
    const maxBytes = 200 * 1024 * 1024;
    const testUrl = `https://speed.cloudflare.com/__down?bytes=${singleSizeMB * 1024 * 1024}`;

    let bestSpeed = 0;
    let bestRequests = 0;
    let pingResults = [];

    for (let round = 0; round < 2; round++) {
      let totalBytes = 0;
      let requestCount = 0;
      const startTime = Date.now();
      const worker = async () => {
        while (Date.now() - startTime < testDuration && totalBytes < maxBytes) {
          try {
            await $.http.get({ url: testUrl, timeout: timeoutMs });
            totalBytes += singleSizeMB * 1024 * 1024;
            requestCount++;
          } catch {}
        }
      };

      const tasks = Array(concurrency).fill(0).map(() => worker());
      await Promise.race([
        Promise.allSettled(tasks),
        new Promise(resolve => setTimeout(resolve, testDuration))
      ]);

      if (totalBytes > 0) {
        const durationSec = (Date.now() - startTime) / 1000;
        const speedMbps = (totalBytes * 8) / (durationSec * 1024 * 1024);
        if (speedMbps > bestSpeed) {
          bestSpeed = speedMbps;
          bestRequests = requestCount;
        }
      }

      for (let i = 0; i < 3; i++) {
        const pingStart = Date.now();
        try {
          await Promise.race([
            $.http.get({ url: 'http://www.gstatic.com/generate_204', method: 'HEAD', timeout: timeoutMs }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Ping超时(>6秒)")), timeoutMs))
          ]);
          pingResults.push(Date.now() - pingStart);
        } catch {}
      }
    }

    if (bestSpeed === 0) throw new Error('测速期间无成功下载');
    if (pingResults.length === 0) throw new Error('Ping全部失败');

    const bestPing = Math.min(...pingResults);
    const title = '网络测速';
    const content = `速度: ${bestSpeed.toFixed(2)} Mbps\n延迟: ${bestPing} ms\n请求: ${bestRequests}个完成`;
    const iconColor = bestSpeed < 50 ? '#FF4D4D' : '#66E384';
    $.done({ title, content, bestSpeed, bestPing, bestRequests, icon: 'arrow.up.arrow.down.circle.fill', 'icon-color': iconColor });

  } catch (e) {
    $.done({ title: '测速失败', content: e.message || e.toString() });
  }
})();

function Env() {
  class Http {
    constructor(env) { this.env = env }
    get(options) {
      if (typeof options === 'string') options = { url: options };
      return new Promise((resolve, reject) => {
        let timeoutHandle = setTimeout(() => reject(new Error('请求超时')), options.timeout || 6000);
        if (this.env.isSurge() || this.env.isStash()) {
          this.env.$httpClient.get(options, (err, resp) => {
            clearTimeout(timeoutHandle);
            err ? reject(err) : resolve({ status: resp.status || resp.statusCode });
          });
        } else {
          clearTimeout(timeoutHandle);
          reject('不支持的运行环境');
        }
      });
    }
  }

  return new (class {
    constructor() {
      this.http = new Http(this);
      this.$httpClient = typeof $httpClient !== 'undefined' ? $httpClient : null;
      this.$task = typeof $task !== 'undefined' ? $task : null;
    }
    isSurge() { return typeof $httpClient !== 'undefined' && typeof $loon === 'undefined' }
    isLoon() { return typeof $loon !== 'undefined' }
    isShadowrocket() { return false }
    isQuanX() { return false }
    isStash() { return typeof $environment !== 'undefined' && $environment['stash-version'] !== undefined }
    done(result = {}) {
      if (this.isSurge() || this.isLoon() || this.isStash()) $done(result)
      else process.exit(0)
    }
  })();
}
