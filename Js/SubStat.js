(async () => {
  try {
    const { url, title, icon, color, expire } = getArgs(); // 不再读取 reset_day
    const info = await getDataInfo(url);
    if (!info) return $done({});

    const used = (info.download || 0) + (info.upload || 0);
    const total = info.total || 0;
    const remaining = total - used;
    const percentage = total ? ((used / total) * 100).toFixed(1) : "0";

    const content = [
      `使用进度：${percentage}%`,
      `已用流量：${bytesToSize(used)}`,
      `剩余流量：${bytesToSize(remaining >= 0 ? remaining : 0)}`
    ];

    if ("reset_day" in info) {
      content.push(`重置日期：${getRemainingDays(info.reset_day)} 天后`);
    }

    content.push(
      expire || info.expire
        ? `订阅到期：${formatTime(expire || info.expire)}`
        : `到期：无信息`
    );

    $done({
      title: title || "订阅用量",
      content: content.join("\n"),
      icon: icon || "tornado",
      "icon-color": color || "#DF4688"
    });

  } catch (err) {
    console.log("错误:", err);
    $done({
      title: "订阅信息获取失败",
      content: `错误信息: ${err}`,
      icon: "exclamationmark.triangle",
      "icon-color": "#CB1B45"
    });
  }
})();

// 解析参数
function getArgs() {
  return Object.fromEntries(new URLSearchParams($argument));
}

// 请求订阅数据（伪装为 Quantumult X）
async function getDataInfo(url) {
  const headers = {
    "User-Agent": "Quantumult X",
    "X-Device-Model": "iPhone13,2",
    "X-OS-Version": "16.5",
    "X-App-Version": "1.1.6"
  };

  return new Promise((resolve, reject) => {
    $httpClient.get({ url, headers }, (err, resp) => {
      if (err || resp.status !== 200) return reject("请求失败");

      const info = Object.entries(resp.headers).find(([k]) =>
        k.toLowerCase() === "subscription-userinfo"
      );
      if (!info) return reject("未找到订阅信息");

      const pairs = info[1].match(/\w+=[\d.eE+-]+/g);
      if (!pairs) return reject("无法解析订阅数据");

      resolve(Object.fromEntries(pairs.map(i => {
        const [k, v] = i.split("=");
        return [k, +v];
      })));
    });
  });
}

// 计算距离下次重置还有几天
function getRemainingDays(day) {
  const now = new Date();
  const today = now.getDate();
  const daysInThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const nextMonthDays = new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate();
  const resetDay = Math.min(day, today < day ? daysInThisMonth : nextMonthDays);
  return today < day ? day - today : daysInThisMonth - today + resetDay;
}

// 格式化流量单位
function bytesToSize(bytes) {
  if (bytes === 0) return "0B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + units[i];
}

// 格式化时间戳
function formatTime(time) {
  let t = typeof time === "string" ? parseInt(time) : time;
  if (t < 1e12) t *= 1000;
  const d = new Date(t);
  return isNaN(d) ? "无效日期" : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
