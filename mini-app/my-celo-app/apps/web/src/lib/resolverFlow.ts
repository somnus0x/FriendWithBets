// src/lib/resolverFlow.ts
import { FakeChain } from "./fakeChain"

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

export async function runResolverFlow(id: number) {
  console.log("🔮 Tier 1: zk-Prover (fake)…")

  if (Math.random() < 0.7) {
    await sleep(600)
    FakeChain.resolve(id, "YES", "TIER1")
    console.log("✅ Resolved via Tier 1")
    return
  }

  console.log("❌ Tier 1 failed → Tier 2…")

  if (Math.random() < 0.8) {
    await sleep(400)
    FakeChain.resolve(id, "YES", "TIER2")
    console.log("✅ Resolved via Tier 2")
    return
  }

  console.log("❌ Tier 2 failed → Tier 3…")

  await sleep(300)
  FakeChain.resolve(id, "YES", "TIER3")
  console.log("✅ Resolved via Tier 3 (admin)")
}

