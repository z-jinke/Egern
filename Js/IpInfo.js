/**
 * 功能: 查询节点IP基本信息
 */

let url = "https://ipinfo.io/json?token=fa5efe047d9b4f";

let countryMap = {
  "HK": "香港", "TW": "台湾", "JP": "日本", "KR": "韩国", "SG": "新加坡",
  "US": "美国", "GB": "英国", "DE": "德国", "FR": "法国", "CA": "加拿大",
  "AU": "澳大利亚", "NZ": "新西兰",
  "IN": "印度", "ID": "印度尼西亚", "TH": "泰国", "VN": "越南", "MY": "马来西亚", "PH": "菲律宾",
  "RU": "俄罗斯", "UA": "乌克兰", "KZ": "哈萨克斯坦",
  "BR": "巴西", "AR": "阿根廷", "CL": "智利", "MX": "墨西哥",
  "IT": "意大利", "ES": "西班牙", "PT": "葡萄牙", "NL": "荷兰", "BE": "比利时", "CH": "瑞士", "SE": "瑞典", "NO": "挪威", "DK": "丹麦", "FI": "芬兰",
  "TR": "土耳其", "SA": "沙特阿拉伯", "AE": "阿联酋", "IL": "以色列", "EG": "埃及", "ZA": "南非"
};

let fixedIcon = "location.north.circle.fill";
let iconColor = "#2293FF";

$httpClient.get(url, (error, resp, body) => {
    let ipText = "";
    let serviceText = "";
    let country = "";
    let latlngText = "";

    if (!error && body) {
        try {
            let json = JSON.parse(body);

            if (json.country && json.country.length === 2) {
                country = countryMap[json.country.toUpperCase()] || json.country.toUpperCase();
            }
            if (json.ip) {
                ipText = `位置IP：${json.ip}`;
            }
            if (json.org) {
                let orgName = json.org.replace(/^AS\d+\s*/, "");
                let parts = orgName.split(" ");
                let serviceName = parts.slice(0, 2).join(" ");
                serviceText = `服务：${serviceName}`;
            }
            if (json.loc) {
                let locParts = json.loc.split(",");
                if (locParts.length === 2) {
                    // 这里保持你之前的顺序，经度在前，纬度在后
                    latlngText = `经纬：${locParts[1]}-${locParts[0]}`;
                }
            }
        } catch (e) {}
    }

    $done({
        title: country,
        content: `${ipText}\n${serviceText}\n${latlngText}`,
        icon: fixedIcon,
        "icon-color": iconColor
    });
});
