// 2025.8.2

const url = "http://api.ip2location.io/";

function countryCodeToFlagEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '';
    const OFFSET = 127397;
    return [...countryCode.toUpperCase()].map(c => String.fromCodePoint(c.charCodeAt() + OFFSET)).join('');
}

const countryMap = {
    "HK": "香港",
    "JP": "日本",
    "SG": "新加坡",
    "US": "美国",
    "KR": "韩国"
};

$httpClient.get(url, (error, response, data) => {
    if (error) {
        return $done({
            title: "节点信息",
            content: "请求错误",
            icon: "exclamationmark.triangle",
            "icon-color": "#FF9500"
        });
    }

    let jsonData;
    try {
        jsonData = JSON.parse(data);
    } catch {
        return $done({
            title: "节点信息",
            content: "解析失败",
            icon: "exclamationmark.triangle",
            "icon-color": "#FF9500"
        });
    }

    const countryCode = jsonData.country_code || "未知";
    const ip = jsonData.ip || "未知";
    const asName = jsonData.as || "未知运营商";
    const countryCN = countryMap[countryCode.toUpperCase()] || "其他地区";
    const flagEmoji = countryCodeToFlagEmoji(countryCode);

    const body = {
        title: "节点信息",
        content: `IP所在地：${ip}\n运营服务：${asName}\n节点落地：${flagEmoji} ${countryCN}`,
        icon: "globe",
        "icon-color": "#48D1CC"
    };
    $done(body);
});
