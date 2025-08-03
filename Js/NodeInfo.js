// 2024.8.3

let url = "https://api.ip2location.io";
let countryMap={"HK":"香港","AS":"美属萨摩亚","AD":"安道尔","AG":"安提瓜和巴布达","AW":"阿鲁巴","AU":"澳大利亚","AT":"奥地利","BS":"巴哈马","BH":"巴林","BB":"巴巴多斯","BR":"文莱","BE":"比利时","BM":"百慕大","CA":"加拿大","CY":"塞浦路斯","CZ":"捷克","DK":"丹麦","EE":"爱沙尼亚","FI":"芬兰","FR":"法国","GI":"直布罗陀","GL":"格陵兰","GR":"希腊","HU":"匈牙利","IS":"冰岛","IE":"爱尔兰","IL":"以色列","IT":"意大利","JP":"日本","KR":"韩国","KW":"科威特","LI":"列支敦士登","LT":"立陶宛","LU":"卢森堡","LV":"拉脱维亚","MT":"马耳他","MC":"摩纳哥","NL":"荷兰","NO":"挪威","NZ":"新西兰","OM":"阿曼","PL":"波兰","PT":"葡萄牙","QA":"卡塔尔","SA":"沙特阿拉伯","SG":"新加坡","SK":"斯洛伐克","SI":"斯洛文尼亚","ES":"西班牙","SE":"瑞典","CH":"瑞士","GB":"英国","US":"美国","AE":"阿联酋","VG":"英属维尔京群岛","VI":"美属维尔京群岛","UY":"乌拉圭","TO":"汤加","TC":"特克斯和凯科斯群岛","NC":"新喀里多尼亚","NU":"瑙鲁"};
let fixedIcon = "location.circle.fill";
let successColor = "#1EA2FF";

$httpClient.get(url, function(error, response, data) {
    let ip = "失败";
    let service = "失败";
    let countryCN = "失败";
    let flagEmoji = "";

    if (!error && response && data) {
        try {
            let jsonData = JSON.parse(data);
            if (jsonData.ip) {
                ip = jsonData.ip;
            }
            if (jsonData.as) {
                service = jsonData.as;
            }
            if (jsonData.country_code && jsonData.country_code.length === 2) {
                let countryCode = jsonData.country_code.toUpperCase();
                flagEmoji = String.fromCodePoint(countryCode.charCodeAt(0) + 127397) +
                            String.fromCodePoint(countryCode.charCodeAt(1) + 127397);
                if (countryMap[countryCode]) {
                    countryCN = countryMap[countryCode];
                } else {
                    countryCN = countryCode;
                }
            }
        } catch (e) {
            // JSON 解析失败，保持默认“失败”
        }
    }

    $done({
        title: "节点信息",
        content: "查询：" + ip + "\n服务：" + service + "\n地区：" + countryCN + flagEmoji,
        icon: fixedIcon,
        "icon-color": successColor
    });
});
