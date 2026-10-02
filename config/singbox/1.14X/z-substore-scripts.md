# sing-box 完整分流版（*-full.json）与 Sub-Store 生成说明

本目录新增 6 个 `<平台>-full.json`，在**原文件一字不改**的前提下，只把
`config/mihomo/config/mihomo.yaml` 里缺的**分流规则**、**策略组**、**节点组**补进去。
原来的 `momo.json`、`linux.json`、`windows.json`、`iphone.json`、`reF1nd.json`、
`linux_mini.json` 全部保持原样，可以继续照旧使用。

| 文件 | 对应原版 | 节点来源 | 需要 sub-store 脚本填充 |
| --- | --- | --- | --- |
| `momo-full.json` | `momo.json` | 空 outbound 占位 | 是 |
| `linux-full.json` | `linux.json` | 空 outbound 占位 | 是 |
| `windows-full.json` | `windows.json` | 空 outbound 占位 | 是 |
| `iphone-full.json` | `iphone.json` | 空 outbound 占位 | 是 |
| `reF1nd-full.json` | `reF1nd.json` | `providers` + `use_all_providers` | 否 |
| `linux_mini-full.json` | `linux_mini.json` | 纯自建节点，写死在配置里 | 否 |
| `nixos-full.json` | `linux.json` | 空 outbound 占位 | 是 |

`-full` 与原版的差异**只有下面这几类**，inbounds / services / experimental / dns 服务器 /
其余规则一律逐字沿用原文件（每个平台自己那份，不是套用别的平台）。

> **NixOS 用户注意**：`nixos-full.json` 就是给 NixOS 用的，内容与 `linux-full.json` 完全一致，
> 只改了两处运行时路径，因为 NixOS 上 `/etc/sing-box` 是只读且不可由服务写入的：
>
> | 字段 | linux-full.json | nixos-full.json |
> | --- | --- | --- |
> | `services[].dashboard.path` | `/etc/sing-box/dashboard` | `/var/lib/sing-box/ui` |
> | `experimental.cache_file.path` | `/etc/sing-box/cache.db` | `/var/lib/sing-box/cache.db` |
>
> `/var/lib/sing-box` 对应 NixOS 的 `StateDirectory = "sing-box"`，由 systemd 自动创建并
> 赋予服务用户写权限。`experimental.clash_api.external_ui` 仍指向 `/etc/sing-box/ui`，
> 那是你手动放外部 UI 静态文件的地方，保持只读即可。

## 一、补了什么

原版只覆盖了 mihomo 的**域名**规则，mihomo 里还有几条 **IP 规则**和一条 **QUIC 拦截规则**
没有对应实现，这次一并补上：

| mihomo.yaml 原规则 | 原版 sing-box | `*-full.json` |
| --- | --- | --- |
| `AND((RULE-SET,cn!_domain),(DST-PORT,443),(NETWORK,UDP)) → REJECT` | 无 | `geosite-geolocation-!cn` + `port 443` + `network udp` → `reject` |
| `RULE-SET,google_ip → Google` | 无 | `geoip-google` → `Google` |
| `RULE-SET,apple_ip → Apple` | 无 | `geoip-apple` → `Apple` |
| `RULE-SET,netflix_ip → NETFLIX` | 无 | `geoip-netflix` → `Netflix` |

另外两处对齐 mihomo：

* **DNS 的 fakeip 直连白名单**补入 `geosite-steam@cn`，与 mihomo 的 `fake-ip-filter`
  （`cn_domain / microsoftcn / applecn / steamcn`）一致，避免 Steam 国内 CDN 被分配到 fakeip 地址。
* **补上台湾节点组**。mihomo 的 `G1/S1/S2/S3` 里都有 `台湾故转 / 台湾手动 / 台湾自动`，
  而 sing-box 侧只有港/日/狮/美，台湾节点无处安放、只能落到「漏网之鱼」。
  新增 `台湾手动` 选择器，并挂进 `默认代理 / AI / YouTube / Google / Github / Telegram /
  TikTok / Netflix / Wallet / Steam / Microsoft / OneDrive / Apple / 漏网之鱼 / GLOBAL` 共 15 个选择器。

### 各文件的差异

* **momo / linux / windows / iphone**：改法完全相同。`台湾手动` 是空 `outbounds` 占位，
  和其它地区组一样由 sub-store 脚本填充。
* **reF1nd-full**：节点组走 reF1nd 内核自己的 `use_all_providers`，所以 `台湾手动` 直接写过滤条件，
  不需要 sub-store：
  ```json
  {"tag": "台湾手动", "type": "selector", "outbounds": null, "use_all_providers": true, "include": "🇹🇼|TW|tw|台湾|台|Taiwan", "exclude": "ZJ|zijian|自建"}
  ```
  用的是 reF1nd fork 的 schema，官方 `sing-box` 不认 `providers` 字段，
  `sing-box check` 会报 `unknown field "providers"`——原版 `reF1nd.json` 也一样，不是新问题。
* **linux_mini-full**：纯自建节点专用，没有地区节点组，所以**不加** `台湾手动`，
  `geoip-*` 三条规则统一指向 `默认代理`（原文件所有业务组本来就都指向 `默认代理`）。

> 台湾节点没有单独的 `台湾自动`，统一走全局的 `自动选择`，与港/日/狮/美现有结构一致。
> 想还原 mihomo 的「每地区独立自动测速」，照抄 `自动选择` 那条 urltest 改 tag 即可。

### 为什么 4 条 geoip 要写 4 行

sing-box 只支持 `{tag}` 这一个 URL 占位符（没有 `{tag-without-geoip}`），
而 `MetaCubeX/meta-rules-dat` 的 `geoip/` 目录下没有 `apple.srs`——
Apple 的 IP 库在 `geo-lite/geoip/` 下，与 mihomo 里 `apple_ip` 指向 `geo-lite` 一致。
所以只能一条 rule_set 写一行。

## 二、用 Sub-Store 一键生成（momo / linux / windows / iphone）

Sub-Store 服务端需要能访问 `raw.githubusercontent.com`（或改用下面的 `gh-proxy.com` 前缀）。

### 1. 添加机场订阅

`订阅` → `新建订阅` → 类型选 `远程订阅`，填机场订阅地址，名称随意，例如 `airport`。

### 2. 建一个组合订阅

`订阅` → `新建订阅` → 类型选 `组合订阅`，把上一步的机场订阅加进去，**名称记牢**（脚本要用）。
假设组合订阅的名称叫 `airport`。

### 3. 新建模板订阅（核心一步）

`订阅` → `新建订阅`，按下表填写：

| 字段 | 填入内容 |
| --- | --- |
| 名称 | 随便，例如 `singbox-linux` |
| 类型 | **远程订阅** |
| 地址（URL） | 下面「模板地址」按你要的平台选一行 |
| 脚本操作 → 脚本 | 下面「脚本地址」 |

**模板地址**（下列链接指向 `feat/mihomo-full-rules` 分支，已可直接使用；
将来这些文件合并进 `main` 后，把链接里的分支名换成 `main` 即可）：

```
https://raw.githubusercontent.com/Murkiness4095/rule/feat/mihomo-full-rules/config/singbox/1.14X/momo-full.json
https://raw.githubusercontent.com/Murkiness4095/rule/feat/mihomo-full-rules/config/singbox/1.14X/linux-full.json
https://raw.githubusercontent.com/Murkiness4095/rule/feat/mihomo-full-rules/config/singbox/1.14X/windows-full.json
https://raw.githubusercontent.com/Murkiness4095/rule/feat/mihomo-full-rules/config/singbox/1.14X/iphone-full.json
https://raw.githubusercontent.com/Murkiness4095/rule/feat/mihomo-full-rules/config/singbox/1.14X/nixos-full.json
```

> 第 5 行是 **NixOS** 专用（`/var/lib/sing-box`），其它 Linux 用第 2 行 `linux-full.json`。

访问不了 GitHub 就在前面加 `https://gh-proxy.com/`，例如
`https://gh-proxy.com/https://raw.githubusercontent.com/Murkiness4095/rule/feat/mihomo-full-rules/config/singbox/1.14X/linux-full.json`。

> 用 fork 同步上游更新时，建议保留这个分支单独跑 sub-store，
> 上游更新直接 merge/rebase `main` 进来即可，冲突面只有 `config/singbox/1.14X/` 下的这几个新文件。

**脚本地址**（`name` 要和第 2 步的组合订阅名称一致，这里假定叫 `airport`）：

```
https://raw.githubusercontent.com/xream/scripts/main/surge/modules/sub-store-scripts/sing-box/template.js#type=组合订阅&name=airport&outbound=🕳ℹ️手动选择|自动选择🏷ℹ️^(?!.*(?:官网|剩余|流量|套餐|免费|订阅|到期时间|直连|GB|Expire Date|Traffic|ExpireDate)).*🕳ℹ️香港手动🏷ℹ️^(?!.*(?:ZJ|zijian|自建|台|TW)).*(🇭🇰|HK|hk|香港|港|HongKong)🕳ℹ️日本手动🏷ℹ️^(?!.*(?:ZJ|zijian|自建)).*(🇯🇵|JP|jp|日本|日|Japan)🕳ℹ️台湾手动🏷ℹ️^(?!.*(?:ZJ|zijian|自建)).*(🇹🇼|TW|tw|台湾|台|Taiwan)🕳ℹ️狮城手动🏷ℹ️^(?!.*(?:ZJ|zijian|自建)).*(新加坡|坡|狮城|SG|Singapore)🕳ℹ️美国手动🏷ℹ️^(?!.*(?:ZJ|zijian|自建|AUS|RUS)).*(🇺🇸|US|us|美国|美|United States)
```

在 Sub-Store 前端编辑时，参数里带 `?`、`&` 的部分**不要** `encodeURIComponent`；
若手工拼 URL，参数值需要编码。

**这 4 个平台脚本参数完全一样**，因为它们的 outbound 结构一致，只要换模板地址即可。
`reF1nd-full.json` 和 `linux_mini-full.json` 不走 sub-store：前者改 `providers` 里的
`"url": "此处填入订阅链接"`，后者直接改写死在配置里的自建节点。

### 4. 取订阅链接

保存后访问这个订阅的链接，得到的**就是填好节点的完整 sing-box 配置**，导入内核即可。

## 三、参数怎么读

`outbound` 参数用 `🕳` 分隔，每段是 `匹配到的 outbound tag 正则🏷节点名正则`：

* `🕳ℹ️手动选择|自动选择🏷ℹ️^(?!.*(?:官网|剩余|流量|…)).*`
  所有**排除掉流量/官网/到期时间等信息节点**后的节点，灌进 `手动选择` 和 `自动选择`。
  第一个 `🕳` 段没有 `🏷` 时默认匹配全部节点，所以这里必须补 `🏷` 排除信息节点。
* `🕳ℹ️香港手动🏷ℹ️…` 只按地区正则筛选，因此每个地区的 `🏷` 都要带**反向排除**
  （`ZJ|zijian|自建`），否则自建落地节点会串到机场组里。
* `ℹ️` 表示忽略大小写，写在 `🕳` 后匹配 outbound tag，写在 `🏷` 后匹配节点名。
* 某个地区一个节点都没匹配上时，脚本会自动插一个 `COMPATIBLE`（`type: direct`）占位，
  避免该选择器为空导致内核启动报错。

### 按自己的节点名改

`🏷` 后面是正则，按机场实际节点名改即可。例如节点叫 `US-01` / `JP-01` / `TW-01`：

```
🕳ℹ️香港手动🏷ℹ️^HK.*🕳ℹ️日本手动🏷ℹ️^JP.*🕳ℹ️台湾手动🏷ℹ️^TW.*🕳ℹ️狮城手动🏷ℹ️^SG.*🕳ℹ️美国手动🏷ℹ️^US.*
```

台湾的正则不要写进港/日/狮/美的**正向**列表，但要在它们的**反向排除**里加上 `台|TW`，
否则 `台湾 TW 中转` 这类节点会被香港的正则误吞。上面默认参数已经带上了。

## 四、原版配置的脚本地址（不变）

继续用 `momo.json` / `linux.json` / `windows.json` / `iphone.json` 时，
脚本地址和参数跟以前一模一样，只是没有 `台湾手动` 那一段，模板地址换成原版文件名：

```
https://raw.githubusercontent.com/xream/scripts/main/surge/modules/sub-store-scripts/sing-box/template.js#type=组合订阅&name=singbox&outbound=🕳ℹ️手动选择|自动选择🏷ℹ️^(?!.*(?:官网|剩余|流量|套餐|免费|订阅|到期时间|直连|GB|Expire Date|Traffic|ExpireDate)).*🕳ℹ️香港手动🏷ℹ️^(?!.*(?:ZJ|zijian|自建)).*(🇭🇰|HK|hk|香港|港|HongKong)🕳ℹ️日本手动🏷ℹ️^(?!.*(?:ZJ|zijian|自建)).*(🇯🇵|JP|jp|日本|日|Japan)🕳ℹ️狮城手动🏷ℹ️^(?!.*(?:ZJ|zijian|自建)).*(新加坡|坡|狮城|SG|Singapore)🕳ℹ️美国手动🏷ℹ️^(?!.*(?:ZJ|zijian|自建|AUS|RUS)).*(🇺🇸|US|us|美国|美|United States)
```

## 五、关于 powerfullz/override-rules 的 convert.min.js

`https://cdn.jsdelivr.net/gh/powerfullz/override-rules/convert.min.js` 是**给 Mihomo/Clash
设计的覆写脚本**：它输出的 `proxy-groups` / `rule-providers` / `rules` 全是 mihomo 语法，
只能产出 mihomo YAML，**不能生成 sing-box 配置**。所以 `mihomo.yaml` 是它生成的，
而 sing-box 这边走的是另一条路——拿本目录的 JSON 当模板，让 sub-store 的 sing-box
模板脚本把节点灌进空的 outbound 里。两者不要混用。

想同步 mihomo 那边新增的**分流规则**，照第一节的表格往对应文件的
`route.rules` / `route.rule_set` 里加即可；`convert.min.js` 新增的代理组（静态资源、
搜狗输入、Tailscale 等）需要自己判断是否要在 sing-box 里实现。