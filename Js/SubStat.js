(async () => {
  try {
    const { url, title, icon, color, expire } = Object.fromEntries(new URLSearchParams($argument));
    if (!url) return $done({ title: "错误", content: "缺少url参数" });

    const { info, dateHeader } = await getDataInfo(url);

    const used = (info.download || 0) + (info.upload || 0);
    const total = info.total || 0;
    const remaining = total - used;
    const percentage = total ? ((used / total) * 100).toFixed(1) : "0";

    const content = [
      dateHeader ? `更新时间：${formatTime(new Date(dateHeader).getTime(), true)}` : `更新时间：无信息`,
      `总计流量：${bytesToSize(total)}`,
      `剩余流量：${bytesToSize(remaining >= 0 ? remaining : 0)}`,
      `使用进度：${percentage}%`,
      expire || info.expire ? `订阅到期：${formatTime(expire || info.expire, false)}` : `到期：无信息`
    ];

    $done({
      title: title || "订阅用量",
      content: content.join("\n"),
      icon: icon || "tornado",
      "icon-color": color || "#DF4688",
    });

  } catch (err) {
    $done({
      title: "订阅信息获取失败",
      content: `错误信息: ${err}`,
      icon: "exclamationmark.triangle",
      "icon-color": "#CB1B45",
    });
  }
})();

/**
 * 请求订阅信息并解析
 * @param {string} url 订阅链接
 * @returns {Promise<{info: Object, dateHeader: string}>}
 */
function getDataInfo(url) {
  const headers = {
    "User-Agent": "Shadowrocket",
    "Accept-Encoding": "gzip, deflate"
  };

  return new Promise((resolve, reject) => {
    $httpClient.get({ url, headers }, (err, resp) => {
      if (err || resp.status !== 200) return reject("请求失败");

      // 将响应头全部转为小写键名，方便统一处理
      const lowerHeaders = {};
      for (const key in resp.headers) {
        lowerHeaders[key.toLowerCase()] = resp.headers[key];
      }

      const dateHeader = lowerHeaders["date"];
      const infoStr = lowerHeaders["subscription-userinfo"];
      if (!infoStr) return reject("未找到订阅信息");

      // 解析 key=value 形式的订阅信息
      const info = {};
      infoStr.split(";").forEach(pair => {
        const [k, v] = pair.split("=");
        if (k && v) info[k.trim()] = Number(v);
      });

      resolve({ info, dateHeader });
    });
  });
}

/**
 * 将字节数格式化为可读单位
 * @param {number} bytes
 * @returns {string}
 */
function bytesToSize(bytes) {
  if (bytes === 0) return "0B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + units[i];
}

/**
 * 格式化时间
 * @param {number|string} time 时间戳，秒或毫秒
 * @param {boolean} showTime 是否显示时分
 * @returns {string}
 */
function formatTime(time, showTime = false) {
  let t = typeof time === "string" ? parseInt(time) : time;
  if (t < 1e12) t *= 1000; // 统一成毫秒
  const d = new Date(t);
  if (isNaN(d)) return "无效日期";

  const dateStr = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  if (!showTime) return dateStr;

  return `${dateStr} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 数字补零
 * @param {number} n
 * @returns {string}
 */
function pad(n) {
  return n < 10 ? "0" + n : n;
}
