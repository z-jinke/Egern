const $ = new Env();

(async () => {
  try {
    const singleSizeMB = 5, concurrency = 4;
    const testUrl = `https://speed.cloudflare.com/__down?bytes=${singleSizeMB * 1024 * 1024}`;
    const timeoutMs = 5000;
    let totalBytes = 0;
    let finishedCount = 0;
    const timeoutPromise = new Promise(resolve => setTimeout(resolve, timeoutMs));
    const startTime = Date.now();
    const tasks = Array(concurrency).fill(0).map(() =>
      new Promise(async (resolve) => {
        try {
          await $.http.get({ url: testUrl, timeout: timeoutMs });
          totalBytes += singleSizeMB * 1024 * 1024;
          finishedCount++;
          resolve(true);
        } catch {
          resolve(false);
        }
      })
    );
    await Promise.race([
      Promise.all(tasks),
      timeoutPromise
    ]);
    const durationSec = Math.max((Date.now() - startTime) / 1000, 0.001);
    if (totalBytes === 0) throw new Error('所有请求均超时或失败');
    const speedMbps = (totalBytes * 8) / (durationSec * 1024 * 1024);
    const pingStart = Date.now();
    await Promise.race([
      $.http.get({ url: 'http://cp.cloudflare.com/generate_204', method: 'HEAD', timeout: timeoutMs }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Ping超时(>5秒)")), timeoutMs))
    ]);
    const pingDuration = Date.now() - pingStart;
    const title = '网络测速';
    const content = `速度: ${speedMbps.toFixed(2)} Mbps\n延迟: ${pingDuration} ms\n耗时: ${durationSec.toFixed(2)} 秒`;
    const iconColor = speedMbps < 50 ? '#FF4D4D' : '#66E384';
    $.done({ title, content, speedMbps, pingDuration, durationSec, icon: 'arrow.up.arrow.down', 'icon-color': iconColor });
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
        let timeoutHandle = setTimeout(() => reject(new Error('请求超时')), options.timeout || 5000);

        if (this.env.isSurge() || this.env.isLoon() || this.env.isShadowrocket() || this.env.isStash()) {
          this.env.$httpClient.get(options, (err, resp, body) => {
            clearTimeout(timeoutHandle);
            err ? reject(err) : resolve({ status: resp.status || resp.statusCode, body });
          });
        } else if (this.env.isQuanX()) {
          options.method = 'GET';
          $task.fetch(options).then(resp => {
            clearTimeout(timeoutHandle);
            resolve(resp);
          }, err => {
            clearTimeout(timeoutHandle);
            reject(err);
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
    isShadowrocket() { return typeof $rocket !== 'undefined' }
    isQuanX() { return typeof $task !== 'undefined' }
    isStash() { return typeof $environment !== 'undefined' && $environment['stash-version'] !== undefined }
    done(result = {}) {
      if (this.isSurge() || this.isLoon() || this.isShadowrocket() || this.isStash() || this.isQuanX()) $done(result)
      else process.exit(0)
    }
  })();
}
