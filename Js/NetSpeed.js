// 2025.8.1

const $ = new Env('cloudflare-speed');

(async () => {
  try {
    const maxMB = 10, maxBytes = maxMB * 1024 * 1024, timeoutMs = 5000;
    const start = Date.now();

    const downloadPromise = $.http.get({
      url: `https://speed.cloudflare.com/__down?bytes=${maxBytes}`,
      timeout: timeoutMs + 1000
    });

    const timeoutPromise = new Promise(res => setTimeout(() => res("timeout"), timeoutMs));

    const result = await Promise.race([downloadPromise, timeoutPromise]);
    const duration = (Date.now() - start) / 1000;

    const downloadedMB = result === "timeout" ? Math.min(maxMB, maxMB * (duration / (timeoutMs / 1000))) : maxMB;
    const speedMbps = round((downloadedMB / duration) * 8, 2);

    const pingStart = Date.now();
    await $.http.get({ url: `http://cp.cloudflare.com/generate_204`, timeout: 5000 });
    const ping = Date.now() - pingStart;

    $.done({
      title: `网络速率`,
      content: `速率: ${speedMbps} Mbps\n延迟: ${ping} ms\n耗时: ${round(duration, 2)} 秒`,
      icon: "arrow.up.arrow.down",
      "icon-color": "3cb371"
    });
  } catch (e) {
    $.done({ title: '网络测速失败', content: e.message || e });
  }
})();

function round(num, precision = 0) {
  const factor = 10 ** precision;
  return Math.round(num * factor) / factor;
}

function Env(name) {
  this.name = name;
  this.http = {
    get: (opts) => new Promise((resolve, reject) => {
      if (typeof $httpClient !== "undefined") {
        $httpClient.get(opts, (err, resp) => err ? reject(err) : resolve(resp));
      } else if (typeof $task !== "undefined") {
        $task.fetch(opts).then(resolve).catch(reject);
      } else {
        reject(new Error('不支持的环境'));
      }
    })
  };
  this.done = (result) => { if (typeof $done === 'function') $done(result); };
}
