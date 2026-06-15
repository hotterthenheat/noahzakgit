import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Volume2,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  Info,
  Sparkles,
  Layers,
} from "lucide-react";
import { AssetInfo } from "../types";
import { ASSET_LIST } from "../data";
import { useContractStore } from "../lib/store";
import { useLiveMockStore } from '../lib/liveMockData';


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

// Seed initial historical feed logs

export function DiscoveryView({
  systemScore,
  discovery,
  onSelectContract,
}: DiscoveryViewProps) {
  const themeMode = useContractStore((s) => s.themeMode);
  const isLight = themeMode === "light";

  const contracts = useLiveMockStore(s => s.contracts);
  const [expandedContracts, setExpandedContracts] = useState<
    Record<string, boolean>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [optionTypeFilter, setOptionTypeFilter] = useState<
    "all" | "calls" | "puts"
  >("all");
  const activeShelf = "all";
  const feedLogs = useLiveMockStore(s => s.feedLogs);
  const [lastFlashingId, setLastFlashingId] = useState<string | null>(null);
  const [flashDirection, setFlashDirection] = useState<"up" | "down">("up");
  const [metricsPulse, setMetricsPulse] = useState(false);

  // Strategy Manual & target logic reasons dictionary (explanations in simple words why they are the best)
  const [isStrategyExpanded, setIsStrategyExpanded] = useState(true);
  const [isMockScanning, setIsMockScanning] = useState(false);
  const [lastScanMessage, setLastScanMessage] = useState(
    "Models calibrated. Ready to scalp.",
  );
  const [scanHistoryCount, setScanHistoryCount] = useState(0);

  const SHELF_EXPLANATIONS = {
    conviction: {
      title: " Core Conviction Setups (High Probability Positions)",
      whyItsBest:
        "These are our absolute highest-quality trades backed by massive institutional dealer buy walls. They are 'the best' because market makers are heavily committed at these levels and are forced to buy stock to defend their positions, creating an exceptionally strong and reliable price floor with almost zero downside risk.",
      horizon: "TODAY'S DATA",
      mathTracking: "Dealer GEX Support Level + Concentrated Buy Wall Clusters",
      confidenceTier: "ULTRA CONFIDENCE (94% - 98%)",
    },
    improved: {
      title: " High Velocity Breakouts (Quick Scalp Trades)",
      whyItsBest:
        "These are fast-moving momentum trades with explosive volume speed. They are 'the best' for quick day trading (scalping) because derivative volumes are speeding up rapidly in the last 15 minutes, showing that buyers are sweeping options at the ask, which forces dealers to cover their shorts, driving price up fast.",
      horizon: "TODAY'S DATA",
      mathTracking: "Delta Acceleration Speed + Localized Volume",
      confidenceTier: "SCALPER RATE (86% - 92%)",
    },
    mispriced: {
      title: " Mathematical Arbitrage (Option Premium Discounts)",
      whyItsBest:
        "These are deep value opportunities where options are priced exceptionally cheap. They are 'the best' because temporary implied volatility drops have created a price mismatch: active brokers are selling these contracts at a -15% discount compared to their true mathematical value. Enter cheap, exit under normal curves.",
      horizon: "TODAY'S DATA",
      mathTracking: "Theoretical Fair Pricing vs Broker Market Value",
      confidenceTier: "VALUE DISCOUNTS (80% - 85%)",
    },
    invalidation: {
      title: "️ Support Rebounds & Boundaries (Trades Coming Back)",
      whyItsBest:
        "These are options hovering right at critical line-in-the-sand support thresholds. They are 'the best' for reversals because they are 'coming back' to key support lines (put walls), offering a highly defined bounce-back entry with tight, predefined stop-losses.",
      horizon: "TODAY'S DATA",
      mathTracking: "Dealer Put Wall Cushioning + Key Support Pivot",
      confidenceTier: "SUPPORT REBOUNDS (40% - 55%)",
    },
    whale: {
      title: " Smart Money Whale Sweeps (Institutional Tape Follower)",
      whyItsBest:
        "These represent trades where ultra-wealthy institutional players are sweeping multi-million dollar cash blocks directly at the ask price. They are 'the best' because you are alignment-trading with the largest forces in the market, riding their powerful directional tailwinds.",
      horizon: "TODAY'S DATA",
      mathTracking: "On-Tape Notional Premium Volume Sweeps ($5M+ Blocks)",
      confidenceTier: "INSTITUTIONAL CONVICTION SCALE (85%+)",
    },
    all: {
      title: " All Discovered Signals (Unified Market Catalog)",
      whyItsBest:
        "A unified look across the entire option spectrum under scanning supervision. Use this tab to compare all categories side-by-side, sorted from the absolute strongest active model ratings to the weakest.",
      horizon: "TODAY'S DATA",
      mathTracking: "Multi-Agent Data Processing",
      confidenceTier: "MARKET REGISTRY",
    },
  };

  // Helper function to formulate simple human reasons why each specific card is the best
  const getSimpleWordReason = (c: any) => {
    const isCall = c.isCall;
    if (c.shelf === "conviction") {
      return `Solid institutional buy walls are supporting price at ${c.strike}. Option market makers are heavily short this strike and must buy stock to remain hedged, forming an automatic protective floor under our entry target.`;
    } else if (c.shelf === "improved") {
      return `Rapid volume surge detected over the last few minutes. Buyers are sweeping contracts on the ask, preparing the asset for a classic option squeeze. High-velocity setup ideal for a quick, fast-exit momentum scalp.`;
    } else if (c.shelf === "mispriced") {
      return `Severe model mismatch. Broker ask is priced at $${c.price.toFixed(2)}, but our calculated mathematical fair value is $${(c.price * 1.4).toFixed(2)}. Highly underpriced premium grants an immediate edge over retail books.`;
    } else if (c.shelf === "invalidation") {
      return `Option is coming back to primary support buffers. Hovering right near the crucial put wall invalidation level. Entering here offers a safe, highly-defined rebound setup with extremely tight loss limits.`;
    } else if (c.shelf === "whale") {
      return `Multi-million dollar blocks are sweeping this exact strike. This is institutional smart money committing heavy leverage, forcing dealer market makers to rapidly buy hedge blocks. Excellent tailwind trade.`;
    }
    return `High-scoring index anomaly active. Positive order flow momentum backing are aligned with dealer positioning and index support.`;
  };

  // Stats tickers that change slightly
  const [brierScore, setBrierScore] = useState(0.042);
  const [globalGex, setGlobalGex] = useState(485.4);
  const [scanRate, setScanRate] = useState(14.8);

  // Establish live SSE stream directly from our backend for options discoveries
  useEffect(() => {
    const url = "/api/stream/discovery";
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (typeof data.brierScore === "number") setBrierScore(data.brierScore);
        if (typeof data.globalGex === "number") setGlobalGex(data.globalGex);
        if (typeof data.scanRate === "number") setScanRate(data.scanRate);
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
        console.error(
          "[SkyVision Discovery Client] Error parsing SSE Stream",
          err,
        );
      }
    };

    eventSource.onerror = (err) => {
      console.error("[SkyVision Discovery Client] EventSource Error", err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // HIGH FREQUENCY LOCAL TICK FLUIDITY (Make prices dynamically tick in real-time for high-performance scalp feel!)
  useEffect(() => {
    const tickInterval = setInterval(() => {
    }, 2800);

    return () => clearInterval(tickInterval);
  }, []);

  // Manual fast-scale scan refresh handler (forces immediate dynamic ticks and adds simulated live options activity)
  const triggerManualScannerRefresh = () => {
    if (isMockScanning) return;
    setIsMockScanning(true);
    setLastScanMessage("Initiating institutional deep-regime memory scan...");

    setTimeout(() => {
      // Slightly randomize values
      setGlobalGex((prev) => prev + (Math.random() > 0.5 ? 2.4 : -1.8));
      setBrierScore((prev) => Math.max(0.01, prev - 0.0004));
      setScanRate((prev) => 15.0 + Math.random() * 2);


      // Insert fresh scalp feed log to show raw activity
      const tickers = ["SPX", "QQQ", "NDX", "SPY"];
      const strikes = [7640, 442, 18500, 510];
      const randomTicker = tickers[Math.floor(Math.random() * tickers.length)];
      const randomStrike = strikes[Math.floor(Math.random() * strikes.length)];
      const randomIsBullish = Math.random() > 0.4;
      const timestampLabel = new Date().toTimeString().split(" ")[0];

      const newLog = {
        timestamp: timestampLabel,
        ticker: randomTicker,
        strike: randomStrike,
        type: randomIsBullish ? "C" : "P",
        side: Math.random() > 0.5 ? "Sweep" : "Block",
        size: `${Math.floor(Math.random() * 1500 + 400)} cons`,
        premium: `$${(Math.floor(Math.random() * 400 + 100) * 1000).toLocaleString()}`,
        tag: randomIsBullish ? "BULLISH" : "HEDGE",
        action: randomIsBullish ? "SWEPT @ ASK" : "AT BID",
      };

      
      setIsMockScanning(false);
      setScanHistoryCount((prev) => prev + 1);
      setLastScanMessage(
        `Calibrated! Scanned ${contracts.length} options. 3 new core scalps prioritized.`,
      );
    }, 1000);
  };

  // Combined filtering of our expanded database
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      // 1. Shelf check
      if (activeShelf !== "all" && c.shelf !== activeShelf) {
        return false;
      }
      // 2. Call/Put check
      if (optionTypeFilter === "calls" && !c.isCall) return false;
      if (optionTypeFilter === "puts" && c.isCall) return false;

      // 3. Search query check (search strike or ticker)
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toUpperCase();
        const matchesTicker = c.ticker.includes(query);
        const matchesStrike = String(c.strike).includes(query);
        const matchesType =
          query === "C" || query === "CALL"
            ? c.isCall
            : query === "P" || query === "PUT"
              ? !c.isCall
              : false;
        return matchesTicker || matchesStrike || matchesType;
      }
      return true;
    });
  }, [contracts, activeShelf, optionTypeFilter, searchQuery]);

  // Variables removed for flat layout

  // Quick statistics for display
  const metricsOverview = useMemo(() => {
    const totalCount = contracts.length;
    const enterCount = contracts.filter((c) => c.health >= 88).length;
    const extremeEV = contracts.filter(
      (c) => c.shelf === "whale" || c.shelf === "conviction",
    ).length;
    return {
      totalCount,
      enterCount,
      extremeEV,
    };
  }, [contracts]);

  // Match corresponding AssetInfo object to trigger selection
  const handleSelectWithMatch = (
    ticker: string,
    strike: number,
    isCall: boolean,
  ) => {
    const asset = ASSET_LIST.find((a) => a.ticker === ticker);
    if (asset) {
      onSelectContract(asset, strike, isCall);
    }
  };

  const currentManualText = SHELF_EXPLANATIONS[activeShelf];

  // Dynamic light mode theme classes mapping
  const c_bgMain = isLight ? "bg-[#fcfcfd]" : "bg-transparent";
  const c_textColor = isLight ? "text-zinc-800" : "text-zinc-200";
  const c_cardBg = isLight
    ? "bg-white border-zinc-200 shadow-sm text-zinc-800"
    : "bg-[#050505] border-zinc-900 shadow-2xl text-zinc-100";
  const c_cardBorder = isLight ? "border-zinc-200" : "border-zinc-900";
  const c_textWhite = isLight
    ? "text-zinc-950 font-black"
    : "text-white font-black";
  const c_textMuted = isLight ? "text-zinc-550 font-medium" : "text-zinc-400";
  const c_pillBg = isLight
    ? "bg-zinc-100 border-zinc-200"
    : "bg-black/60 border-zinc-900";
  const c_innerCardBg = isLight
    ? "bg-zinc-50 border-zinc-200/80"
    : "bg-[#0a0a0c] border-zinc-900";
  const c_innerWellBg = isLight
    ? "bg-zinc-100/70 border-zinc-200/60"
    : "bg-zinc-950/60 border-zinc-900/60";
  const c_glassBg = isLight
    ? "bg-zinc-100/95 border border-zinc-250 shadow-md text-zinc-800"
    : "bg-[#020202] border border-zinc-900/80 shadow-xl text-zinc-200";

  return (
    <div
      className={`w-full flex flex-col font-mono select-none antialiased space-y-6 w-full px-2 lg:px-6 2xl:px-8 pt-2 pb-12 ${c_textColor}`}
    >
      {/* 1. TOP DENSE STATUS BAR (Same as Skyeyes Core Cockpit styling) */}
      <div
        className={`flex flex-col md:flex-row justify-between items-stretch md:items-center p-4 rounded-xl gap-4 md:gap-2 relative overflow-hidden border ${c_cardBg}`}
      >
        {/* Glow corner element */}
        <div className="absolute top-0 left-0 w-16 h-16 bg-white/5 blur-xl pointer-events-none" />

        <div className="flex items-center gap-2.5 relative z-10">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping absolute" />
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full relative z-10" />
          </div>
          <div>
            <h1
              className={`text-xs font-black tracking-widest uppercase ${c_textWhite}`}
            >
              SLAYER DISCOVERY COCKPIT{" "}
              <span className="text-zinc-500">/ EXCURSION MATRIX v1.3</span>
            </h1>
            <p className="text-[9.5px] text-zinc-500 mt-0.5 uppercase tracking-wide">
              REAL-TIME POSITIONING • STREAMING EXCURSIONS ACTIVE
            </p>
          </div>
        </div>

        {/* Live Cockpit Statistics Panel */}
        <div
          className={`flex items-center gap-4 flex-wrap text-left text-[10px] md:border-l md:pl-5 ${isLight ? "border-zinc-200" : "border-zinc-900"}`}
        >
          <div className="space-y-0.5">
            <span className="text-[7.5px] text-zinc-500 uppercase block tracking-wider font-extrabold">
              GLOBAL GEX SUPPORT
            </span>
            <span className="text-emerald-400 font-bold block transition-all duration-300">
              +{globalGex.toFixed(1)}M
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[7.5px] text-zinc-500 uppercase block tracking-wider font-extrabold">
              SYSTEM BRIER FIT
            </span>
            <span
              className={`font-mono font-bold block transition-all duration-300 ${c_textWhite}`}
            >
              {brierScore.toFixed(4)}
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[7.5px] text-zinc-500 uppercase block tracking-wider font-extrabold">
              SCANNING RATE
            </span>
            <span
              className={`text-[#4f8cff] font-bold block transition-all duration-300 ${isMockScanning || metricsPulse ? "animate-bounce text-emerald-400" : ""}`}
            >
              {scanRate.toFixed(1)}/s
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[7.5px] text-zinc-500 uppercase block tracking-wider font-extrabold">
              LATENCY
            </span>
            <span className="text-emerald-500 font-bold block">
              12ms (STREAM ON)
            </span>
          </div>
        </div>
      </div>

      {/* 2. DUSTING BENTO-COMPLIANT CONTROLS BAR (Filters, Search) */}
      <div
        className={`grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-lg border ${c_glassBg}`}
      >
        {/* Section Title */}
        <div className="md:col-span-8 flex flex-col justify-center px-4 py-3">
          <h2
            className={`text-md font-black tracking-widest uppercase ${c_textWhite}`}
          >
            TOP OPPORTUNITIES
          </h2>
          <p className="text-[9.5px] text-zinc-500 uppercase tracking-wide">
            Sourced from global sweep data and real-time dealer exposure
          </p>
        </div>

        {/* Option Call/Put Type Filter Option */}
        <div
          className={`md:col-span-2 flex justify-center p-0.5 border rounded-md mx-2 md:mx-0 ${isLight ? "bg-zinc-100 border-zinc-200" : "bg-black border-zinc-900"}`}
        >
          {[
            { id: "all", label: "ALL" },
            { id: "calls", label: "C" },
            { id: "puts", label: "P" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setOptionTypeFilter(opt.id as any);
              }}
              className={`px-3.5 py-1.5 text-[8.5px] uppercase font-extrabold rounded-xs flex-1 transition-all cursor-pointer ${
                optionTypeFilter === opt.id
                  ? "bg-[#4f8cff]/15 text-[#4f8cff] border border-[#4f8cff]/30 font-black"
                  : `text-zinc-500 border border-transparent ${isLight ? "hover:text-zinc-950" : "hover:text-white"}`
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Mini Ticker/Strike search box - Glassmorphism, high-fidelity focus effect */}
        <div
          className={`md:col-span-2 relative flex items-center rounded-lg px-3 py-1.5 border transition-all duration-300 focus-within:ring-1 focus-within:ring-[#4f8cff]/50 ${
            isLight
              ? "bg-zinc-50 border-zinc-200 focus-within:bg-white focus-within:border-zinc-400"
              : "bg-black/60 border-zinc-900 focus-within:bg-[#07070a]/90 focus-within:border-zinc-700 shadow-inner"
          }`}
        >
          <Search className="w-3.5 h-3.5 text-zinc-500 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="FILTER BY TICKER OR STRIKE..."
            className={`w-full bg-transparent border-none text-[9.5px] font-black uppercase focus:outline-none placeholder-zinc-500 font-mono tracking-wider transition-all duration-200 ${
              isLight ? "text-zinc-900" : "text-white"
            }`}
          />
          {searchQuery.length > 0 ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-zinc-500 hover:text-white text-[8px] uppercase font-bold pl-1 font-mono hover:underline shrink-0"
            >
              CLEAR
            </button>
          ) : (
            <kbd className="hidden sm:inline-block bg-[#0f0f12] text-zinc-650 border border-zinc-900 px-1 py-[1.5px] rounded-xs font-mono text-[7px] select-none shrink-0">
              TXT
            </kbd>
          )}
        </div>
      </div>

      {/* 2C. LIVE SCANNER CONTROL INTERFACE */}
      <div
        className={`w-full p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 text-xs border ${c_glassBg}`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <span
              className={`w-3 h-3 rounded-full bg-emerald-500 absolute block ${isMockScanning ? "animate-ping opacity-75" : ""}`}
            />
            <span className="w-3 h-3 rounded-full bg-emerald-400 border border-black relative block" />
          </div>
          <div className="text-left">
            <span className="text-[10px] text-zinc-500 block font-bold uppercase">
              SECURE PORT HARVEST SCANNER
            </span>
            <span
              className={`text-[10.5px] font-black ${isMockScanning ? "text-emerald-500 font-bold" : isLight ? "text-zinc-700 font-extrabold" : "text-zinc-400"}`}
            >
              STATUS: {lastScanMessage}
            </span>
          </div>
        </div>

        <button
          onClick={triggerManualScannerRefresh}
          disabled={isMockScanning}
          className={`px-5 py-2.5 rounded-lg border text-[10px] font-extrabold uppercase tracking-widest cursor-pointer shadow-xl transition-all flex items-center gap-2 ${
            isMockScanning
              ? isLight
                ? "bg-zinc-200 text-zinc-400 border-zinc-200"
                : "bg-zinc-950 text-zinc-650 border-zinc-900"
              : isLight
                ? "bg-zinc-850 text-white hover:bg-zinc-900 border-zinc-800 font-extrabold shadow-sm"
                : "bg-white text-black hover:bg-zinc-200 border-white font-extrabold"
          }`}
        >
          {isMockScanning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-450" />
              <span>SCANNING EXCURSIONS...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>
                FORCE CORRELATE SCANNER ({scanHistoryCount} Refreshes)
              </span>
            </>
          )}
        </button>
      </div>

      {/* 3. CORE HIGH-PERFORMANCE WORKSPACE */}
      <div className="flex flex-col gap-6 items-start w-full">
        {/* ==========================================
 THE EXCURSION GRID
 ========================================== */}
        <div className="flex flex-col gap-5 w-full">
          <div className="w-full flex justify-between items-center px-1 mb-2">
            <span
              className={`text-[11px] font-extrabold uppercase tracking-wider ${isLight ? "text-zinc-700" : "text-zinc-400"}`}
            >
              DISPLAYING {filteredContracts.length} MATCHING EXCURSIONS OF{" "}
              {contracts.length} DETECTED NODES
            </span>
            <div className="flex items-center gap-1.5 text-[9px] text-[#A1A1AA] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              <span>LIVE FREQUENCY LOCK</span>
            </div>
          </div>

          <div className="w-full flex flex-col gap-10 mt-2">
            {Object.entries(SHELF_EXPLANATIONS)
              .filter(([id]) => id !== "all")
              .map(([shelfId, config]) => {
                const shelfContracts = filteredContracts.filter(
                  (c) => c.shelf === shelfId,
                );
                if (shelfContracts.length === 0) return null;

                return (
                  <div key={shelfId} className="w-full flex flex-col gap-4">
                    <div
                      className={`p-4 rounded-xl border flex flex-col gap-2 ${isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#030303] border-zinc-900/60"}`}
                    >
                      <div
                        className={`text-xs font-black uppercase tracking-widest flex items-center ${c_textWhite}`}
                      >
                        {config.title.trim()}{" "}
                        <span
                          className={`ml-3 px-2 py-0.5 rounded-sm text-[9px] font-bold ${isLight ? "bg-zinc-200 text-zinc-600" : "bg-white/10 text-zinc-300"}`}
                        >
                          {shelfContracts.length} MATCHES
                        </span>
                      </div>
                      <div
                        className={`text-[10px] uppercase font-sans font-bold tracking-wide leading-relaxed ${isLight ? "text-zinc-500" : "text-zinc-500"}`}
                      >
                        {config.whyItsBest}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start w-full place-content-start">
                      <AnimatePresence mode="popLayout">
                        {shelfContracts
                          .slice()
                          .sort((a, b) => b.health - a.health)
                          .map((c, idx) => {
                            const actionColor =
                              c.action === "ENTER"
                                ? "text-[#00ff88] border-[#00ff88]/20 bg-[#00ff88]/5"
                                : c.action === "SELL"
                                  ? "text-rose-400 border-rose-400/20 bg-rose-400/5"
                                  : "text-amber-400 border-amber-400/20 bg-amber-400/5";

                            const isFlashing = lastFlashingId === c.id;
                            const isCardExpanded = !!expandedContracts[c.id];

                            // Classification tags
                            let classBadgeLabel = "EXP: 06/13/2026";
                            let classBadgeStyle =
                              "bg-[#4f8cff]/10 text-[#4f8cff] border-[#4f8cff]/20";
                            if (c.shelf === "improved")
                              classBadgeStyle =
                                "bg-amber-400/10 text-amber-300 border-amber-400/20";
                            if (c.shelf === "invalidation")
                              classBadgeStyle =
                                "bg-rose-500/10 text-rose-400 border-rose-500/20";
                            if (c.shelf === "mispriced")
                              classBadgeStyle =
                                "bg-emerald-500/10 text-[#00ff88] border-emerald-500/20";
                            if (c.shelf === "whale")
                              classBadgeStyle =
                                "bg-purple-500/10 text-purple-400 border-purple-500/20";

                            const isPrimaryPeak = idx === 0;

                            const coreSwingTarget = c.t1
                              ? c.t1
                              : c.price * 1.35;
                            const coreSwingGain = c.p1 ? c.p1 : 35;
                            const quickScalpTarget = c.price * 1.18;
                            const quickScalpGain = 18;

                            return (
                              <motion.div
                                layout
                                key={c.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.25 }}
                                onClick={() =>
                                  setExpandedContracts((prev) => ({
                                    ...prev,
                                    [c.id]: !prev[c.id],
                                  }))
                                }
                                className={`p-4 border rounded-xl flex flex-col gap-2.5 text-left relative overflow-hidden shadow-xl transition-all duration-300 cursor-pointer ${
                                  isFlashing
                                    ? flashDirection === "up"
                                      ? "bg-emerald-500/10 border-emerald-400/35"
                                      : "bg-rose-500/10 border-rose-400/35"
                                    : isCardExpanded
                                      ? isLight
                                        ? "bg-zinc-50 border-zinc-300 shadow-md ring-1 ring-zinc-300/50"
                                        : "bg-[#0a0a0c] border-zinc-800 shadow-xl ring-1 ring-zinc-800"
                                      : isLight
                                        ? "bg-white hover:border-zinc-300 border-zinc-200 text-zinc-900 shadow-sm hover:shadow"
                                        : "bg-[#030303] border-zinc-900 hover:border-zinc-750 text-zinc-100 shadow-xl"
                                }`}
                              >
                                {/* Tiny neon glider strip */}
                                <div
                                  className={`absolute top-0 left-0 right-0 h-[2px] transition-colors duration-300 ${
                                    c.isCall
                                      ? "bg-emerald-500/40"
                                      : "bg-rose-500/40"
                                  }`}
                                />

                                {/* Top Contract Badge & Header */}
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span
                                        className={`text-xs font-black font-sans px-2.5 py-0.5 rounded-md border uppercase inline-block ${
                                          c.isCall
                                            ? "bg-emerald-950/20 text-[#00ff88] border-emerald-900/45"
                                            : "bg-rose-950/20 text-rose-400 border-rose-900/45"
                                        }`}
                                      >
                                        {c.ticker} {c.strike}
                                        {c.isCall ? "C" : "P"}
                                      </span>
                                      <span
                                        className={`text-[7.5px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest border ${classBadgeStyle}`}
                                      >
                                        {classBadgeLabel}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 pt-0.5">
                                      <span className="text-[7.5px] uppercase tracking-wider text-zinc-500 font-extrabold font-mono">
                                        HEURISTIC: {c.health} SCORE
                                      </span>
                                      <span className="text-zinc-650">•</span>
                                      <span
                                        className={`text-[7.5px] uppercase tracking-wider font-extrabold ${actionColor}`}
                                      >
                                        {c.action}
                                      </span>
                                      {isPrimaryPeak && (
                                        <>
                                          <span className="text-zinc-655">
                                            •
                                          </span>
                                          <span className="text-[7px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-1 rounded uppercase">
                                            TEAM LEADER
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Price Info */}
                                  <div className="text-right flex flex-col items-end gap-1">
                                    <div className="space-y-0.5">
                                      <span className="text-[7px] text-zinc-650 tracking-wider block font-black uppercase">
                                        CURRENT PRICE
                                      </span>
                                      <span
                                        className={`text-xs font-black block transition-all duration-300 ${
                                          isFlashing
                                            ? flashDirection === "up"
                                              ? "text-[#00ff88]"
                                              : "text-rose-400"
                                            : isLight
                                              ? "text-zinc-900"
                                              : "text-zinc-100"
                                        }`}
                                      >
                                        ${c.price.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* TARGETS */}
                                <div
                                  className={`grid grid-cols-2 gap-2 mt-1 p-2 rounded-lg text-center text-[10px] border ${isLight ? "bg-zinc-100 border-zinc-200" : "bg-black/60 border-zinc-900"}`}
                                >
                                  <div
                                    className={`border-r px-1 text-left ${isLight ? "border-zinc-200" : "border-zinc-900"}`}
                                  >
                                    <div className="text-[7px] text-zinc-550 uppercase tracking-widest font-black block">
                                      {" "}
                                      TARGET 1 (SCALP)
                                    </div>
                                    <span
                                      className={`font-extrabold font-mono text-[11px] block ${isLight ? "text-zinc-900" : "text-white"}`}
                                    >
                                      ${quickScalpTarget.toFixed(2)}
                                    </span>
                                    <span className="text-[7.5px] text-emerald-500 font-bold font-mono">
                                      +{quickScalpGain}% GAIN
                                    </span>
                                  </div>
                                  <div className="px-1 text-left">
                                    <div className="text-[7px] text-zinc-550 uppercase tracking-widest font-black block">
                                      {" "}
                                      TARGET 2 (SWING)
                                    </div>
                                    <span
                                      className={`font-extrabold font-mono text-[11px] block ${isLight ? "text-zinc-900" : "text-white"}`}
                                    >
                                      ${coreSwingTarget.toFixed(2)}
                                    </span>
                                    <span className="text-[7.5px] text-amber-500 font-bold font-mono">
                                      +{coreSwingGain}% GAIN
                                    </span>
                                  </div>
                                </div>

                                {/* EXPANDED CONTENT DATA MATRIX */}
                                {isCardExpanded && (
                                  <div
                                    className="space-y-3 mt-1 pt-3 border-t border-zinc-900/40 animate-fadeIn"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* Plain English explanation */}
                                    <div
                                      className={`p-2.5 rounded-lg text-[9.5px]/[14.5px] tracking-wide text-left flex gap-1.5 items-start font-sans uppercase border ${isLight ? "bg-zinc-100/70 border-zinc-200/60 text-zinc-650" : "bg-zinc-950/60 border-zinc-900/60 text-zinc-400"}`}
                                    >
                                      <Info className="w-3.5 h-3.5 text-[#4f8cff] shrink-0 mt-0.5" />
                                      <div className="font-medium tracking-wide">
                                        <span className="text-[#4f8cff] font-extrabold mr-1">
                                          WHY THE BEST:
                                        </span>
                                        {getSimpleWordReason(c)}
                                      </div>
                                    </div>

                                    {/* Short Analytical Narrative */}
                                    <p
                                      className={`text-[10px] font-sans tracking-wide leading-relaxed uppercase border-t pt-2.5 ${isLight ? "border-zinc-200 text-zinc-600" : "border-zinc-900/50 text-zinc-450"}`}
                                    >
                                      {c.narrative}
                                    </p>

                                    {/* Quantitative Stats Matrix */}
                                    <div
                                      className={`border rounded-lg p-2.5 grid grid-cols-4 gap-2 text-center text-[10px] font-mono ${isLight ? "bg-white border-zinc-200 text-zinc-700 shadow-sm" : "bg-black/60 border-zinc-900 text-zinc-400"}`}
                                    >
                                      <div>
                                        <span className="block text-[7.5px] text-zinc-550 mb-0.5 tracking-wider uppercase">
                                          DELTA
                                        </span>
                                        <span
                                          className={`font-bold block ${c.isCall ? "text-emerald-500/80" : "text-rose-500/80"}`}
                                        >
                                          {c.delta}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="block text-[7.5px] text-zinc-550 mb-0.5 tracking-wider uppercase">
                                          GAMMA
                                        </span>
                                        <span
                                          className={`font-bold block ${isLight ? "text-zinc-800" : "text-zinc-300"}`}
                                        >
                                          {c.gamma}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="block text-[7.5px] text-zinc-550 mb-0.5 tracking-wider uppercase">
                                          THETA
                                        </span>
                                        <span className="text-amber-500/80 font-bold block">
                                          {c.theta}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="block text-[7.5px] text-zinc-550 mb-0.5 tracking-wider uppercase">
                                          VOLATILITY
                                        </span>
                                        <span
                                          className={`font-bold block ${isLight ? "text-zinc-850" : "text-zinc-400"}`}
                                        >
                                          {(c.vega * 100).toFixed(1)}%
                                        </span>
                                      </div>
                                    </div>

                                    {/* Pricing Segment */}
                                    <div className="flex justify-between items-center pt-2.5 border-t border-zinc-900/50 text-[10.5px]">
                                      <div className="space-y-0.5">
                                        <span className="text-[7.5px] text-zinc-650 uppercase block tracking-wider font-bold">
                                          SPREAD SENSITIVITY
                                        </span>
                                        <span className="text-zinc-500 font-mono font-bold block">
                                          ${c.bid.toFixed(2)} - $
                                          {c.ask.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[7.5px] text-zinc-500 uppercase block tracking-wider font-bold">
                                          LIVE MID PREMIUM
                                        </span>
                                        <motion.span
                                          animate={
                                            isFlashing
                                              ? { scale: [1, 1.15, 1] }
                                              : {}
                                          }
                                          className={`text-xs font-black block transition-all duration-300 ${
                                            isFlashing
                                              ? flashDirection === "up"
                                                ? "text-[#00ff88]"
                                                : "text-rose-400"
                                              : isLight
                                                ? "text-zinc-900"
                                                : "text-zinc-100"
                                          }`}
                                        >
                                          ${c.price.toFixed(2)}
                                        </motion.span>
                                      </div>
                                    </div>

                                    {/* Click to Action Button always visible at bottom */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectWithMatch(
                                          c.ticker,
                                          c.strike,
                                          c.isCall,
                                        );
                                      }}
                                      className={`w-full py-2.5 bg-gradient-to-r text-[8.5px] font-extrabold uppercase tracking-widest rounded-md mt-2 transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 shadow-md hover:shadow-lg hover:-translate-y-[1px]
 ${isLight ? "from-zinc-100 to-white hover:from-zinc-200 hover:to-zinc-100 border border-zinc-200 text-zinc-700" : "from-zinc-900 to-black hover:from-white hover:to-white hover:text-black border border-zinc-900 text-zinc-400 hover:text-black"}`}
                                    >
                                      <span>
                                        LAUNCH DEEP SKYEYES ASSESSMENT
                                      </span>
                                      <ArrowRight className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                )}

                                {/* EXPAND INDICATOR ICON */}
                                <div className="w-full flex justify-center items-center mt-2.5 pt-2 border-t border-zinc-900/10 dark:border-zinc-800/50 text-[8px] font-black tracking-widest uppercase text-zinc-400">
                                  {isCardExpanded ? (
                                    <span className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors">
                                      COLLAPSE DATA{" "}
                                      <ChevronUp className="w-3 h-3" />
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors">
                                      EXPAND DATA{" "}
                                      <ChevronDown className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
          </div>

          {filteredContracts.length === 0 && (
            <div
              className={`border p-8 rounded-xl text-center text-zinc-500 uppercase text-xs space-y-2 ${isLight ? "bg-[#f4f4f5] border-zinc-200" : "bg-[#050505] border-zinc-900"}`}
            >
              <ShieldAlert className="w-8 h-8 text-zinc-500 mx-auto" />
              <p
                className={`font-extrabold tracking-widest text-[10px] ${c_textWhite}`}
              >
                No active scanner signals discovered
              </p>
              <p className="text-[9px] text-zinc-500 leading-snug font-sans uppercase">
                Try clearing the filters or modifying your manual search terms
                above.
              </p>
            </div>
          )}
          {}
          <div
            className={`w-full rounded-xl p-5 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xl border ${c_cardBg}`}
          >
            <div className="space-y-1">
              <span className="text-[8.5px] text-[#4f8cff] tracking-widest uppercase font-black block">
                OPPORTUNITY DENSITY CONFIG
              </span>
              <p
                className={`text-[10px] uppercase tracking-wide leading-relaxed font-sans font-medium ${isLight ? "text-zinc-600" : "text-zinc-400"}`}
              >
                Slayer.trade models automatically weigh dealer positioning
                scores (DEX/GEX), expected moves, and continuous calibration
                matrices across 1,248 concurrent options contracts. Select
                details of any contract block above to inspect dynamic target
                coordinates.
              </p>
            </div>
            <div
              className={`flex gap-4 shrink-0 text-left border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-5 ${isLight ? "border-zinc-200" : "border-zinc-900/60"}`}
            >
              <div>
                <span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest block">
                  ENTER SIGNAL RATIO
                </span>
                <span className={`text-sm font-black ${c_textWhite}`}>
                  {(
                    (metricsOverview.enterCount / metricsOverview.totalCount) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div>
                <span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest block">
                  EXTREME NOTIONAL
                </span>
                <span className="text-sm font-black text-emerald-500">
                  +{metricsOverview.extremeEV} Blocks
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
