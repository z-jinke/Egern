// 2025.8.1

const $ = new Env('network-speed');

(async () => {
  try {
    const mb = 1;
    const bytes = mb * 1024 * 1024;

    let start = Date.now();
    await $.http.get({ url: `https://speed.cloudflare.com/__down?bytes=${bytes}` });
    const duration = (Date.now() - start) / 1000;
    const speedMbps = round(mb / duration * 8, 2); // Mbps

    const pingStart = Date.now();
    await $.http.get({ url: `http://cp.cloudflare.com/generate_204` });
    const ping = Date.now() - pingStart;

    const title = `网络速率`;
    const content = `速率: ${speedMbps} Mbps\n延迟: ${ping} ms\n测试耗时: ${round(duration, 2)} 秒`;
    
    const result = {
      title,
      content,
      icon: "arrow.up.arrow.down",
      "icon-color": "3cb371"
    };
    $.log(result);
    $.done(result);
  } catch (e) {
    const error = `${e.message || e}`;
    $.log(`错误: ${error}`);
    $.done({ title: '网络测速失败', content: error });
  }
})();

function round(number, precision = 0) {
  const factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

function Env(name) {
  this.name = name;
  this.http = {
    get: (options) => new Promise((resolve, reject) => {
      if (typeof $httpClient !== "undefined") {
        $httpClient.get(options, (err, resp, body) => err ? reject(err) : resolve(resp));
      } else if (typeof $task !== "undefined") {
        $task.fetch(options).then(resolve).catch(reject);
      } else {
        reject(new Error('不支持的环境'));
      }
    }),
  };
  this.log = console.log;
  this.done = (result) => {
    if (typeof $done === 'function') {
      $done(result);
    } else {
      process.exit(0);
    }
  };
}
