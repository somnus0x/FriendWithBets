export type Side = "YES" | "NO";
export type MarketStatus = "OPEN" | "RESOLVED" | "CANCELLED";

export type Market = {
  id: number;
  question: string;
  creator: string;
  closeTime: number;
  resolveTime: number;
  status: MarketStatus;
  result: Side | null;
  totalYes: number;
  totalNo: number;
  tier?: "TIER1" | "TIER2" | "TIER3";
};

export type Bet = {
  marketId: number;
  user: string;
  side: Side;
  amount: number;
};

type EventName = "MarketCreated" | "BetPlaced" | "MarketResolved";

type MarketCreatedPayload = {
  id: number;
  question: string;
  creator: string;
};

type BetPlacedPayload = {
  id: number;
  user: string;
  side: Side;
  amount: number;
};

type MarketResolvedPayload = {
  id: number;
  result: Side;
  tier: "TIER1" | "TIER2" | "TIER3";
};

type ListenerMap = {
  MarketCreated: (p: MarketCreatedPayload) => void;
  BetPlaced: (p: BetPlacedPayload) => void;
  MarketResolved: (p: MarketResolvedPayload) => void;
};

const state = {
  markets: [] as Market[],
  bets: [] as Bet[],
  nextMarketId: 1,
  listeners: {
    MarketCreated: [] as ListenerMap["MarketCreated"][],
    BetPlaced: [] as ListenerMap["BetPlaced"][],
    MarketResolved: [] as ListenerMap["MarketResolved"][],
  },
};

function emit<E extends EventName>(
  event: E,
  payload: Parameters<ListenerMap[E]>[0]
) {
  for (const cb of state.listeners[event]) {
    // @ts-ignore
    cb(payload);
  }
}

export const FakeChain = {
  on<E extends EventName>(event: E, cb: ListenerMap[E]) {
    // @ts-ignore
    state.listeners[event].push(cb);
  },

  listMarkets(): Market[] {
    return [...state.markets].sort((a, b) => b.id - a.id);
  },

  getMarket(id: number): Market | null {
    return state.markets.find((m) => m.id === id) ?? null;
  },

  getBetsForUser(user: string): Bet[] {
    return state.bets.filter(
      (b) => b.user.toLowerCase() === user.toLowerCase(),
    );
  },

  createMarket(
    question: string,
    creator: string,
    closeTime?: number,
    resolveTime?: number
  ): Market {
    const now = Math.floor(Date.now() / 1000);
    const finalCloseTime = closeTime || now + 3600;
    const finalResolveTime = resolveTime || now + 7200;

    const m: Market = {
      id: state.nextMarketId++,
      question,
      creator,
      closeTime: finalCloseTime,
      resolveTime: finalResolveTime,
      status: "OPEN",
      result: null,
      totalYes: 0,
      totalNo: 0,
    };

    state.markets.push(m);

    emit("MarketCreated", {
      id: m.id,
      question: m.question,
      creator: m.creator,
    });

    return m;
  },

  bet(marketId: number, user: string, side: Side, amount: number): Bet {
    const m = this.getMarket(marketId);
    if (!m) throw new Error("no market");
    if (m.status !== "OPEN") throw new Error("not open");
    if (Math.floor(Date.now() / 1000) >= m.closeTime) throw new Error("closed");

    const b: Bet = { marketId, user, side, amount };
    state.bets.push(b);

    if (side === "YES") m.totalYes += amount;
    else m.totalNo += amount;

    emit("BetPlaced", {
      id: m.id,
      user,
      side,
      amount,
    });

    return b;
  },

  resolve(
    marketId: number,
    result: Side,
    tier: "TIER1" | "TIER2" | "TIER3",
  ): Market {
    const m = this.getMarket(marketId);
    if (!m) throw new Error("no market");

    if (m.status !== "OPEN") {
      return m;
    }

    m.status = "RESOLVED";
    m.result = result;
    m.tier = tier;

    emit("MarketResolved", {
      id: m.id,
      result,
      tier,
    });

    return m;
  },
};

