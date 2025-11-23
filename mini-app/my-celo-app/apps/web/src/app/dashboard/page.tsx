"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useMiniApp } from "@/contexts/miniapp-context"
import { useAccount } from "wagmi"
import { FakeChain, Market, Bet } from "@/lib/fakeChain"
import { MarketCard } from "@/components/market-card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Check } from "lucide-react"

export default function DashboardPage() {
  const { context } = useMiniApp()
  const { address } = useAccount()
  const user = context?.user
  
  const [userBets, setUserBets] = useState<Array<{ market: Market; bets: Bet[] }>>([])

  const getUserAddress = () => {
    return address || user?.custody || user?.verifications?.[0] || "0xDemoUser"
  }

  useEffect(() => {
    const update = () => {
      const userAddress = getUserAddress()
      const allBets = FakeChain.getBetsForUser(userAddress)
      
      // Group bets by market
      const betsByMarket = new Map<number, { market: Market; bets: Bet[] }>()
      
      allBets.forEach((bet) => {
        const market = FakeChain.getMarket(bet.marketId)
        if (market) {
          if (!betsByMarket.has(bet.marketId)) {
            betsByMarket.set(bet.marketId, { market, bets: [] })
          }
          betsByMarket.get(bet.marketId)!.bets.push(bet)
        }
      })
      
      setUserBets(Array.from(betsByMarket.values()))
    }

    update()
    FakeChain.on("MarketCreated", update)
    FakeChain.on("BetPlaced", update)
    FakeChain.on("MarketResolved", update)
  }, [address, user])

  if (userBets.length === 0) {
    return (
      <main className="container flex min-h-screen flex-col gap-6 py-8">
        <h1 className="text-4xl font-bold text-casino-gold">My Bets</h1>
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <p className="text-muted-foreground">
            You haven't placed any bets yet. Discover markets to get started!
          </p>
          <Link href="/discover" className={buttonVariants({ variant: "outline" })}>
            Discover Markets
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="container flex min-h-screen flex-col gap-6 py-8">
      <h1 className="text-4xl font-bold text-casino-gold">My Bets</h1>
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {userBets.map(({ market, bets }) => (
          <MarketCard key={market.id} market={market}>
            <div className="space-y-2">
              {bets.map((bet) => (
                <div key={`${bet.marketId}-${bet.side}-${bet.amount}`} className="rounded-md border bg-card p-2 text-sm">
                  <div className="flex items-center">
                    {market.status === "RESOLVED" && market.result === bet.side && (
                      <Check className="mr-2 size-4 text-green-500" />
                    )}
                    <div className="font-semibold">
                      {bet.side}
                    </div>
                    <div className="ml-auto text-muted-foreground">
                      {bet.amount} tokens
                    </div>
                    {market.status === "RESOLVED" && market.result === bet.side && (
                      <Badge className="ml-2" variant="default">
                        Winner
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Link
              href={`/market/${market.id}`}
              className={buttonVariants({
                variant: "outline",
              })}
            >
              Go To Market
            </Link>
          </MarketCard>
        ))}
      </div>
    </main>
  )
}

