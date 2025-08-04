let url = "https://ipinfo.io/json?token=fa5efe047d9b4f";
let testUrl = "https://www.google.com/generate_204";

let countryMap = {
  "HK":"香港","JP":"日本","KR":"韩国","SG":"新加坡","TW":"台湾","MO":"澳门",
  "CN":"中国","US":"美国","CA":"加拿大","GB":"英国","DE":"德国","FR":"法国",
  "NL":"荷兰","CH":"瑞士","IT":"意大利","ES":"西班牙","SE":"瑞典","NO":"挪威",
  "FI":"芬兰","DK":"丹麦","PL":"波兰","RU":"俄罗斯","IN":"印度","ID":"印度尼西亚",
  "TH":"泰国","MY":"马来西亚","AU":"澳大利亚","NZ":"新西兰","AE":"阿联酋",
  "SA":"沙特阿拉伯","BR":"巴西","AR":"阿根廷","MX":"墨西哥"
};

let fixedIcon = "location.north.circle.fill";
let successColor = "#1EA2FF";
let failColor = "#FF3B30";
let start = Date.now();

$httpClient.get(testUrl, function(err, resp, body) {
  let delay = "超时";
  if (!err && resp && resp.status === 204) {
    delay = (Date.now() - start) + "ms";
  }

  $httpClient.get(url, function(error, response, data) {
    let ip = "失败";
    let service = "失败";
    let countryCN = "失败";
    let flagEmoji = "";
    let iconColor = successColor;

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
          flagEmoji = String.fromCodePoint(countryCode.charCodeAt(0) + 127397) +
                      String.fromCodePoint(countryCode.charCodeAt(1) + 127397);
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
               "\n国家：" + countryCN + flagEmoji +
               "\n延迟：" + delay +
               "\n运营：" + service,
      icon: fixedIcon,
      "icon-color": iconColor 
    });
  });
});
