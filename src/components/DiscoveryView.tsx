import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  Percent, 
  Activity, 
  Zap, 
  Search, 
  ShieldAlert, 
  Flame, 
  Database,
  RefreshCw,
  Sliders,
  DollarSign,
  TrendingDown,
  Volume2
} from 'lucide-react';
import { AssetInfo } from '../types';
import { ASSET_LIST } from '../data';

interface DiscoveryViewProps {
  systemScore: any;
  discovery?: {
    mispricedCalls: any[];
    mispricedPuts: any[];
    mostImproved: any[];
    nearInvalidation: any[];
  };
  onSelectContract: (asset: AssetInfo, strike: number, isCall: boolean) => void;
}

// Complete database of 30 institutional-grade options contracts
const INITIAL_CONTRACTS = [
  // SHELF: CONVICTION
  {
    id: 'spx-7620-c',
    ticker: 'SPX',
    strike: 7620,
    isCall: true,
    health: 96,
    expectedMove: '+42.5%',
    action: 'ENTER' as const,
    narrative: 'Heavy institutional volume cluster matched. Dealer buy walls are perfectly positioned.',
    tagText: 'CONVICTION',
    shelf: 'conviction',
    delta: 0.54,
    gamma: 0.024,
    vega: 0.14,
    theta: -0.81,
    volume: 14205,
    price: 5.40,
    bid: 5.35,
    ask: 5.45,
    t1: 7.20,
    p1: 33
  },
  {
    id: 'spy-515-c',
    ticker: 'SPY',
    strike: 515,
    isCall: true,
    health: 93,
    expectedMove: '+36.2%',
    action: 'ENTER' as const,
    narrative: 'Unusually clean volume profile confirms call momentum.',
    tagText: 'CONVICTION',
    shelf: 'conviction',
    delta: 0.48,
    gamma: 0.038,
    vega: 0.12,
    theta: -0.45,
    volume: 38201,
    price: 3.20,
    bid: 3.18,
    ask: 3.22,
    t1: 4.35,
    p1: 36
  },
  {
    id: 'qqq-448-c',
    ticker: 'QQQ',
    strike: 448,
    isCall: true,
    health: 91,
    expectedMove: '+29.0%',
    action: 'ENTER' as const,
    narrative: 'Dealer block purchases confirm near-term floor.',
    tagText: 'CONVICTION',
    shelf: 'conviction',
    delta: 0.52,
    gamma: 0.041,
    vega: 0.15,
    theta: -0.55,
    volume: 22401,
    price: 4.20,
    bid: 4.15,
    ask: 4.25,
    t1: 5.40,
    p1: 29
  },
  {
    id: 'ndx-18350-c',
    ticker: 'NDX',
    strike: 18350,
    isCall: true,
    health: 90,
    expectedMove: '+31.4%',
    action: 'ENTER' as const,
    narrative: 'Rapid acceleration in derivative order flow on Nasdaq nodes.',
    tagText: 'CONVICTION',
    shelf: 'conviction',
    delta: 0.49,
    gamma: 0.015,
    vega: 0.18,
    theta: -1.25,
    volume: 5204,
    price: 15.50,
    bid: 15.30,
    ask: 15.70,
    t1: 20.30,
    p1: 31
  },
  {
    id: 'spx-7600-c',
    ticker: 'SPX',
    strike: 7600,
    isCall: true,
    health: 95,
    expectedMove: '+39.1%',
    action: 'ENTER' as const,
    narrative: 'Below spot magnet concentration attracts structural institutional buyer hedging.',
    tagText: 'CONVICTION',
    shelf: 'conviction',
    delta: 0.62,
    gamma: 0.021,
    vega: 0.13,
    theta: -0.92,
    volume: 18940,
    price: 11.20,
    bid: 11.10,
    ask: 11.30,
    t1: 15.60,
    p1: 39
  },
  {
    id: 'spy-510-c',
    ticker: 'SPY',
    strike: 510,
    isCall: true,
    health: 92,
    expectedMove: '+34.8%',
    action: 'ENTER' as const,
    narrative: 'Slayer deep learning index detects massive localized volume sweep.',
    tagText: 'CONVICTION',
    shelf: 'conviction',
    delta: 0.58,
    gamma: 0.035,
    vega: 0.13,
    theta: -0.48,
    volume: 45100,
    price: 5.10,
    bid: 5.05,
    ask: 5.15,
    t1: 6.85,
    p1: 34
  },

  // SHELF: IMPROVED / VELOCITY
  {
    id: 'ndx-18300-c',
    ticker: 'NDX',
    strike: 18300,
    isCall: true,
    health: 89,
    expectedMove: '+55.2%',
    action: 'ENTER' as const,
    narrative: 'Rapid jump in scoring index over the last 15 minutes. High expansion.',
    tagText: 'VELOCITY',
    shelf: 'improved',
    delta: 0.58,
    gamma: 0.018,
    vega: 0.19,
    theta: -1.15,
    volume: 6310,
    price: 14.20,
    bid: 14.05,
    ask: 14.35,
    t1: 22.01,
    p1: 55
  },
  {
    id: 'qqq-446-c',
    ticker: 'QQQ',
    strike: 446,
    isCall: true,
    health: 88,
    expectedMove: '+32.4%',
    action: 'ENTER' as const,
    narrative: 'Dealer short blocks have dissolved, freeing up massive room overhead.',
    tagText: 'VELOCITY',
    shelf: 'improved',
    delta: 0.54,
    gamma: 0.043,
    vega: 0.16,
    theta: -0.58,
    volume: 29402,
    price: 3.80,
    bid: 3.75,
    ask: 3.85,
    t1: 5.05,
    p1: 32
  },
  {
    id: 'spy-514-c',
    ticker: 'SPY',
    strike: 514,
    isCall: true,
    health: 87,
    expectedMove: '+28.5%',
    action: 'ENTER' as const,
    narrative: 'Score rating surges as dealers transition from negative gamma to neutral gamma.',
    tagText: 'VELOCITY',
    shelf: 'improved',
    delta: 0.51,
    gamma: 0.039,
    vega: 0.12,
    theta: -0.46,
    volume: 18920,
    price: 2.80,
    bid: 2.77,
    ask: 2.83,
    t1: 3.60,
    p1: 28
  },
  {
    id: 'spx-7660-c',
    ticker: 'SPX',
    strike: 7660,
    isCall: true,
    health: 86,
    expectedMove: '+45.0%',
    action: 'ENTER' as const,
    narrative: 'Breakout momentum identified. Standard dispersion limit predicts vol expansion.',
    tagText: 'VELOCITY',
    shelf: 'improved',
    delta: 0.42,
    gamma: 0.019,
    vega: 0.14,
    theta: -0.84,
    volume: 9811,
    price: 4.80,
    bid: 4.70,
    ask: 4.90,
    t1: 6.95,
    p1: 45
  },
  {
    id: 'qqq-450-c',
    ticker: 'QQQ',
    strike: 450,
    isCall: true,
    health: 85,
    expectedMove: '+26.8%',
    action: 'ENTER' as const,
    narrative: 'Derivative speed indices ticking straight up; fast buy feedback loop active.',
    tagText: 'VELOCITY',
    shelf: 'improved',
    delta: 0.46,
    gamma: 0.040,
    vega: 0.17,
    theta: -0.61,
    volume: 15400,
    price: 2.65,
    bid: 2.61,
    ask: 2.69,
    t1: 3.35,
    p1: 26
  },
  {
    id: 'spx-7640-c',
    ticker: 'SPX',
    strike: 7640,
    isCall: true,
    health: 88,
    expectedMove: '+30.2%',
    action: 'ENTER' as const,
    narrative: 'Rapid acceleration in order flow profile matches strong buy trend.',
    tagText: 'VELOCITY',
    shelf: 'improved',
    delta: 0.52,
    gamma: 0.022,
    vega: 0.13,
    theta: -0.85,
    volume: 12401,
    price: 6.80,
    bid: 6.70,
    ask: 6.90,
    t1: 8.85,
    p1: 30
  },

  // SHELF: MISPRICED / ARBITRAGE
  {
    id: 'spy-442-p',
    ticker: 'SPY',
    strike: 442,
    isCall: false,
    health: 85,
    expectedMove: '+24.1%',
    action: 'HOLD' as const,
    narrative: 'Valuation curve points to an extreme temporary discount on deep puts.',
    tagText: 'MISPRICED',
    shelf: 'mispriced',
    delta: -0.12,
    gamma: 0.008,
    vega: 0.06,
    theta: -0.15,
    volume: 5310,
    price: 0.45,
    bid: 0.43,
    ask: 0.47,
    t1: 0.55,
    p1: 22
  },
  {
    id: 'spx-7650-c',
    ticker: 'SPX',
    strike: 7650,
    isCall: true,
    health: 83,
    expectedMove: '+18.5%',
    action: 'HOLD' as const,
    narrative: 'Priced exceptionally cheap relative to general spot move; heavy IV discount.',
    tagText: 'MISPRICED',
    shelf: 'mispriced',
    delta: 0.45,
    gamma: 0.020,
    vega: 0.14,
    theta: -0.83,
    volume: 8105,
    price: 5.10,
    bid: 5.00,
    ask: 5.20,
    t1: 6.05,
    p1: 18
  },
  {
    id: 'spy-508-p',
    ticker: 'SPY',
    strike: 508,
    isCall: false,
    health: 81,
    expectedMove: '+20.5%',
    action: 'HOLD' as const,
    narrative: 'Theoretical model price sits at $1.85, while active broker ask is $1.35.',
    tagText: 'MISPRICED',
    shelf: 'mispriced',
    delta: -0.38,
    gamma: 0.025,
    vega: 0.11,
    theta: -0.32,
    volume: 12502,
    price: 1.35,
    bid: 1.32,
    ask: 1.38,
    t1: 1.62,
    p1: 20
  },
  {
    id: 'spx-7590-p',
    ticker: 'SPX',
    strike: 7590,
    isCall: false,
    health: 84,
    expectedMove: '+27.0%',
    action: 'ENTER' as const,
    narrative: 'Implied volatility suppression created a perfect risk-to-reward underpricing node.',
    tagText: 'MISPRICED',
    shelf: 'mispriced',
    delta: -0.41,
    gamma: 0.018,
    vega: 0.13,
    theta: -0.75,
    volume: 7500,
    price: 12.80,
    bid: 12.60,
    ask: 13.00,
    t1: 16.25,
    p1: 27
  },
  {
    id: 'qqq-442-p',
    ticker: 'QQQ',
    strike: 442,
    isCall: false,
    health: 80,
    expectedMove: '+19.2%',
    action: 'HOLD' as const,
    narrative: 'Underpriced hedge option with high delta sensitivity relative to current spot.',
    tagText: 'MISPRICED',
    shelf: 'mispriced',
    delta: -0.39,
    gamma: 0.034,
    vega: 0.14,
    theta: -0.42,
    volume: 16210,
    price: 2.15,
    bid: 2.12,
    ask: 2.18,
    t1: 2.56,
    p1: 19
  },
  {
    id: 'ndx-18200-p',
    ticker: 'NDX',
    strike: 18200,
    isCall: false,
    health: 82,
    expectedMove: '+22.4%',
    action: 'HOLD' as const,
    narrative: 'Strong theoretical offset detected. Arbitrage spread calculated at 14.5%.',
    tagText: 'ARBITRAGE',
    shelf: 'mispriced',
    delta: -0.44,
    gamma: 0.014,
    vega: 0.18,
    theta: -1.10,
    volume: 3840,
    price: 42.10,
    bid: 41.50,
    ask: 42.70,
    t1: 51.50,
    p1: 22
  },

  // SHELF: INVALIDATION / BOUNDARIES
  {
    id: 'spx-7610-p',
    ticker: 'SPX',
    strike: 7610,
    isCall: false,
    health: 48,
    expectedMove: '-15.4%',
    action: 'REDUCE' as const,
    narrative: 'Slipped past main dealer GEX hedge floor. Tail risk exponentially flashing high.',
    tagText: 'INVALIDATION',
    shelf: 'invalidation',
    delta: -0.42,
    gamma: 0.021,
    vega: 0.13,
    theta: -0.85,
    volume: 15401,
    price: 18.50,
    bid: 18.30,
    ask: 18.70,
    t1: 15.65,
    p1: -15
  },
  {
    id: 'spy-440-p',
    ticker: 'SPY',
    strike: 440,
    isCall: false,
    health: 51,
    expectedMove: '-10.2%',
    action: 'SELL' as const,
    narrative: 'Liquidity sweep void detected below current level. Immediate defensive alert.',
    tagText: 'INVALIDATION',
    shelf: 'invalidation',
    delta: -0.10,
    gamma: 0.005,
    vega: 0.05,
    theta: -0.12,
    volume: 24500,
    price: 0.35,
    bid: 0.33,
    ask: 0.37,
    t1: 0.31,
    p1: -10
  },
  {
    id: 'spx-7580-p',
    ticker: 'SPX',
    strike: 7580,
    isCall: false,
    health: 41,
    expectedMove: '-24.0%',
    action: 'SELL' as const,
    narrative: 'Extreme threshold crossover boundary triggers automatic institutional liquidation.',
    tagText: 'INVALIDATION',
    shelf: 'invalidation',
    delta: -0.32,
    gamma: 0.016,
    vega: 0.12,
    theta: -0.80,
    volume: 11040,
    price: 8.50,
    bid: 8.35,
    ask: 8.65,
    t1: 6.45,
    p1: -24
  },
  {
    id: 'spy-502-p',
    ticker: 'SPY',
    strike: 502,
    isCall: false,
    health: 45,
    expectedMove: '-18.5%',
    action: 'SELL' as const,
    narrative: 'Brushed beneath primary dealer put wall support. Hedging dynamics turned negative.',
    tagText: 'INVALIDATION',
    shelf: 'invalidation',
    delta: -0.28,
    gamma: 0.022,
    vega: 0.09,
    theta: -0.28,
    volume: 19105,
    price: 2.10,
    bid: 2.05,
    ask: 2.15,
    t1: 1.71,
    p1: -18
  },
  {
    id: 'qqq-438-p',
    ticker: 'QQQ',
    strike: 438,
    isCall: false,
    health: 49,
    expectedMove: '-14.0%',
    action: 'REDUCE' as const,
    narrative: 'Unwinds beneath crucial volume-weighted index pivot. Support levels dissolve.',
    tagText: 'INVALIDATION',
    shelf: 'invalidation',
    delta: -0.31,
    gamma: 0.028,
    vega: 0.12,
    theta: -0.38,
    volume: 14210,
    price: 3.15,
    bid: 3.10,
    ask: 3.20,
    t1: 2.70,
    p1: -14
  },
  {
    id: 'ndx-18100-p',
    ticker: 'NDX',
    strike: 18100,
    isCall: false,
    health: 38,
    expectedMove: '-32.5%',
    action: 'SELL' as const,
    narrative: 'System score degraded as gamma flip point triggers extreme margin sell hedging.',
    tagText: 'INVALIDATION',
    shelf: 'invalidation',
    delta: -0.36,
    gamma: 0.010,
    vega: 0.16,
    theta: -1.02,
    volume: 2901,
    price: 28.50,
    bid: 28.00,
    ask: 29.00,
    t1: 19.20,
    p1: -32
  },

  // SHELF: WHALE SWEEPS
  {
    id: 'spx-7700-c',
    ticker: 'SPX',
    strike: 7700,
    isCall: true,
    health: 94,
    expectedMove: '+62.4%',
    action: 'ENTER' as const,
    narrative: 'Block institutional trades sweep SPX 7700 strike, representing $14.2M notional.',
    tagText: 'WHALE',
    shelf: 'whale',
    delta: 0.35,
    gamma: 0.018,
    vega: 0.15,
    theta: -0.78,
    volume: 62400,
    price: 2.45,
    bid: 2.40,
    ask: 2.50,
    t1: 3.98,
    p1: 62
  },
  {
    id: 'ndx-18500-c',
    ticker: 'NDX',
    strike: 18500,
    isCall: true,
    health: 91,
    expectedMove: '+75.0%',
    action: 'ENTER' as const,
    narrative: 'Massive out-of-the-money block trade cluster. Aggressive bullish volatility positioning.',
    tagText: 'WHALE',
    shelf: 'whale',
    delta: 0.30,
    gamma: 0.010,
    vega: 0.17,
    theta: -1.08,
    volume: 11400,
    price: 8.90,
    bid: 8.70,
    ask: 9.10,
    t1: 15.55,
    p1: 75
  },
  {
    id: 'spy-520-c',
    ticker: 'SPY',
    strike: 520,
    isCall: true,
    health: 89,
    expectedMove: '+44.1%',
    action: 'ENTER' as const,
    narrative: 'Sweeps executed on Ask price consistently over the last 10 minutes. Bull run.',
    tagText: 'WHALE',
    shelf: 'whale',
    delta: 0.34,
    gamma: 0.031,
    vega: 0.11,
    theta: -0.40,
    volume: 92400,
    price: 1.15,
    bid: 1.12,
    ask: 1.18,
    t1: 1.65,
    p1: 44
  },
  {
    id: 'qqq-455-c',
    ticker: 'QQQ',
    strike: 455,
    isCall: true,
    health: 88,
    expectedMove: '+38.5%',
    action: 'ENTER' as const,
    narrative: 'Multimillion institutional block sweep targeting the upper resistance channel wall.',
    tagText: 'WHALE',
    shelf: 'whale',
    delta: 0.32,
    gamma: 0.033,
    vega: 0.13,
    theta: -0.52,
    volume: 51200,
    price: 1.45,
    bid: 1.41,
    ask: 1.49,
    t1: 2.01,
    p1: 38
  },
  {
    id: 'spx-7500-p',
    ticker: 'SPX',
    strike: 7500,
    isCall: false,
    health: 85,
    expectedMove: '+52.0%',
    action: 'HOLD' as const,
    narrative: 'Huge defensive protective put basket sweep ($22.4M notional hedge) detected.',
    tagText: 'WHALE',
    shelf: 'whale',
    delta: -0.19,
    gamma: 0.010,
    vega: 0.09,
    theta: -0.55,
    volume: 48900,
    price: 4.80,
    bid: 4.70,
    ask: 4.90,
    t1: 7.30,
    p1: 52
  },
  {
    id: 'ndx-17800-p',
    ticker: 'NDX',
    strike: 17800,
    isCall: false,
    health: 83,
    expectedMove: '+48.5%',
    action: 'HOLD' as const,
    narrative: 'Significant tail protection sweep blocks are locking up hedge positions at put wall.',
    tagText: 'WHALE',
    shelf: 'whale',
    delta: -0.15,
    gamma: 0.008,
    vega: 0.12,
    theta: -0.78,
    volume: 8520,
    price: 12.40,
    bid: 12.10,
    ask: 12.70,
    t1: 18.40,
    p1: 48
  }
];

// Seed initial historical feed logs
const INITIAL_FEED_LOGS = [
  { timestamp: '01:34:25', ticker: 'SPX', strike: 7620, type: 'C', side: 'Sweep', size: '280 cons', premium: '$151,200', tag: 'BULLISH', action: 'SWEPT @ ASK' },
  { timestamp: '01:34:10', ticker: 'QQQ', strike: 448, type: 'C', side: 'Block', size: '1,200 cons', premium: '$504,000', tag: 'BULLISH', action: 'AT ASK' },
  { timestamp: '01:33:48', ticker: 'NDX', strike: 18350, type: 'C', side: 'Block', size: '150 cons', premium: '$232,500', tag: 'BULLISH', action: 'ABOVE ASK' },
  { timestamp: '01:33:02', ticker: 'SPY', strike: 508, type: 'P', side: 'Sweep', size: '2,500 cons', premium: '$337,500', tag: 'BEARISH', action: 'SWEPT @ ASK' },
  { timestamp: '01:31:55', ticker: 'SPX', strike: 7700, type: 'C', side: 'Block', size: '3,000 cons', premium: '$735,000', tag: 'BULLISH', action: 'OFF-EXCHANGE' },
  { timestamp: '01:30:22', ticker: 'NDX', strike: 17800, type: 'P', side: 'Sweep', size: '400 cons', premium: '$496,000', tag: 'HEDGE', action: 'SWEPT @ ASK' },
  { timestamp: '01:29:15', ticker: 'SPY', strike: 515, type: 'C', side: 'Sweep', size: '1,800 cons', premium: '$576,000', tag: 'BULLISH', action: 'SWEPT @ ASK' },
  { timestamp: '01:28:40', ticker: 'QQQ', strike: 455, type: 'C', side: 'Sweep', size: '2,400 cons', premium: '$348,000', tag: 'BULLISH', action: 'ABOVE ASK' }
];

export function DiscoveryView({
  systemScore,
  discovery,
  onSelectContract
}: DiscoveryViewProps) {
  const [contracts, setContracts] = useState(INITIAL_CONTRACTS);
  const [activeShelf, setActiveShelf] = useState<'conviction' | 'improved' | 'mispriced' | 'invalidation' | 'whale' | 'all'>('conviction');
  const [searchQuery, setSearchQuery] = useState('');
  const [optionTypeFilter, setOptionTypeFilter] = useState<'all' | 'calls' | 'puts'>('all');
  const [feedLogs, setFeedLogs] = useState(INITIAL_FEED_LOGS);
  const [lastFlashingId, setLastFlashingId] = useState<string | null>(null);
  const [flashDirection, setFlashDirection] = useState<'up' | 'down'>('up');
  const [metricsPulse, setMetricsPulse] = useState(false);

  // Stats tickers that change slightly
  const [brierScore, setBrierScore] = useState(0.042);
  const [globalGex, setGlobalGex] = useState(485.4);
  const [scanRate, setScanRate] = useState(14.8);

  // Establish live SSE stream directly from our backend for options discoveries
  useEffect(() => {
    const url = '/api/stream/discovery';
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.contracts) setContracts(data.contracts);
        if (data.feedLogs) setFeedLogs(data.feedLogs);
        if (typeof data.brierScore === 'number') setBrierScore(data.brierScore);
        if (typeof data.globalGex === 'number') setGlobalGex(data.globalGex);
        if (typeof data.scanRate === 'number') setScanRate(data.scanRate);
        if (data.lastFlashingId) {
          setLastFlashingId(data.lastFlashingId);
          if (data.flashDirection) setFlashDirection(data.flashDirection);
          
          setMetricsPulse(true);
          setTimeout(() => setMetricsPulse(false), 500);

          setTimeout(() => {
            setLastFlashingId(null);
          }, 700);
        }
      } catch (err) {
        console.error('[SkyVision Discovery Client] Error parsing SSE Stream', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[SkyVision Discovery Client] EventSource Error', err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Combined filtering of our expanded database
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      // 1. Shelf check
      if (activeShelf !== 'all' && c.shelf !== activeShelf) {
        return false;
      }
      // 2. Call/Put check
      if (optionTypeFilter === 'calls' && !c.isCall) return false;
      if (optionTypeFilter === 'puts' && c.isCall) return false;
      
      // 3. Search query check (search strike or ticker)
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toUpperCase();
        const matchesTicker = c.ticker.includes(query);
        const matchesStrike = String(c.strike).includes(query);
        const matchesType = (query === 'C' || query === 'CALL') ? c.isCall : (query === 'P' || query === 'PUT') ? !c.isCall : false;
        return matchesTicker || matchesStrike || matchesType;
      }
      return true;
    });
  }, [contracts, activeShelf, optionTypeFilter, searchQuery]);

  // Quick statistics for display
  const metricsOverview = useMemo(() => {
    const totalCount = contracts.length;
    const enterCount = contracts.filter(c => c.health >= 88).length;
    const extremeEV = contracts.filter(c => c.shelf === 'whale' || c.shelf === 'conviction').length;
    return {
      totalCount,
      enterCount,
      extremeEV
    };
  }, [contracts]);

  // Match corresponding AssetInfo object to trigger selection
  const handleSelectWithMatch = (ticker: string, strike: number, isCall: boolean) => {
    const asset = ASSET_LIST.find(a => a.ticker === ticker);
    if (asset) {
      onSelectContract(asset, strike, isCall);
    }
  };

  return (
    <div className="w-full text-zinc-200 flex flex-col font-mono select-none antialiased space-y-6 max-w-6xl mx-auto pt-2 pb-12">
      
      {/* 1. TOP DENSE STATUS BAR (Same as Skyeyes Core Cockpit styling) */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-[#050505] border border-zinc-900 p-4 rounded-xl gap-4 md:gap-2 shadow-2xl relative overflow-hidden">
        
        {/* Glow corner element */}
        <div className="absolute top-0 left-0 w-16 h-16 bg-white/5 blur-xl pointer-events-none" />

        <div className="flex items-center gap-2.5 relative z-10">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping absolute" />
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full relative z-10" />
          </div>
          <div>
            <h1 className="text-xs font-black text-white tracking-widest uppercase">
              SLAYER DISCOVERY COCKPIT <span className="text-zinc-600">/ EXCURSION MATRIX v1.2</span>
            </h1>
            <p className="text-[9.5px] text-zinc-500 mt-0.5 uppercase tracking-wide">
              REAL-TIME POSITIONING • STREAMING EXCURSIONS ACTIVE
            </p>
          </div>
        </div>

        {/* Live Cockpit Statistics Panel */}
        <div className="flex items-center gap-4 flex-wrap text-left text-[10px] md:border-l md:border-zinc-900 md:pl-5">
          <div className="space-y-0.5">
            <span className="text-[7.5px] text-zinc-600 uppercase block tracking-wider font-extrabold">GLOBAL GEX SUPPORT</span>
            <span className="text-emerald-400 font-bold block transition-all duration-300">
              +{globalGex.toFixed(1)}M
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[7.5px] text-zinc-600 uppercase block tracking-wider font-extrabold">SYSTEM BRIER FIT</span>
            <span className="text-white font-mono font-bold block transition-all duration-300">
              {brierScore.toFixed(4)}
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[7.5px] text-zinc-600 uppercase block tracking-wider font-extrabold">SCANNING RATE</span>
            <span className={`text-[#4f8cff] font-bold block transition-all duration-300 ${metricsPulse ? 'animate-bounce' : ''}`}>
              {scanRate.toFixed(1)}/s
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[7.5px] text-zinc-600 uppercase block tracking-wider font-extrabold">LATENCY</span>
            <span className="text-zinc-400 font-bold block">12ms</span>
          </div>
        </div>

      </div>

      {/* 2. DUSTING BENTO-COMPLIANT CONTROLS BAR (Segmented Selection, Filters, Search) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-[#020202] border border-zinc-900/80 p-3 rounded-lg shadow-xl">
        
        {/* Navigation Categories Tabs */}
        <div className="md:col-span-8 flex items-center bg-black p-0.5 border border-zinc-900 rounded-md overflow-x-auto scrollbar-none gap-0.5">
          {[
            { id: 'conviction', label: '🎯 CONVICTION', count: contracts.filter(c => c.shelf === 'conviction').length },
            { id: 'improved', label: '📈 VELOCITY', count: contracts.filter(c => c.shelf === 'improved').length },
            { id: 'mispriced', label: '💎 ARBITRAGE', count: contracts.filter(c => c.shelf === 'mispriced').length },
            { id: 'invalidation', label: '⚠️ BOUNDARIES', count: contracts.filter(c => c.shelf === 'invalidation').length },
            { id: 'whale', label: '🐳 WHALE SWEEPS', count: contracts.filter(c => c.shelf === 'whale').length },
            { id: 'all', label: '📂 ALL DETECTED', count: contracts.length }
          ].map(shelf => (
            <button
              key={shelf.id}
              onClick={() => setActiveShelf(shelf.id as any)}
              className={`px-3 py-1.5 text-[9.5px] uppercase font-black tracking-wider rounded-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeShelf === shelf.id
                  ? 'bg-white text-black font-extrabold shadow'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>{shelf.label}</span>
              <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${activeShelf === shelf.id ? 'bg-zinc-200 text-black' : 'bg-zinc-950 text-zinc-650'}`}>
                {shelf.count}
              </span>
            </button>
          ))}
        </div>

        {/* Option Call/Put Type Filter Option */}
        <div className="md:col-span-2 flex justify-center bg-black p-0.5 border border-zinc-900 rounded-md">
          {[
            { id: 'all', label: 'ALL' },
            { id: 'calls', label: 'C' },
            { id: 'puts', label: 'P' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setOptionTypeFilter(opt.id as any)}
              className={`px-3.5 py-1.5 text-[8.5px] uppercase font-extrabold rounded-xs flex-1 transition-all cursor-pointer ${
                optionTypeFilter === opt.id
                  ? 'bg-[#4f8cff]/15 text-[#4f8cff] border border-[#4f8cff]/30'
                  : 'text-zinc-500 hover:text-white border border-transparent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Mini Ticker/Strike search box */}
        <div className="md:col-span-2 relative flex items-center bg-[#070707] border border-zinc-900 rounded-md px-2 py-1">
          <Search className="w-3.5 h-3.5 text-zinc-600 mr-1 shrink-0" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="FILTER..." 
            className="w-full bg-transparent border-none text-[10px] text-white font-black uppercase focus:outline-none placeholder-zinc-700 font-mono" 
          />
          {searchQuery.length > 0 && (
            <button onClick={() => setSearchQuery('')} className="text-zinc-600 hover:text-white text-[8px] uppercase font-bold pl-1">
              CLEAR
            </button>
          )}
        </div>

      </div>

      {/* 3. CORE DUAL-COLUMN HIGH-PERFORMANCE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        
        {/* ==========================================
            LEFT COLUMN: THE EXCURSION MATRIX CARD GRID (8 COLS)
            ========================================== */}
        <div className="lg:col-span-8 flex flex-col gap-4 w-full">
          
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              DISPLAYING {filteredContracts.length} MATCHING EXCURSIONS OF {contracts.length} DETECTED NODES
            </span>
            <div className="flex items-center gap-1.5 text-[9px] text-[#A1A1AA] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              <span>LIVE FEED LOCK</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <AnimatePresence mode="popLayout">
              {filteredContracts.map((c) => {
                const actionColor = c.action === 'ENTER' 
                  ? 'text-[#00ff88] border-[#00ff88]/20 bg-[#00ff88]/5' 
                  : c.action === 'SELL' 
                    ? 'text-rose-400 border-rose-400/20 bg-rose-400/5' 
                    : 'text-amber-400 border-amber-400/20 bg-amber-400/5';
                
                const isFlashing = lastFlashingId === c.id;
                const highlightBg = isFlashing 
                  ? (flashDirection === 'up' ? 'bg-emerald-500/10 border-emerald-400/40' : 'bg-rose-500/10 border-rose-400/40')
                  : 'bg-[#030303] hover:border-zinc-750 hover:bg-[#060606] border-zinc-900';

                return (
                  <motion.div
                    layout
                    key={c.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className={`p-4 border rounded-xl flex flex-col gap-4 text-left relative overflow-hidden shadow-xl transition-all duration-300 cursor-pointer ${highlightBg}`}
                    onClick={() => handleSelectWithMatch(c.ticker, c.strike, c.isCall)}
                  >
                    
                    {/* Tiny neon glider strip */}
                    <div className={`absolute top-0 left-0 right-0 h-[2px] transition-colors duration-300 ${
                      c.isCall ? 'bg-emerald-500/30' : 'bg-rose-500/30'
                    }`} />

                    {/* Top Contract Badge & Header */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-black font-sans px-2.5 py-0.5 rounded-md border uppercase inline-block ${
                            c.isCall 
                              ? 'bg-emerald-950/20 text-[#00ff88] border-emerald-900/45' 
                              : 'bg-rose-950/20 text-rose-400 border-rose-900/45'
                          }`}>
                            {c.ticker} {c.strike}{c.isCall ? 'C' : 'P'}
                          </span>
                          <span className="inline-flex items-center gap-1 bg-black/60 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[7.5px] font-black text-emerald-400 tracking-widest uppercase">
                            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                            LIVE
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[7.5px] uppercase tracking-wider text-zinc-500 font-extrabold font-mono">
                            HEALTH: {c.health} PTS
                          </span>
                          <span className="text-zinc-650">•</span>
                          <span className={`text-[7.5px] uppercase tracking-wider font-extrabold ${actionColor}`}>
                            {c.action}
                          </span>
                        </div>
                      </div>

                      {/* Expected Return */}
                      <div className="text-right space-y-0.5">
                        <span className="text-[7.5px] text-zinc-650 tracking-wider block font-bold uppercase">EXPECTED ARR</span>
                        <span className={`text-sm font-black tracking-tight ${c.health >= 55 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {c.expectedMove}
                        </span>
                      </div>
                    </div>

                    {/* Short Analytical Narrative */}
                    <p className="text-[10px] text-zinc-400 font-sans tracking-wide leading-relaxed uppercase border-t border-zinc-900/50 pt-2.5">
                      {c.narrative}
                    </p>

                    {/* Quantitative Stats Matrix */}
                    <div className="bg-black/40 border border-zinc-900/50 rounded-lg p-2.5 grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                      <div>
                        <span className="block text-[7.5px] text-zinc-600 mb-0.5 tracking-wider uppercase">DELTA</span>
                        <span className={`font-bold block ${c.isCall ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>{c.delta}</span>
                      </div>
                      <div>
                        <span className="block text-[7.5px] text-zinc-600 mb-0.5 tracking-wider uppercase">GAMMA</span>
                        <span className="text-white block">{c.gamma}</span>
                      </div>
                      <div>
                        <span className="block text-[7.5px] text-zinc-600 mb-0.5 tracking-wider uppercase">THETA</span>
                        <span className="text-amber-500/80 block">{c.theta}</span>
                      </div>
                      <div>
                        <span className="block text-[7.5px] text-zinc-600 mb-0.5 tracking-wider uppercase">VOL (K)</span>
                        <span className="text-zinc-400 font-bold block">{(c.volume / 1000).toFixed(1)}k</span>
                      </div>
                    </div>

                    {/* Pricing Segment */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-zinc-900/50 text-[10.5px]">
                      <div className="space-y-0.5">
                        <span className="text-[7.5px] text-zinc-600 uppercase block tracking-wider font-bold">BID / ASK SPREAD</span>
                        <span className="text-zinc-400 font-mono font-bold block">
                          ${c.bid.toFixed(2)} - ${c.ask.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[7.5px] text-zinc-500 uppercase block tracking-wider font-bold">LIVE MID</span>
                        <motion.span 
                          animate={isFlashing ? { scale: [1, 1.1, 1] } : {}}
                          className={`text-xs font-black block transition-all duration-300 ${
                            isFlashing 
                              ? (flashDirection === 'up' ? 'text-[#00ff88]' : 'text-rose-400')
                              : 'text-white'
                          }`}
                        >
                          ${c.price.toFixed(2)}
                        </motion.span>
                      </div>
                    </div>

                    {/* Action Button matching Skyeyes Call to Action */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectWithMatch(c.ticker, c.strike, c.isCall);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-zinc-900 to-black hover:from-white hover:to-white hover:text-black border border-zinc-800 text-[8px] text-zinc-400 hover:text-black font-extrabold uppercase tracking-widest rounded-md mt-1 transition-all duration-300 cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>LAUNCH DEEP SKYEYES ASSESSMENT</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>

                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredContracts.length === 0 && (
              <div className="col-span-2 bg-[#050505] border border-zinc-900 p-8 rounded-xl text-center text-zinc-500 uppercase text-xs space-y-2">
                <ShieldAlert className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="font-extrabold tracking-widest text-[10px]">No active scanner signals discovered</p>
                <p className="text-[9px] text-zinc-700 leading-snug">
                  Try clearing the filters or modifying your manual search terms above.
                </p>
              </div>
            )}

          </div>

          {/* EXCURSION GRID SUMMARY */}
          <div className="w-full bg-[#050505] border border-zinc-900 rounded-xl p-5 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xl">
            <div className="space-y-1">
              <span className="text-[8.5px] text-[#4f8cff] tracking-widest uppercase font-black block">OPPORTUNITY DENSITY</span>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide leading-relaxed font-sans font-medium">
                Slayer.trade models automatically weigh dealer positioning scores (DEX/GEX), expected moves, and continuous calibration matrices across 1,248 concurrent options contracts. Select details of any contract block above to inspect dynamic target coordinates.
              </p>
            </div>
            <div className="flex gap-4 shrink-0 text-left border-t md:border-t-0 md:border-l border-zinc-900/60 pt-3 md:pt-0 md:pl-5">
              <div>
                <span className="text-[7px] text-zinc-650 uppercase font-black tracking-widest block">ENTER SIGNAL RATIO</span>
                <span className="text-sm font-black text-white">{((metricsOverview.enterCount / metricsOverview.totalCount) * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-[7px] text-zinc-650 uppercase font-black tracking-widest block">EXTREME NOTIONAL</span>
                <span className="text-sm font-black text-emerald-400">+{metricsOverview.extremeEV} Blocks</span>
              </div>
            </div>
          </div>

        </div>

        {/* ==========================================
            RIGHT COLUMN: INSTITUTIONAL FLOW FEED & WHALE COGNITION (4 COLS)
            ========================================== */}
        <div className="lg:col-span-4 flex flex-col gap-4 w-full">
          
          {/* A. WHALE DETECTION PANEL */}
          <div className="bg-[#050505] border border-zinc-900 rounded-xl p-4.5 text-left relative overflow-hidden shadow-2xl flex flex-col gap-3.5">
            
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-2xl pointer-events-none" />

            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
              <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
              <h2 className="text-[10.5px] font-black text-white uppercase tracking-widest">
                LARGEST WHALE DETECTIONS
              </h2>
            </div>

            <div className="space-y-2.5">
              
              {/* Bullish position */}
              <div className="bg-black/60 border border-zinc-900 p-2.5 rounded-lg flex justify-between items-center text-[10px]">
                <div className="space-y-0.5">
                  <span className="text-[7px] text-zinc-600 uppercase block font-black">LARGEST BULLISH BLOCK</span>
                  <span className="text-[#00ff88] font-bold block">SPX 7700C (Call)</span>
                  <span className="text-[8px] text-zinc-400 font-sans uppercase">Premium: $14.2M Notional</span>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-[7px] text-zinc-600 block uppercase font-bold">DEALER IMPACT</span>
                  <span className="text-white block font-black font-mono">CRITICAL</span>
                  <span className="text-[8.5px] px-1 py-0.2 bg-emerald-500/10 border border-emerald-500/20 text-[#00ff88] rounded font-bold">HIGH DELTA</span>
                </div>
              </div>

              {/* Bearish Position */}
              <div className="bg-black/60 border border-zinc-900 p-2.5 rounded-lg flex justify-between items-center text-[10px]">
                <div className="space-y-0.5">
                  <span className="text-[7px] text-zinc-600 uppercase block font-black">LARGEST HEDGE PUT Sweep</span>
                  <span className="text-rose-400 font-bold block">SPX 7500P (Put)</span>
                  <span className="text-[8px] text-zinc-400 font-sans uppercase">Premium: $22.4M Notional</span>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-[7px] text-zinc-600 block uppercase font-bold">DEALER IMPACT</span>
                  <span className="text-white block font-black font-mono">MODERATE</span>
                  <span className="text-[8.5px] px-1 py-0.2 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded font-bold">WALL ANCHOR</span>
                </div>
              </div>

              {/* QQQ Outflow */}
              <div className="bg-black/60 border border-zinc-900 p-2.5 rounded-lg flex justify-between items-center text-[10px]">
                <div className="space-y-0.5">
                  <span className="text-[7px] text-zinc-600 uppercase block font-black">LARGEST SPECULATIVE BLOCKS</span>
                  <span className="text-[#4f8cff] font-bold block">NDX 18500C (Call)</span>
                  <span className="text-[8px] text-zinc-400 font-sans uppercase">Premium: $8.9M Notional</span>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-[7px] text-zinc-600 block uppercase font-bold">GEX BIAS</span>
                  <span className="text-white block font-black font-mono">SUPPRESSED</span>
                  <span className="text-[8.5px] px-1 py-0.2 bg-[#4f8cff]/10 border border-col-[#4f8cff]/20 text-[#4f8cff] rounded font-bold">VOL SQUEEZE</span>
                </div>
              </div>

            </div>

          </div>

          {/* B. INSTITUTIONAL FLOW FEED (REAL-TIME SCROLLING WORKSPACE) */}
          <div className="bg-[#050505] border border-zinc-900 rounded-xl p-4.5 text-left relative overflow-hidden shadow-2xl flex flex-col gap-3.5">
            
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4f8cff] animate-ping absolute" />
                <Database className="w-4 h-4 text-[#4f8cff] relative z-10" />
                <h2 className="text-[10.5px] font-black text-white uppercase tracking-widest pl-1">
                  LIVE OPTION FLOW SECURE TAPE
                </h2>
              </div>
              <span className="text-[7.5px] text-[#A1A1AA] uppercase tracking-widest font-black bg-[#4f8cff]/15 px-1.5 py-0.5 border border-[#4f8cff]/25 rounded">
                SECURE STREAM
              </span>
            </div>

            {/* Scrolling Tape Container */}
            <div className="h-[285px] overflow-y-auto scrollbar-thin divide-y divide-zinc-950 pr-1 select-none flex flex-col gap-1.5">
              <AnimatePresence initial={false}>
                {feedLogs.map((log, index) => {
                  const isGoldSweep = log.side === 'Sweep';
                  const isBullish = log.tag === 'BULLISH';
                  
                  return (
                    <motion.div
                      key={`${log.timestamp}-${index}`}
                      initial={{ opacity: 0, x: 20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="py-2.5 bg-black/40 border border-zinc-900/40 rounded-lg px-2.5 hover:bg-black/60 transition-colors flex flex-col gap-1 text-[9.5px]"
                    >
                      <div className="flex justify-between items-center text-[9px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-600 font-mono font-bold">{log.timestamp}</span>
                          <span className={`px-1 py-0.2 rounded font-black text-[7.5px] ${
                            isGoldSweep ? 'bg-amber-400/10 border border-amber-400/25 text-amber-400' : 'bg-[#4f8cff]/10 border border-[#4f8cff]/25 text-[#4f8cff]'
                          }`}>
                            {log.side.toUpperCase()}
                          </span>
                        </div>
                        <span className={`font-mono font-extrabold ${isBullish ? 'text-emerald-400' : 'text-amber-500'}`}>
                          {log.action}
                        </span>
                      </div>

                      <div className="flex justify-between items-baseline font-mono font-bold">
                        <span className="text-white text-[10.5px]">
                          {log.ticker} {log.strike}{log.type}
                        </span>
                        <span className={isBullish ? 'text-emerald-400' : 'text-amber-400'}>
                          {log.premium}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[8.5px] text-zinc-500 pt-0.5 border-t border-zinc-950 border-dashed">
                        <span>SIZE: {log.size}</span>
                        <span>BIAS: <span className={isBullish ? 'text-emerald-500/80 font-bold' : 'text-zinc-400 font-bold'}>{log.tag}</span></span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Bottom active status ticker */}
            <div className="text-[7.5px] text-zinc-650 bg-black/80 p-2 rounded border border-zinc-950 font-black flex justify-between items-center uppercase">
              <span>STREAMING ACTIVE</span>
              <span className="animate-pulse">● FEED ONLINE</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
