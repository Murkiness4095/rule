# sing-box 完整分流版（*-full.json）与 Sub-Store 生成说明

本目录的 `<平台>-full.json` 把
[powerfullz/override-rules](https://github.com/powerfullz/override-rules) 的 `convert.min.js`
那套**完整组结构**迁到了 sing-box：**23 个节点组 + 26 个策略组 + 46 条分流规则**。
原来的 `momo.json`、`linux.json`、`windows.json`、`iphone.json`、`reF1nd.json`、
`linux.json` 等**一字未改**，可以继续照旧使用。

| 文件 | 对应原版 | 节点来源 | 需要 sub-store 填充 |
| --- | --- | --- | --- |
| `momo-full.json` | `momo.json` | 空 outbound 占位 | 是 |
| `linux-full.json` | `linux.json` | 空 outbound 占位 | 是 |
| `windows-full.json` | `windows.json` | 空 outbound 占位 | 是 |
| `iphone-full.json` | `iphone.json` | 空 outbound 占位 | 是 |
| `nixos-full.json` | `linux.json` | 空 outbound 占位 | 是 |
| `reF1nd-full.json` | `reF1nd.json` | `providers` + `use_all_providers` | 否 |

> `linux_mini` 原版是「纯自建节点专用」，只有 2 个写死的自建节点，没有节点组概念，
> 本轮没有为它生成 `-full` 版本。

## 一、面板上会看到的组

### 节点组（23 个）

`香港节点` `澳门节点` `台湾节点` `新加坡节点` `日本节点` `韩国节点` `美国节点`
`加拿大节点` `英国节点` `澳大利亚节点` `德国节点` `法国节点` `俄罗斯节点` `泰国节点`
`印度节点` `马来西亚节点` `阿根廷节点` `芬兰节点` `埃及节点` `菲律宾节点` `土耳其节点`
`乌克兰节点`，外加 `低倍率节点`、`自动选择`(urltest)、`故障转移`(urltest)、`手动选择`。

地区节点名匹配正则照搬 `convert.min.js` 的地区表，含国家名、城市名、IATA 三字码、
emoji 国旗，例如香港匹配 `香港|港|\bHK\b|Hong ?Kong|🇭🇰`。
`低倍率节点` 匹配 `0\.[0-5]|低倍率|省流|实验性`。

### 策略组（26 个）

`选择代理` `静态资源` `加密货币` `金融服务` `AI服务` `哔哩哔哩` `Youtube` `Telegram`
`Xbox` `Github` `Netflix` `Twitch` `Spotify` `巴哈姆特` `PikPak网盘` `Twitter`
`新浪微博` `Truth Social` `E-Hentai` `TikTok` `苹果服务` `微软服务` `谷歌服务`
`广告拦截` `搜狗输入法`，加上 `漏网之鱼` 与 `GLOBAL`。

### 分流规则（46 条）

顺序照抄 `convert.min.js` 的 `q()`：广告拦截 → 搜狗输入 → Truth Social → 静态资源 →
加密货币 → 金融 → AI → 哔哩哔哩 → YouTube → Telegram(域名+IP) → Xbox → Github →
Netflix(域名+IP) → Twitch → Spotify → 巴哈姆特 → PikPak → Twitter → 微博 →
E-Hentai → TikTok → GFWList → Steam/FCM/Google Play 国内 CDN 修复直连 →
苹果/微软/谷歌 → `geosite-geolocation-!cn` 兜底 → `geoip-cn` 直连。

外加 mihomo 首条那条 QUIC 拦截：`geosite-geolocation-!cn` 且 `port 443` 且 `network udp`
一律 reject，逼浏览器回落 TCP。

> ⚠️ **面板的「代理」页只渲染 outbound（节点组/策略组），不显示 route 规则。**
> 要看分流规则得开 Clash API 的 `/rules`，或在连接详情里看命中了哪条。

## 二、规则集从哪来

分三处：

* **geosite / geoip**：`SagerNet/sing-geosite`、`SagerNet/sing-geoip`、
  `MetaCubeX/meta-rules-dat` 的 `.srs` 二进制包，`format: binary` 直接远程拉。
* **Clash 格式的自定义规则集**（广告、TikTok、E-Hentai、GFWList、CDN 等共 12 个）：
  sing-box 不吃 `.list` / `adblockmihomolite.yaml` / domainset，
  由 `rules/singbox/build-rule-sets.js` 转成 source JSON 放在本仓库 `rules/singbox/`，
  配置以 `format: source` 远程引用。规则更新后重跑该脚本再提交即可：
  ```bash
  bun rules/singbox/build-rule-sets.js
  ```
* **fakeip 过滤**：`qichiyuhub/rule` 的两个 json。

## 三、用 Sub-Store 一键生成（momo / linux / windows / iphone / nixos）

Sub-Store 服务端需要能访问 `raw.githubusercontent.com`（或加 `https://gh-proxy.com/` 前缀）。

### 1. 添加机场订阅

`订阅` → `新建订阅` → 类型 `远程订阅`，填机场订阅地址，名称随意，例如 `airport`。

### 2. 建一个组合订阅

`订阅` → `新建订阅` → 类型 `组合订阅`，把机场订阅加进去，**名称记牢**（脚本要用）。
假设组合订阅叫 `airport`。

### 3. 新建模板订阅

`订阅` → `新建订阅`：

| 字段 | 填入内容 |
| --- | --- |
| 名称 | 随便，例如 `singbox-linux` |
| 类型 | **远程订阅** |
| 地址（URL） | 下面「模板地址」按平台选一行 |
| 脚本操作 → 脚本 | 下面「脚本地址」 |

**模板地址**（指向 `feat/mihomo-full-rules` 分支，已可用；合并进 `main` 后把分支名换掉）：

```
https://raw.githubusercontent.com/Murkiness4095/rule/feat/mihomo-full-rules/config/singbox/1.14X/momo-full.json
https://raw.githubusercontent.com/Murkiness4095/rule/feat/mihomo-full-rules/config/singbox/1.14X/linux-full.json
https://raw.githubusercontent.com/Murkiness4095/rule/feat/mihomo-full-rules/config/singbox/1.14X/windows-full.json
https://raw.githubusercontent.com/Murkiness4095/rule/feat/mihomo-full-rules/config/singbox/1.14X/iphone-full.json
https://raw.githubusercontent.com/Murkiness4095/rule/feat/mihomo-full-rules/config/singbox/1.14X/nixos-full.json
```

最后一行是 **NixOS** 专用（`/var/lib/sing-box`），其它 Linux 用第 2 行。

**脚本地址**——**5 个平台完全相同**，只换模板地址：

```
https://raw.githubusercontent.com/xream/scripts/main/surge/modules/sub-store-scripts/sing-box/template.js#type=组合订阅&name=airport&outbound=🕳ℹ️手动选择|自动选择|故障转移|选择代理|漏网之鱼🏷ℹ️^(?!.*(?:官网|剩余|流量|套餐|订阅|到期时间|免费|直连|GB|Expire Date|Traffic|ExpireDate)).*🕳ℹ️香港节点🏷ℹ️香港|港|\\bHK\\b|Hong ?Kong|HKG|深港|九龙|Kowloon|新界|沙田|荃湾|葵涌|🇭🇰🕳ℹ️澳门节点🏷ℹ️澳门|澳門|Macau|MACAU|MACAO|🇲🇴🕳ℹ️台湾节点🏷ℹ️台|新北|彰化|\\bTW\\b|Taiwan|TAIWAN|TWN|TPE|ROC|🇹🇼🕳ℹ️新加坡节点🏷ℹ️新加坡|坡|狮城|\\bSG\\b|Singapore|SINGAPORE|SIN|🇸🇬🕳ℹ️日本节点🏷ℹ️日本|川日|东京|大阪|泉日|埼玉|沪日|深日|\\bJP\\b|Japan|JAPAN|🇯🇵🕳ℹ️韩国节点🏷ℹ️韩国|韩|韓|春川|Chuncheon|首尔|\\bKR\\b|Korea|KOREA|🇰🇷🕳ℹ️美国节点🏷ℹ️美国|波特兰|达拉斯|俄勒冈|凤凰城|费利蒙|硅谷|拉斯维加斯|洛杉矶|圣何塞|圣克拉拉|西雅图|芝加哥|纽约|亚特兰大|迈阿密|华盛顿|\\bUS\\b|United States|🇺🇸🕳ℹ️加拿大节点🏷ℹ️加拿大|多伦多|温哥华|蒙特利尔|Montreal|\\bCA\\b|Canada|CANADA|🇨🇦🕳ℹ️英国节点🏷ℹ️英国|伦敦|曼彻斯特|Manchester|\\bUK\\b|Britain|United Kingdom|🇬🇧🕳ℹ️澳大利亚节点🏷ℹ️澳大利亚|澳洲|悉尼|Sydney|\\bAU\\b|Australia|🇦🇺🕳ℹ️德国节点🏷ℹ️德国|柏林|法兰克福|慕尼黑|Munich|\\bDE\\b|Germany|GERMANY|DEU|MUC|🇩🇪🕳ℹ️法国节点🏷ℹ️法国|巴黎|马赛|Marseille|\\bFR\\b|France|FRANCE|FRA|CDG|MRS|🇫🇷🕳ℹ️俄罗斯节点🏷ℹ️俄罗斯|\\bRU\\b|Russia|🇷🇺🕳ℹ️泰国节点🏷ℹ️泰国|\\bTH\\b|Thailand|🇹🇭🕳ℹ️印度节点🏷ℹ️印度|\\bIN\\b|India|INDIA|🇮🇳🕳ℹ️马来西亚节点🏷ℹ️马来西亚|马来|\\bMY\\b|Malaysia|🇲🇾🕳ℹ️阿根廷节点🏷ℹ️阿根廷|\\bAR\\b|Argentina|EZE|🇦🇷🕳ℹ️芬兰节点🏷ℹ️芬兰|赫尔辛基|\\bFI\\b|Finland|HEL|🇫🇮🕳ℹ️埃及节点🏷ℹ️埃及|开罗|\\bEG\\b|Egypt|CAI|🇪🇬🕳ℹ️菲律宾节点🏷ℹ️菲律宾|马尼拉|\\bPH\\b|Philippines|MNL|🇵🇭🕳ℹ️土耳其节点🏷ℹ️土耳其|伊斯坦布尔|\\bTR\\b|Turkey|Türkiye|IST|🇹🇷🕳ℹ️乌克兰节点🏷ℹ️乌克兰|基辅|\\bUA\\b|Ukraine|KBP|🇺🇦🕳ℹ️低倍率节点🏷ℹ️低倍率节点
```

节点名跟机场对不上时，按 `rules/singbox/build-substore-param.js` 里
`REGIONS` 表的格式改 `🏷` 后面的正则即可。参数很长，建议用仓库里的生成脚本：
```bash
bun rules/singbox/build-substore-param.js   # 打印整串 outbound 参数
```

在 Sub-Store 前端编辑时，带 `?` `&` 的部分**不要** `encodeURIComponent`。

### 4. 取订阅链接

保存后访问该订阅链接，得到的就是填好节点的完整配置。

## 四、两个必须知道的点

### 模板不能直接载入

`-full.json` 里所有节点组的 `outbounds` 是**空数组**，官方内核直接载入会报：

```
FATAL[0000] initialize outbound[0]: missing tags
```

这是设计如此——节点必须经 sub-store 注入。某些地区没匹配到节点时，
sub-store 会自动插一个 `COMPATIBLE`（`type: direct`）占位，避免启动失败。

### 分流规则在面板上看不见

面板的「代理」页只列 outbound。`广告拦截`、`TikTok`、`金融` 这些是 `route.rules`，
面板不显示。验证方式：

```bash
curl -H 'Authorization: Bearer passwd' http://127.0.0.1:9095/rules
```

## 五、NixOS 用户

`nixos-full.json` 与 `linux-full.json` 只差两处运行时路径，因为 NixOS 上
`/etc/sing-box` 只读且不可由服务写入：

| 字段 | linux-full.json | nixos-full.json |
| --- | --- | --- |
| `services[].dashboard.path` | `/etc/sing-box/dashboard` | `/var/lib/sing-box/ui` |
| `experimental.cache_file.path` | `/etc/sing-box/cache.db` | `/var/lib/sing-box/cache.db` |

`/var/lib/sing-box` 对应 NixOS 的 `StateDirectory = "sing-box"`，由 systemd 创建并授权：

```nix
systemd.services.sing-box.Service.StateDirectory = "sing-box";
```

`experimental.clash_api.external_ui` 仍是 `/etc/sing-box/ui`（放外部 UI 静态文件，只读即可）。

## 六、reF1nd 版

`reF1nd-full.json` 走 reF1nd 内核自己的 `providers` 机制，节点组用
`use_all_providers` + `include` 正则动态筛选，**不需要 sub-store**，只要改
`providers[0].url` 为订阅地址即可。用的是 reF1nd fork 的 schema，
官方 `sing-box check` 会报 `unknown field "providers"`，原版 `reF1nd.json` 也一样。

## 七、关于 convert.min.js

`convert.min.js` 是**给 Mihomo/Clash 设计的覆写脚本**，只能产出 mihomo YAML，
**不能生成 sing-box 配置**。`config/mihomo/config/mihomo.yaml` 是它生成的；
sing-box 这边走的是另一条路——拿本目录的 JSON 当模板，让 sub-store 的 sing-box
模板脚本把节点灌进空的 outbound。两者不要混用。

`-full` 的全部内容由 `rules/singbox/build-full-config.js` 生成，改组或改规则后
重跑一次即可，不要手改 JSON：

```bash
bun rules/singbox/build-full-config.js
```