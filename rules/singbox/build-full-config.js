// 生成「完整组结构」版 sing-box 配置：<platform>-full.json
// 以仓库原版 <platform>.json 为底稿——inbounds / services / experimental /
// certificate / ntp / log / http_clients / route.final 等一律原样保留，
// 只重写 dns、outbounds、route.rules、route.rule_set，
// 迁入 powerfullz/override-rules convert.min.js 的 22 个地区节点组与全部策略组。
// 用法: bun rules/singbox/build-full-config.js
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const DIR = join(HERE, "../../config/singbox/1.14X")
const RAW = "https://raw.githubusercontent.com/Murkiness4095/rule/feat/mihomo-full-rules/rules/singbox"

const GEO = "https://gh-proxy.com/https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/{tag}.srs"
const SG = "https://gh-proxy.com/https://raw.githubusercontent.com/SagerNet/sing-geoip/rule-set/geoip-cn.srs"
const FAKEIP = "https://gh-proxy.com/https://raw.githubusercontent.com/qichiyuhub/rule/refs/heads/main/rules/{tag}.json"

// 22 个地区：中文名 -> 节点名匹配正则（照搬 convert.min.js 的 E 表）
const REGIONS = [
  ["香港", "香港|港|\\bHK\\b|Hong ?Kong|HKG|深港|九龙|Kowloon|新界|沙田|荃湾|葵涌|🇭🇰"],
  ["澳门", "澳门|澳門|Macau|MACAU|MACAO|🇲🇴"],
  ["台湾", "台|新北|彰化|\\bTW\\b|Taiwan|TAIWAN|TWN|TPE|ROC|🇹🇼"],
  ["新加坡", "新加坡|坡|狮城|\\bSG\\b|Singapore|SINGAPORE|SIN|🇸🇬"],
  ["日本", "日本|川日|东京|大阪|泉日|埼玉|沪日|深日|\\bJP\\b|Japan|JAPAN|🇯🇵"],
  ["韩国", "韩国|韩|韓|春川|Chuncheon|首尔|\\bKR\\b|Korea|KOREA|🇰🇷"],
  ["美国", "美国|波特兰|达拉斯|俄勒冈|凤凰城|费利蒙|硅谷|拉斯维加斯|洛杉矶|圣何塞|圣克拉拉|西雅图|芝加哥|纽约|亚特兰大|迈阿密|华盛顿|\\bUS\\b|United States|🇺🇸"],
  ["加拿大", "加拿大|多伦多|温哥华|蒙特利尔|Montreal|\\bCA\\b|Canada|CANADA|🇨🇦"],
  ["英国", "英国|伦敦|曼彻斯特|Manchester|\\bUK\\b|Britain|United Kingdom|🇬🇧"],
  ["澳大利亚", "澳大利亚|澳洲|悉尼|Sydney|\\bAU\\b|Australia|🇦🇺"],
  ["德国", "德国|柏林|法兰克福|慕尼黑|Munich|\\bDE\\b|Germany|GERMANY|DEU|MUC|🇩🇪"],
  ["法国", "法国|巴黎|马赛|Marseille|\\bFR\\b|France|FRANCE|FRA|CDG|MRS|🇫🇷"],
  ["俄罗斯", "俄罗斯|\\bRU\\b|Russia|🇷🇺"],
  ["泰国", "泰国|\\bTH\\b|Thailand|🇹🇭"],
  ["印度", "印度|\\bIN\\b|India|INDIA|🇮🇳"],
  ["马来西亚", "马来西亚|马来|\\bMY\\b|Malaysia|🇲🇾"],
  ["阿根廷", "阿根廷|\\bAR\\b|Argentina|EZE|🇦🇷"],
  ["芬兰", "芬兰|赫尔辛基|\\bFI\\b|Finland|HEL|🇫🇮"],
  ["埃及", "埃及|开罗|\\bEG\\b|Egypt|CAI|🇪🇬"],
  ["菲律宾", "菲律宾|马尼拉|\\bPH\\b|Philippines|MNL|🇵🇭"],
  ["土耳其", "土耳其|伊斯坦布尔|\\bTR\\b|Turkey|Türkiye|IST|🇹🇷"],
  ["乌克兰", "乌克兰|基辅|\\bUA\\b|Ukraine|KBP|🇺🇦"],
]

const REGION_TAGS = REGIONS.map(([zh]) => `${zh}节点`)
const AUTO = "自动选择"
const FAILOVER = "故障转移"
const MANUAL = "手动选择"
const SELECT = "选择代理"
const LOW = "低倍率节点"
const NODE_GROUPS = [...REGION_TAGS, AUTO, FAILOVER, LOW, MANUAL]

// 策略组 -> [域名规则集, IP 规则集]
const POLICIES = [
  ["选择代理", ["gfwlist"], []],
  ["静态资源", ["static-resources", "cdn-resources", "additional-cdn"], []],
  ["加密货币", ["geosite-category-cryptocurrency"], []],
  ["金融服务", ["geosite-category-finance"], []],
  ["AI服务", ["geosite-category-ai-!cn"], []],
  ["哔哩哔哩", ["geosite-bilibili"], []],
  ["Youtube", ["geosite-youtube"], []],
  ["Telegram", ["geosite-telegram"], ["geoip-telegram"]],
  ["Xbox", ["geosite-xbox"], []],
  ["Github", ["geosite-github"], []],
  ["Netflix", ["geosite-netflix"], ["geoip-netflix"]],
  ["Twitch", ["geosite-twitch"], []],
  ["Spotify", ["geosite-spotify"], []],
  ["巴哈姆特", ["geosite-bahamut"], []],
  ["PikPak网盘", ["geosite-pikpak"], []],
  ["Twitter", ["geosite-twitter"], []],
  ["新浪微博", ["weibo"], []],
  ["Truth Social", [], []],
  ["E-Hentai", ["ehentai"], []],
  ["TikTok", ["tiktok"], []],
  ["苹果服务", ["geosite-apple"], []],
  ["微软服务", ["geosite-microsoft"], []],
  ["谷歌服务", ["geosite-google"], []],
  ["广告拦截", ["adblock", "additional-filter"], []],
  ["搜狗输入法", ["sogouinput"], []],
]
const POLICY_TAGS = POLICIES.map(p => p[0])

// 各策略组的候选出站：节点组优先，再列其它策略组，最后兜底。
// 注意不能互相引用——sing-box 会报 circular outbound dependency，
// 所以只允许「后定义的业务组 -> 先定义的业务组」单向引用：
// POLICIES 的顺序即优先级，组只能引用排在它前面的业务组。
function candidates(self) {
  const selfIdx = POLICIES.findIndex(([t]) => t === self)
  const earlier = POLICY_TAGS.slice(0, selfIdx)
  return [
    ...new Set([SELECT, MANUAL, AUTO, FAILOVER, LOW, ...REGION_TAGS, ...earlier, "漏网之鱼", "直连"].filter(t => t !== self)),
  ]
}

function buildOutbounds(ref1nd) {
  const list = []
  for (const [zh, pattern] of REGIONS) {
    if (ref1nd) {
      // reF1nd 内核自带 providers，用正则动态筛选，无需 sub-store 填充
      list.push({ tag: `${zh}节点`, type: "selector", outbounds: null, use_all_providers: true, include: pattern })
    } else {
      list.push({ tag: `${zh}节点`, type: "selector", outbounds: [] })
    }
  }
  if (ref1nd) {
    list.push({ tag: AUTO, type: "urltest", outbounds: null, use_all_providers: true, url: "https://cp.cloudflare.com/generate_204", interval: "10m", tolerance: 50 })
    list.push({ tag: FAILOVER, type: "urltest", outbounds: null, use_all_providers: true, url: "https://cp.cloudflare.com/generate_204", interval: "10m" })
    list.push({ tag: LOW, type: "selector", outbounds: null, use_all_providers: true, include: "0\\.[0-5]|低倍率|省流|实验性" })
    list.push({ tag: MANUAL, type: "selector", outbounds: null, use_all_providers: true, exclude: "官网|剩余|流量|套餐|订阅|到期时间|免费|GB|Expire Date|Traffic|ExpireDate|直连" })
  } else {
    list.push({ tag: AUTO, type: "urltest", outbounds: [], url: "https://cp.cloudflare.com/generate_204", interval: "10m", tolerance: 50 })
    list.push({ tag: FAILOVER, type: "urltest", outbounds: [], url: "https://cp.cloudflare.com/generate_204", interval: "10m" })
    list.push({ tag: LOW, type: "selector", outbounds: [] })
    list.push({ tag: MANUAL, type: "selector", outbounds: [] })
  }
  for (const [tag] of POLICIES) list.push({ tag, type: "selector", outbounds: candidates(tag) })
  // 漏网之鱼是兜底组，只引用节点层。不能引用业务组：业务组的候选里也有漏网之鱼，
  // 互相引用会被内核判为 circular outbound dependency。
  list.push({ tag: "漏网之鱼", type: "selector", outbounds: [...new Set([MANUAL, AUTO, FAILOVER, LOW, ...REGION_TAGS, "直连"])] })
  list.push({ tag: "GLOBAL", type: "selector", outbounds: [...new Set([...POLICY_TAGS, ...NODE_GROUPS, "漏网之鱼", "直连"])] })
  list.push({ tag: "直连", type: "direct", domain_resolver: "ali" })
  return list
}
function GLOBAL_SAFE() { return "GLOBAL" }

function buildRules(resolveRule) {
  const r = []
  const logical = (mode, rules) => ({ type: "logical", mode, rules })
  r.push({ type: "logical", mode: "and", rules: [{ port: [53, 853], invert: true }, { clash_mode: "Global", invert: true }, { type: "logical", mode: "or", rules: [{ ip_is_private: true }, { rule_set: "geoip-cn" }] }], action: "bypass" })
  r.push({ type: "logical", mode: "or", rules: [{ domain_suffix: "push.apple.com" }, { rule_set: "geoip-telegram" }], invert: true, action: "sniff", sniffer: ["http", "tls", "stun", "quic", "dns"], timeout: "100ms" })
  r.push({ type: "logical", mode: "or", rules: [{ port: 53 }, { protocol: "dns" }], action: "hijack-dns" })
  r.push({ ip_is_private: true, outbound: "直连" })
  // mihomo 首条：非国内域名的 UDP/443 一律拒，逼浏览器回落 TCP
  r.push({ type: "logical", mode: "and", rules: [{ rule_set: "geosite-geolocation-!cn" }, { port: 443 }, { network: "udp" }], action: "reject" })
  r.push({ ...logical("or", [{ port: 853 }, { protocol: ["stun", "quic"] }]), action: "reject", no_drop: true })
  r.push({ network: "icmp", action: "resolve" })
  r.push({ network: "icmp", outbound: "直连" })
  r.push({ clash_mode: "Direct", outbound: "直连" })
  r.push({ clash_mode: "Global", outbound: "GLOBAL" })
  r.push({ rule_set: "geosite-private", outbound: "直连" })
  // 以下顺序照抄 convert.min.js 的 q()
  r.push({ rule_set: "adblock", action: "reject" })
  r.push({ rule_set: "additional-filter", action: "reject" })
  r.push({ rule_set: "sogouinput", outbound: "搜狗输入法" })
  r.push({ domain_suffix: "truthsocial.com", outbound: "Truth Social" })
  r.push({ rule_set: "static-resources", outbound: "静态资源" })
  r.push({ rule_set: "cdn-resources", outbound: "静态资源" })
  r.push({ rule_set: "additional-cdn", outbound: "静态资源" })
  r.push({ rule_set: "geosite-category-cryptocurrency", outbound: "加密货币" })
  r.push({ rule_set: "geosite-category-finance", outbound: "金融服务" })
  r.push({ rule_set: "geosite-category-ai-!cn", outbound: "AI服务" })
  r.push({ rule_set: "geosite-bilibili", outbound: "哔哩哔哩" })
  r.push({ rule_set: "geosite-youtube", outbound: "Youtube" })
  r.push({ rule_set: "geosite-telegram", outbound: "Telegram" })
  r.push({ rule_set: "geoip-telegram", outbound: "Telegram" })
  r.push({ rule_set: "geosite-xbox", outbound: "Xbox" })
  r.push({ rule_set: "geosite-github", outbound: "Github" })
  r.push({ rule_set: "geosite-netflix", outbound: "Netflix" })
  r.push({ rule_set: "geoip-netflix", outbound: "Netflix" })
  r.push({ rule_set: "geosite-twitch", outbound: "Twitch" })
  r.push({ rule_set: "geosite-spotify", outbound: "Spotify" })
  r.push({ rule_set: "geosite-bahamut", outbound: "巴哈姆特" })
  r.push({ rule_set: "geosite-pikpak", outbound: "PikPak网盘" })
  r.push({ rule_set: "geosite-twitter", outbound: "Twitter" })
  r.push({ rule_set: "weibo", outbound: "新浪微博" })
  r.push({ rule_set: "ehentai", outbound: "E-Hentai" })
  r.push({ rule_set: "tiktok", outbound: "TikTok" })
  r.push({ rule_set: "gfwlist", outbound: "选择代理" })
  r.push({ rule_set: "steamfix", outbound: "直连" })
  r.push({ rule_set: "googlefcm", outbound: "直连" })
  r.push({ rule_set: "geosite-google-play@cn", outbound: "直连" })
  r.push({ rule_set: "geosite-microsoft@cn", outbound: "直连" })
  r.push({ rule_set: "geosite-geolocation-!cn", outbound: "漏网之鱼" })
  // 原版在这条之后有一条 action: resolve（momo 无 match_only，reF1nd 有）
  if (resolveRule) r.push(resolveRule)
  // IP 规则兜底（mihomo 里是 no-resolve 的 GEOIP）
  r.push({ rule_set: "geoip-cn", outbound: "直连" })
  return r
}

function buildRuleSets() {
  const local = ["adblock", "additional-cdn", "additional-filter", "cdn-resources", "ehentai", "gfwlist", "googlefcm", "sogouinput", "static-resources", "steamfix", "tiktok", "weibo"]
  const geosite = [
    "geosite-category-cryptocurrency", "geosite-category-finance", "geosite-category-ai-!cn",
    "geosite-bilibili", "geosite-youtube", "geosite-telegram", "geosite-xbox", "geosite-github",
    "geosite-netflix", "geosite-twitch", "geosite-spotify", "geosite-bahamut", "geosite-pikpak",
    "geosite-twitter", "geosite-apple", "geosite-microsoft", "geosite-google",
    "geosite-google-play@cn", "geosite-microsoft@cn", "geosite-apple@cn", "geosite-private",
    "geosite-geolocation-!cn", "geosite-cn",
  ]
  return [
    { tag: ["fakeipfilter-cn", "fakeipfilter-!cn"], type: "remote", format: "source", url: FAKEIP },
    { tag: geosite, type: "remote", format: "binary", url: GEO },
    { tag: "geoip-telegram", type: "remote", format: "binary", url: "https://gh-proxy.com/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/geoip/telegram.srs" },
    { tag: "geoip-netflix", type: "remote", format: "binary", url: "https://gh-proxy.com/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/geoip/netflix.srs" },
    { tag: "geoip-cn", type: "remote", format: "binary", url: SG },
    { tag: local, type: "remote", format: "source", url: `${RAW}/{tag}.json` },
  ]
}

function buildDns(detour) {
  return {
    servers: [
      { tag: "local", type: "local", prefer_go: true },
      // ali 用 udp 明文 223.5.5.5，不用 DoH：实测 DoH(443) 在部分网络只有
      // 约 4/10 连通率，而它同时是 clash_mode Direct / 国内域名 / geoip-cn
      // 的出口，一旦不通，启动阶段所有远程 rule-set 会一起失败
      // （dial tcp 223.5.5.5:443: i/o timeout）。udp:53 不占用 443，
      // 也不会被 TUN 的 HTTPS 劫持路径卷入。
      { tag: "ali", type: "udp", server: "223.5.5.5" },
      { tag: "google", type: "https", server: "8.8.8.8", detour },
      { tag: "fakeip", type: "fakeip", inet4_range: "198.19.0.0/16" },
      // tx 依赖 hosts 里预置的 doh.pub 地址
      { tag: "tx", type: "https", server: "doh.pub", domain_resolver: "hosts" },
      { tag: "hosts", type: "hosts", predefined: { "doh.pub": ["1.12.12.21", "120.53.53.53"] } },
    ],
    rules: [
      // clash_mode 规则排在最后：启动阶段 clash API 尚未就绪，提前匹配会把引导
      // 解析导向 ali，拖慢甚至阻塞 rule-set 下载。移到末尾后仅作兜底。
      { query_type: ["HTTPS", "SVCB"], action: "reject" },
      { rule_set: ["fakeipfilter-cn", "geosite-cn", "geosite-apple@cn", "geosite-microsoft@cn", "geosite-private"], server: "ali" },
      { rule_set: "fakeipfilter-!cn", server: "google" },
      { type: "logical", mode: "and", rules: [{ query_type: ["A", "AAAA"] }, { rule_set: "geosite-geolocation-!cn", invert: true }], action: "evaluate", server: "google", client_subnet: "223.5.5.0/24", timeout: "2s" },
      { match_response: true, rule_set: "geoip-cn", server: "ali" },
      { query_type: ["A", "AAAA"], server: "fakeip", rewrite_ttl: 1 },
      { clash_mode: "Direct", server: "ali" },
      { clash_mode: "Global", server: "fakeip" },
    ],
    // 引导解析（远程 rule-set 下载）用 local：走系统 stub，不依赖任何 DoH，
    // 也不经过尚未就绪的节点组。规则集下载完成后正常流量仍按 dns.rules 分流。
    final: "local",
    strategy: "ipv4_only",
    cache_capacity: 8192,
    optimistic: { enabled: true },
    reverse_mapping: true,
  }
}

function build(platform, opts = {}) {
  const src = JSON.parse(readFileSync(join(DIR, `${platform}.json`), "utf-8"))
  const ref1nd = Boolean(src.providers)
  const resolveRule = src.route.rules.find(x => x.action === "resolve" && !x.network)
  src.dns = buildDns(SELECT)
  src.outbounds = buildOutbounds(ref1nd)
  src.route.rules = buildRules(resolveRule)
  src.route.rule_set = buildRuleSets()
  // 引导解析（下载远程规则集、出站握手）默认走系统解析器：
  // default_domain_resolver 指向 ali 时，若 223.5.5.5:443 在当前网络不通，
  // 启动阶段所有远程 rule-set 会一起 Get 失败。local 走系统 stub/上游，最稳。
  src.route.default_domain_resolver = { server: opts.resolver ?? "local" }
  if (opts.nixos) {
    src.services[0].dashboard.path = "/var/lib/sing-box/ui"
    src.experimental.cache_file.path = "/var/lib/sing-box/cache.db"
  }
  const name = opts.nixos ? "nixos-full.json" : `${platform}${opts.suffix ?? "-full"}.json`
  const out = join(DIR, name)
  writeFileSync(out, JSON.stringify(src, null, 2) + "\n")
  return out
}

// linux_mini 是纯自建节点专用（原版只有 2 个写死的自建节点），不参与本轮重写
const TARGETS = [
  { platform: "momo", suffix: "-full" },
  { platform: "linux", suffix: "-full" },
  { platform: "windows", suffix: "-full" },
  { platform: "iphone", suffix: "-full" },
  { platform: "reF1nd", suffix: "-full" },
  { platform: "linux", suffix: "-full-nixos", nixos: true },
]

console.log(TARGETS.map(t => build(t.platform, t)).join("\n"))