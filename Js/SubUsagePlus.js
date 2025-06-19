(async () => {
  try {
    const args = getArgs();
    const info = await getDataInfo(args.url);

    if (!info) return $done({});

    const resetDayLeft = args.reset_day ? getRemainingDays(parseInt(args.reset_day)) : null;
    const expireDate = args.expire || info.expire;
    const expireDaysLeft = getExpireDaysLeft(expireDate);

    const used = info.download + info.upload;
    const total = info.total;
    const content = [];

    buildNotifications(content, used, total, resetDayLeft, expireDaysLeft, expireDate);

    $done({
      title: args.title || "订阅用量",
      content: content.join("\n"),
      icon: args.icon || "tornado",
      "icon-color": args.color || "#DF4688",
    });
  } catch (error) {
    console.log(`发生错误: ${error}`);
    $done({
      title: "订阅信息获取失败",
      content: `错误信息: ${error}`,
      icon: "exclamationmark.triangle",
      "icon-color": "#CB1B45",
    });
  }
})();

function buildNotifications(content, used, total, resetDayLeft, expireDaysLeft, expireDate) {
  const remaining = total - used;
  const percentage = ((used / total) * 100).toFixed(1);

  content.push(`已用：${bytesToSize(used)}`);
  content.push(`剩余：${bytesToSize(remaining)}`);
  content.push(`使用率：${percentage}%`);

  if (resetDayLeft !== null) {
    content.push(`重置：${resetDayLeft} 天后`);
  } else {
    content.push(`重置：无信息`);
  }

  if (expireDaysLeft !== null) {
    content.push(`到期：${formatTime(expireDate)}（剩 ${expireDaysLeft} 天）`);
  } else {
    content.push(`到期：无信息`);
  }
}

function getArgs() {
  return Object.fromEntries(
    $argument
      .split("&")
      .map((item) => {
        const [key, value] = item.split("=");
        return [key, value ? decodeURIComponent(value) : null];
      })
      .filter(([key]) => key)
  );
}

function getUserInfo(url) {
  if (!url) {
    return Promise.reject("未提供有效的订阅链接");
  }

  const request = {
    headers: { "User-Agent": "Quantumult%20X" },
    url,
  };

  return new Promise((resolve, reject) => {
    $httpClient.get(request, (err, resp) => {
      if (err) return reject(`网络请求错误: ${err}`);
      if (resp.status !== 200) return reject(`服务器状态码异常: ${resp.status}`);

      const header = Object.keys(resp.headers).find(
        (key) => key.toLowerCase() === "subscription-userinfo"
      );

      if (header) {
        return resolve(resp.headers[header]);
      }

      reject("未找到流量信息头部");
    });
  });
}

async function getDataInfo(url) {
  try {
    const data = await getUserInfo(url);
    const matches = data.match(/\w+=[\d.eE+-]+/g);
    if (!matches || matches.length === 0) throw new Error("无法解析返回的数据");

    return Object.fromEntries(
      matches.map((item) => {
        const [key, value] = item.split("=");
        return [key, Number(value)];
      })
    );
  } catch (error) {
    console.log(`获取数据失败: ${error}`);
    return null;
  }
}

function getRemainingDays(resetDay) {
  if (!resetDay || resetDay < 1 || resetDay > 31) return null;

  const now = new Date();
  const today = now.getDate();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const daysInThisMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const adjustedResetDay = Math.min(resetDay, daysInThisMonth);

  if (adjustedResetDay > today) {
    return adjustedResetDay - today;
  }

  const daysInNextMonth = new Date(currentYear, currentMonth + 2, 0).getDate();
  const nextMonthResetDay = Math.min(resetDay, daysInNextMonth);

  return daysInThisMonth - today + nextMonthResetDay;
}

function getExpireDaysLeft(expire) {
  if (!expire) return null;

  const now = new Date().getTime();
  let expireTime;

  if (typeof expire === 'number' || /^[\d.]+$/.test(expire)) {
    expireTime = parseInt(expire);
    if (expireTime < 1000000000000) expireTime *= 1000;
  } else {
    expireTime = new Date(expire).getTime();
    if (isNaN(expireTime)) return null;
  }

  const daysLeft = Math.ceil((expireTime - now) / (1000 * 60 * 60 * 24));
  return daysLeft > 0 ? daysLeft : null;
}

function bytesToSize(bytes) {
  if (bytes === 0) return "0B";

  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (bytes / Math.pow(k, i)).toFixed(2) + " " + units[i];
}

function formatTime(time) {
  if (!time) return "未知日期";

  let timestamp = time;
  if (typeof time !== 'number' && /^[\d.]+$/.test(time)) {
    timestamp = parseInt(time);
  }

  if (timestamp < 1000000000000) {
    timestamp *= 1000;
  }

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "无效日期";

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    return `${year}年${month}月${day}日`;
  } catch (error) {
    console.log(`日期格式化错误: ${error}`);
    return "日期解析错误";
  }
}
