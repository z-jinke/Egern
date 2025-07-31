// 更新 2025.7.31

(async () => {
  const { url1, title1, url2, title2, icon, color, expire1, expire2 } =
    Object.fromEntries(new URLSearchParams($argument));

  if ((!url1 || url1.trim() === "") && (!url2 || url2.trim() === "")) {
    return $done({
      title: "提示",
      content: "未填写任何订阅链接",
      icon: "info.circle",
      "icon-color": "#808080",
    });
  }

  const tasks = [];
  if (url1 && url1.trim() !== "") {
    tasks.push(
      getDataInfo(url1)
        .then((info) => ({ type: 1, info }))
        .catch((err) => ({ type: 1, err }))
    );
  }
  if (url2 && url2.trim() !== "") {
    tasks.push(
      getDataInfo(url2)
        .then((info) => ({ type: 2, info }))
        .catch((err) => ({ type: 2, err }))
    );
  }

  const results = await Promise.all(tasks);
  const contents = [];

  for (const res of results) {
    const title = res.type === 1 ? (title1 || "订阅1") : (title2 || "订阅2");
    const expire = res.type === 1 ? expire1 : expire2;
    if (res.info) {
      contents.push(formatContent(res.info, title, expire));
    } else {
      contents.push(`机场名称：${title}\n获取失败：${res.err}`);
    }
  }

  $done({
    content: contents.join("\n\n"),
    icon: icon || "arrow.up.arrow.down",
    "icon-color": color || "#1E90FF",
  });
})();

function formatContent(info, title, expire) {
  const used = (info.download || 0) + (info.upload || 0);
  const total = info.total || 0;
  const remaining = Math.max(total - used, 0);
  const percentage = total ? ((used / total) * 100).toFixed(1) : "0";

  return [
    `机场名称：${title}`,
    `剩余流量：${bytesToSize(remaining)}`,
    `总计流量：${bytesToSize(total)}`,
    (expire || info.expire)
      ? `到期时间：${formatDate(expire || info.expire)}`
      : `到期时间：无信息`,
  ].join("\n");
}

function getDataInfo(url) {
  return new Promise((resolve, reject) => {
    $httpClient.get(
      {
        url,
        headers: {
          "User-Agent": "Shadowrocket",
          "Accept-Encoding": "gzip, deflate",
        },
      },
      (err, resp) => {
        if (err || resp.status !== 200) return reject("请求失败");

        const headers = Object.fromEntries(
          Object.entries(resp.headers).map(([k, v]) => [k.toLowerCase(), v])
        );

        const infoStr = headers["subscription-userinfo"];
        if (!infoStr) return reject("未找到订阅信息");

        const info = {};
        infoStr.split(";").forEach((pair) => {
          const [k, v] = pair.split("=").map((s) => s.trim());
          if (k && v) info[k] = Number(v);
        });

        resolve(info);
      }
    );
  });
}

function bytesToSize(bytes) {
  if (!bytes) return "0B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + units[i];
}

function formatDate(time) {
  let t = typeof time === "string" ? parseInt(time) : time;
  if (t < 1e12) t *= 1000;
  const d = new Date(t);
  return isNaN(d)
    ? "无效日期"
    : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
