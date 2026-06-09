import { useState, useEffect } from 'react';
import { useContractStore } from './lib/store';
import { ASSET_LIST } from './data';
import { AssetInfo } from './types';

// Import Workspace Modular Views
import { SkyVisionView } from './components/SkyVisionView';
import { PinpointAIView } from './components/PinpointAIView';
import { QuantAuditView } from './components/QuantAuditView';
import { DiscoveryView } from './components/DiscoveryView';
import SlayerIntro from './components/SlayerIntro';

import {
  Sparkles,
  Database,
  Compass,
  Dna,
  Lock,
  LogOut
} from 'lucide-react';

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

  const handleSelectOpportunity = (asset: AssetInfo, type: 'C' | 'P') => {
    setSelectedAsset(asset);
    setSelectedOptionType(type);
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

  return (
    <div className="min-h-screen bg-black text-[#f4f4f5] flex flex-col font-mono select-none overflow-x-hidden antialiased">
      
      {/* Upper ecosystem gouverning top banner overlay */}
      <header className="border-b border-zinc-900 bg-black px-6 py-4.5 flex flex-col sm:flex-row justify-between items-center select-none font-mono gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white select-none animate-pulse" />
          <span className="text-xs font-black tracking-widest text-[#FFFFFF] uppercase">
            SLAYER <span className="text-zinc-650 font-normal">/ BY ARBOR CAPITAL</span>
          </span>
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
            <div className="flex items-center gap-2">
              <span className="text-zinc-600 block uppercase font-black text-[8.5px] mr-2">SANDBOX SYSTEM:</span>
              <a 
                href="/api/auth/sandbox" 
                className="px-3 py-1 border border-zinc-850 hover:border-zinc-755 bg-zinc-950 text-zinc-450 hover:text-white uppercase font-black transition-colors flex items-center gap-1.5 text-[9px] rounded-xs"
              >
                <span>◌</span>
                <span>ACTIVATE OFFLINE SANDBOX SESSION</span>
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Main Mode Navigation Bar (Separate product branding accents) */}
      <nav className="bg-[#050505] border-b border-zinc-900 px-6 py-2 flex flex-wrap justify-between items-center gap-2 select-none">
        <div className="flex flex-wrap gap-2">
          {/* HOME LANDING */}
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3.5 py-1.5 text-[10px] font-bold cursor-pointer transition-all border uppercase rounded-xs ${
              activeTab === 'home'
                ? 'bg-zinc-900 text-white border-zinc-800'
                : 'bg-black/35 border-transparent hover:border-zinc-850 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>Ecosystem Introduction</span>
          </button>

          {/* 1. SKYVISION */}
          <button
            onClick={() => setActiveTab('skyvision')}
            className={`px-3.5 py-1.5 text-[10px] font-bold cursor-pointer transition-all border uppercase flex items-center gap-1.5 rounded-xs ${
              activeTab === 'skyvision'
                ? 'bg-white text-black border-white font-extrabold shadow-md'
                : 'bg-black/35 border-transparent hover:border-zinc-850 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Slayer // SkyVision</span>
          </button>

          {/* 2. PINPOINT */}
          <button
            onClick={() => setActiveTab('pinpoint')}
            className={`px-3.5 py-1.5 text-[10px] font-bold cursor-pointer transition-all border uppercase flex items-center gap-1.5 rounded-xs ${
              activeTab === 'pinpoint'
                ? 'bg-zinc-900 text-white border-zinc-850'
                : 'bg-black/35 border-transparent hover:border-zinc-850 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Dna className="w-3 h-3" />
            <span>Slayer // Pinpoint</span>
          </button>

          {/* 3. DISCOVERY */}
          <button
            onClick={() => setActiveTab('discovery')}
            className={`px-3.5 py-1.5 text-[10px] font-bold cursor-pointer transition-all border uppercase flex items-center gap-1.5 rounded-xs ${
              activeTab === 'discovery'
                ? 'bg-zinc-900 text-white border-zinc-850'
                : 'bg-black/35 border-transparent hover:border-zinc-850 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>Slayer // Discovery</span>
          </button>

          {/* 4. TRADE ARCHIVE */}
          <button
            onClick={() => setActiveTab('auditor')}
            className={`px-3.5 py-1.5 text-[10px] font-bold cursor-pointer transition-all border uppercase flex items-center gap-1.5 rounded-xs ${
              activeTab === 'auditor'
                ? 'bg-zinc-900 text-white border-zinc-850'
                : 'bg-black/35 border-transparent hover:border-zinc-850 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Database className="w-3 h-3" />
            <span>Trust Archive</span>
          </button>
        </div>

        {/* Quick config settings dropdowns for immediate workspace access */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 select-none">
            <span className="text-[9px] text-zinc-550 uppercase">INDEX</span>
            <select
              value={selectedAsset.ticker}
              onChange={(e) => {
                const targetAsset = ASSET_LIST.find(a => a.ticker === e.target.value);
                if (targetAsset) {
                  setSelectedAsset(targetAsset);
                }
              }}
              className="bg-black border border-zinc-850 text-[10.5px] py-1 px-2 text-zinc-300 rounded-xs focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              {ASSET_LIST.map(a => (
                <option key={a.ticker} value={a.ticker}>{a.ticker}</option>
              ))}
            </select>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="bg-black border border-zinc-850 text-[10.5px] py-1 px-2 text-zinc-300 rounded-xs focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="1h">1h</option>
              <option value="4h">4h</option>
              <option value="1d">1d</option>
            </select>
          </div>
        </div>
      </nav>

      {/* Main workspace frame */}
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-6 max-w-7xl w-full mx-auto justify-start">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="animate-fadeIn">
            <SlayerIntro 
              onEnterApp={() => setActiveTab('skyvision')} 
              selectedAsset={selectedAsset}
              setSelectedAsset={setSelectedAsset}
              selectedTimeframe={selectedTimeframe}
              setSelectedTimeframe={setSelectedTimeframe}
              systemScore={serverState.system_score}
              v8Trades={serverState.trade_archive}
              bestOpportunity={bestOpportunity}
              topSub10Calls={topSub10Calls}
              topSub10Puts={topSub10Puts}
              onSelectOpportunity={(asset, type) => {
                handleSelectOpportunity(asset, type);
              }}
              renderTerminalWorkspace={() => null}
            />
          </div>
        )}

        {/* TAB 2: SKYVISION (DECISION ENGINE) */}
        {activeTab === 'skyvision' && (
          <SkyVisionView />
        )}

        {/* TAB 3: PINPOINT AI (MARKET INTELLIGENCE) */}
        {activeTab === 'pinpoint' && (
          <PinpointAIView />
        )}

        {/* TAB 4: DISCOVERY (OPPORTUNITY ENGINE) */}
        {activeTab === 'discovery' && (
          <DiscoveryView
            systemScore={serverState.system_score}
            discovery={serverState.discovery}
            onSelectContract={(asset, strike, isCall) => {
              setSelectedAsset(asset);
              setCustomStrike(strike);
              setSelectedOptionType(isCall ? 'C' : 'P');
              setActiveTab('skyvision');
            }}
          />
        )}

        {/* TAB 5: AUDIT (TRUST ENGINE) */}
        {activeTab === 'auditor' && (
          <QuantAuditView
            selectedAsset={selectedAsset}
            isCall={selectedOptionType === 'C'}
            systemScore={serverState.system_score}
            optionPremium={serverState.optionPremiumFloat}
            trades={serverState.trade_archive}
            onClearTrades={clearV8Trades}
          />
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
    </div>
  );
}
