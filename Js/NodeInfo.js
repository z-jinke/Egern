let url = "https://ipinfo.io/json?token=fa5efe047d9b4f";

let countryMap = {
  "HK": "香港", "JP": "日本", "KR": "韩国", "SG": "新加坡", "TW": "台湾",
  "US": "美国", "GB": "英国", "DE": "德国", "FR": "法国"
};

let fixedIcon = "location.north.circle.fill";
let successColor = "#2293FF";
let failColor = "#FF3B30";

$httpClient.get(url, (error, resp, body) => {
  let ip = "缺少",
      service = "缺少",
      country = "缺少",
      locationStr = "缺少",
      iconColor = failColor;

  if (!error && body) {
    try {
      let json = JSON.parse(body);
      ip = json.ip || ip;
      service = json.org ? (json.org.split(" ").slice(1).join(" ") || json.org) : service;
      country = (json.country && json.country.length === 2) ? (countryMap[json.country.toUpperCase()] || json.country.toUpperCase()) : country;
      
      locationStr = country;
      if (json.loc) {
        locationStr += "｜" + json.loc.replace(",", "-");
      }      
      iconColor = successColor;
    } catch {}
  }

  $done({
    title: "节点信息",
    content: `查询：${ip}\n地理：${locationStr}\n运营：${service}`,
    icon: fixedIcon,
    "icon-color": iconColor
  });
});
