(async () => {
  try {
    const { url, title, expire } = Object.fromEntries(new URLSearchParams($argument));
    if (!url) return $done({ title: "错误", content: "缺少url参数" });

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
      icon: "gauge",
      "icon-color": "#4CAF50",  // 固定绿色
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
