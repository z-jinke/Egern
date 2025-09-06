/**
 * 作者: zjinke
 * 功能: 查查询节点IP基本信息
 */

let url = "https://ipinfo.io/json?token=fa5efe047d9b4f";

let countryMap = {
  "HK":"香港","TW":"台湾","JP":"日本","KR":"韩国","SG":"新加坡",
  "US":"美国","GB":"英国","DE":"德国","FR":"法国","CA":"加拿大"
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
                ipText = `IP地址：${json.ip}`;
            }
            if (json.org) {
                let orgName = json.org.replace(/^AS\d+\s*/, "");
                let parts = orgName.split(" ");
                let serviceName = parts.slice(0, 2).join(" ");
                serviceText = `运营商：${serviceName}`;
            }
            if (json.loc) {
                let locParts = json.loc.split(",");
                if (locParts.length === 2) {
                    latlngText = `经纬度：${locParts[1]}-${locParts[0]}`;
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
