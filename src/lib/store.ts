import { create } from 'zustand';
import { AssetInfo, Candle, V8TradeRecord, TimeframeVal, ServerStatePayload } from '../types';
import { ASSET_LIST } from '../data';

export type PinLevel = {
  strike: number;
  dollars: number;
  strength: number;
  type: 'support' | 'resistance' | 'magnet';
};

export type PinpointData = {
  spotPrice: number;
  step: number;
  levels: PinLevel[];
};

export type ContractState = {
  contract: string;
  health: number;
  recommendation: 'ENTER' | 'HOLD' | 'REDUCE' | 'EXIT';
  expectedMove: number;
  targets: any[];
  chartData: Candle[];
  pinpoint: PinpointData;
};

interface MarketState {
  open: boolean;
  closeIn: string;
  openIn: string;
}

interface ContractStore {
  // Navigation & View Tabs
  activeTab: 'home' | 'skyvision' | 'pinpoint' | 'discovery' | 'auditor' | 'dealerflow' | 'accountability';
  setActiveTab: (tab: 'home' | 'skyvision' | 'pinpoint' | 'discovery' | 'auditor' | 'dealerflow' | 'accountability') => void;

  // Selected parameters
  selectedAsset: AssetInfo;
  selectedTimeframe: TimeframeVal;
  selectedOptionType: 'C' | 'P';
  selectedStrike: number | null;
  isPositionOpen: boolean;
  isContractLocked: boolean;

  // State caches and broad items
  activeContract: ContractState | null;
  contractCache: Record<string, ContractState>;
  serverState: ServerStatePayload | null;
  trades: V8TradeRecord[];

  // Market status timer
  marketState: MarketState;

  // Actions
  setSelectedAsset: (asset: AssetInfo) => void;
  setSelectedTimeframe: (tf: TimeframeVal) => void;
  setSelectedOptionType: (type: 'C' | 'P') => void;
  setSelectedStrike: (strike: number | null) => void;
  selectContractAtomically: (asset: AssetInfo, strike: number, isCall: boolean) => void;
  setIsPositionOpen: (open: boolean) => void;
  setTrades: (trades: V8TradeRecord[]) => void;
  
  // High-latency prevention: selectContract set instantly!
  selectContract: (ticker: string, strike: number, isCall: boolean) => void;
  updateFromSSE: (payload: ServerStatePayload) => void;
  tickMarketState: () => void;
}

// Global NY/CBOE Market State check function (Bug #8)
export function getMarketState(currentTime = new Date()): MarketState {
  const utcHours = currentTime.getUTCHours();
  const utcMinutes = currentTime.getUTCMinutes();
  const utcSeconds = currentTime.getUTCSeconds();
  const dayOfWeek = currentTime.getUTCDay(); // 0 is Sunday, 6 is Saturday

  // NY market hours: 14:30 UTC to 21:00 UTC (9:30 AM to 4:00 PM EST)
  const utcTimeInSeconds = utcHours * 3600 + utcMinutes * 60 + utcSeconds;
  const marketOpenSeconds = 14 * 3600 + 30 * 60; // 14:30:00
  const marketCloseSeconds = 21 * 3600; // 21:00:00

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isWeekend) {
    // Open in: Monday 14:30
    const daysToMonday = dayOfWeek === 0 ? 1 : 2;
    const secondsToOpen = (daysToMonday * 24 * 3600) + (marketOpenSeconds - utcTimeInSeconds);
    return {
      open: false,
      closeIn: '00:00:00',
      openIn: formatDuration(Math.max(0, secondsToOpen))
    };
  }

  if (utcTimeInSeconds >= marketOpenSeconds && utcTimeInSeconds < marketCloseSeconds) {
    const secondsToClose = marketCloseSeconds - utcTimeInSeconds;
    return {
      open: true,
      closeIn: formatDuration(secondsToClose),
      openIn: '00:00:00'
    };
  } else {
    let secondsToOpen = 0;
    if (utcTimeInSeconds < marketOpenSeconds) {
      secondsToOpen = marketOpenSeconds - utcTimeInSeconds;
    } else {
      // after close, opens tomorrow
      const daysToNextOpen = dayOfWeek === 5 ? 3 : 1;
      secondsToOpen = (daysToNextOpen * 24 * 3600) - (utcTimeInSeconds - marketOpenSeconds);
    }
    return {
      open: false,
      closeIn: '00:00:00',
      openIn: formatDuration(Math.max(0, secondsToOpen))
    };
  }
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0')
  ].join(':');
}

export const useContractStore = create<ContractStore>((set, get) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),

  selectedAsset: ASSET_LIST[0],
  selectedTimeframe: '5m',
  selectedOptionType: 'C',
  selectedStrike: null,
  isPositionOpen: false,
  isContractLocked: false,

  activeContract: null,
  contractCache: {},
  serverState: null,
  trades: [],

  marketState: getMarketState(),

  setSelectedAsset: (asset) => {
    const step = asset.defaultPrice > 1000 ? 100 : asset.defaultPrice > 150 ? 5 : 1;
    const initialStrike = Math.round(asset.defaultPrice / step) * step;
    set({ selectedAsset: asset, selectedStrike: initialStrike, isContractLocked: false });
    get().selectContract(asset.ticker, initialStrike, get().selectedOptionType === 'C');
  },
  setSelectedTimeframe: (tf) => set({ selectedTimeframe: tf }),
  setSelectedOptionType: (type) => {
    const step = get().selectedAsset.defaultPrice > 1000 ? 100 : get().selectedAsset.defaultPrice > 150 ? 5 : 1;
    const currentStrike = get().selectedStrike || Math.round(get().selectedAsset.defaultPrice / step) * step;
    set({ selectedOptionType: type });
    get().selectContract(get().selectedAsset.ticker, currentStrike, type === 'C');
  },
  setSelectedStrike: (strike) => {
    set({ selectedStrike: strike, isContractLocked: strike !== null });
    if (strike) {
      get().selectContract(get().selectedAsset.ticker, strike, get().selectedOptionType === 'C');
    }
  },
  selectContractAtomically: (asset, strike, isCall) => {
    set({
      selectedAsset: asset,
      selectedStrike: strike,
      selectedOptionType: isCall ? 'C' : 'P',
      isContractLocked: false
    });
    get().selectContract(asset.ticker, strike, isCall);
  },
  setIsPositionOpen: (open) => set({ isPositionOpen: open }),
  setTrades: (trades) => set({ trades }),

  selectContract: (ticker, strike, isCall) => {
    const asset = ASSET_LIST.find(a => a.ticker === ticker) || get().selectedAsset;
    const contractKey = `${ticker}-${strike}${isCall ? 'C' : 'P'}`;
    const cached = get().contractCache[contractKey];

    if (cached) {
      set({
        selectedAsset: asset,
        selectedStrike: strike,
        selectedOptionType: isCall ? 'C' : 'P',
        activeContract: cached
      });
    } else {
      // Build immediate high-similarity predicted state to bridge SSE gap (<50ms setup)
      const spot = asset.defaultPrice;
      const step = asset.defaultPrice > 1000 ? 100 : asset.defaultPrice > 150 ? 5 : 1;
      
      const preloadedState: ContractState = {
        contract: `${ticker} ${strike}${isCall ? 'C' : 'P'}`,
        health: 88, // predicted target health
        recommendation: 'HOLD',
        expectedMove: Number((asset.volatility * spot * 0.05).toFixed(1)),
        targets: [],
        chartData: get().activeContract?.chartData || [], // smooth rendering
        pinpoint: {
          spotPrice: spot,
          step,
          levels: []
        }
      };

      set({
        selectedAsset: asset,
        selectedStrike: strike,
        selectedOptionType: isCall ? 'C' : 'P',
        activeContract: preloadedState
      });
    }
  },

  updateFromSSE: (payload: ServerStatePayload) => {
    if (!payload) return;

    // 1. Race condition guard: Ensure the received payload is for the currently selected asset, option type, and strike!
    const payloadTicker = payload.contract.replace('-', ' ').split(' ')[0];
    const currentTicker = get().selectedAsset.ticker;

    const payloadIsCall = payload.provenance?.inputs?.option_type === 'C';
    const currentIsCall = get().selectedOptionType === 'C';

    const payloadStrike = payload.optionStrike;
    const currentStrike = get().selectedStrike;

    if (payloadTicker !== currentTicker) {
      console.warn(`[SSE Race Condition Guard] Ignored stale payload for ${payloadTicker} (active: ${currentTicker})`);
      return;
    }
    if (payloadIsCall !== currentIsCall) {
      console.warn(`[SSE Race Condition Guard] Ignored stale payload for type ${payloadIsCall ? 'C' : 'P'} (active: ${currentIsCall ? 'C' : 'P'})`);
      return;
    }
    if (currentStrike !== null && payloadStrike !== currentStrike) {
      console.warn(`[SSE Race Condition Guard] Ignored stale payload for strike ${payloadStrike} (active: ${currentStrike})`);
      return;
    }

    const contractKey = payload.contract.replace(/\s+/g, '-'); // e.g. "SPX-7620C"
    
    // Pinpoint levels: dollars come straight from the server's per-strike
    // net GEX computation (real chain when live, deterministic mock offline).
    const rawLevels = payload.pinpoint_map?.levels || [];
    const mappedLevels: PinLevel[] = rawLevels.map((lvl: any) => {
      const dollarsStr = lvl.exposureInfo?.match(/([+-]?\$[0-9.]+[BM])/i)?.[1] || '';
      let dollarsNum = 0;
      if (dollarsStr) {
        const value = parseFloat(dollarsStr.replace(/[^0-9.]/g, ''));
        dollarsNum = dollarsStr.endsWith('B') ? value * 1e9 : value * 1e6;
      }
      return {
        strike: lvl.strike,
        dollars: Math.abs(lvl.gexDollars !== undefined ? lvl.gexDollars : dollarsNum),
        strength: lvl.strength,
        type: lvl.label === 'support' || lvl.isPutWall
          ? 'support'
          : lvl.label === 'resistance' || lvl.isCallWall
          ? 'resistance'
          : 'magnet'
      };
    });

    const newContractState: ContractState = {
      contract: payload.contract,
      health: payload.trade_health,
      recommendation: payload.recommendation,
      expectedMove: Number(payload.expected_move?.pct?.replace(/[^0-9.]/g, '') || '0'),
      targets: payload.targets,
      chartData: payload.candles || [],
      pinpoint: {
        spotPrice: payload.pinpoint_map?.spot_price || payload.provenance?.inputs?.underlying_price || 0,
        step: payload.pinpoint_map?.step || 10,
        levels: mappedLevels
      }
    };

    set((state) => {
      const updatedCache = { ...state.contractCache, [contractKey]: newContractState };
      return {
        serverState: payload,
        activeContract: newContractState,
        contractCache: updatedCache,
        trades: payload.trade_archive || [],
        isPositionOpen: payload.recommendation === 'HOLD' || payload.recommendation === 'REDUCE'
      };
    });
  },

  tickMarketState: () => {
    set({ marketState: getMarketState() });
  }
}));
