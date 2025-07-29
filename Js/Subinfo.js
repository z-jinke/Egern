(async () => {
  try {
    // 解析中文参数名，保持兼容
    const params = Object.fromEntries(new URLSearchParams($argument));
    const url = params["订阅链接"];
    const title = params["机场名称"];

    if (!url) return $done({ title: "错误", content: "缺少订阅链接参数" });

    const info = await getDataInfo(url);

    const used = (info.download || 0) + (info.upload || 0);
    const total = info.total || 0;
    const remaining = Math.max(total - used, 0);
    const percentage = total ? ((used / total) * 100).toFixed(1) : "0";

    const content = [
      `总计流量：${bytesToSize(total)}`,
      `剩余流量：${bytesToSize(remaining)}`,
      `使用进度：${percentage}%`,
      (expire || info.expire) ? `订阅到期：${formatDate(expire || info.expire)}` : `到期：无信息`
    ];

    $done({
      title: title || "订阅用量",
      content: content.join("\n"),
      icon: "gauge",           // 固定用苹果自带符号
      "icon-color": "#4CAF50"  // 固定绿色
    });

  } catch (err) {
    $done({
      title: "订阅信息获取失败",
      content: `错误信息: ${err}`,
      icon: "exclamationmark.triangle",
      "icon-color": "#CB1B45"
    });
  }
})();

/**
 * 获取订阅信息函数（保持不变）
 */
function getDataInfo(url) {
  return new Promise((resolve, reject) => {
    $httpClient.get({
      url,
      headers: { "User-Agent": "Shadowrocket", "Accept-Encoding": "gzip, deflate" }
    }, (err, resp) => {
      if (err || resp.status !== 200) return reject("请求失败");

      const headers = Object.fromEntries(
        Object.entries(resp.headers).map(([k, v]) => [k.toLowerCase(), v])
      );

      const infoStr = headers["subscription-userinfo"];
      if (!infoStr) return reject("未找到订阅信息");

      const info = {};
      infoStr.split(";").forEach(pair => {
        const [k, v] = pair.split("=");
        if (k && v) info[k.trim()] = Number(v);
      });

      resolve(info);
    });
  });
}

/**
 * 字节转单位，保持不变
 */
function bytesToSize(bytes) {
  if (!bytes) return "0B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + units[i];
}

/**
 * 格式化日期，保持不变
 */
function formatDate(time) {
  let t = typeof time === "string" ? parseInt(time) : time;
  if (t < 1e12) t *= 1000;
  const d = new Date(t);
  return isNaN(d) ? "无效日期" : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
