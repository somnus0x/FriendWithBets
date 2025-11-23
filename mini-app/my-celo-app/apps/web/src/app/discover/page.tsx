// src/app/discover/page.tsx
"use client"

import { useEffect, useState } from "react"
import { FakeChain, Market } from "@/lib/fakeChain"
import { MarketCard } from "@/components/market-card"

export default function DiscoverPage() {
  const [markets, setMarkets] = useState<Market[]>([])

  useEffect(() => {
    setMarkets(FakeChain.listMarkets())
    // In a demo you can optionally subscribe to events and update live
    const update = () => setMarkets(FakeChain.listMarkets())
    FakeChain.on("MarketCreated", update)
    FakeChain.on("BetPlaced", update)
    FakeChain.on("MarketResolved", update)
    return () => {
      // no unsubscribe API; fine for demo
    }
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-4xl font-bold mb-2 text-casino-gold">Discover Markets</h1>
      {markets.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">
            No markets yet. Create one from the home screen.
          </p>
        </div>
      )}
      <div className="grid gap-6">
        {markets.map((m) => (
          <MarketCard key={m.id} market={m} />
        ))}
      </div>
    </div>
  )
}

