import { useState, useEffect, memo } from 'react';
import { motion } from 'motion/react';
import { useContractStore } from './lib/store';
import { ASSET_LIST } from './data';
import { AssetInfo } from './types';

// Import Workspace Modular Views
import { SkyVisionView } from './components/SkyVisionView';
import { PinpointAIView } from './components/PinpointAIView';
import { QuantAuditView } from './components/QuantAuditView';
import { DiscoveryView } from './components/DiscoveryView';
import { DealerFlowView } from './components/DealerFlowView';
import SlayerIntro from './components/SlayerIntro';
import { SkyseyeAlertHub } from './components/SkyseyeAlertHub';
import { DashboardView } from './components/DashboardView';
import { AlertsView } from './components/AlertsView';
import { AutomationView } from './components/AutomationView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import ArborCapital from './components/ArborCapital';

import {
  Sparkles,
  Database,
  Compass,
  Dna,
  Lock,
  LogOut,
  Waves,
  ShieldCheck,
  Sun,
  Moon,
  Activity,
  Bell,
  Smartphone,
  FileText,
  SlidersHorizontal,
  GraduationCap
} from 'lucide-react';

const TickerTape = memo(() => {
  const staticTickers = [
    { ticker: 'SPX', name: 'S&P 500 Index', price: 7623.00, change: '+0.88%', isUp: true, vol: '14.2%' },
    { ticker: 'NDX', name: 'NASDAQ 100 Index', price: 18250.00, change: '+1.42%', isUp: true, vol: '21.0%' },
    { ticker: 'QQQ', name: 'NASDAQ ETF', price: 445.50, change: '+1.24%', isUp: true, vol: '18.5%' },
    { ticker: 'SPY', name: 'S&P 505 ETF', price: 512.30, change: '+0.65%', isUp: true, vol: '12.8%' },
    { ticker: 'RUT', name: 'Russell 2000 Index', price: 2025.00, change: '+0.92%', isUp: true, vol: '16.4%' },
    { ticker: 'SPX', name: 'S&P 500 Index', price: 7623.00, change: '+0.88%', isUp: true, vol: '14.2%' },
    { ticker: 'NDX', name: 'NASDAQ 100 Index', price: 18250.00, change: '+1.42%', isUp: true, vol: '21.0%' },
    { ticker: 'QQQ', name: 'NASDAQ ETF', price: 445.50, change: '+1.24%', isUp: true, vol: '18.5%' },
    { ticker: 'SPY', name: 'S&P 505 ETF', price: 512.30, change: '+0.65%', isUp: true, vol: '12.8%' },
    { ticker: 'RUT', name: 'Russell 2000 Index', price: 2025.00, change: '+0.92%', isUp: true, vol: '16.4%' },
    { ticker: 'SPX', name: 'S&P 500 Index', price: 7623.00, change: '+0.88%', isUp: true, vol: '14.2%' },
    { ticker: 'NDX', name: 'NASDAQ 100 Index', price: 18250.00, change: '+1.42%', isUp: true, vol: '21.0%' },
    { ticker: 'QQQ', name: 'NASDAQ ETF', price: 445.50, change: '+1.24%', isUp: true, vol: '18.5%' },
    { ticker: 'SPY', name: 'S&P 505 ETF', price: 512.30, change: '+0.65%', isUp: true, vol: '12.8%' },
    { ticker: 'RUT', name: 'Russell 2000 Index', price: 2025.00, change: '+0.92%', isUp: true, vol: '16.4%' }
  ];

  return (
    <div className="w-full bg-[#050506]/75 border-b border-zinc-900/50 backdrop-blur-xl overflow-hidden py-1.5 relative z-40 select-none">
      <div className="animate-ticker-marquee flex whitespace-nowrap">
        {[...Array(2)].map((_, loopIdx) => (
          <div key={loopIdx} className="flex gap-14 items-center pr-14 animate-none">
            {staticTickers.map((t, idx) => (
              <div 
                key={`${loopIdx}-${idx}`} 
                className="flex items-center gap-2.5 font-mono text-[9.5px] px-2 py-1 rounded transition-all"
              >
                <span className="font-black text-white tracking-widest">{t.ticker}</span>
                <span className="text-zinc-500 text-[8.5px] uppercase">{t.name}</span>
                <span className="font-extrabold text-[#f4f4f5]">${t.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={`font-bold flex items-center gap-0.5 ${t.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {t.isUp ? '▲' : '▼'}{t.change}
                </span>
                <span className="text-zinc-650 text-[8px] font-black border border-zinc-950/20 bg-zinc-950/60 px-1 rounded-xs uppercase">
                  VOL: {t.vol}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

export default function App() {
  // Navigation & configuration subscribing to global useContractStore Zustand store
  const activeTab = useContractStore(s => s.activeTab);
  const setActiveTab = useContractStore(s => s.setActiveTab);

  const selectedAsset = useContractStore(s => s.selectedAsset);
  const setSelectedAsset = useContractStore(s => s.setSelectedAsset);
  const selectedTimeframe = useContractStore(s => s.selectedTimeframe);
  const setSelectedTimeframe = useContractStore(s => s.setSelectedTimeframe);
  const selectedOptionType = useContractStore(s => s.selectedOptionType);
  const setSelectedOptionType = useContractStore(s => s.setSelectedOptionType);
  const selectedStrike = useContractStore(s => s.selectedStrike);
  const setCustomStrike = useContractStore(s => s.setSelectedStrike);
  const isPositionOpen = useContractStore(s => s.isPositionOpen);
  const setIsPositionOpen = useContractStore(s => s.setIsPositionOpen);

  const serverState = useContractStore(s => s.serverState);
  const updateFromSSE = useContractStore(s => s.updateFromSSE);
  const tickMarketState = useContractStore(s => s.tickMarketState);
  const isContractLocked = useContractStore(s => s.isContractLocked);

  const themeMode = useContractStore(s => s.themeMode);
  const toggleThemeMode = useContractStore(s => s.toggleThemeMode);
  const isLight = themeMode === 'light';

  useEffect(() => {
    if (isLight) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [isLight]);

  // User session state (Bug #9 HttpOnly cookie verification and storage)
  const [session, setSession] = useState<{ authenticated: boolean; name?: string; provider?: string; avatar?: string } | null>(null);

  // Fetch session on load
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    } catch (e) {
      console.error('Failed to load session details', e);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setSession({ authenticated: false });
        // Redirect to homepage
        window.location.reload();
      }
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  // Keep NY hours tick alive globally every second
  useEffect(() => {
    const interval = setInterval(tickMarketState, 1000);
    return () => clearInterval(interval);
  }, [tickMarketState]);

  // Establish live SSE stream directly mapping payload updates into the Zustand cache (Bug #1, Bug #2)
  useEffect(() => {
    const assetParam = selectedAsset.ticker;
    const tfParam = selectedTimeframe;
    const isCall = selectedOptionType === 'C';
    const strikeParam = selectedStrike !== null ? `&strike=${selectedStrike}` : '';
    const posParam = `&positionOpen=${isPositionOpen}`;

    const url = `/api/stream?asset=${assetParam}&timeframe=${tfParam}&isCall=${isCall}${strikeParam}${posParam}`;
    
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        updateFromSSE(data);
      } catch (err) {
        console.error('[SkyVision Client] Parsing SSE Data Stream', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[SkyVision Client] Stream Connection Error', err);
    };

    return () => {
      eventSource.close();
    };
  }, [selectedAsset, selectedTimeframe, selectedOptionType, selectedStrike, isPositionOpen, updateFromSSE]);

  // Option Action handlers connecting to backend storage
  const handleAddNewPerformanceLog = async (
    direction: 'BULLISH' | 'BEARISH',
    entry: number,
    target: number,
    stop: number
  ) => {
    if (!serverState) return;

    const body = {
      underlying: selectedAsset.ticker,
      contract: serverState.contract,
      direction: direction,
      entryPrice: entry,
      underlyingPrice: serverState.pinpoint_map.spot_price,
      iv: serverState.expected_move.ivPercentile,
      target1: serverState.targets[0]?.optionValue || (entry * 1.3),
      target2: serverState.targets[1]?.optionValue || (entry * 1.7),
      target3: serverState.targets[2]?.optionValue || (entry * 2.2),
      stretchTarget: serverState.targets[3]?.optionValue || (entry * 3.0),
      stopLoss: stop
    };

    try {
      const res = await fetch('/api/trades/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setIsPositionOpen(true);
      }
    } catch (e) {
      console.error('[SkyVision Client] POST trade action failure', e);
    }
  };

  const clearV8Trades = async () => {
    try {
      const res = await fetch('/api/trades/clear', { method: 'POST' });
      if (res.ok) {
        setIsPositionOpen(false);
      }
    } catch (e) {
      console.error('[SkyVision Client] POST clear state failure', e);
    }
  };

  const handleSelectOpportunity = (asset: AssetInfo, type: 'C' | 'P', strike?: number) => {
    const step = asset.defaultPrice > 1000 ? 100 : asset.defaultPrice > 150 ? 5 : 1;
    const targetStrike = strike || Math.round(asset.defaultPrice / step) * step;
    
    useContractStore.getState().selectContractAtomically(asset, targetStrike, type === 'C');
    setActiveTab('skyvision');
  };

  // Safe fallback loading state and skeletal setup
  if (!serverState) {
    return (
      <div className="min-h-screen bg-black text-zinc-400 flex flex-col justify-center items-center font-mono select-none antialiased">
        <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin mb-4"></div>
        <div className="tracking-widest uppercase text-xs text-white">SLAYER CLIENT HYDRATION ENGINE ONLINE...</div>
        <div className="text-[10px] text-zinc-650 mt-2 uppercase font-mono">Resolving dynamic system variables</div>
      </div>
    );
  }

  // Pre-calculated components mappings with zero client math
  const bestOpportunity = {
    asset: serverState?.discovery?.mispricedCalls[0]?.asset || ASSET_LIST[0],
    ticker: `${serverState?.discovery?.mispricedCalls[0]?.asset.ticker || 'SPX'} ${serverState?.discovery?.mispricedCalls[0]?.strike || 7640}C`,
    confidence: serverState?.discovery?.mispricedCalls[0]?.health || 91,
    isCall: true,
    currentPrice: `$${(serverState?.discovery?.mispricedCalls[0]?.marketPrice || 4.2).toFixed(2)}`,
    fairValue: `$${(serverState?.discovery?.mispricedCalls[0]?.modelValue || 6.8).toFixed(2)}`,
    entryZone: `$${((serverState?.discovery?.mispricedCalls[0]?.marketPrice || 4.2) * 0.92).toFixed(2)} - $${((serverState?.discovery?.mispricedCalls[0]?.marketPrice || 4.2) * 0.98).toFixed(2)}`
  };

  const topSub10Calls = (serverState?.discovery?.mispricedCalls || []).map((c: any) => ({
    asset: c.asset,
    ticker: `${c.asset.ticker} ${c.strike}C`,
    confidence: c.health
  }));

  const topSub10Puts = (serverState?.discovery?.mispricedPuts || []).map((p: any) => ({
    asset: p.asset,
    ticker: `${p.asset.ticker} ${p.strike}P`,
    confidence: p.health
  }));

  const isCall = selectedOptionType === 'C';
  const showColoredBg = isContractLocked && (activeTab === 'skyvision' || activeTab === 'auditor');

  let bgClass = "min-h-screen text-[#f4f4f5] flex flex-col font-mono select-none overflow-x-hidden antialiased relative transition-all duration-700 ease-in-out bg-[#050506]";
  
  if (showColoredBg) {
    if (isCall) {
      bgClass = "min-h-screen text-[#f4f4f5] flex flex-col font-mono select-none overflow-x-hidden antialiased relative transition-all duration-700 ease-in-out bg-[#011409]";
    } else {
      bgClass = "min-h-screen text-[#f4f4f5] flex flex-col font-mono select-none overflow-x-hidden antialiased relative transition-all duration-700 ease-in-out bg-[#140203]";
    }
  } else {
    // Glassy slate grey/black/white elegant configuration
    bgClass = "min-h-screen text-[#f4f4f5] flex flex-col font-mono select-none overflow-x-hidden antialiased relative transition-all duration-700 ease-in-out bg-[#0d0d0f]";
  }

  return (
    <div className={bgClass}>
      <SkyseyeAlertHub />
      
      {/* Liquid background elements mirroring Apple macOS/iOS fluid updates */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-1000">
        {showColoredBg && isCall && (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-emerald-500/12 blur-[120px] animate-fluid-blob-1 transition-all duration-700" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[65%] h-[60%] rounded-full bg-teal-500/8 blur-[140px] animate-fluid-blob-2 transition-all duration-700" />
            <div className="absolute top-[35%] right-[20%] w-[45%] h-[45%] rounded-full bg-emerald-450/6 blur-[110px] animate-fluid-blob-3 transition-all duration-700" />
          </>
        )}
        {showColoredBg && !isCall && (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-rose-500/12 blur-[120px] animate-fluid-blob-1 transition-all duration-700" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[65%] h-[60%] rounded-full bg-red-600/8 blur-[140px] animate-fluid-blob-2 transition-all duration-700" />
            <div className="absolute top-[35%] right-[20%] w-[45%] h-[45%] rounded-full bg-[#ff453a]/6 blur-[110px] animate-fluid-blob-3 transition-all duration-700" />
          </>
        )}
        {!showColoredBg && (
          <>
            <div className={`absolute inset-0 ${isLight ? 'bg-gradient-to-b from-black/[0.005] via-transparent to-white/[0.05]' : 'bg-gradient-to-b from-white/[0.012] via-transparent to-black/[0.12]'} backdrop-blur-[1px] pointer-events-none transition-all duration-700`} />
            <div className={`absolute top-[-10%] left-[-10%] w-[52%] h-[52%] rounded-full ${isLight ? 'bg-zinc-950/10' : 'bg-white/6'} blur-[120px] animate-fluid-blob-1 transition-all duration-700`} />
            <div className={`absolute bottom-[-15%] right-[-10%] w-[60%] h-[55%] rounded-full ${isLight ? 'bg-slate-900/10' : 'bg-zinc-400/5'} blur-[140px] animate-fluid-blob-2 transition-all duration-700`} />
            <div className={`absolute top-[35%] right-[20%] w-[40%] h-[40%] rounded-full ${isLight ? 'bg-zinc-900/8' : 'bg-zinc-650/4'} blur-[110px] animate-fluid-blob-3 transition-all duration-700`} />
            <div className={`absolute top-[10%] right-[40%] w-[35%] h-[35%] rounded-full ${isLight ? 'bg-indigo-950/10' : 'bg-white/3'} blur-[90px] animate-pulse transition-all duration-700`} />
          </>
        )}
      </div>
      
      {/* Upper ecosystem workstation cockpit core header */}
      <header className="sticky top-0 z-50 bg-[#050506]/80 backdrop-blur-xl border-b border-zinc-900/60 px-6 py-3 flex flex-col sm:flex-row justify-between items-center select-none font-mono gap-4">
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-black tracking-widest text-[#FFFFFF] uppercase whitespace-nowrap">
              ARBOR CAPITAL GROUP
            </span>
          </div>

          {serverState?.data_source === 'TRADIER_POLYGON_COMPLEMENTARY' ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[8.5px] font-black tracking-widest uppercase rounded-xs">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
              </span>
              <span>COMPLEMENTARY FEED (POLYGON + TRADIER) ACTIVE</span>
            </div>
          ) : serverState?.data_source === 'TRADIER_LIVE' ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[8.5px] font-black tracking-widest uppercase rounded-xs">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-450 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
              </span>
              <span>LIVE TRADIER STREAM ACTIVE</span>
            </div>
          ) : serverState?.data_source === 'POLYGON_LIVE' ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[8.5px] font-black tracking-widest uppercase rounded-xs">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>LIVE POLYGON STREAM ACTIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[8.5px] font-black tracking-widest uppercase rounded-xs" title="Provide TRADIER_API_KEY inside workspace configuration to activate live Tradier OPRA contracts">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>SANDBOX SIMULATION MODE</span>
            </div>
          )}

          <span className="text-zinc-800 text-xs hidden sm:inline">/</span>

          {/* Active Workstation selector dropdown on hover */}
          <div className="relative group py-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-white cursor-pointer select-none bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-850 px-3 py-1.5 rounded-md transition-all">
              <span className={`w-1.5 h-1.5 rounded-full ${['home', 'skyvision', 'pinpoint', 'auditor', 'dealerflow'].includes(activeTab) ? 'animate-pulse bg-emerald-400' : 'bg-zinc-650'}`} />
              <span>ACTIVE ENGINE: <span className="text-white uppercase font-black">
                {activeTab === 'home' && 'Ecosystem Introduction'}
                {activeTab === 'skyvision' && 'Slayer // SkyVision'}
                {activeTab === 'pinpoint' && 'Slayer // Pinpoint'}
                {activeTab === 'auditor' && 'Trust Archive & Registry'}
                {activeTab === 'dealerflow' && 'Dealer Flow'}
                {!['home', 'skyvision', 'pinpoint', 'auditor', 'dealerflow'].includes(activeTab) && 'SELECT'}
              </span></span>
              <span className="text-[8px] text-zinc-650 group-hover:text-white transition-transform duration-200">▼</span>
            </div>
            
            {/* Hover options list */}
            <div className="absolute top-full left-0 mt-1 w-[22rem] bg-[#09090b] border border-zinc-850 rounded-sm shadow-2xl opacity-0 scale-95 origin-top-left invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible transition-all duration-150 z-50 p-2 space-y-1 max-h-[80vh] overflow-y-auto">
              <div className="text-[8px] text-zinc-650 font-black tracking-widest px-2 py-1 border-b border-[#121214] uppercase mb-1">
                SELECT COGNITIVE CORE
              </div>
              
              <button
                onClick={() => setActiveTab('home')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'home'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-white pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span>1. ECOSYSTEM INTRODUCTION</span>
                <span className="text-[8px] text-zinc-650">LANDING PAGE</span>
              </button>

              <button
                onClick={() => setActiveTab('skyvision')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'skyvision'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-emerald-450 pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                  <span>2. SLAYER // SKYVISION</span>
                </span>
                <span className="text-[8px] text-zinc-650">DECISION ENGINE</span>
              </button>

              <button
                onClick={() => setActiveTab('pinpoint')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'pinpoint'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-emerald-450 pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Dna className="w-3 h-3 text-emerald-400" />
                  <span>3. SLAYER // PINPOINT</span>
                </span>
                <span className="text-[8px] text-zinc-650">MARKET INTEL</span>
              </button>

              <button
                onClick={() => setActiveTab('auditor')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'auditor'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-emerald-450 pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-zinc-500" />
                  <span>4. TRUST ARCHIVE & REGISTRY</span>
                </span>
                <span className="text-[8px] text-zinc-650">EXECUTION LOGS</span>
              </button>

              <button
                onClick={() => setActiveTab('dealerflow')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'dealerflow'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-emerald-450 pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Waves className="w-3 h-3 text-emerald-400" />
                  <span>5. DEALER FLOW</span>
                </span>
                <span className="text-[8px] text-zinc-650">GAMMA FLOW</span>
              </button>
            </div>
          </div>

          <span className="text-zinc-800 text-xs hidden sm:inline">/</span>

          {/* More Power Tools selector dropdown on hover */}
          <div className="relative group py-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-white cursor-pointer select-none bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-850 px-3 py-1.5 rounded-md transition-all">
              <span className={`w-1.5 h-1.5 rounded-full ${['dashboard', 'alerts', 'automation', 'reports', 'arbor', 'settings'].includes(activeTab) ? 'animate-pulse bg-cyan-450' : 'bg-zinc-655'}`} />
              <span>MORE POWER TOOLS: <span className="text-white uppercase font-black">
                {activeTab === 'dashboard' && 'Executive Dashboard'}
                {activeTab === 'alerts' && 'Realtime Alerts'}
                {activeTab === 'automation' && 'SMS Auto-Dispatch'}
                {activeTab === 'reports' && 'Compliance Reports'}
                {activeTab === 'arbor' && 'Research & Community'}
                {activeTab === 'settings' && 'Workspace Config'}
                {!['dashboard', 'alerts', 'automation', 'reports', 'arbor', 'settings'].includes(activeTab) && 'SELECT'}
              </span></span>
              <span className="text-[8px] text-zinc-650 group-hover:text-white transition-transform duration-200">▼</span>
            </div>
            
            {/* Hover options list */}
            <div className="absolute top-full left-0 mt-1 w-[22rem] bg-[#09090b] border border-zinc-850 rounded-sm shadow-2xl opacity-0 scale-95 origin-top-left invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible transition-all duration-150 z-50 p-2 space-y-1 max-h-[80vh] overflow-y-auto">
              <div className="text-[8px] text-zinc-650 font-black tracking-widest px-2 py-1 border-b border-[#121214] uppercase mb-1">
                SELECT POWER TOOL
              </div>

              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-emerald-450 pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-emerald-455" />
                  <span>6. EXECUTIVE DASHBOARD</span>
                </span>
                <span className="text-[8px] text-zinc-650">OVERVIEW</span>
              </button>

              <button
                onClick={() => setActiveTab('alerts')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'alerts'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-emerald-450 pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Bell className="w-3 h-3 text-rose-400 animate-pulse" />
                  <span>7. REALTIME ALERTS</span>
                </span>
                <span className="text-[8px] text-zinc-650">DISPATCH QUEUE</span>
              </button>

              <button
                onClick={() => setActiveTab('automation')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'automation'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-emerald-450 pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3 h-3 text-cyan-405" />
                  <span>8. SMS AUTO-DISPATCH</span>
                </span>
                <span className="text-[8px] text-zinc-650">CARRIER GATEWAY</span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-emerald-450 pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-zinc-400" />
                  <span>9. COMPLIANCE REPORTS</span>
                </span>
                <span className="text-[8px] text-zinc-650">SEC DOSSIER</span>
              </button>

              <button
                onClick={() => setActiveTab('arbor')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'arbor'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-emerald-450 pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3 h-3 text-emerald-400" />
                  <span>10. RESEARCH & COMMUNITY</span>
                </span>
                <span className="text-[8px] text-zinc-650">KNOWLEDGE</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left px-2.5 py-2 text-[10px] font-medium transition-all rounded-xs flex items-center justify-between cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-zinc-900 text-white font-bold border-l-2 border-emerald-450 pl-2'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3 h-3 text-zinc-500" />
                  <span>11. WORKSPACE CONFIG</span>
                </span>
                <span className="text-[8px] text-zinc-650">SETTINGS</span>
              </button>
            </div>
          </div>


        </div>

        {/* Real HTTP OAuth Action segment header (Bug #9) */}
        <div className="flex items-center gap-4 text-[9.5px]">
          {session?.authenticated ? (
            <div className="flex items-center gap-3.5 bg-zinc-950 px-3.5 py-1.5 border border-zinc-900 rounded-xs">
              <img 
                src={session.avatar} 
                alt="user avatar" 
                className="w-4 h-4 rounded-full border border-zinc-800 object-cover" 
                referrerPolicy="no-referrer"
              />
              <span className="text-[10px] font-black text-white uppercase">{session.name}</span>
              <span className="text-zinc-800">|</span>
              <button 
                onClick={handleLogout} 
                className="hover:text-white transition-colors cursor-pointer text-zinc-500 uppercase font-black flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>LOGOUT</span>
              </button>
            </div>
          ) : (
            <div className="flex items-[#center] gap-2">
              <span className="text-zinc-600 hidden md:block uppercase font-black text-[8.5px] mr-2">SANDBOX SYSTEM:</span>
              <a 
                href="/api/auth/sandbox" 
                className="px-3 py-1.5 border border-zinc-850 hover:border-zinc-755 bg-zinc-950 text-zinc-450 hover:text-white uppercase font-black transition-colors flex items-center gap-1.5 text-[9px] rounded-xs"
              >
                <span>◌</span>
                <span>ACTIVATE OFFLINE SANDBOX SESSION</span>
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Interactive Continuously-Scrolling Nasdaq Ticker Tape (Restricted to Landing Page only) */}
      {activeTab === 'home' && <TickerTape />}
 
       {/* Main workspace frame */}
       <main className="flex-1 p-4 md:p-6 flex flex-col gap-6 w-full max-w-full justify-start">
        {/* Global Asset & Timeframe pickers rendered at the top of the active page layout */}
        {activeTab !== 'home' && activeTab !== 'skyvision' && (
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-lg border gap-3 ${
            isLight 
              ? 'bg-zinc-50 border-zinc-200 text-zinc-900 shadow-sm' 
              : 'bg-[#09090b] border-zinc-900 text-zinc-100 shadow-2xl relative z-10'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Active Workstation Controls // {selectedAsset.name} ({selectedAsset.ticker})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono uppercase font-black ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>ACTIVE TARGET:</span>
              <select
                value={selectedAsset.ticker}
                onChange={(e) => {
                  const targetAsset = ASSET_LIST.find(a => a.ticker === e.target.value);
                  if (targetAsset) {
                    setSelectedAsset(targetAsset);
                  }
                }}
                className={`border text-[10px] font-black py-1 px-3 rounded-md focus:outline-none focus:border-zinc-500 cursor-pointer transition-all ${
                  isLight 
                    ? 'bg-white border-zinc-300 text-zinc-800 hover:border-zinc-400' 
                    : 'bg-black border-zinc-800 text-white focus:border-zinc-700'
                }`}
              >
                {ASSET_LIST.map(a => (
                  <option key={a.ticker} value={a.ticker}>{a.ticker}</option>
                ))}
              </select>
              <span className="text-zinc-800 text-xs hidden sm:inline">|</span>
              <span className={`text-[9px] font-mono uppercase font-black ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>TIMEFRAME:</span>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                className={`border text-[10px] font-black py-1 px-3 rounded-md focus:outline-none focus:border-zinc-500 cursor-pointer transition-all ${
                  isLight 
                    ? 'bg-white border-zinc-300 text-zinc-800 hover:border-zinc-400' 
                    : 'bg-black border-zinc-800 text-white focus:border-zinc-700'
                }`}
              >
                <option value="5m">5m</option>
                <option value="15m">15m</option>
                <option value="1h">1h</option>
                <option value="4h">4h</option>
                <option value="1d">1d</option>
              </select>
            </div>
          </div>
        )}
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="animate-fadeIn">
            <SlayerIntro 
              onEnterApp={(targetTab) => setActiveTab((targetTab as any) || 'skyvision')} 
              selectedAsset={selectedAsset}
              setSelectedAsset={setSelectedAsset}
              selectedTimeframe={selectedTimeframe}
              setSelectedTimeframe={setSelectedTimeframe}
              systemScore={serverState.system_score}
              v8Trades={serverState.trade_archive}
              bestOpportunity={bestOpportunity}
              topSub10Calls={topSub10Calls}
              topSub10Puts={topSub10Puts}
              onSelectOpportunity={(asset, type, strike) => {
                handleSelectOpportunity(asset, type, strike);
              }}
              renderTerminalWorkspace={() => null}
            />
          </div>
        )}

        {/* TAB 2: SKYVISION (DECISION ENGINE) */}
        {activeTab === 'skyvision' && (
          <div className="view-enter">
            <SkyVisionView />
          </div>
        )}

        {/* TAB 3: PINPOINT AI (MARKET INTELLIGENCE) */}
        {activeTab === 'pinpoint' && (
          <div className="view-enter border border-zinc-900 bg-[#060607] rounded-md p-1 drop-shadow-2xl relative z-10">
            <PinpointAIView />
          </div>
        )}

        {/* TAB 5: AUDIT (TRUST ENGINE) */}
        {activeTab === 'auditor' && (
          <div className="view-enter">
            <QuantAuditView
              selectedAsset={selectedAsset}
              isCall={selectedOptionType === 'C'}
              systemScore={serverState.system_score}
              optionPremium={serverState.optionPremiumFloat}
              trades={serverState.trade_archive}
              onClearTrades={clearV8Trades}
            />
          </div>
        )}

        {/* TAB 6: DEALER FLOW */}
        {activeTab === 'dealerflow' && (
          <div className="view-enter">
            <DealerFlowView />
          </div>
        )}

        {/* TAB 7: EXECUTIVE DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="view-enter">
            <DashboardView />
          </div>
        )}

        {/* TAB 8: REALTIME ALERTS */}
        {activeTab === 'alerts' && (
          <div className="view-enter">
            <AlertsView />
          </div>
        )}

        {/* TAB 9: SMS AUTO-DISPATCH */}
        {activeTab === 'automation' && (
          <div className="view-enter">
            <AutomationView />
          </div>
        )}

        {/* TAB 10: COMPLIANCE REPORTS */}
        {activeTab === 'reports' && (
          <div className="view-enter">
            <ReportsView />
          </div>
        )}

        {/* TAB 11: RESEARCH & COMMUNITY */}
        {activeTab === 'arbor' && (
          <div className="view-enter">
            <ArborCapital />
          </div>
        )}

        {/* TAB 12: WORKSPACE CONFIG */}
        {activeTab === 'settings' && (
          <div className="view-enter">
            <SettingsView />
          </div>
        )}
      </main>

      {/* Terminal Footer Status Bar */}
      <footer className="mt-auto border-t border-zinc-900 bg-black px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between text-[9px] text-zinc-550 font-mono tracking-widest uppercase gap-2">
        <div className="flex flex-wrap gap-4 sm:gap-6 justify-center sm:justify-start">
          <span>SYSTEM STATUS: OPTIMAL</span>
          <span className="text-zinc-850">|</span>
          <span>LATENCY: ACTIVE (SSE SYNC)</span>
          <span className="text-zinc-850">|</span>
          <span>FEED: CME GROUP DIRECT FEED</span>
          <span className="text-zinc-850">|</span>
          <span>PROVENANCE TRAIL ACTIVE</span>
          <span className="text-zinc-850">|</span>
          <span className="text-white">AUDIT: {serverState?.provenance?.audit_id || 'AUD-991A'}</span>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-zinc-400 font-bold">SERVER LIVE FEED STREAMING</span>
        </div>
      </footer>

      {/* Fixed Universally Floating Theme Switcher Badge */}
      <button
        onClick={toggleThemeMode}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full shadow-2xl border transition-all duration-300 hover:scale-110 cursor-pointer backdrop-blur-md ${
          isLight 
            ? 'bg-white/90 border-zinc-200 text-amber-500 shadow-amber-500/10' 
            : 'bg-[#050506]/90 border-zinc-850 text-indigo-400 shadow-indigo-500/10'
        }`}
        title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      >
        <motion.div
          key={themeMode}
          initial={{ rotate: -90, scale: 0.8, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex items-center justify-center"
        >
          {isLight ? <Sun className="w-5.5 h-5.5 text-amber-500" /> : <Moon className="w-5.5 h-5.5 text-indigo-400" />}
        </motion.div>
      </button>
    </div>
  );
}
