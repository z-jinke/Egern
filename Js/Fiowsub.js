// 2025.9.5

(async () => {
  try {
    const args = getArgs();
    const info = await getDataInfo(args.url);

    if (!info) throw new Error("获取订阅信息失败");

    const used = info.download + info.upload;
    const total = info.total;
    const content = [`用量：${bytesToSize(used)} / ${bytesToSize(total)}`];

    // 只显示剩余天数
    const expireDaysLeft = getExpireDaysLeft(info.expire);
    if (expireDaysLeft) {
      content.push(`到期：距离剩余：${expireDaysLeft}天`);
    }

    $done({
      title: args.title,
      content: content.join("\n"),
      icon: "antenna.radiowaves.left.and.right.circle.fill",
      "icon-color": "#00E28F",
    });
  } catch (error) {
    $done({
      title: "订阅信息获取失败",
      content: `错误信息: ${error}`,
      icon: "antenna.radiowaves.left.and.right.circle.fill",
      "icon-color": "#FFD500",
    });
  }
})();

/**
 * 解析参数，仅保留 URL 和标题
 */
function getArgs() {
  const args = {};
  $argument.split("&").forEach(item => {
    const index = item.indexOf("=");
    if (index > -1) {
      const key = item.substring(0, index);
      const value = item.substring(index + 1);
      if (key === "url" || key === "title") {
        args[key] = key === "url" ? value : decodeURIComponent(value);
      }
    }
  });
  return args;
}

/**
 * 获取用户信息
 */
function getUserInfo(url) {
  if (!url) return Promise.reject("未提供有效的订阅链接");

  const request = { headers: { "User-Agent": "Quantumult%20X" }, url };
  return new Promise((resolve, reject) => {
    $httpClient.get(request, (err, resp) => {
      if (err) return reject(`网络请求错误: ${err}`);
      if (resp.status !== 200) return reject(`服务器返回非200状态码: ${resp.status}`);
      const header = Object.keys(resp.headers).find(key => key.toLowerCase() === "subscription-userinfo");
      if (header) return resolve(resp.headers[header]);
      reject("链接响应头不带有流量信息");
    });
  });
}

/**
 * 获取数据信息
 */
async function getDataInfo(url) {
  try {
    const data = await getUserInfo(url);
    const matches = data.match(/\w+=[\d.eE+-]+/g);
    if (!matches || matches.length === 0) throw new Error("无法解析返回的数据");
    return Object.fromEntries(matches.map(item => {
      const [key, value] = item.split("=");
      return [key, Number(value)];
    }));
  } catch (error) {
    console.log(`获取数据失败: ${error}`);
    return null;
  }
}

/**
 * 计算到期剩余天数
 */
function getExpireDaysLeft(expire) {
  if (!expire) return null;
  const now = new Date().getTime();
  let expireTime;

  if (typeof expire === 'number' || /^[\d.]+$/.test(expire)) {
    expireTime = parseInt(expire);
    if (expireTime < 1000000000000) expireTime *= 1000;
  } else {
    expireTime = new Date(expire).getTime();
    if (isNaN(expireTime)) return null;
  }

  const daysLeft = Math.ceil((expireTime - now) / (1000 * 60 * 60 * 24));
  return daysLeft > 0 ? daysLeft : null;
}

/**
 * 字节转换为可读大小
 */
function bytesToSize(bytes) {
  if (bytes === 0) return "0B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + units[i];
}
