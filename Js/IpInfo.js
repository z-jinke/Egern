// 2025.9.3

let url = "https://ipinfo.io/json?token=fa5efe047d9b4f";
let countryMap = {
  "HK": "香港🇭🇰", "TW": "台湾🇨🇳", "JP": "日本🇯🇵", "KR": "韩国🇰🇷", "SG": "新加坡🇸🇬", 
  "US": "美国🇺🇸", "GB": "英国🇬🇧", "DE": "德国🇩🇪", "FR": "法国🇫🇷", "CA": "加拿大🇨🇦",
  "AU": "澳大利亚🇦🇺", "NZ": "新西兰🇳🇿", "IT": "意大利🇮🇹", "ES": "西班牙🇪🇸",
  "NL": "荷兰🇳🇱", "SE": "瑞典🇸🇪", "CH": "瑞士🇨🇭", "BE": "比利时🇧🇪", "TH": "泰国🇹🇭",
  "MY": "马来西亚🇲🇾", "PH": "菲律宾🇵🇭", "ID": "印度尼西亚🇮🇩", "VN": "越南🇻🇳",
  "AE": "阿联酋🇦🇪", "TR": "土耳其🇹🇷", "SA": "沙特阿拉伯🇸🇦", "EG": "埃及🇪🇬",
  "MX": "墨西哥🇲🇽", "BR": "巴西🇧🇷", "AR": "阿根廷🇦🇷", "ZA": "南非🇿🇦"
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
      iconColor = successColor;
    } catch {}
  }

  $done({
    title: "节点信息",
    content: `位置：${locationStr}\n查询：${ip}\n运营：${service}`,
    icon: fixedIcon,
    "icon-color": iconColor
  });
});
