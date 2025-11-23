// src/app/market/[[...id]]/market-display.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useMiniApp } from "@/contexts/miniapp-context"
import { useAccount } from "wagmi"
import { FakeChain, Market } from "@/lib/fakeChain"
import { ApeButton } from "@/components/ape-button"
import { runResolverFlow } from "@/lib/resolverFlow"

export function MarketDisplay() {
  const params = useParams()
  const { context } = useMiniApp()
  const { address } = useAccount()
  const user = context?.user
  
  const idParam = Array.isArray(params?.id) ? params.id[0] : params?.id
  const id = Number(idParam)

  const [market, setMarket] = useState<Market | null>(null)

  useEffect(() => {
    if (!Number.isFinite(id)) return
    setMarket(FakeChain.getMarket(id) ?? null)
    
    // Listen for bet events to update the market in real-time
    const updateMarket = () => {
      const updatedMarket = FakeChain.getMarket(id)
      if (updatedMarket) {
        // Create a new object to ensure React detects the change
        setMarket({ ...updatedMarket })
      }
    }
    
    FakeChain.on("BetPlaced", updateMarket)
    FakeChain.on("MarketResolved", updateMarket)
    
    return () => {
      // Cleanup listeners (though FakeChain doesn't have unsubscribe, this is fine for demo)
    }
  }, [id])

  if (!Number.isFinite(id)) {
    return <div className="p-6">Invalid market id.</div>
  }

  if (!market) {
    return <div className="p-6">Market not found (maybe not created yet).</div>
  }

  const getUserAddress = () => {
    return address || user?.custody || user?.verifications?.[0] || "0xDemoUser"
  }

  const betYes = () => {
    FakeChain.bet(market.id, getUserAddress(), "YES", 1)
    // Force update by creating a new object reference
    const updatedMarket = FakeChain.getMarket(market.id)
    if (updatedMarket) {
      setMarket({ ...updatedMarket })
    }
  }

  const betNo = () => {
    FakeChain.bet(market.id, getUserAddress(), "NO", 1)
    // Force update by creating a new object reference
    const updatedMarket = FakeChain.getMarket(market.id)
    if (updatedMarket) {
      setMarket({ ...updatedMarket })
    }
  }

  const resolve = async () => {
    await runResolverFlow(market.id)
    const updatedMarket = FakeChain.getMarket(market.id)
    if (updatedMarket) {
      setMarket({ ...updatedMarket })
    }
  }

  // Calculate percentages for progress bar
  const total = market.totalYes + market.totalNo
  const yesPercentage = total > 0 ? (market.totalYes / total) * 100 : 50
  const noPercentage = total > 0 ? (market.totalNo / total) * 100 : 50

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
        <h1 className="text-4xl font-bold mb-4 text-casino-gold">{market.question}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="font-semibold text-foreground">YES <span className="text-casino-gold">{market.totalYes}</span></span>
          <span className="text-muted-foreground">•</span>
          <span className="font-semibold text-foreground">NO <span className="text-casino-gold">{market.totalNo}</span></span>
        </div>
        {market.status === "RESOLVED" && (
          <div className="mt-4 p-4 rounded-xl bg-secondary border border-border">
            <p className="text-lg font-semibold text-casino-gold">
              Result: {market.result === "YES" ? "YES 🟢" : "NO 🔴"}{" "}
              {market.tier && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (resolved via {market.tier})
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {market.status === "OPEN" && (
        <>
          {/* Progress Bar */}
          <div className="space-y-3 bg-card border border-border rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-foreground">YES <span className="text-casino-gold">{yesPercentage.toFixed(1)}%</span></span>
              <span className="text-foreground">NO <span className="text-casino-gold">{noPercentage.toFixed(1)}%</span></span>
            </div>
            <div className="relative h-12 w-full rounded-full overflow-hidden border-2 border-border bg-muted shadow-inner">
              <div
                className="absolute left-0 top-0 h-full casino-gradient-green casino-glow-green transition-all duration-500 flex items-center justify-center text-white font-bold text-sm"
                style={{ width: `${yesPercentage}%` }}
              >
                {yesPercentage > 15 && `${yesPercentage.toFixed(0)}%`}
              </div>
              <div
                className="absolute right-0 top-0 h-full casino-gradient-red casino-glow-red transition-all duration-500 flex items-center justify-center text-white font-bold text-sm"
                style={{ width: `${noPercentage}%` }}
              >
                {noPercentage > 15 && `${noPercentage.toFixed(0)}%`}
              </div>
            </div>
          </div>

          {/* Bet Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={betYes}
              className="inline-flex items-center justify-center rounded-xl border-2 border-casino px-6 py-4 text-base font-bold text-primary-foreground casino-gradient-green casino-glow-green transition-all hover:scale-105 active:scale-95"
            >
              🟢 Bet YES
            </button>
            <button
              onClick={betNo}
              className="inline-flex items-center justify-center rounded-xl border-2 border-casino px-6 py-4 text-base font-bold text-primary-foreground casino-gradient-red casino-glow-red transition-all hover:scale-105 active:scale-95"
            >
              🔴 Bet NO
            </button>
          </div>

          <div className="pt-2">
            <ApeButton onClick={resolve} className="w-full">
              Resolve (Tier1 → Tier2 → Tier3)
            </ApeButton>
          </div>
        </>
      )}
    </div>
  )
}

