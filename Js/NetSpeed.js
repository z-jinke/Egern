// 2025.8.1

const $ = new Env('cloudflare-speed');

const FILE_SIZES_MB = [1, 10, 50];
const TEST_TIMES = 2;

(async () => {
  try {
    const totalStart = Date.now();
    let allSpeeds = [];

    for (let size of FILE_SIZES_MB) {
      for (let i = 0; i < TEST_TIMES; i++) {
        const { speed, duration } = await testDownload(size);
        allSpeeds.push(speed);
        $.log(`文件 ${size}MB 第${i+1}次: ${speed} Mbps, 耗时 ${duration} 秒`);
      }
    }

    const avgSpeed = round(avg(allSpeeds), 2);
    const avgPing = round(await testPing(), 2);
    const totalDuration = round((Date.now() - totalStart) / 1000, 2);

    const result = {
      content: `平均速率: ${avgSpeed} Mbps\n测试延迟: ${avgPing} ms\n本次耗时: ${totalDuration} 秒`,
      icon: "arrow.up.arrow.down",
      "icon-color": "3cb371"
    };
    $.log(result);
    $.done(result);

  } catch (e) {
    $.done({ content: e.message || e });
  }
})();

async function testDownload(mb) {
  const bytes = mb * 1024 * 1024;
  const url = `https://speed.cloudflare.com/__down?bytes=${bytes}`;
  let start = Date.now();
  await $.http.get({ url });
  const duration = (Date.now() - start) / 1000;
  const speed = round(mb / duration * 8, 2); // Mbps
  return { speed, duration };
}

async function testPing() {
  const pingStart = Date.now();
  await $.http.get({ url: `http://cp.cloudflare.com/generate_204` });
  return Date.now() - pingStart;
}

function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function round(num, precision = 0) {
  const factor = Math.pow(10, precision);
  return Math.round(num * factor) / factor;
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
  this.done = (result) => { if (typeof $done === 'function') $done(result); };
}
