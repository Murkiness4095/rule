// 从 build-full-config.js 的 REGIONS 抽出 sub-store 脚本用的 outbound 参数串
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("./build-full-config.js", import.meta.url),
  "utf-8",
)

const REGION_RE = /\["([\u4e00-\u9fa5]+)", "((?:[^"\\]|\\.)*)"\],/g
const LOW_RE = /LOW = "((?:[^"\\]|\\.)*)"/

const regions = []
let m
while ((m = REGION_RE.exec(src))) {
  regions.push([m[1], m[2]])
}
const low = src.match(LOW_RE)[1]

const NODE_FILTER =
  "官网|剩余|流量|套餐|订阅|到期时间|免费|直连|GB|Expire Date|Traffic|ExpireDate"

// 所有节点进的总池：手动选择 / 自动选择 / 故障转移 / 选择代理 / 漏网之鱼
const parts = [
  `🕳ℹ️手动选择|自动选择|故障转移|选择代理|漏网之鱼🏷ℹ️^(?!.*(?:${NODE_FILTER})).*`,
]
for (const [zh, pattern] of regions) {
  parts.push(`🕳ℹ️${zh}节点🏷ℹ️${pattern}`)
}
parts.push(`🕳ℹ️低倍率节点🏷ℹ️${low}`)

console.log(parts.join(""))