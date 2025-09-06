/**
 * 引用：https://github.com/cc63/Surge/raw/refs/heads/main/Module/Panel/Sub-info/Moore/Sub-info.js
 * 功能: 自用修改版订阅流量监控脚本（增加使用进度百分比趣味表情）
 */

(async () => {
  try {
    const args = getArgs();
    const info = await getDataInfo(args.url);

    if (!info) throw new Error("获取订阅信息失败");

    const used = info.download + info.upload;
    const total = info.total;

    const expireInfo = info.expire ? getExpireInfo(info.expire) : null;
    const resetInfo = args.resetDay ? getResetInfo(args.resetDay) : null;

    const percent = total > 0 ? Math.round((used / total) * 100) : 0;
    let emoji = "🥰";
    if (percent >= 50 && percent < 60) emoji = "😐";
    else if (percent >= 60 && percent < 80) emoji = "😩";
    else if (percent >= 80 && percent < 99) emoji = "🥵";

    const content = [
      `进度：${percent} % ${emoji}`,
      `流量：${bytesToSize(total)}｜${bytesToSize(used)}`,
      expireInfo ? `到期：${expireInfo.date}` : null,
      resetInfo ? `距离流量重置剩余${resetInfo.days}天` : null
    ].filter(Boolean);

    $done({
      title: args.title || "订阅流量",
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

function getArgs() {
  const args = {};
  $argument.split("&").forEach(item => {
    const index = item.indexOf("=");
    if (index > -1) {
      const key = item.substring(0, index);
      const value = item.substring(index + 1);
      if (key === "url" || key === "title" || key === "resetDay") {
        args[key] = decodeURIComponent(value);
      }
    }
  });
  return args;
}

function getUserInfo(url) {
  if (!url) return Promise.reject("未提供有效订阅链接");

  const request = { headers: { "User-Agent": "Quantumult%20X" }, url };
  return new Promise((resolve, reject) => {
    $httpClient.get(request, (err, resp) => {
      if (err) return reject(`网络请求错误: ${err}`);
      if (resp.status !== 200) return reject(`服务器返回非200状态码: ${resp.status}`);
      const header = Object.keys(resp.headers).find(key => key.toLowerCase() === "subscription-userinfo");
      if (header) return resolve(resp.headers[header]);
      reject("响应头没有流量信息");
    });
  });
}

async function getDataInfo(url) {
  try {
    const data = await getUserInfo(url);
    const matches = data.match(/\w+=[\d.eE+-]+/g);
    if (!matches || matches.length === 0) throw new Error("无法解析返回数据");
    return Object.fromEntries(matches.map(item => {
      const [key, value] = item.split("=");
      return [key, Number(value)];
    }));
  } catch (error) {
    console.log(`获取数据失败: ${error}`);
    return null;
  }
}

function getExpireInfo(expire) {
  if (!expire) return null;

  let expireTime;

  if (typeof expire === 'number' || /^[\d.]+$/.test(expire)) {
    expireTime = parseInt(expire);
    if (expireTime < 1000000000000) expireTime *= 1000;
  } else {
    expireTime = new Date(expire).getTime();
    if (isNaN(expireTime)) return null;
  }

  const date = new Date(expireTime);
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}月${String(date.getDate()).padStart(2, "0")}号`;

  return { date: dateStr };
}

function getResetInfo(resetDay) {
  if (!resetDay) return null;
  const now = new Date();
  const day = parseInt(resetDay);
  if (isNaN(day) || day < 1 || day > 31) return null;

  let nextReset = new Date(now.getFullYear(), now.getMonth(), day);
  if (now.getDate() >= day) {
    nextReset = new Date(now.getFullYear(), now.getMonth() + 1, day);
  }

  const daysLeft = Math.ceil((nextReset - now) / (1000 * 60 * 60 * 24));
  return { days: daysLeft };
}

function bytesToSize(bytes) {
  if (bytes === 0) return "0B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + units[i];
}
