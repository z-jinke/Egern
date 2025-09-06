let url = "https://ipinfo.io/json?token=fa5efe047d9b4f";

let countryMap = {
  "HK":"香港","TW":"台湾","JP":"日本","KR":"韩国","SG":"新加坡",
  "US":"美国","GB":"英国","DE":"德国","FR":"法国","CA":"加拿大"
};

let fixedIcon = "location.north.circle.fill";
let successColor = "#2293FF";
let failColor = "#FF3B30";

$httpClient.get(url, (error, resp, body) => {
    let ip = " ",
        service = " ",
        country = " ",
        locationStr = " ",
        iconColor = failColor;

    if (!error && body) {
        try {
            let json = JSON.parse(body);
            ip = json.ip || ip;
            if (json.org) {
                let orgName = json.org.replace(/^AS\d+\s*/, "");
                let parts = orgName.split(" ");
                service = parts.slice(0, 2).join(" ");
            }
            if (json.country && json.country.length === 2) {
                country = countryMap[json.country.toUpperCase()] || json.country.toUpperCase();
            }
            locationStr = country;
            iconColor = successColor;
        } catch (e) {}
    }

    $done({
        title: `${locationStr}\n`,
        content: `IP地址：${ip}\n运营商：${service}`,
        icon: fixedIcon,
        "icon-color": iconColor
    });
});
