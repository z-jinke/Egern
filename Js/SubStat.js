(async () => {
  try {
    const { url, title, icon, color, expire } = getArgs();
    const { info, dateHeader } = await getDataInfo(url);
    if (!info) return $done({});

    const used = (info.download || 0) + (info.upload || 0);
    const total = info.total || 0;
    const remaining = total - used;
    const percentage = total ? ((used / total) * 100).toFixed(1) : "0";

    const content = [
      dateHeader ? `更新时间：${formatTime(new Date(dateHeader).getTime())}` : `更新时间：无信息`,
      `使用进度：${percentage}%`,
      `已用流量：${bytesToSize(used)}`,
      `剩余流量：${bytesToSize(remaining >= 0 ? remaining : 0)}`,
      `总计流量：${bytesToSize(total)}`,
      expire || info.expire ? `订阅到期：${formatTime(expire || info.expire)}` : `到期：无信息`
    ];

    $done({
      title: title || "订阅用量",
      content: content.join("\n"),
      icon: icon || "tornado",
      "icon-color": color || "#DF4688",
    });

  } catch (err) {
    console.log("错误:", err);
    $done({
      title: "订阅信息获取失败",
      content: `错误信息: ${err}`,
      icon: "exclamationmark.triangle",
      "icon-color": "#CB1B45",
    });
  }
})();

// 解析参数
function getArgs() {
  return Object.fromEntries(new URLSearchParams($argument));
}

// 获取订阅信息与响应时间
async function getDataInfo(url) {
  const headers = { "User-Agent": "Shadowrocket" };
  return new Promise((resolve, reject) => {
    $httpClient.get({ url, headers }, (err, resp) => {
      if (err || resp.status !== 200) return reject("请求失败");

      const dateHeader = resp.headers["Date"] || resp.headers["date"];

      const infoHeader = Object.entries(resp.headers).find(([k]) =>
        k.toLowerCase() === "subscription-userinfo"
      );
      if (!infoHeader) return reject("未找到订阅信息");

      const pairs = infoHeader[1].match(/\w+=[\d.eE+-]+/g);
      if (!pairs) return reject("无法解析订阅数据");

      const info = Object.fromEntries(pairs.map(i => i.split("=").map((v, i) => i ? +v : v)));
      resolve({ info, dateHeader });
    });
  });
}

// 流量格式化
function bytesToSize(bytes) {
  if (bytes === 0) return "0B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + units[i];
}

// 格式化时间戳或日期对象
function formatTime(time) {
  let t = typeof time === "string" ? parseInt(time) : time;
  if (t < 1e12) t *= 1000;
  const d = new Date(t);
  return isNaN(d) ? "无效日期" : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function pad(n) {
  return n < 10 ? "0" + n : n;
}
