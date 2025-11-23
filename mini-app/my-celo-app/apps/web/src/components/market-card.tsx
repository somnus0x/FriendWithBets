// src/components/market-card.tsx
import Link from "next/link"
import { Market } from "@/lib/fakeChain"
import { cn } from "@/lib/utils"
import { Badge } from "./ui/badge"
import { buttonVariants } from "./ui/button"

export function MarketCard({
  market,
  children,
  className,
}: {
  market: Market
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-xs">
        <Badge variant="outline" className="border-casino text-casino-gold">#{market.id}</Badge>
        {market.status === "OPEN" ? (
          <Badge variant="default" className="casino-gradient text-primary-foreground">Open</Badge>
        ) : (
          <Badge variant="secondary" className="bg-secondary">
            Resolved {market.result === "YES" ? "YES" : "NO"}
          </Badge>
        )}
      </div>

      <div className="text-lg font-bold text-foreground">{market.question}</div>

      <div className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">YES <span className="text-casino-gold">{market.totalYes}</span></span>
        <span className="mx-2">•</span>
        <span className="font-semibold text-foreground">NO <span className="text-casino-gold">{market.totalNo}</span></span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1" />
        {children ?? (
          <Link
            href={`/market/${market.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Go To Market
          </Link>
        )}
      </div>
    </div>
  )
}

