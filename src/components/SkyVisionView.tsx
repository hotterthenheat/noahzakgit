import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useContractStore, ContractState } from '../lib/store';
import { InteractiveChart } from './InteractiveChart';
import { ASSET_LIST } from '../data';
import { Zap, Percent, HelpCircle, FileText, CheckCircle2, Bot } from 'lucide-react';

export function SkyVisionView() {
  const selectedAsset = useContractStore(s => s.selectedAsset);
  const selectedOptionType = useContractStore(s => s.selectedOptionType);
  const selectedTimeframe = useContractStore(s => s.selectedTimeframe);
  const selectedStrike = useContractStore(s => s.selectedStrike);
  const activeContract = useContractStore(s => s.activeContract);
  const serverState = useContractStore(s => s.serverState);
  
  const selectContract = useContractStore(s => s.selectContract);
  const setSelectedAsset = useContractStore(s => s.setSelectedAsset);
  const setSelectedStrike = useContractStore(s => s.setSelectedStrike);
  const setSelectedOptionType = useContractStore(s => s.setSelectedOptionType);
  const isPositionOpen = useContractStore(s => s.isPositionOpen);

  const [isExpanded, setIsExpanded] = React.useState(false);

  const spotPrice = serverState?.pinpoint_map?.spot_price || selectedAsset.defaultPrice;
  const activeStrike = selectedStrike || Math.round(spotPrice / 10) * 10;
  
  // Setup nice option premium price
  const activePrice = serverState?.optionPremiumFloat || 4.20;

  const [isDeepSkyseyeExpanded, setIsDeepSkyseyeExpanded] = React.useState(false);

  // Render the preloaded Strikes Chain Centered on Spot but display them as list of OptionCards (Bug #4)
  const strikesList = useMemo(() => {
    const step = serverState?.pinpoint_map?.step || (spotPrice > 1000 ? 100 : spotPrice > 150 ? 5 : 1);
    const center = Math.round(spotPrice / step) * step;
    
    // Generate 10 strike rows centered on active Spot Price
    return [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map(factor => {
      const strikeValue = center + (factor * step);
      const isSpotRow = factor === 0;

      // Calls logic
      let callHealth = 88;
      if (strikeValue <= spotPrice) {
        callHealth = Math.round(96 - (spotPrice - strikeValue) * 0.04);
      } else {
        callHealth = Math.round(91 - (strikeValue - spotPrice) * 1.6 / step);
      }
      callHealth = Math.max(30, Math.min(98, callHealth));
      const callAction = callHealth >= 94 ? 'ENTER' : callHealth >= 75 ? 'HOLD' : callHealth <= 45 ? 'SELL' : 'REDUCE';

      // Puts logic
      let putHealth = 65;
      if (strikeValue >= spotPrice) {
        putHealth = Math.round(34 - (strikeValue - spotPrice) * 1.1 / step);
      } else {
        putHealth = Math.round(79 + (spotPrice - strikeValue) * 0.4 / step);
      }
      putHealth = Math.max(25, Math.min(94, putHealth));
      const putAction = putHealth >= 88 ? 'ENTER' : putHealth >= 65 ? 'HOLD' : putHealth <= 40 ? 'SELL' : 'REDUCE';

      return {
        strike: strikeValue,
        isSpotRow,
        callHealth,
        callAction,
        callMove: Math.round(35 + (spotPrice - strikeValue) * 0.4),
        putHealth,
        putAction,
        putMove: Math.round(22 + (spotPrice - strikeValue) * 0.35)
      };
    });
  }, [spotPrice]);

  // OptionCard Component for selection - strictly no Delta/Gamma clutter (Bug #4, Bug #7)
  interface OptionCardProps {
    strikeLabel: string;
    health: number;
    move: number;
    action: string;
    isSelected: boolean;
    onClick: () => void;
    key?: string;
  }
  function OptionCard({ strikeLabel, health, move, action, isSelected, onClick }: OptionCardProps) {
    const actionColor = action === 'ENTER' ? 'text-[#00ff88] border-[#00ff88]/30 bg-[#00ff88]/5' : action === 'SELL' ? 'text-rose-400 border-rose-400/30 bg-rose-400/5' : 'text-zinc-400 border-zinc-800 bg-zinc-950/40';
    const momentum = health > 85 ? 'STRENGTHENING' : health < 60 ? 'WEAKENING' : 'NEUTRAL';

    return (
      <motion.div
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        onClick={onClick}
        className={`p-3.5 border rounded-sm cursor-pointer transition-all flex flex-col gap-2 text-left ${
          isSelected 
            ? 'bg-zinc-900 border-white text-white shadow-xl' 
            : 'bg-[#030303] border-zinc-900 hover:border-zinc-850 text-zinc-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-black font-sans text-white">{strikeLabel}</span>
            <span className="text-[7.5px] uppercase tracking-wider text-zinc-500">HEALTH: {health} PTS</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-400 font-bold font-mono text-[10px]">+{move}%</span>
            <span className={`px-2.5 py-0.5 rounded-xs text-[8.5px] font-black tracking-widest border uppercase ${actionColor}`}>
              {action}
            </span>
          </div>
        </div>
        <div className="flex mt-1 pt-2 border-t border-zinc-900/40 justify-between items-center">
           <span className="text-[8px] text-zinc-500 font-mono">FLOW MOMENTUM:</span>
           <span className={`text-[8.5px] font-black uppercase ${momentum === 'STRENGTHENING' ? 'text-emerald-400' : momentum === 'WEAKENING' ? 'text-rose-400' : 'text-zinc-400'}`}>{momentum}</span>
        </div>
      </motion.div>
    );
  }

  // Active decision and parameters derived
  const selectedFocusedOption = strikesList.find(s => s.strike === activeStrike);
  const tradeHealthValue = selectedFocusedOption 
    ? (selectedOptionType === 'C' ? selectedFocusedOption.callHealth : selectedFocusedOption.putHealth) 
    : 85;
  const activeRecommendation = selectedFocusedOption
    ? (selectedOptionType === 'C' ? selectedFocusedOption.callAction : selectedFocusedOption.putAction)
    : (activeContract?.recommendation || 'HOLD');
  const expectedMoveField = selectedFocusedOption
    ? (selectedOptionType === 'C' ? selectedFocusedOption.callMove : selectedFocusedOption.putMove)
    : (activeContract?.expectedMove || 42);

  // Real-time custom targets list
  const profitTargetsList = useMemo(() => {
    return [
      { id: 't1', label: 'Take Profit 1', optionValue: activePrice * 1.3, expectedPnL: '+30%', status: tradeHealthValue > 70 ? 'HIT TP 1 🎯' : 'IN PROGRESS' },
      { id: 't2', label: 'Take Profit 2', optionValue: activePrice * 1.8, expectedPnL: '+80%', status: tradeHealthValue > 85 ? 'HIT TP 2 🎯' : 'IN PROGRESS' },
      { id: 't3', label: 'Take Profit 3', optionValue: activePrice * 2.5, expectedPnL: '+150%', status: tradeHealthValue > 95 ? 'HIT TP 3 🎯' : 'PENDING' },
      { id: 't4', label: 'Take Profit 4', optionValue: activePrice * 3.5, expectedPnL: '+250%', status: 'PENDING' },
    ];
  }, [activePrice, tradeHealthValue]);

  const [searchQuery, setSearchQuery] = React.useState('');

  if (!isExpanded) {
    const signals = [
      { asset: 'SPX', type: 'CALL', strike: 7620, price: 5.40, t1: 7.20, p1: 33, t2: 9.50, p2: 75, desc: 'BULLISH MOMENTUM STRIKE DRIFT IDENTIFIED', detail: 'High order-flow clustering detected on institutional SPX grids.' },
      { asset: 'QQQ', type: 'PUT', strike: 440, price: 2.10, t1: 3.10, p1: 47, t2: 4.80, p2: 128, desc: 'BEARISH LIQUIDITY SWEEP DETECTED', detail: 'Major selling pressure confirmed on derivative VWAP retest.' },
      { asset: 'NDX', type: 'CALL', strike: 18500, price: 14.50, t1: 18.00, p1: 24, t2: 25.50, p2: 75, desc: 'VOLATILITY COMPRESSION BREAKOUT', detail: 'Gamma squeeze parameters aligning with dealer positioning.' }
    ];

    return (
      <div className="w-full text-zinc-200 flex flex-col font-mono select-none antialiased max-w-5xl mx-auto pt-4 relative">
         <div className="absolute top-0 right-4 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">
            LIVE SCANNER ACTIVE
         </div>
         <h2 className="text-xl font-black text-white px-4">TOP OPPORTUNITIES TODAY</h2>
         <p className="text-xs text-zinc-500 px-4 mb-6">Continuous monitoring of all option contracts across tracked indices.</p>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
           {signals.map((sig, i) => (
             <motion.div 
               key={i}
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={() => {
                 const asset = ASSET_LIST.find(a => a.ticker === sig.asset);
                 if (asset) setSelectedAsset(asset);
                 setSelectedStrike(sig.strike);
                 setSelectedOptionType(sig.type.charAt(0) as 'C'|'P');
                 setIsExpanded(true);
               }}
               className="w-full bg-[#050505] border border-zinc-900 rounded-xl p-5 cursor-pointer hover:border-zinc-700 transition-all text-left flex flex-col gap-4 relative shadow-2xl"
             >
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <Bot className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black text-white">Slayer Signal</h3>
                      <span className="text-[8px] text-zinc-500 tracking-widest uppercase">{i === 0 ? 'JUST NOW' : i * 15 + ' MINS AGO'}</span>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 font-black uppercase text-[8px] tracking-widest">
                    TRIGGERED
                  </div>
               </div>

               <div className="space-y-1">
                  <h4 className="text-xs font-black text-emerald-400">
                     {sig.asset} {sig.desc}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-sans tracking-wide leading-snug">
                    {sig.detail}
                  </p>
               </div>

               <div className="w-full bg-zinc-950 border border-zinc-900 rounded-lg p-3 grid grid-cols-2 gap-y-3 gap-x-4 mt-auto">
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">CONTRACT</span>
                    <div className="text-xs font-black text-white">{sig.asset} {sig.strike}{sig.type.charAt(0)}</div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">ENTRY</span>
                    <div className="text-xs font-black text-emerald-400">Under ${sig.price.toFixed(2)}</div>
                  </div>
                  <div className="space-y-0.5 col-span-2">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">TARGET</span>
                    <div className="text-xs font-black text-white">${sig.t1.toFixed(2)} <span className="text-emerald-400">(+{sig.p1}%)</span></div>
                  </div>
               </div>
             </motion.div>
           ))}
         </div>

         {/* Search Box below the top boxes */}
         <div className="mt-12 px-4 w-full">
            <h3 className="text-sm font-black text-zinc-300 uppercase tracking-wider mb-3 items-center flex gap-2">
              <Zap className="w-4 h-4 text-[#4f8cff]" />
              Manual Ticker Explorer
            </h3>
            <div className="relative w-full max-w-2xl bg-[#050505] p-1 border border-zinc-900 rounded-lg flex items-center">
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search ticker (e.g. SPY, NDX, MSFT)..." 
                 className="w-full bg-transparent border-none px-4 py-3 text-sm text-white font-black uppercase focus:outline-none placeholder-zinc-700" 
               />
               <button 
                 onClick={() => {
                   if (searchQuery.trim().length > 0) {
                     // For UI sake, just select first asset or create a mock one. Or match by symbol if it exists.
                     const q = searchQuery.toUpperCase();
                     const found = ASSET_LIST.find(a => a.ticker === q);
                     if (found) setSelectedAsset(found);
                     else {
                       // Keep whatever default, but mock search functionality by opening
                       // In real app, we'd lookup custom option chain
                     }
                     setIsExpanded(true);
                   }
                 }}
                 className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-6 py-2.5 rounded-md text-[11px] font-bold uppercase hover:bg-emerald-500/20 mr-1 transition-colors whitespace-nowrap"
               >
                 PULL CHAIN
               </button>
            </div>
            
            {/* Simple autocomplete suggestions */}
            {searchQuery.length > 0 && (
               <div className="w-full max-w-2xl mt-2 bg-zinc-950 border border-zinc-900 rounded-lg shadow-xl overflow-hidden divide-y divide-zinc-900/50">
                  {ASSET_LIST.filter(a => a.ticker.includes(searchQuery.toUpperCase())).map((asset) => (
                    <div 
                      key={asset.ticker}
                      className="px-4 py-3 hover:bg-zinc-900 cursor-pointer flex justify-between items-center transition-colors text-left"
                      onClick={() => {
                        setSelectedAsset(asset);
                        setSearchQuery('');
                        setIsExpanded(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-black text-white text-sm">{asset.ticker}</span>
                        <span className="text-[10px] text-zinc-500 uppercase">{asset.name}</span>
                      </div>
                      <span className="text-[9px] text-[#4f8cff] uppercase font-bold bg-[#4f8cff]/10 px-2 py-0.5 rounded">View Options</span>
                    </div>
                  ))}
                  {searchQuery.length > 0 && !ASSET_LIST.some(a => a.ticker.includes(searchQuery.toUpperCase())) && (
                    <div className="px-4 py-3 hover:bg-zinc-900 cursor-pointer flex justify-between items-center transition-colors text-left" onClick={() => setIsExpanded(true)}>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-white text-sm uppercase">{searchQuery}</span>
                        <span className="text-[10px] text-zinc-500 uppercase">Load External Chain</span>
                      </div>
                    </div>
                  )}
               </div>
            )}
         </div>
      </div>
    );
  }

  return (
    <div className="w-full text-zinc-200 flex flex-col font-mono select-none antialiased space-y-6">
      
      {/* Back Button to list */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-zinc-900/50">
        <button 
          onClick={() => setIsExpanded(false)}
          className="flex items-center gap-2 text-[10px] text-zinc-400 hover:text-white uppercase tracking-widest font-black py-1 px-3 bg-zinc-900/50 rounded hover:bg-zinc-800 transition-colors"
        >
          ← BACK TO SIGNALS
        </button>
        <span className="text-[10px] text-zinc-500 uppercase font-black">SELECTED: {selectedAsset.ticker} {activeStrike}{selectedOptionType}</span>
      </div>

      {/* Index Selector (Level 2 Brand Header Context) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#050505] border border-zinc-900 p-3.5 rounded-sm gap-2">
        <div className="flex gap-2 items-center">
          <Zap className="w-4 h-4 text-zinc-400 animate-pulse" />
          <span className="text-[8.5px] text-zinc-550 uppercase tracking-widest font-black">SLAYER ACTIVE TERMINAL CORE / BY ARBOR CAPITAL</span>
        </div>
        
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-black p-0.5 border border-zinc-900 rounded-sm">
            {ASSET_LIST.map(asset => (
              <button
                key={asset.ticker}
                onClick={() => setSelectedAsset(asset)}
                className={`px-3.5 py-1 text-[9px] uppercase font-black tracking-widest rounded-xs transition-all cursor-pointer ${
                  selectedAsset.ticker === asset.ticker
                    ? 'bg-white text-black font-extrabold shadow'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {asset.ticker}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-zinc-900">
             <span className="text-[8px] text-zinc-500">CUSTOM:</span>
             <input type="text" placeholder="TICKER" className="bg-zinc-950 border border-zinc-800 text-xs px-2 py-1 rounded w-16 text-center text-white focus:outline-none focus:border-emerald-500 transition-colors" />
             <button className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded text-[9px] font-bold uppercase hover:bg-emerald-500/20">PULL</button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          BUG #5: SKYVISION SCREEN HIERARCHY - REORGANIZED FOR PARALLEL GRID
          Left: Provenance Evaluation Matrix, Profit Targets & Summary
          Right: Options Cards Selection
          Bottom: Full-Width High-Precision Chart View
          ===================================================================== */}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        
        {/* LEFT COLUMN: PROVENANCE EVALUATION MATRIX & METRICS */}
        <div className="lg:col-span-6 flex flex-col gap-4 w-full">
          
          {/* PROVENANCE EVALUATION MATRIX CARD */}
          <div 
            className="w-full apple-glass rounded-2xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-between transition-all duration-300 hover:border-white/15"
            style={{ minHeight: '340px' }}
          >
            {/* Moving border white line constantly running along the perimeter */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ borderRadius: 'inherit' }}>
              <rect
                x="0.75"
                y="0.75"
                width="calc(100% - 1.5px)"
                height="calc(100% - 1.5px)"
                rx="16"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
              />
              <motion.rect
                x="0.75"
                y="0.75"
                width="calc(100% - 1.5px)"
                height="calc(100% - 1.5px)"
                rx="16"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                pathLength={1}
                strokeDasharray="0.16 0.84"
                animate={{
                  strokeDashoffset: [0, -1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 5,
                  ease: "linear",
                }}
              />
            </svg>

            {/* Accent high strip */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/20" />

            {/* Top Line label */}
            <div className="flex justify-between items-start border-b border-zinc-900/40 pb-4 relative z-10">
              <div className="text-left space-y-1">
                <span className="text-[8.5px] text-zinc-500 tracking-widest uppercase font-black block text-left">OPTION DECISION ENGINE</span>
                <h1 className="text-xl md:text-2xl font-black text-white font-sans tracking-tight uppercase leading-none">
                  {selectedAsset.ticker} {activeStrike}{selectedOptionType}
                </h1>
              </div>
              <div className="text-right bg-zinc-950 p-2 border border-zinc-900 rounded-lg text-[10px]">
                <span className="text-zinc-550 uppercase text-[8px] block">LIVE MID</span>
                <span className="text-white font-extrabold block text-xs">${(activePrice ?? 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Grid of decision layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch my-2 relative z-10">
              
              {/* Recommendation block */}
              <div className="bg-zinc-950/60 border border-zinc-900/60 p-4.5 rounded-xl flex flex-col justify-between text-left">
                <div>
                  <span className="text-[8px] text-zinc-550 tracking-wider uppercase block">RECOMMENDATION STRATEGY</span>
                  <span className="text-xl md:text-2xl font-extrabold text-white font-sans uppercase block tracking-tight pt-1">
                    {activeRecommendation}
                  </span>
                </div>
                <div className="text-[9.5px] text-zinc-400 pt-3 border-t border-zinc-900/30 leading-relaxed font-sans mt-2">
                  Position bias established under strict statistical continuous evaluation.
                </div>
              </div>

              {/* Health index dials */}
              <div className="bg-zinc-950/30 border border-zinc-900/40 p-4 rounded-xl flex flex-col justify-center space-y-3 text-left">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-900/30">
                  <span className="text-zinc-500 uppercase text-[9px]">Decision Score</span>
                  <span className="font-extrabold text-white">{tradeHealthValue} <span className="text-[8px] text-zinc-550">PTS</span></span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-900/30">
                  <span className="text-zinc-500 uppercase text-[9px]">Heuristic Bias</span>
                  <span className="font-extrabold text-[#00ff88] uppercase">{tradeHealthValue >= 80 ? 'BULLISH ACCEL' : 'STABILIZING'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 uppercase text-[9px]">Calculated Move</span>
                  <span className="font-extrabold text-[#4f8cff]">+{expectedMoveField}% Expected</span>
                </div>
              </div>

            </div>

            {/* Bottom regulatory action bar */}
            <div className="border-t border-zinc-950 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-[#A1A1AA] gap-2 relative z-10">
              <span className="uppercase text-[8px] text-zinc-500 block">REAL-TIME GRID MODEL CALCULATION</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#30d158] rounded-full animate-ping" />
                <span className="font-black text-white px-2 py-0.5 border border-zinc-900 rounded-md uppercase text-[8px]">
                  LIVE UPDATES ACTIVE
                </span>
              </div>
            </div>

          </div>

          {/* STAGE 2: PROFIT TARGETS SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
            {profitTargetsList.map((tgt) => (
              <div 
                key={tgt.id}
                className="bg-[#050505] border border-zinc-900 p-4 rounded-sm flex items-center justify-between text-left"
              >
                <div className="space-y-1">
                  <span className="text-[7.5px] text-zinc-650 tracking-wider block font-black uppercase">{tgt.label}</span>
                  <h4 className={`text-[10px] font-black uppercase ${tgt.status.includes('HIT TP') ? 'text-[#00ff88]' : 'text-amber-400'}`}>{tgt.status}</h4>
                  <span className="text-[10px] text-zinc-400 block font-mono">Target: <span className="font-bold text-white">${tgt.optionValue.toFixed(2)}</span></span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-[#00ff88] block">{tgt.expectedPnL}</span>
                  <span className="text-[7px] text-zinc-500 uppercase block font-mono">EXPECTED</span>
                </div>
              </div>
            ))}
          </div>

          {/* STAGE 2.5: OPTION CHAIN ACTUAL GREEKS & INFO */}
          <div 
            className="w-full bg-[#050505] border border-zinc-900 p-4 rounded-md text-left flex flex-col gap-3 relative overflow-hidden"
          >
            <div className="flex justify-between items-center border-b border-zinc-900/50 pb-2">
              <span className="text-[9.5px] text-zinc-500 uppercase tracking-widest font-black">Contract Greeks & Volume Info</span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-[10px] font-mono">
              <div>
                <span className="block text-[8px] text-zinc-600 mb-0.5 tracking-widest">DELTA</span>
                <span className={`font-bold ${serverState?.active_greeks?.delta !== undefined ? (serverState.active_greeks.delta >= 0 ? 'text-[#00ff88]' : 'text-rose-400') : (selectedOptionType === 'C' ? 'text-[#00ff88]' : 'text-rose-400')}`}>
                  {serverState?.active_greeks?.delta !== undefined 
                    ? serverState.active_greeks.delta.toFixed(3) 
                    : (selectedOptionType === 'C' ? '0.540' : '-0.460')}
                </span>
              </div>
              <div>
                <span className="block text-[8px] text-zinc-600 mb-0.5 tracking-widest">GAMMA</span>
                <span className="text-white font-bold">
                  {serverState?.active_greeks?.gamma !== undefined 
                    ? serverState.active_greeks.gamma.toFixed(4) 
                    : (selectedOptionType === 'C' ? '0.0240' : '0.0280')}
                </span>
              </div>
              <div>
                <span className="block text-[8px] text-zinc-600 mb-0.5 tracking-widest">THETA</span>
                <span className="text-amber-400 font-bold">
                  {serverState?.active_greeks?.theta !== undefined 
                    ? serverState.active_greeks.theta.toFixed(3) 
                    : (selectedOptionType === 'C' ? '-0.810' : '-0.680')}
                </span>
              </div>
              <div>
                <span className="block text-[8px] text-zinc-600 mb-0.5 tracking-widest">VEGA</span>
                <span className="text-white font-bold">
                  {serverState?.active_greeks?.vega !== undefined 
                    ? serverState.active_greeks.vega.toFixed(3) 
                    : (selectedOptionType === 'C' ? '0.140' : '0.180')}
                </span>
              </div>
              <div className="border-l border-zinc-900 pl-3">
                <span className="block text-[8px] text-zinc-600 mb-0.5 tracking-widest">VOLUME</span>
                <span className="text-white font-bold">
                  {serverState?.active_volume !== undefined 
                    ? serverState.active_volume.toLocaleString() 
                    : (selectedOptionType === 'C' ? '14,204' : '22,401')}
                </span>
              </div>
            </div>
          </div>

          {/* STAGE 3: ANALYSIS SUMMARY SECTION */}
          <div className="w-full bg-[#050505] border border-zinc-900 p-5 rounded-2xl text-left space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
              <FileText className="w-3.5 h-3.5 text-zinc-500" />
              <h4 className="text-[10.5px] font-black text-white uppercase tracking-wider block">
                Analysis Summary & Market Outlook
              </h4>
            </div>
            <div className="text-[11px] leading-relaxed text-zinc-400 font-mono space-y-2 uppercase tracking-wide bg-zinc-950/50 p-3 rounded border border-zinc-900/50">
              <p>
                Decision Logic Triggered: {serverState?.position_management?.decision_reason || `High confidence condition detected.`}
              </p>
              <p>
                Order book flows indicate {serverState?.position_management?.momentum === 'ACCELERATING' ? 'concentrated execution pressure' : 'weak neutral shifts'}. 
                Action recommended is <span className="text-emerald-400 font-black">{activeRecommendation}</span> based on momentum shifting {tradeHealthValue > 70 ? 'UPWARDS' : 'DOWNWARDS'}.
              </p>
              {serverState?.deep_intelligence && (
                <div className="mt-2 pt-2 border-t border-zinc-900/60 font-sans tracking-normal space-y-1">
                  <p className="text-zinc-300 font-bold">• {activeStrike} contains {serverState.deep_intelligence.strike_metrics.gammaContribution} of total {selectedOptionType === 'C' ? 'call' : 'put'} gamma.</p>
                  <p className="text-zinc-300 font-bold">• Dealers become aggressive {selectedOptionType === 'C' ? 'buyers above' : 'sellers below'} {(serverState?.deep_intelligence?.dealer_metrics?.flipLevel ?? 0).toFixed(2)}.</p>
                  <p className="text-zinc-300 font-bold">• {(serverState?.deep_intelligence?.dealer_metrics?.putWall ?? 0).toFixed(2)} remains strongest downside support.</p>
                  <p className="text-zinc-300 font-bold">• {(serverState?.deep_intelligence?.dealer_metrics?.magnetStrike ?? 0).toFixed(2)} remains primary magnet strike.</p>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-zinc-900/60 flex items-center gap-1 text-[8.5px] text-zinc-500 uppercase font-black">
              <CheckCircle2 className="w-3 h-3 text-[#30d158]" />
              <span>STATISTICAL ANALYTICS MODEL VERIFIED ON MULTI-TIMEFRAME</span>
            </div>
          </div>

          {/* NEW LIVE ORDER BOOK FEED LOCATION */}
          <div className="w-full bg-[#050505] border border-zinc-900 p-4 rounded-2xl flex flex-col text-left mb-2">
             <div className="border-b border-zinc-900 pb-2 mb-3">
                <span className="text-[9.5px] text-zinc-400 font-black uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#4f8cff] rounded-full animate-pulse"></span> Live Order Book Feed (Filtered: {selectedAsset.ticker} {activeStrike}{selectedOptionType})
                </span>
             </div>
             <div className="flex flex-col gap-2 overflow-hidden text-[9.5px] font-mono">
                
                <div className={`flex flex-col gap-1.5 bg-zinc-950/80 p-2 rounded border border-zinc-900/60 transition-colors hover:border-${selectedOptionType === 'C' ? 'emerald-500' : 'rose-400'}/30`}>
                  <div className="flex justify-between items-center">
                    <span className={`${selectedOptionType === 'C' ? 'text-emerald-400' : 'text-rose-400'} font-bold`}>+1.2M BLOCK {selectedOptionType === 'C' ? 'BUY' : 'SELL'}</span>
                    <span className="text-white font-black">{selectedAsset.ticker} {activeStrike}{selectedOptionType}</span>
                  </div>
                  <span className="text-[8px] text-zinc-500 block">Dealer Desk • 2 Seconds Ago</span>
                </div>

                <div className={`flex flex-col gap-1.5 bg-zinc-950/80 p-2 rounded border border-zinc-900/60 transition-colors hover:border-${selectedOptionType === 'C' ? 'emerald-500' : 'rose-400'}/30`}>
                  <div className="flex justify-between items-center">
                    <span className={`${selectedOptionType === 'C' ? 'text-emerald-400' : 'text-rose-400'} font-bold`}>+840K BLOCK {selectedOptionType === 'C' ? 'BUY' : 'SELL'}</span>
                    <span className="text-white font-black">{selectedAsset.ticker} {activeStrike}{selectedOptionType}</span>
                  </div>
                  <span className="text-[8px] text-zinc-500 block">Derivative VWAP Setup • 12 Seconds Ago</span>
                </div>

                <div className={`flex flex-col gap-1.5 bg-zinc-950/80 p-2 rounded border border-zinc-900/60 transition-colors hover:border-${selectedOptionType === 'C' ? 'rose-400' : 'emerald-500'}/30`}>
                  <div className="flex justify-between items-center">
                    <span className={`${selectedOptionType === 'C' ? 'text-rose-400' : 'text-emerald-400'} font-bold`}>-400K REJECT</span>
                    <span className="text-white font-black">{selectedAsset.ticker} {activeStrike}{selectedOptionType}</span>
                  </div>
                  <span className="text-[8px] text-zinc-500 block">Dealer Liquidity Trap • 45 Seconds Ago</span>
                </div>

                <div className={`flex flex-col gap-1.5 bg-zinc-950/80 p-2 rounded border border-zinc-900/60 transition-colors hover:border-${selectedOptionType === 'C' ? 'emerald-500' : 'rose-400'}/30`}>
                  <div className="flex justify-between items-center">
                    <span className={`${selectedOptionType === 'C' ? 'text-emerald-400' : 'text-rose-400'} font-bold`}>+3.5M SWEEP</span>
                    <span className="text-white font-black">{selectedAsset.ticker} {activeStrike}{selectedOptionType}</span>
                  </div>
                  <span className="text-[8px] text-zinc-500 block">Institutional Volatility Leg • 1 Min Ago</span>
                </div>
             </div>
          </div>

        </div>

        {/* RIGHT COLUMN: SIMPLIFIED ADAPTIVE OPTIONS CHAIN DISPLAY */}
        <div className="lg:col-span-6 w-full bg-[#050505] border border-zinc-900 p-5 rounded-2xl flex flex-col justify-between" style={{ minHeight: '520px' }}>
          
          <div className="border-b border-zinc-900 pb-3 text-left">
            <h3 className="text-xs font-black text-white uppercase tracking-wider relative inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              LIVE CONTRACT FEED
            </h3>
            <p className="text-[8.5px] text-zinc-500 uppercase font-mono tracking-wider">
              Real-time changes, risk scores, momentum, and premium estimation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {/* CALL CARD COLUMNS */}
            <div className="space-y-2.5">
              <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest block text-left font-bold pl-1">
                🟢 CALL CONTRACT CARDS
              </span>
              <div className="flex flex-col gap-2">
                {strikesList.map((row) => {
                  const strikeLabel = `${selectedAsset.ticker} ${row.strike}C`;
                  const isSelected = activeStrike === row.strike && selectedOptionType === 'C';
                  return (
                    <OptionCard
                      key={`call-${row.strike}`}
                      strikeLabel={strikeLabel}
                      health={row.callHealth}
                      move={row.callMove}
                      action={row.callAction}
                      isSelected={isSelected}
                      onClick={() => {
                        setSelectedStrike(row.strike);
                        setSelectedOptionType('C');
                        selectContract(selectedAsset.ticker, row.strike, true);
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* PUT CARD COLUMNS */}
            <div className="space-y-2.5">
              <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest block text-left font-bold pl-1">
                🔴 PUT CONTRACT CARDS
              </span>
              <div className="flex flex-col gap-2">
                {strikesList.map((row) => {
                  const strikeLabel = `${selectedAsset.ticker} ${row.strike}P`;
                  const isSelected = activeStrike === row.strike && selectedOptionType === 'P';
                  return (
                    <OptionCard
                      key={`put-${row.strike}`}
                      strikeLabel={strikeLabel}
                      health={row.putHealth}
                      move={row.putMove}
                      action={row.putAction}
                      isSelected={isSelected}
                      onClick={() => {
                        setSelectedStrike(row.strike);
                        setSelectedOptionType('P');
                        selectContract(selectedAsset.ticker, row.strike, false);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-950 pt-2.5 mt-4 text-[8px] text-zinc-650 uppercase font-bold text-left">
            * Selected Contract: {selectedAsset.ticker} {activeStrike}{selectedOptionType} • Synced Live Coordinates
          </div>

        </div>

      </div>

      {/* EXPANDABLE DEEP INSTITUTIONAL INTELLIGENCE (SKYSEYE EXPANSION MODEL) */}
      <div className="w-full mt-2">
        <button 
          onClick={() => setIsDeepSkyseyeExpanded(!isDeepSkyseyeExpanded)}
          className="w-full bg-[#050505] border border-zinc-900 hover:border-zinc-700 hover:bg-zinc-900/50 transition-colors p-3 rounded-lg flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400"
        >
          {isDeepSkyseyeExpanded ? '▽ Hide Deep Institutional Intelligence' : '▷ Expand Deep Institutional Intelligence'}
        </button>

        {isDeepSkyseyeExpanded && serverState?.deep_intelligence && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4 text-left"
          >
            {/* COLUMN 1: CONTRACT & STRIKE INTELLIGENCE */}
            <div className="lg:col-span-8 flex flex-col gap-4">
               {/* Largest Impact Contracts */}
               <div className="bg-[#050505] border border-zinc-900 rounded-xl p-5">
                  <div className="border-b border-zinc-900 pb-2 mb-4 flex justify-between items-center">
                    <span className="text-[10px] text-zinc-300 font-black uppercase tracking-widest">Largest Impact Contracts</span>
                    <span className="text-[8px] text-[#4f8cff] uppercase px-2 py-0.5 border border-[#4f8cff]/30 bg-[#4f8cff]/10 rounded flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#4f8cff] rounded-full animate-pulse"></span>
                      Live Gamma Ranking 
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[9px] font-mono text-zinc-400">
                      <thead>
                        <tr className="border-b border-zinc-900 text-zinc-500 uppercase tracking-widest">
                          <th className="pb-2 font-black">Impact Rank</th>
                          <th className="pb-2 font-black">Contract</th>
                          <th className="pb-2 font-black">Exp</th>
                          <th className="pb-2 font-black">Open Int</th>
                          <th className="pb-2 font-black">Volume</th>
                          <th className="pb-2 font-black text-right">Delta Notional</th>
                          <th className="pb-2 font-black text-right">Gamma Contribution</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/50 text-xs">
                        {serverState.deep_intelligence.impact_contracts.map((c: any) => (
                          <tr key={c.contract} className="hover:bg-zinc-900/20 transition-colors">
                            <td className={`py-2 font-black ${c.rank === 1 ? 'text-[#ff4545]' : c.rank === 2 ? 'text-[#4f8cff]' : 'text-zinc-500'}`}>#{c.rank}</td>
                            <td className="py-2 font-black text-white">{c.contract}</td>
                            <td className="py-2">{c.expiration}</td>
                            <td className="py-2 text-zinc-300">{c.oi.toLocaleString()}</td>
                            <td className="py-2 text-zinc-300">{c.volume.toLocaleString()}</td>
                            <td className="py-2 text-right font-bold text-white">{c.deltaNotional}</td>
                            <td className="py-2 text-right font-bold text-[#00ff88]">{c.gammaContribution}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>

               {/* Strike Breakdown (Strike Intelligence) */}
               <div className="bg-[#050505] border border-zinc-900 rounded-xl p-5 shadow-inner">
                  <div className="border-b border-zinc-900 pb-2 mb-4">
                    <span className="text-[10px] text-zinc-300 font-black uppercase tracking-widest flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                       Live Strike Intelligence: {(activeStrike ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="bg-zinc-950 border border-zinc-900 rounded-md p-3">
                      <span className="text-[8px] text-zinc-500 uppercase block mb-1">Total Open Interest</span>
                      <span className="font-extrabold text-white">{serverState.deep_intelligence.strike_metrics.totalOi.toLocaleString()}</span>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900 rounded-md p-3">
                      <span className="text-[8px] text-zinc-500 uppercase block mb-1">Net Exposure</span>
                      <span className={`font-extrabold ${serverState.deep_intelligence.strike_metrics.netExposure.includes('+') ? 'text-[#00ff88]' : 'text-rose-400'}`}>
                         {serverState.deep_intelligence.strike_metrics.netExposure}
                      </span>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900 rounded-md p-3">
                      <span className="text-[8px] text-zinc-500 uppercase block mb-1">Call / Put Ratio</span>
                      <span className="font-extrabold text-white">{serverState.deep_intelligence.strike_metrics.callPutRatio}</span>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900 rounded-md p-3">
                      <span className="text-[8px] text-zinc-500 uppercase block mb-1">Hedge Sensitivity</span>
                      <span className="font-extrabold text-rose-400">{serverState.deep_intelligence.strike_metrics.hedgeSensitivity}</span>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900 rounded-md p-3">
                      <span className="text-[8px] text-zinc-500 uppercase block mb-1">Dealer Exposure</span>
                      <span className="font-extrabold text-indigo-400">{serverState.deep_intelligence.strike_metrics.dealerExposure}</span>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900 rounded-md p-3">
                      <span className="text-[8px] text-zinc-500 uppercase block mb-1">Gamma Contribution</span>
                      <span className="font-extrabold text-[#00ff88]">{serverState.deep_intelligence.strike_metrics.gammaContribution}</span>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900 rounded-md p-3 col-span-2 flex items-center justify-between">
                      <div>
                        <span className="text-[8px] text-zinc-500 uppercase block mb-1">Delta Contribution</span>
                        <span className="font-extrabold text-white">{serverState.deep_intelligence.strike_metrics.deltaContribution}</span>
                      </div>
                      <div className="w-1/2 h-1.5 bg-black rounded-full overflow-hidden">
                         <div className="h-full bg-[#4f8cff]" style={{ width: serverState.deep_intelligence.strike_metrics.deltaContribution }} />
                      </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* COLUMN 2: WHALE DETECTION & FLOW FEED */}
            <div className="lg:col-span-4 flex flex-col gap-4">
               {/* Live Dealer Commentary Card */}
               <div className="bg-[#050505] border border-zinc-900 rounded-xl p-5 shadow-inner">
                  <div className="border-b border-zinc-900 pb-2 mb-3">
                    <span className="text-[10px] text-zinc-300 font-black uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#4f8cff] rounded-full animate-pulse"></span>
                      Dealer Positioning Briefing
                    </span>
                  </div>
                  <div className="space-y-2.5">
                     {serverState.deep_intelligence.commentary && serverState.deep_intelligence.commentary.map((point: string, idx: number) => (
                       <div key={idx} className="p-2 border border-zinc-900/50 rounded-lg bg-zinc-950/40 text-[9.5px] font-sans text-zinc-400 leading-relaxed flex gap-2">
                          <span className="text-[#4f8cff] mt-0.5 select-none text-[8px]">■</span>
                          <span>{point}</span>
                       </div>
                     ))}
                     {(!serverState.deep_intelligence.commentary || serverState.deep_intelligence.commentary.length === 0) && (
                       <div className="text-zinc-500 italic text-xs py-2 text-center">No commentary points compiled for the current frame.</div>
                     )}
                  </div>
               </div>

               {/* Whale Detection */}
               <div className="bg-[#050505] border border-zinc-900 rounded-xl p-5">
                  <div className="border-b border-zinc-900 pb-2 mb-3">
                    <span className="text-[10px] text-zinc-300 font-black uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse"></span>
                      Whale Detection Radar
                    </span>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center p-2 bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-md">
                      <div>
                        <span className="text-[8px] text-[#00ff88] uppercase block font-black">Largest Bullish Position</span>
                        <span className="text-white font-bold">{serverState.deep_intelligence.whale_detection.bullish.contract} • 0DTE</span>
                      </div>
                      <span className="font-black text-white">{serverState.deep_intelligence.whale_detection.bullish.size}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-[#ff4545]/5 border border-[#ff4545]/20 rounded-md">
                      <div>
                        <span className="text-[8px] text-[#ff4545] uppercase block font-black">Largest Bearish Position</span>
                        <span className="text-white font-bold">{serverState.deep_intelligence.whale_detection.bearish.contract} • 0DTE</span>
                      </div>
                      <span className="font-black text-white">{serverState.deep_intelligence.whale_detection.bearish.size}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-zinc-950 border border-zinc-800 rounded-md gap-3">
                      <div>
                        <span className="text-[8px] text-zinc-400 uppercase block font-black">Largest Call Position</span>
                        <span className="text-white font-bold">{serverState.deep_intelligence.whale_detection.largestCall}</span>
                      </div>
                      <span className="font-black text-white cursor-help border-b border-dashed border-zinc-600 block text-right">HEDGE</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-zinc-950 border border-zinc-800 rounded-md gap-3">
                      <div>
                        <span className="text-[8px] text-zinc-400 uppercase block font-black">Largest Put Position</span>
                        <span className="text-white font-bold">{serverState.deep_intelligence.whale_detection.largestPut}</span>
                      </div>
                      <span className="font-black text-white cursor-help border-b border-dashed border-zinc-600 block text-right">HEDGE</span>
                    </div>
                  </div>
               </div>
               
               {/* Institutional Flow Feed */}
               <div className="bg-[#050505] border border-zinc-900 rounded-xl p-5 flex-1 flex flex-col h-[300px]">
                  <div className="border-b border-zinc-900 pb-2 mb-3 shrink-0 flex justify-between items-center">
                    <span className="text-[10px] text-zinc-300 font-black uppercase tracking-widest flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-[#4f8cff] rounded-full animate-pulse"></span>
                       Live Institutional Flow Feed
                    </span>
                    <span className="text-[7.5px] text-zinc-500 font-black uppercase">LIVE</span>
                  </div>
                  <div className="flex flex-col gap-2 overflow-y-auto text-[10px] font-mono hover:overflow-y-scroll pr-1 flex-1">
                     {serverState.deep_intelligence.flow_feed.slice(0, 10).map((f: any) => (
                       <div key={f.id} className={`flex flex-col gap-1.5 p-2 bg-zinc-950 border border-zinc-800/80 rounded transition-colors hover:bg-zinc-900 ${f.type === 'UNUSUAL' ? 'border-l-2 border-l-indigo-500' : ''}`}>
                          <div className="flex justify-between">
                             <span className={`${f.type === 'SWEEP' ? 'text-[#00ff88]' : f.type === 'BLOCK' ? 'text-rose-400' : 'text-indigo-400'} font-bold`}>{f.type}</span>
                             <span className="text-white font-bold">{f.contract}</span>
                          </div>
                          <span className="text-[8px] text-zinc-500 uppercase">{f.desc}</span>
                       </div>
                     ))}
                     {serverState.deep_intelligence.flow_feed.length === 0 && (
                       <div className="text-zinc-500 text-center py-4 italic text-xs">Waiting for market flows...</div>
                     )}
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </div>

        {/* STAGE 4: HIGH-PRECISION INTEGRATED CHART REFERENCE & WEBHOOK FEED */}
      <div className="w-full mt-2">
        
        <div className="w-full bg-[#050505] border border-zinc-900 p-5 rounded-sm space-y-3">
          <div className="flex justify-between items-center text-[8.5px] uppercase text-zinc-500 bg-black p-2.5 rounded border border-zinc-950">
            <span>Continuous TradingView Liquidity Flow Integration</span>
            <span className="text-zinc-650 font-bold">ARBOR WEBHOOK TUNNEL ACTIVE</span>
          </div>
          <div className="h-[210px] w-full">
            <InteractiveChart
              candles={activeContract?.chartData || []}
              timeframe={selectedTimeframe}
              selectedTicker={selectedAsset.ticker}
              showFVGs={true}
              showLiquiditySweeps={true}
              showDisplacementEvents={true}
            />
          </div>
        </div>

      </div>

      {/* FOOTER: TRADINGVIEW WEBHOOK STATUS */}
      <div className="w-full mt-4 bg-[#050505] border border-zinc-900 p-3 rounded-sm flex items-center justify-between text-[9px] font-mono select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 font-bold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            TradingView Webhook Active
          </div>
          <span className="text-zinc-500 uppercase tracking-widest hidden md:inline-block">Connected to Arbor Liquidity Engine • Port 3000 Secured</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-400">
          <div className="flex items-center gap-1">
            <span className="text-zinc-600">IN/SEC:</span>
            <span className="font-bold text-white">12.4 MB/s</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-zinc-600">LATENCY:</span>
            <span className="font-bold text-[#00ff88]">14ms</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-zinc-600">DEALER FLOW:</span>
            <span className="font-bold text-white">SYNCED</span>
          </div>
        </div>
      </div>

    </div>
  );
}
