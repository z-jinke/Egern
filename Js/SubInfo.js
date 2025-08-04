// 2025.8.3

(async () => {
  const { url1, title1, url2, title2, icon, color, expire1, expire2 } =
    Object.fromEntries(new URLSearchParams($argument));

  if (!url1 && !url2) {
    return $done({ title: "提示", content: "未填写任何订阅链接" });
  }

  const tasks = [];
  if (url1) tasks.push(getData(url1, title1 || "订阅1", expire1));
  if (url2) tasks.push(getData(url2, title2 || "订阅2", expire2));

  const results = await Promise.all(tasks.map((p) => p.catch((e) => e)));
  $done({
    content: results.join("\n\n"),
    icon: icon || "antenna.radiowaves.left.and.right.circle.fill",
    "icon-color": color || "#28CDBB",
  });
})();

function getData(url, title, expire) {
  return new Promise((resolve, reject) => {
    $httpClient.get(
      { url, headers: { "User-Agent": "Shadowrocket" } },
      (err, resp) => {
        if (err || resp.status !== 200) {
          return resolve(`机场：${title}\n获取失败`);
        }

        const infoStr = (resp.headers["subscription-userinfo"] || "").toString();
        if (!infoStr) {
          return resolve(`机场：${title}\n未找到订阅信息`);
        }

        const info = {};
        infoStr.split(";").forEach((p) => {
          const [k, v] = p.split("=");
          if (k && v) info[k.trim()] = Number(v.trim());
        });

        const used = (info.download || 0) + (info.upload || 0);
        const total = info.total || 0;
        const remain = Math.max(total - used, 0);

        resolve(
          `机场：${title}\n流量：${bytesToSize(total)}｜${bytesToSize(remain)}\n到期：${
            expire ? formatDate(expire) : info.expire ? formatDate(info.expire) : "无信息"
          }`
        );
      }
    );
  });
}

function bytesToSize(b) {
  if (!b) return "0B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return (b / 1024 ** i).toFixed(2) + " " + u[i];
}

function formatDate(t) {
  let time = Number(t);
  if (time < 1e12) time *= 1000;
  const d = new Date(time);
  return isNaN(d) ? "无效日期" : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
