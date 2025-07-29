// 主函数：获取订阅信息并显示
(async () => {
  try {
    // 解析参数
    const { url, title, icon, color, expire } = Object.fromEntries(new URLSearchParams($argument));
    if (!url) return $done({ title: "错误", content: "缺少url参数" });

    // 获取订阅信息
    const info = await getDataInfo(url);

    // 计算用量
    const used = (info.download || 0) + (info.upload || 0);
    const total = info.total || 0;
    const remaining = Math.max(total - used, 0);
    const percentage = total ? ((used / total) * 100).toFixed(1) : "0";

    // 拼接展示内容
    const content = [
      `总计流量：${bytesToSize(total)}`,
      `剩余流量：${bytesToSize(remaining)}`,
      `使用进度：${percentage}%`,
      (expire || info.expire) ? `订阅到期：${formatDate(expire || info.expire)}` : `到期：无信息`
    ];

    // 输出结果
    $done({
      title: title || "订阅用量",
      content: content.join("\n"),
      icon: icon || "server.rack",
      "icon-color": color || "#1E90FF",
    });

  } catch (err) {
    // 异常处理
    $done({
      title: "订阅信息获取失败",
      content: `错误信息: ${err}`,
      icon: "exclamationmark.triangle",
      "icon-color": "#FF4500",
    });
  }
})();

/**
 * 获取订阅信息
 * @param {string} url
 * @returns {Promise<Object>}
 */
function getDataInfo(url) {
  return new Promise((resolve, reject) => {
    $httpClient.get({
      url,
      headers: { "User-Agent": "Shadowrocket", "Accept-Encoding": "gzip, deflate" }
    }, (err, resp) => {
      if (err || resp.status !== 200) return reject("请求失败");

      // 将响应头键名转小写
      const headers = Object.fromEntries(
        Object.entries(resp.headers).map(([k, v]) => [k.toLowerCase(), v])
      );

      // 从响应头中取订阅用量信息
      const infoStr = headers["subscription-userinfo"];
      if (!infoStr) return reject("未找到订阅信息");

      // 解析 key=value 格式的数据
      const info = {};
      infoStr.split(";").forEach(pair => {
        const [k, v] = pair.split("=").map(s => s.trim());
        if (k && v) info[k] = Number(v);
      });

      resolve(info);
    });
  });
}

/**
 * 字节数转可读单位
 */
function bytesToSize(bytes) {
  if (!bytes) return "0B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + units[i];
}

/**
 * 格式化日期（仅显示年月日）
 */
function formatDate(time) {
  let t = typeof time === "string" ? parseInt(time) : time;
  if (t < 1e12) t *= 1000; // 秒转毫秒
  const d = new Date(t);
  return isNaN(d) ? "无效日期" : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
