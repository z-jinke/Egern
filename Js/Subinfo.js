// 主函数：获取多个订阅信息并显示
(async () => {
  try {
    const params = Object.fromEntries(new URLSearchParams($argument));
    const subs = [
      { url: params.url1, title: params.title1 || "订阅1" },
      { url: params.url2, title: params.title2 || "订阅2" },
      { url: params.url3, title: params.title3 || "订阅3" },
    ].filter(s => s.url); // 只保留有 URL 的订阅

    if (subs.length === 0) {
      return $done({ title: "错误", content: "缺少订阅链接参数" });
    }

    const results = await Promise.all(
      subs.map(s =>
        getDataInfo(s.url)
          .then(info => ({ ...s, info }))
          .catch(err => ({ ...s, error: err }))
      )
    );

    const content = results.map(res => {
      if (res.error) {
        return `【${res.title}】\n获取失败 (${res.error})`;
      }
      const used = (res.info.download || 0) + (res.info.upload || 0);
      const total = res.info.total || 0;
      const remaining = Math.max(total - used, 0);
      const percentage = total ? ((used / total) * 100).toFixed(1) : "0";
      return [
        `【${res.title}】`,
        `总计：${bytesToSize(total)}`,
        `剩余：${bytesToSize(remaining)}`,
        `进度：${percentage}%`,
        res.info.expire ? `到期：${formatDate(res.info.expire)}` : `到期：无信息`
      ].join("\n");
    });

    $done({
      title: "多订阅面板",
      content: content.join("\n\n"),
      icon: "network",
      "icon-color": "#1E90FF",
    });

  } catch (err) {
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
 * 格式化日期
 */
function formatDate(time) {
  let t = typeof time === "string" ? parseInt(time) : time;
  if (t < 1e12) t *= 1000;
  const d = new Date(t);
  return isNaN(d) ? "无效日期" : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
