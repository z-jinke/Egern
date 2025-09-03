// 2025.9.3

(async () => {
  const { url1, title1, url2, title2 } = Object.fromEntries(new URLSearchParams($argument));

  if (!url1 && !url2) {
    return $done({
      title  : "提示",
      content: "未填写任何订阅链接",
    });
  }

  const result1 = url1 ? await getData(url1, title1 || "订阅1") : "";
  const result2 = url2 ? await getData(url2, title2 || "订阅2") : "";

  const content = [result1, result2].filter(Boolean).join("\n\n");

  $done({
    content,
    icon      : "antenna.radiowaves.left.and.right.circle.fill",
    "icon-color": "#00E28F",
  });
})();

function getData(url, title) {
  return new Promise(resolve => {
    let trafficLine = "流量：无信息";
    let expireLine  = "到期：无信息";

    $httpClient.get(
      { url, headers: { "User-Agent": "Shadowrocket" } },
      (err, resp) => {
        if (err || resp.status !== 200) {
          return resolve(formatResult(title, trafficLine, expireLine));
        }

        const infoStr = (resp.headers["subscription-userinfo"] || "").toString();
        const info    = parseUserInfo(infoStr);

        if (info.total > 0) {
          const used = (info.download || 0) + (info.upload || 0);
          trafficLine = `用量：${bytesToSize(used)} ｜ ${bytesToSize(info.total)}`;
        }

        if (info.expire) {
          expireLine = `到期：${formatDate(info.expire)}`;
        }

        resolve(formatResult(title, trafficLine, expireLine));
      }
    );
  });
}

function formatResult(title, traffic, expire) {
  return `机场：${title}\n${traffic}\n${expire}`;
}

function parseUserInfo(str) {
  if (!str) return {};

  return str.split(";").reduce((acc, cur) => {
    const [k, v] = cur.split("=");
    if (k && v) acc[k.trim()] = Number(v.trim());
    return acc;
  }, {});
}

function bytesToSize(bytes) {
  if (!bytes) return "0B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const idx   = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / 1024 ** idx).toFixed(2) + " " + units[idx];
}

function formatDate(t) {
  let time = Number(t);
  if (time < 1e12) time *= 1000;

  const d = new Date(time);
  if (isNaN(d)) return "无效日期";

  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
