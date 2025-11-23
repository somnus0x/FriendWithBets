// src/app/market/[[...id]]/page.tsx
import { Metadata } from "next"
import { MarketDisplay } from "./market-display"

export const metadata: Metadata = {
  title: "Friend With Bets — Market",
}

export default function MarketPage() {
  return <MarketDisplay />
}

