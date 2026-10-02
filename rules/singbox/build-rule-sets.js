// 把 convert.min.js 用的 Clash classical .list 规则转成 sing-box source 格式，
// 输出到 rules/singbox/ 供 -full 配置引用。
// 用法: bun rules/singbox/build-rule-sets.js
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const OUT = join(dirname(fileURLToPath(import.meta.url)))

const SOURCES = {
  "tiktok": "https://cdn.jsdelivr.net/gh/powerfullz/override-rules@main/ruleset/TikTok.list",
  "ehentai": "https://cdn.jsdelivr.net/gh/powerfullz/override-rules@main/ruleset/EHentai.list",
  "steamfix": "https://cdn.jsdelivr.net/gh/powerfullz/override-rules@main/ruleset/SteamFix.list",
  "googlefcm": "https://cdn.jsdelivr.net/gh/powerfullz/override-rules@main/ruleset/FirebaseCloudMessaging.list",
  "additional-filter": "https://cdn.jsdelivr.net/gh/powerfullz/override-rules@main/ruleset/AdditionalFilter.list",
  "additional-cdn": "https://cdn.jsdelivr.net/gh/powerfullz/override-rules@main/ruleset/AdditionalCDNResources.list",
  "weibo": "https://cdn.jsdelivr.net/gh/powerfullz/override-rules@main/ruleset/Weibo.list",
  "sogouinput": "https://ruleset.skk.moe/Clash/non_ip/sogouinput.txt",
  "static-resources": "https://ruleset.skk.moe/Clash/domainset/cdn.txt",
  "cdn-resources": "https://ruleset.skk.moe/Clash/non_ip/cdn.txt",
  "gfwlist": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt",
}

// Clash classical -> sing-box source
function convert(text) {
  const rules = []
  const seen = new Set()
  const add = r => {
    const k = JSON.stringify(r)
    if (seen.has(k)) return
    seen.add(k)
    rules.push(r)
  }
  // gfwlist 是 yaml 形态（`- '+.example.com'`），先归一成 Clash classical
  if (/^payload:/m.test(text)) {
    text = text
      .split("\n")
      .filter(l => /^\s*-\s*'/.test(l))
      .map(l => l.trim().replace(/^-\s*'/, "").replace(/'$/, ""))
      .filter(Boolean)
      .map(d => (d.startsWith("+.") ? `DOMAIN-SUFFIX,${d.slice(2)}` : `DOMAIN-SUFFIX,${d}`))
      .join("\n")
  }
  for (const raw of text.split("\n")) {
    const line = raw.trim()
    if (!line || line.startsWith("#") || line.startsWith("//")) continue
    // parts 只有一项时是 domainset 格式（每行一个裸域名）
    const parts = line.split(",").map(p => p.trim())
    if (parts.length === 1) {
      if (/^[\w.-]+\.[a-z]{2,}$/i.test(parts[0])) add({ domain_keyword: [parts[0]] })
      continue
    }
    const type = parts[0].toUpperCase()
    const val = parts[1]
    if (!val) continue
    if (type === "DOMAIN-SUFFIX") add({ domain_suffix: [val] })
    else if (type === "DOMAIN") add({ domain: [val] })
    else if (type === "DOMAIN-KEYWORD") add({ domain_keyword: [val] })
    else if (type === "DOMAIN-REGEX") add({ domain_regex: [val] })
  }
  return { version: 3, rules }
}

mkdirSync(OUT, { recursive: true })
const report = []
for (const [tag, url] of Object.entries(SOURCES)) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${tag}: HTTP ${res.status} ${url}`)
  const out = convert(await res.text())
  if (out.rules.length === 0) throw new Error(`${tag}: 解析出 0 条规则，格式可能变了`)
  const file = join(OUT, `${tag}.json`)
  writeFileSync(file, JSON.stringify(out, null, 2) + "\n")
  report.push(`${tag.padEnd(20)} ${String(out.rules.length).padStart(5)} 条  ${url}`)
}
console.log(report.join("\n"))