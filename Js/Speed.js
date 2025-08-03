const $ = new Env();

(async () => {
  try {
    const sizeMB = 30;
    const timeout = 10000;
    const url = `https://speed.cloudflare.com/__down?bytes=${sizeMB * 1024 * 1024}`;
    const warmupUrl = `https://speed.cloudflare.com/__down?bytes=1024`;
    
    for (let i = 0; i < 1; i++) {
      try {
        await $.http.get({ url: warmupUrl, timeout: 3000 });
      } catch {}
    }

    const start = Date.now();
    await $.http.get({ url, timeout });
    const durationSec = (Date.now() - start) / 1000;

    const speedMbps = (sizeMB * 8) / durationSec;

    let pings = [];
    for (let i = 0; i < 3; i++) {
      const pingStart = Date.now();
      try {
        await $.http.get({ url: 'http://www.gstatic.com/generate_204', method: 'HEAD', timeout });
        pings.push(Date.now() - pingStart);
      } catch {}
    }
    if (pings.length === 0) throw new Error("Ping全部失败");
    const bestPing = Math.min(...pings);

    const content = `速度: ${speedMbps.toFixed(2)} Mbps\n延迟: ${bestPing} ms\n耗时: ${durationSec.toFixed(1)}秒钟完成`;

    $.done({
      title: '网络测速',
      content,
      icon: 'arrow.up.arrow.down.circle.fill',
      'icon-color': speedMbps < 50 ? '#FF4D4D' : '#66E384'
    });

  } catch (e) {
    $.done({ title: '测速失败', content: e.message });
  }
})();

function Env() {
  class Http {
    constructor(env) { this.env = env }
    get(opt) {
      if (typeof opt === "string") opt = { url: opt };
      return new Promise((res, rej) => {
        const timer = setTimeout(() => rej("请求超时"), opt.timeout || 6000);
        if (this.env.isSurge() || this.env.isStash()) {
          this.env.$httpClient.get(opt, (err, resp) => {
            clearTimeout(timer);
            err ? rej(err) : res({ status: resp.status });
          });
        } else {
          clearTimeout(timer);
          rej("不支持的环境");
        }
      });
    }
  }
  return new class {
    constructor() {
      this.http = new Http(this);
      this.$httpClient = typeof $httpClient !== "undefined" ? $httpClient : null;
    }
    isSurge() { return typeof $httpClient !== "undefined" && typeof $loon === "undefined" }
    isLoon() { return typeof $loon !== "undefined" }
    isStash() { return typeof $environment !== "undefined" && $environment["stash-version"] }
    done(result = {}) {
      if (this.isSurge() || this.isLoon() || this.isStash()) $done(result);
      else process.exit(0);
    }
  }
}
