// 2025.8.3

const $ = new Env();

(async () => {
  let title = "解锁检测";
  let icon = "lock.circle.fill";        
  let iconColor = "#FF7F50";   

  let contentGPT = "";
  let contentNetflix = "";
  let contentDisney = "";

  // GPT检测
  try {
    const respGPT = await $.http.get({
      url: "https://api.openai.com/v1/models",
      headers: { "Authorization": "Bearer fake_api_key" },
      timeout: 5000
    });
    contentGPT = respGPT.status === 401 ? `OpenAI：已解锁` : `OpenAI：未解锁`;
  } catch {
    contentGPT = `OpenAI：请求失败`;
  }

  // Netflix检测
  try {
    const home = await $.http.get({ url: "https://www.netflix.com/", timeout: 5000 });
    if (home.status === 200) {
      const original = await $.http.get({ url: "https://www.netflix.com/title/81280792", timeout: 5000 });
      const region = await $.http.get({ url: "https://www.netflix.com/title/70143836", timeout: 5000 });

      if (original.status === 200 && region.status === 200) {
        contentNetflix = `Netflix：已解锁`;
      } else if (original.status === 200) {
        contentNetflix = `Netflix：半解锁`;
      } else {
        contentNetflix = `Netflix：未解锁`;
      }
    } else {
      contentNetflix = `Netflix：未解锁`;
    }
  } catch {
    contentNetflix = `Netflix：请求失败`;
  }

  // Disney+检测
  try {
    const home = await $.http.get({ url: "https://www.disneyplus.com/", timeout: 5000 });
    if (home.status === 200) {
      const movie = await $.http.get({
        url: "https://www.disneyplus.com/movies/avengers-endgame/5QG5Qk3rTQeg",
        timeout: 5000
      });

      if (movie.status === 200) {
        contentDisney = `Disney+：已解锁`;
      } else {
        contentDisney = `Disney+：半解锁`;
      }
    } else {
      contentDisney = `Disney+：未解锁`;
    }
  } catch {
    contentDisney = `Disney+：请求失败`;
  }

  const content = `${contentGPT}\n${contentNetflix}\n${contentDisney}`;
  $.done({ title, content, icon, "icon-color": iconColor });
})();

function Env() {
  class Http {
    constructor(env) { this.env = env }
    get(options) {
      if (typeof options === "string") options = { url: options };
      return new Promise((resolve, reject) => {
        let timeoutHandle = setTimeout(() => reject(new Error("请求超时")), options.timeout || 5000);
        if (this.env.isSurge() || this.env.isLoon() || this.env.isShadowrocket() || this.env.isStash()) {
          this.env.$httpClient.get(options, (err, resp, body) => {
            clearTimeout(timeoutHandle);
            err ? reject(err) : resolve({ status: resp.status || resp.statusCode, body });
          });
        } else if (this.env.isQuanX()) {
          options.method = "GET";
          $task.fetch(options).then(resp => {
            clearTimeout(timeoutHandle);
            resolve(resp);
          }, err => {
            clearTimeout(timeoutHandle);
            reject(err);
          });
        } else {
          clearTimeout(timeoutHandle);
          reject("不支持的运行环境");
        }
      });
    }
  }

  return new (class {
    constructor() {
      this.http = new Http(this);
      this.$httpClient = typeof $httpClient !== "undefined" ? $httpClient : null;
      this.$task = typeof $task !== "undefined" ? $task : null;
    }
    isSurge() { return typeof $httpClient !== "undefined" && typeof $loon === "undefined" }
    isLoon() { return typeof $loon !== "undefined" }
    isShadowrocket() { return typeof $rocket !== "undefined" }
    isQuanX() { return typeof $task !== "undefined" }
    isStash() { return typeof $environment !== "undefined" && $environment["stash-version"] !== undefined }
    done(result = {}) {
      if (this.isSurge() || this.isLoon() || this.isShadowrocket() || this.isStash() || this.isQuanX()) $done(result)
      else process.exit(0)
    }
  })();
}
