"use client";

import { useState, useEffect } from "react";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useAccount, useConnect } from "wagmi";
import { FakeChain, Market, Bet } from "@/lib/fakeChain";
import { ApeButton } from "@/components/ape-button";
import { CreateBetFlow } from "@/components/create-bet-flow";
import { MarketCard } from "@/components/market-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Check } from "lucide-react";
import { runResolverFlow } from "@/lib/resolverFlow";

type View = "home" | "discover" | "my-bets" | "market";

export default function Home() {
  const { context, isMiniAppReady } = useMiniApp();
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  
  const [q, setQ] = useState("");
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [currentView, setCurrentView] = useState<View>("home");
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [userBets, setUserBets] = useState<Array<{ market: Market; bets: Bet[] }>>([]);

  // Auto-connect wallet when miniapp is ready
  useEffect(() => {
    if (isMiniAppReady && !isConnected && !isConnecting && connectors.length > 0) {
      const farcasterConnector = connectors.find(c => c.id === 'farcaster');
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    }
  }, [isMiniAppReady, isConnected, isConnecting, connectors, connect]);

  // Load markets
  useEffect(() => {
    const updateMarkets = () => {
      setMarkets(FakeChain.listMarkets());
    };
    updateMarkets();
    FakeChain.on("MarketCreated", updateMarkets);
    FakeChain.on("BetPlaced", updateMarkets);
    FakeChain.on("MarketResolved", updateMarkets);
  }, []);

  // Load user bets
  useEffect(() => {
    const updateBets = () => {
      const user = context?.user;
      const userAddress = address || user?.custody || user?.verifications?.[0] || "0xDemoUser";
      const allBets = FakeChain.getBetsForUser(userAddress);
      
      const betsByMarket = new Map<number, { market: Market; bets: Bet[] }>();
      allBets.forEach((bet) => {
        const market = FakeChain.getMarket(bet.marketId);
        if (market) {
          if (!betsByMarket.has(bet.marketId)) {
            betsByMarket.set(bet.marketId, { market, bets: [] });
          }
          betsByMarket.get(bet.marketId)!.bets.push(bet);
        }
      });
      setUserBets(Array.from(betsByMarket.values()));
    };

    updateBets();
    FakeChain.on("MarketCreated", updateBets);
    FakeChain.on("BetPlaced", updateBets);
    FakeChain.on("MarketResolved", updateBets);
  }, [address, context]);

  // Update selected market when view changes
  useEffect(() => {
    if (currentView === "market" && selectedMarket) {
      const updated = FakeChain.getMarket(selectedMarket.id);
      if (updated) {
        setSelectedMarket({ ...updated });
      }
    }
  }, [markets, currentView, selectedMarket]);

  const handleCreateClick = () => {
    setShowCreateFlow(true);
  };

  const handleMarketCreated = (market: Market) => {
    setShowCreateFlow(false);
    setSelectedMarket(market);
    setCurrentView("market");
  };

  const handleMarketClick = (market: Market) => {
    setSelectedMarket(market);
    setCurrentView("market");
  };

  const getUserAddress = () => {
    const user = context?.user;
    return address || user?.custody || user?.verifications?.[0] || "0xDemoUser";
  };

  // Loading state
  if (!isMiniAppReady) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-casino border-t-transparent mx-auto mb-4 casino-glow"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </section>
      </main>
    );
  }

  // Market Detail View
  if (currentView === "market" && selectedMarket) {
    const market = selectedMarket;
    const total = market.totalYes + market.totalNo;
    const yesPercentage = total > 0 ? (market.totalYes / total) * 100 : 50;
    const noPercentage = total > 0 ? (market.totalNo / total) * 100 : 50;

    const betYes = () => {
      FakeChain.bet(market.id, getUserAddress(), "YES", 1);
      const updated = FakeChain.getMarket(market.id);
      if (updated) {
        setSelectedMarket({ ...updated });
      }
    };

    const betNo = () => {
      FakeChain.bet(market.id, getUserAddress(), "NO", 1);
      const updated = FakeChain.getMarket(market.id);
      if (updated) {
        setSelectedMarket({ ...updated });
      }
    };

    const resolve = async () => {
      await runResolverFlow(market.id);
      const updated = FakeChain.getMarket(market.id);
      if (updated) {
        setSelectedMarket({ ...updated });
      }
    };

    return (
      <main className="flex-1">
        <div className="p-6 max-w-3xl mx-auto space-y-8">
          {/* Back Button */}
          <button
            onClick={() => setCurrentView("discover")}
            className="text-casino-gold hover:underline mb-4"
          >
            ← Back to Markets
          </button>

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
      </main>
    );
  }

  // Discover View
  if (currentView === "discover") {
    return (
      <main className="flex-1">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-casino-gold">Discover Markets</h1>
            <ApeButton onClick={() => setCurrentView("home")}>Create New</ApeButton>
          </div>
          {markets.length === 0 && (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <p className="text-muted-foreground">
                No markets yet. Create one to get started!
              </p>
            </div>
          )}
          <div className="grid gap-6">
            {markets.map((m) => (
              <div key={m.id} onClick={() => handleMarketClick(m)} className="cursor-pointer">
                <MarketCard market={m} />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // My Bets View
  if (currentView === "my-bets") {
    return (
      <main className="flex-1">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-casino-gold">My Bets</h1>
            <ApeButton onClick={() => setCurrentView("home")}>Create New</ApeButton>
          </div>
          {userBets.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
              <p className="text-muted-foreground">
                You haven't placed any bets yet. Discover markets to get started!
              </p>
              <Button
                variant="outline"
                onClick={() => setCurrentView("discover")}
              >
                Discover Markets
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {userBets.map(({ market, bets }) => (
                <div key={market.id} onClick={() => handleMarketClick(market)} className="cursor-pointer">
                  <MarketCard market={market}>
                    <div className="space-y-2">
                      {bets.map((bet) => (
                        <div key={`${bet.marketId}-${bet.side}-${bet.amount}`} className="rounded-md border bg-card p-2 text-sm">
                          <div className="flex items-center">
                            {market.status === "RESOLVED" && market.result === bet.side && (
                              <Check className="mr-2 size-4 text-green-500" />
                            )}
                            <div className="font-semibold">{bet.side}</div>
                            <div className="ml-auto text-muted-foreground">
                              {bet.amount} tokens
                            </div>
                            {market.status === "RESOLVED" && market.result === bet.side && (
                              <Badge className="ml-2" variant="default">Winner</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </MarketCard>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  // Home View
  return (
    <main className="flex-1">
      <div className="flex h-full items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="text-6xl mb-4 animate-pulse">🦍</div>
          <h1 className="text-5xl font-bold mb-4 text-casino-gold">Friend With Bets</h1>
          <p className="text-lg text-muted-foreground mb-10">
            Bet on anything with your friends in three taps.
          </p>

          <div className="flex w-full max-w-xl mx-auto gap-3">
            <input
              className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              placeholder="Will ETH hit $5k before New Year?"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateClick();
                }
              }}
            />
            <ApeButton onClick={handleCreateClick}>Create</ApeButton>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 justify-center mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentView("discover")}
              className="flex-1 max-w-xs"
            >
              Discover Markets
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentView("my-bets")}
              className="flex-1 max-w-xs"
            >
              My Bets
            </Button>
          </div>

          <CreateBetFlow
            open={showCreateFlow}
            onOpenChange={(open) => {
              setShowCreateFlow(open);
              if (!open) {
                setQ("");
              }
            }}
            initialQuestion={q}
            onMarketCreated={handleMarketCreated}
          />

          <p className="mt-6 text-xs text-muted-foreground">
            This demo uses an in-memory FakeChain to simulate Base + resolvers.
          </p>
        </div>
      </div>
    </main>
  );
}
