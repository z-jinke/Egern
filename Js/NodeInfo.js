let url = "https://ipinfo.io/json?token=fa5efe047d9b4f";
let testUrl = "https://speed.cloudflare.com/__down?bytes=9000000";

let countryMap = {
  "HK":"香港","JP":"日本","KR":"韩国","SG":"新加坡","TW":"台湾","MO":"澳门",
  "CN":"中国","US":"美国","CA":"加拿大","GB":"英国","DE":"德国","FR":"法国",
  "NL":"荷兰","CH":"瑞士","IT":"意大利","ES":"西班牙","SE":"瑞典","NO":"挪威",
  "FI":"芬兰","DK":"丹麦","PL":"波兰","RU":"俄罗斯","IN":"印度","ID":"印度尼西亚",
  "TH":"泰国","MY":"马来西亚","AU":"澳大利亚","NZ":"新西兰","AE":"阿联酋",
  "SA":"沙特阿拉伯","BR":"巴西","AR":"阿根廷","MX":"墨西哥"
};

let fixedIcon = "location.north.circle.fill";
let successColor = "#499FFF";
let failColor = "#FF3B30";

function toMbps(bytes, ms) {
  if (!bytes || !ms) return "未知";
  let bits = bytes * 8;
  let speed = (bits / (ms / 1000)) / 1024 / 1024;
  return speed >= 1000 ? (speed / 1000).toFixed(2) + " Gbps" : speed.toFixed(2) + " Mbps";
}

let start = Date.now();
let finished = false;

let globalTimeout = setTimeout(() => {
  if (!finished) {
    finished = true;
    getIPInfo("测速超时", failColor);
  }
}, 10000);

$httpClient.get({ url: testUrl, timeout: 10000 }, function(error, response, data) {
  if (finished) return;
  finished = true;
  clearTimeout(globalTimeout);

  if (error || !data) {
    getIPInfo("测速失败", failColor);
    return;
  }

  let ms = Date.now() - start;
  let speed = toMbps(data.length, ms);
  let delay = speed; 

  getIPInfo(delay, successColor);
});

function getIPInfo(delay, iconColor) {
  $httpClient.get(url, function(error, response, data) {
    let ip = "失败";
    let service = "失败";
    let countryCN = "失败";

    if (!error && response && data) {
      try {
        let jsonData = JSON.parse(data);
        if (jsonData.ip) ip = jsonData.ip;
        if (jsonData.org) {
          service = jsonData.org.replace(/^AS\d+\s+/, "");
        } else {
          service = "未知运营商";
        }
        if (jsonData.country && jsonData.country.length === 2) {
          let countryCode = jsonData.country.toUpperCase();
          countryCN = countryMap[countryCode] || countryCode;
        }
      } catch (e) {
        iconColor = failColor;
      }
    } else {
      iconColor = failColor;
    }

    if (ip === "失败") iconColor = failColor;

    $done({
      title: "节点信息",
      content: "查询：" + ip +
               "\n国家：" + countryCN +
               "\n速度：" + delay +
               "\n运营：" + service,
      icon: fixedIcon,
      "icon-color": iconColor
    });
  });
}
