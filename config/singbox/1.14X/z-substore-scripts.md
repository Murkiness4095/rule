# sing-box 配置生成说明（momo-full / 完整分流版）

本目录新增 `momo-full.json`，在原 `momo.json` 的基础上，把 `config/mihomo/config/mihomo.yaml`
里的分流规则补齐。原 `momo.json`、`linux.json` 等文件未做任何改动，可继续照旧使用。

## 一、momo-full.json 相对原版补了什么

原 `momo.json` 的 `route.rules` 只覆盖了 mihomo 的**域名**规则，mihomo 里还有几条**IP 规则**和
一条**QUIC 拦截规则**没有对应实现，这次一并补上：

| mihomo.yaml 原规则 | momo.json（缺） | momo-full.json（补） |
| --- | --- | --- |
| `AND((RULE-SET,cn!_domain),(DST-PORT,443),(NETWORK,UDP)) → REJECT` | 无 | `geosite-geolocation-!cn` + `port 443` + `network udp` → `reject` |
| `RULE-SET,google_ip → Google` | 无 | `geoip-google` → `Google` |
| `RULE-SET,apple_ip → Apple` | 无 | `geoip-apple` → `Apple` |
| `RULE-SET,netflix_ip → NETFLIX` | 无 | `geoip-netflix` → `Netflix` |

另外两处对齐 mihomo 的调整：

* **DNS 的 fakeip 直连白名单**补入 `geosite-steam@cn`，与 mihomo 的
  `fake-ip-filter`（`cn_domain / microsoftcn / applecn / steamcn`）保持一致，
  避免 Steam 国内 CDN 被分配到 fakeip 地址。
* **补上台湾分组**。mihomo 的 `G1/S1/S2/S3` 里都有 `台湾故转 / 台湾手动 / 台湾自动`，
  而 sing-box 侧只有港/日/狮/美，导致台湾节点无处安放、只能落到「漏网之鱼」。
  `momo-full.json` 新增 `台湾手动` 选择器，并挂进 `默认代理 / AI / YouTube / Google /
  Github / Telegram / TikTok / Netflix / Wallet / Steam / Microsoft / OneDrive / Apple /
  漏网之鱼 / GLOBAL`。

> 台湾节点没有单独的 `台湾自动`，统一走全局的 `自动选择`，与港/日/狮/美的现有结构一致。
> 如果要还原 mihomo 的「每地区独立自动测速」，照抄 `自动选择` 那一条 urltest，
> 改 tag 和 url/interval 即可。

sing-box 只支持 `{tag}` 这一个 URL 占位符，所以 4 条 geoip 规则只能各写一行
（`MetaCubeX/meta-rules-dat` 的 `geoip/` 下没有 `apple.srs`，Apple 的 IP 库在
`geo-lite/geoip/` 下，与 mihomo 里 `apple_ip` 指向 `geo-lite` 一致）。

## 二、用 Sub-Store 一键生成

Sub-Store 服务端需要能访问 `raw.githubusercontent.com`（或改用下面的 `gh-proxy.com` 前缀）。

### 1. 添加机场订阅

`订阅` → `新建订阅` → 类型选 `远程订阅`，填机场订阅地址，名称随意，例如 `airport`。

### 2. 建一个组合订阅

`订阅` → `新建订阅` → 类型选 `组合订阅`，把上一步的机场订阅加进去，**名称记牢**（下面脚本要用）。
假设组合订阅的名称是 `airport`。

### 3. 新建模板订阅（核心一步）

`订阅` → `新建订阅`，按下表填写：

| 字段 | 填入内容 |
| --- | --- |
| 名称 | 随便，例如 `singbox` |
| 类型 | **远程订阅** |
| 地址（URL） | 下面「模板地址」二选一 |
| 脚本操作 → 脚本 | 下面「脚本地址」 |

**模板地址**（把 `main` 换成你实际所在的分支）：

```
https://raw.githubusercontent.com/Murkiness4095/rule/main/config/singbox/1.14X/momo-full.json
```

访问不了 GitHub 就加代理前缀：

```
https://gh-proxy.com/https://raw.githubusercontent.com/Murkiness4095/rule/main/config/singbox/1.14X/momo-full.json
```

**脚本地址**（`name` 要和第 2 步的组合订阅名称一致，这里假定叫 `airport`）：

```
https://raw.githubusercontent.com/xream/scripts/main/surge/modules/sub-store-scripts/sing-box/template.js#type=组合订阅&name=airport&outbound=🕳ℹ️手动选择|自动选择🏷ℹ️^(?!.*(?:官网|剩余|流量|套餐|免费|订阅|到期时间|直连|GB|Expire Date|Traffic|ExpireDate)).*🕳ℹ️香港手动🏷ℹ️^(?!.*(?:ZJ|zijian|自建|台|TW)).*(🇭🇰|HK|hk|香港|港|HongKong)🕳ℹ️日本手动🏷ℹ️^(?!.*(?:ZJ|zijian|自建)).*(🇯🇵|JP|jp|日本|日|Japan)🕳ℹ️台湾手动🏷ℹ️^(?!.*(?:ZJ|zijian|自建)).*(🇹🇼|TW|tw|台湾|台|Taiwan)🕳ℹ️狮城手动🏷ℹ️^(?!.*(?:ZJ|zijian|自建)).*(新加坡|坡|狮城|SG|Singapore)🕳ℹ️美国手动🏷ℹ️^(?!.*(?:ZJ|zijian|自建|AUS|RUS)).*(🇺🇸|US|us|美国|美|United States)
```

在 Sub-Store 前端编辑时，参数里带 `?`、`&` 的部分**不要** `encodeURIComponent`；
若手工拼 URL（比如放进 clash 客户端的覆写里），`outbound` 的值需要编码。

### 4. 取订阅链接

保存后，直接访问这个订阅的链接，得到的**就是填好节点的完整 sing-box 配置**，导入内核即可。

## 三、参数怎么读

`outbound` 参数用 `🕳` 分隔，每段是 `匹配到的 outbound tag 正则🏷节点名正则`：

* `🕳ℹ️手动选择|自动选择🏷ℹ️^(?!.*(?:官网|剩余|流量|…)).*`
  所有**去掉流量/官网/到期时间等信息节点**后的节点，灌进 `手动选择` 和 `自动选择`。
  第一个 `🕳` 段没有 `🏷` 时默认匹配全部节点，所以这里必须补 `🏷` 排除信息节点。
* `🕳ℹ️香港手动🏷ℹ️…` 只按地区正则筛选，因此每个地区的 `🏷` 都要带
  **反向排除**（`ZJ|zijian|自建`），否则自建落地节点会串到机场组里。
* `ℹ️` 表示忽略大小写，写在 `🕳` 后匹配 outbound tag，写在 `🏷` 后匹配节点名。
* 某个地区一个节点都没匹配上时，脚本会自动插一个 `COMPATIBLE`（`type: direct`）
  占位，避免该选择器为空导致内核启动报错。

### 按自己的节点名改

`🏷` 后面是正则，按机场实际节点名改即可。例如节点叫 `US-01` / `JP-01` / `TW-01`：

```
🕳ℹ️香港手动🏷ℹ️^HK.*🕳ℹ️日本手动🏷ℹ️^JP.*🕳ℹ️台湾手动🏷ℹ️^TW.*🕳ℹ️狮城手动🏷ℹ️^SG.*🕳ℹ️美国手动🏷ℹ️^US.*
```

台湾的正则里注意别把 `TW` 写进香港/日本/狮城/美国的**正向**列表，
但要在它们的**反向排除**里加上 `台|TW`，否则 `台湾 TW 中转` 这类节点会被香港的正则误吞。

## 四、原版配置的脚本地址（不变）

如果继续用 `momo.json` / `linux.json` / `iphone.json` / `windows.json` 等原版文件，
脚本地址和参数保持原样，只是没有 `台湾手动` 这一段：

```
https://raw.githubusercontent.com/xream/scripts/main/surge/modules/sub-store-scripts/sing-box/template.js#type=组合订阅&name=singbox&outbound=🕳ℹ️手动选择|自动选择🏷ℹ️^(?!.*(?:官网|剩余|流量|套餐|免费|订阅|到期时间|直连|GB|Expire Date|Traffic|ExpireDate)).*🕳ℹ️香港手动🏷ℹ️^(?!.*(?:ZJ|zijian|自建)).*(🇭🇰|HK|hk|香港|港|HongKong)🕳ℹ️日本手动🏷ℹ️^(?!.*(?:ZJ|zijian|自建)).*(🇯🇵|JP|jp|日本|日|Japan)🕳ℹ️狮城手动🏷ℹ️^(?!.*(?:ZJ|zijian|自建)).*(新加坡|坡|狮城|SG|Singapore)🕳ℹ️美国手动🏷ℹ️^(?!.*(?:ZJ|zijian|自建|AUS|RUS)).*(🇺🇸|US|us|美国|美|United States)
```

## 五、关于 powerfullz/override-rules 的 convert.min.js

`https://cdn.jsdelivr.net/gh/powerfullz/override-rules/convert.min.js` 是**给 Mihomo/Clash
设计的覆写脚本**：它输出的 `proxy-groups` / `rule-providers` / `rules` 全是 mihomo 语法，
只产出 mihomo YAML，**不能直接生成 sing-box 配置**。所以 `mihomo.yaml` 是它生成的，
而 sing-box 这边走的是另一条路——用本目录的 JSON 作模板，让 sub-store 的 sing-box
模板脚本把节点灌进空的 outbound 里。两者不要混用。

如果只是想同步 mihomo 那边新增的**分流规则**，照第一节的表格往 `momo-full.json` 的
`route.rules` / `route.rule_set` 里加就行；`convert.min.js` 新增的代理组（静态资源、
搜狗输入、Tailscale 等）需要自己判断是否要在 sing-box 里实现。