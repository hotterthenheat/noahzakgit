/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useContractStore } from '../lib/store';
import { 
  ArrowRight, 
  Globe, 
  Check, 
  Sparkles, 
  Compass, 
  Dna, 
  Database,
  Layers,
  MessageSquare,
  TrendingUp,
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Eye,
  Activity,
  Bot,
  ExternalLink,
  Lock,
  Search,
  Bell
} from 'lucide-react';
import { AssetInfo, TimeframeVal, SystemScore, V8TradeRecord } from '../types';
import { ASSET_LIST } from '../data';

interface SlayerIntroProps {
  onEnterApp: () => void;
  selectedAsset: AssetInfo;
  setSelectedAsset: (asset: AssetInfo) => void;
  selectedTimeframe: TimeframeVal;
  setSelectedTimeframe: (tf: TimeframeVal) => void;
  systemScore: SystemScore;
  v8Trades: V8TradeRecord[];
  bestOpportunity: {
    asset: AssetInfo;
    ticker: string;
    confidence: number;
    isCall: boolean;
    currentPrice: string;
    fairValue: string;
    entryZone: string;
  };
  topSub10Calls: Array<{ asset: AssetInfo; ticker: string; confidence: number }>;
  topSub10Puts: Array<{ asset: AssetInfo; ticker: string; confidence: number }>;
  onSelectOpportunity: (asset: AssetInfo, type: 'C' | 'P', strike?: number) => void;
  renderTerminalWorkspace: () => React.ReactNode;
}

export default function SlayerIntro({
  onEnterApp,
  selectedAsset,
  setSelectedAsset,
  selectedTimeframe,
  setSelectedTimeframe,
  systemScore,
  v8Trades,
  bestOpportunity: originalBestOpportunity,
  topSub10Calls,
  topSub10Puts,
  onSelectOpportunity,
}: SlayerIntroProps) {
  const serverState = useContractStore(s => s.serverState);
  
  // State for active chosen index on landing hero
  const [activeHeroIdx, setActiveHeroIdx] = useState<'SPX' | 'QQQ' | 'NDX' | 'SPY'>('SPX');
  
  // Animation state matching direct timestamps:
  // 0.00s: Homepage is visible and interactive.
  // 0.05s: Ripple.
  // 0.15s: Words appear.
  // 0.15s - 0.60s: Interactive Mouse Move bend/distortion.
  // 0.70s: Ghost words dissolve.
  // 0.80s: Animation overlay gone.
  const [animStage, setAnimStage] = useState<'visible' | 'ripple' | 'words' | 'dissolving' | 'completed'>('visible');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Live sandbox product states
  const [activeProductTab, setActiveProductTab] = useState<'discord' | 'skyvision' | 'gexbot'>('discord');
  const [demoStrikeOffset, setDemoStrikeOffset] = useState<number>(0);
  const [demoIsCall, setDemoIsCall] = useState<boolean>(true);
  const [hoveredGexStrike, setHoveredGexStrike] = useState<number | null>(null);

  // Distortive word array
  const introWords = ['Momentum', 'Liquidity', 'Positioning', 'Conviction', 'Strength', 'Support', 'Resistance'];

  useEffect(() => {
    // 0.05s Ripple trigger
    const rippleTimer = setTimeout(() => {
      setAnimStage('ripple');
    }, 50);

    // 0.15s Words appear
    const wordsTimer = setTimeout(() => {
      setAnimStage('words');
    }, 150);

    // 0.70s Words dissolve
    const dissolveTimer = setTimeout(() => {
      setAnimStage('dissolving');
    }, 700);

    // 0.80s Gone
    const completeTimer = setTimeout(() => {
      setAnimStage('completed');
    }, 800);

    return () => {
      clearTimeout(rippleTimer);
      clearTimeout(wordsTimer);
      clearTimeout(dissolveTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  // Soft track mouse position for 2-4px non-heavy organic bending/distortion
  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Pricing membership structures
  const pricingTab = 'PROFESSIONAL';

  // Selected Index-specific values matching client targets precisely
  const heroOpportunities = {
    SPX: { ticker: 'SPX 7620C', health: 94, move: '+38%', status: 'Strengthening', isCall: true },
    QQQ: { ticker: 'QQQ 515C', health: 91, move: '+29%', status: 'Improving', isCall: true },
    NDX: { ticker: 'NDX 18300C', health: 89, move: '+44%', status: 'Strengthening', isCall: true },
    SPY: { ticker: 'SPY 448C', health: 93, move: '+36%', status: 'Improving', isCall: true },
  };

  const activeOpp = heroOpportunities[activeHeroIdx];

  const handleLaunchToActiveOpportunity = () => {
    const heroStrikes = {
      SPX: 7620,
      QQQ: 515,
      NDX: 18300,
      SPY: 448,
    };
    const strike = heroStrikes[activeHeroIdx];
    const asset = ASSET_LIST.find(a => a.ticker === activeHeroIdx) || ASSET_LIST[0];
    onSelectOpportunity(asset, 'C', strike);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      id="slayer-ecosystem-landing" 
      className="min-h-screen bg-[#000000] text-[#D4D4D8] flex flex-col font-sans selection:bg-white selection:text-black overflow-y-auto relative pb-20 select-none antialiased"
    >
      
      {/* ==================================================
          GPU-ACCELERATED RIPPLE & DISTORTION INTRO LAYER (GONE BY 0.8s)
          ================================================== */}
      {animStage !== 'completed' && (
        <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden h-full w-full">
          {/* 0.05s SINGLE RIPPLE RING */}
          {(animStage === 'ripple' || animStage === 'words' || animStage === 'dissolving') && (
            <motion.div
              initial={{ scale: 0.1, opacity: 0.8 }}
              animate={{ scale: 4.5, opacity: 0 }}
              transition={{ duration: 0.74, ease: 'easeOut' }}
              className="absolute w-[300px] h-[300px] rounded-full border border-zinc-550/30 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: mousePos.x || '50%',
                top: mousePos.y || '40%',
              }}
            />
          )}

          {/* 0.15s GHOST WORDS BENDING COARDS */}
          {(animStage === 'words' || animStage === 'dissolving') && (
            <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-12 px-10 pointer-events-none max-w-4xl mx-auto top-1/4">
              <AnimatePresence>
                {animStage !== 'dissolving' && (
                  introWords.map((word, index) => {
                    // Custom coordinate-based displacement calculations creating elegant 2-4px organic bend
                    // words behave slightly magnetically to track pointer
                    const elementId = `intro-word-${index}`;
                    const element = document.getElementById(elementId);
                    let dx = 0;
                    let dy = 0;
                    
                    if (element && mousePos.x && mousePos.y) {
                      const rect = element.getBoundingClientRect();
                      const wordCenterX = rect.left + rect.width / 2;
                      const wordCenterY = rect.top + rect.height / 2;
                      const distX = mousePos.x - wordCenterX;
                      const distY = mousePos.y - wordCenterY;
                      const centerDist = Math.sqrt(distX * distX + distY * distY);
                      
                      if (centerDist < 300) {
                        const pullFactor = (1 - centerDist / 300) * 4.5; // caps at 4.5px displacement
                        dx = (distX / centerDist) * pullFactor;
                        dy = (distY / centerDist) * pullFactor;
                      }
                    }

                    return (
                      <motion.span
                        key={word}
                        id={elementId}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ 
                          opacity: 0.35, 
                          scale: 1,
                          x: dx,
                          y: dy,
                        }}
                        exit={{ opacity: 0, scale: 0.9, filter: 'blur(3px)' }}
                        transition={{ 
                          type: 'spring', 
                          stiffness: 90, 
                          damping: 10,
                          opacity: { duration: 0.2 } 
                        }}
                        className="text-white text-xs font-mono font-black uppercase tracking-widest pointer-events-none block whitespace-nowrap select-none"
                      >
                        {word}
                      </motion.span>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ==================================================
          LEVEL 1: ARBOR CAPITAL (OVERARCHING CORPORATE LAYER)
          ================================================== */}
      <div id="arbor-capital-banner" className="bg-[#050505] border-b border-zinc-900 px-6 py-3 px-6 py-3.5 flex justify-between items-center z-10 font-mono select-none">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[9.5px] tracking-[0.28em] text-[#A1A1AA] uppercase font-black">
            ARBOR CAPITAL GROUP
          </span>
        </div>
        <div className="flex items-center gap-4 text-[9px] text-[#71717A] uppercase tracking-wider font-semibold">
          <span>RESEARCH FIRM</span>
          <span className="text-zinc-850">•</span>
          <span>COMMUNITY</span>
          <span className="text-zinc-850">•</span>
          <span>TRUST PERSISTENCE</span>
        </div>
      </div>

      {/* ==================================================
          MAIN HERO (LEVEL 2 & LEVEL 3 INTELS - ABSOLUTE FOCUS)
          ================================================= */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 px-6 pt-16 pb-12 max-w-4xl mx-auto text-center space-y-7 flex flex-col items-center"
      >
        
        {/* Subtle emblem */}
        <div className="flex items-center gap-2.5 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>SLAYER TERMINAL</span>
          <span className="text-zinc-800">|</span>
          <span className="text-white">BY ARBOR CAPITAL</span>
        </div>

        {/* STOP GUESSING LEVEL 2 LANDING TITLE */}
        <div className="space-y-4 max-w-3xl">
          <span className="text-[10px] font-mono tracking-[0.34em] text-[#A1A1AA] uppercase font-black bg-zinc-950 px-4 py-1.5 border border-zinc-900 rounded-md inline-block">
            OPTIONS ANALYSIS TERMINAL
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-none font-sans uppercase">
            STOP GUESSING.
          </h1>
          <p className="text-zinc-400 text-base md:text-lg font-light font-sans leading-relaxed tracking-wide max-w-2xl mx-auto">
            Professional analytics for index options traders. Fully automated, mathematically derived setups continuously computed on volume grids.
          </p>
        </div>

        {/* INDEX TABS SELECTOR */}
        <div className="flex bg-zinc-950 border border-zinc-900 rounded-sm p-1 font-mono items-center gap-1.5">
          {(['SPX', 'QQQ', 'NDX', 'SPY'] as const).map((ticker) => (
            <button
              key={ticker}
              onClick={() => setActiveHeroIdx(ticker)}
              className={`px-6 py-2.5 text-xs font-mono font-black uppercase tracking-wider cursor-pointer rounded-xs transition-all ${
                activeHeroIdx === ticker
                  ? 'bg-white text-black font-extrabold'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {ticker}
            </button>
          ))}
        </div>

        <div className="text-[10.5px] font-mono tracking-widest text-[#71717A] uppercase">
          Continuously monitored. Continuously scored. Continuously managed.
        </div>

        {/* ==================================================
            BEST OPPORTUNITY RIGHT NOW PRECISE COARDS (THE HERO)
            ================================================== */}
        <div 
          id="slayer-hero-opportunity" 
          onClick={handleLaunchToActiveOpportunity}
          className="w-full max-w-lg apple-glass rounded-2xl p-6 md:p-7 relative overflow-hidden shadow-2xl text-left space-y-4 font-mono transition-all duration-300 hover:scale-[1.01] cursor-pointer animate-fadeIn"
        >
          
          {/* Top Line accent */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />

          {/* Section Indicator */}
          <div className="flex justify-between items-center pb-2.5 border-b border-zinc-900/40 relative z-10">
            <span className="text-[9px] text-[#A1A1AA] uppercase tracking-widest font-black">
              BEST OPPORTUNITY RIGHT NOW
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30d158]" />
              <span className="text-[8px] text-[#30d158] font-extrabold uppercase">LIVE CALCULATED</span>
            </div>
          </div>

          {/* CORE STAT DETAILS */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-1 relative z-10">
            <div className="space-y-0.5">
              <span className="text-2xl font-black text-white block uppercase tracking-tight">
                {activeOpp.ticker}
              </span>
              <span className="text-[9.5px] text-zinc-500 uppercase block">
                Target Index Frame: {activeHeroIdx}
              </span>
            </div>

            <div className="bg-[#30d158] text-black font-black text-[10.5px] uppercase tracking-widest px-4 py-1.5 rounded-md border border-[#30d158] shadow-lg">
              {activeOpp.status === 'Strengthening' ? 'ENTER' : 'ENTER'}
            </div>
          </div>

          {/* DYNAMIC RATINGS TABS */}
          <div className="grid grid-cols-3 gap-3 bg-zinc-950/60 border border-zinc-900/60 p-3 rounded-xl relative z-10 mb-3">
            <div>
              <span className="text-[8.5px] text-zinc-550 uppercase tracking-tight block">Decision Score</span>
              <span className="text-base font-black text-[#30d158] mt-0.5 block">{activeOpp.health}</span>
            </div>
            <div>
              <span className="text-[8.5px] text-zinc-550 uppercase tracking-tight block">Expected Move</span>
              <span className="text-base font-bold text-white mt-0.5 block">{activeOpp.move}</span>
            </div>
            <div>
              <span className="text-[8.5px] text-zinc-550 uppercase tracking-tight block">Status</span>
              <span className="text-base font-bold text-indigo-400 mt-0.5 block uppercase tracking-tight font-sans text-xs">{activeOpp.status}</span>
            </div>
          </div>

          {/* NEW HERO ENHANCEMENTS (Dealer Bias, Vol State, etc) */}
          {serverState?.deep_intelligence && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-[#050505] border border-zinc-900/40 p-2.5 rounded-lg relative z-10 text-[9px] mb-4">
               <div className="border border-zinc-900/50 p-2 rounded-md bg-zinc-950/50">
                  <span className="text-zinc-500 uppercase font-black block tracking-widest text-[7px] mb-0.5">Dealer Bias</span>
                  <span className={`font-bold ${serverState.deep_intelligence.dealer_metrics.bias === 'LONG GAMMA' ? 'text-[#00ff88]' : 'text-rose-400'}`}>
                    {serverState.deep_intelligence.dealer_metrics.bias}
                  </span>
               </div>
               <div className="border border-zinc-900/50 p-2 rounded-md bg-zinc-950/50">
                  <span className="text-zinc-500 uppercase font-black block tracking-widest text-[7px] mb-0.5">Vol State</span>
                  <span className="text-zinc-300 font-bold">{serverState.deep_intelligence.dealer_metrics.volState}</span>
               </div>
               <div className="border border-zinc-900/50 p-2 rounded-md bg-zinc-950/50">
                  <span className="text-zinc-500 uppercase font-black block tracking-widest text-[7px] mb-0.5">Magnet Strike</span>
                  <span className="text-white font-bold">{Number(serverState.deep_intelligence.dealer_metrics.magnetStrike ?? 0).toFixed(2)}</span>
               </div>
               <div className="border border-zinc-900/50 p-2 rounded-md bg-zinc-950/50">
                  <span className="text-zinc-500 uppercase font-black block tracking-widest text-[7px] mb-0.5">Flip Level</span>
                  <span className="text-rose-400 font-bold">{Number(serverState.deep_intelligence.dealer_metrics.flipLevel ?? 0).toFixed(2)}</span>
               </div>
               
               <div className="border border-zinc-900/50 p-2 rounded-md bg-zinc-950/50 col-span-1 md:col-span-2 flex justify-between items-center">
                  <div>
                     <span className="text-zinc-500 uppercase font-black block tracking-widest text-[7px] mb-0.5">Call Wall</span>
                     <span className="text-white font-bold">{Number(serverState.deep_intelligence.dealer_metrics.callWall ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                     <span className="text-zinc-500 uppercase font-black block tracking-widest text-[7px] mb-0.5">Put Wall</span>
                     <span className="text-white font-bold">{Number(serverState.deep_intelligence.dealer_metrics.putWall ?? 0).toFixed(2)}</span>
                  </div>
               </div>
               <div className="border border-zinc-900/50 p-2 rounded-md bg-zinc-950/50 col-span-1 md:col-span-2">
                  <div className="flex justify-between items-center mb-1">
                     <span className="text-zinc-500 uppercase font-black tracking-widest text-[7px]">Dealer Positioning Score</span>
                     <span className="text-white font-bold text-[9px]">{serverState.deep_intelligence.dealer_metrics.dealerScore}/100</span>
                  </div>
                  <div className="w-full bg-black h-1.5 rounded-full overflow-hidden">
                     <div className="bg-[#4f8cff] h-full transition-all duration-300" style={{ width: `${serverState.deep_intelligence.dealer_metrics.dealerScore}%` }} />
                  </div>
               </div>
            </div>
          )}

          {/* Direct entry action */}
          <div className="pt-2 relative z-10 w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLaunchToActiveOpportunity();
              }}
              className="w-full py-3 bg-white hover:bg-zinc-250 text-black font-extrabold uppercase tracking-widest text-[9.5px] rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01]"
            >
              <span>Launch Live Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* HERO TALLY SUMMARY */}
        <div className="grid grid-cols-3 gap-7 md:gap-14 pt-4 border-t border-zinc-950 w-full max-w-xl font-mono text-center">
          <div>
            <span className="text-xl md:text-2xl font-black text-white block">71%</span>
            <span className="text-[8.5px] text-[#A1A1AA] uppercase tracking-wider block mt-0.5">Target 1 Hit Rate</span>
          </div>
          <div>
            <span className="text-xl md:text-2xl font-black text-emerald-400 block">100%</span>
            <span className="text-[8.5px] text-[#A1A1AA] uppercase tracking-wider block mt-0.5">Public Trade History</span>
          </div>
          <div>
            <span className="text-xl md:text-2xl font-black text-white block">4</span>
            <span className="text-[8.5px] text-[#A1A1AA] uppercase tracking-wider block mt-0.5">Intelligence Engines</span>
          </div>
        </div>

      </motion.section>

      {/* ==================================================
          LIVE PRODUCTS IN ACTION (SANDBOX PREVIEW)
          ================================================== */}
      <motion.section 
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 py-8 px-6 max-w-4xl mx-auto w-full"
      >
        <div className="apple-glass rounded-3xl p-6 md:p-8 space-y-6 shadow-3xl border border-white/8 relative overflow-hidden">
          {/* Subtle liquid glow behind sandbox */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-[#30d158]/3 rounded-full blur-[90px] pointer-events-none z-0" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900/40 pb-4 relative z-10">
            <div className="text-left space-y-1">
              <span className="text-[9px] text-[#A1A1AA] uppercase font-mono tracking-[0.2em] font-black block">
                Live Platforms Preview
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase font-sans">
                Explore Our Active Products
              </h2>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-900 px-3 py-1.5 rounded-full select-none text-[8.5px] font-mono font-bold text-[#30d158]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-ping" />
              <span>INTERACTIVE SANDBOX ACTIVE</span>
            </div>
          </div>

          {/* DYNAMIC SWAPPER NAVIGATION */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-950/90 border border-zinc-900/60 rounded-2xl relative z-10 font-mono">
            <button
              onClick={() => setActiveProductTab('discord')}
              className={`py-3 px-1 text-[9px] sm:text-[10.5px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeProductTab === 'discord'
                  ? 'bg-white text-black font-extrabold shadow-md'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>1. Discord Alerts</span>
            </button>
            <button
              onClick={() => setActiveProductTab('skyvision')}
              className={`py-3 px-1 text-[9px] sm:text-[10.5px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeProductTab === 'skyvision'
                  ? 'bg-white text-black font-extrabold shadow-md'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>2. SkyVision Cockpit</span>
            </button>
            <button
              onClick={() => setActiveProductTab('gexbot')}
              className={`py-3 px-1 text-[9px] sm:text-[10.5px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeProductTab === 'gexbot'
                  ? 'bg-white text-black font-extrabold shadow-md'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>3. Pinpoint Gexbot</span>
            </button>
          </div>

          {/* ACTIVE SANDBOX PREVIEW INNER DISPLAY */}
          <div className="relative z-10 bg-black/40 border border-zinc-900/50 rounded-2xl p-5 md:p-6 min-h-[350px] flex flex-col justify-between">
            
            {/* 1. DISCORD ALERTS DISPLAY */}
            {activeProductTab === 'discord' && (
              <div className="space-y-4 text-left w-full">
                <div className="flex justify-between items-center text-[9px] text-[#A1A1AA] uppercase border-b border-zinc-900/40 pb-2.5 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white bg-[#5865F2] px-2 py-0.5 rounded-sm">DISCORD</span>
                    <span>CHANNEL: <span className="font-extrabold text-white">#spx-realtime-alerts</span></span>
                  </div>
                  <span className="text-zinc-650">Real-Time Webhook Feed</span>
                </div>

                <div className="space-y-3 font-sans">
                  {/* Alert Msg */}
                  <div className="bg-zinc-950/70 border border-zinc-900/30 p-3.5 rounded-xl space-y-2.5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-[#30d158]/10 text-[#30d158] text-[8px] font-mono tracking-wider font-extrabold px-2 py-1 rounded-bl-lg">
                      OPTIONS TRIGGERED
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#30d158]/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-[#30d158]" />
                      </div>
                      <div>
                        <span className="font-extrabold text-white text-[11px] block font-mono">Slayer Signal Bot</span>
                        <span className="text-zinc-600 text-[8px] uppercase tracking-wider block font-mono">Verified webhook • Just Now</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-zinc-300 leading-relaxed space-y-1 pl-1">
                      <div className="font-mono text-[10.5px] font-black text-[#30d158] uppercase">
                        🚨 SPX BULLISH MOMENTUM STRIKE DRIFT IDENTIFIED
                      </div>
                      <p className="text-zinc-400 mt-1">
                        High order-flow clustering detected on institutional SPX grids.
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-2 bg-black/60 p-2.5 rounded-lg border border-zinc-900 text-[10px] font-mono">
                        <div>
                          <span className="text-zinc-550 block text-[8px]">CONTRACT TARGET</span>
                          <span className="text-white font-extrabold">SPX 7620 CALL</span>
                        </div>
                        <div>
                          <span className="text-zinc-550 block text-[8px]">MODEL ENTRANCE RANGE</span>
                          <span className="text-[#30d158] font-bold">Under $5.40</span>
                        </div>
                        <div>
                          <span className="text-zinc-550 block text-[8px]">GOALPOST 1 TARGET</span>
                          <span className="text-white font-black">$7.20 (+33%)</span>
                        </div>
                        <div>
                          <span className="text-zinc-550 block text-[8px]">GOALPOST 2 TARGET</span>
                          <span className="text-white font-black">$9.50 (+75%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Discord User comments */}
                  <div className="flex gap-2.5 pl-1">
                    <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-mono font-bold shrink-0">
                      JD
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5 font-mono">
                        <span className="text-xs text-white font-bold text-[10.5px]">JohnD_Options</span>
                        <span className="text-zinc-650 text-[8px]">Today at 10:44 AM</span>
                      </div>
                      <p className="text-[10.5px] text-zinc-400 font-sans mt-0.5 leading-relaxed">
                        Filled the SPX 7620 Calls at 5.25. Momentum hit Target 1 within 14 minutes. Incredible calculations!
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pl-1 pt-1">
                    <div className="w-7 h-7 rounded-full bg-indigo-950 flex items-center justify-center text-[10px] text-indigo-400 font-mono font-bold shrink-0">
                      AM
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5 font-mono">
                        <span className="text-xs text-white font-bold text-[10.5px]">AlphaM_7</span>
                        <span className="text-zinc-650 text-[8px]">Today at 10:45 AM</span>
                      </div>
                      <p className="text-[10.5px] text-zinc-400 font-sans mt-0.5 leading-relaxed">
                        The Gamma Exposure support floor at 5300 held perfectly just like the Pinpoint chart highlighted. No guessing layout pays off.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 2. SKYVISION COCKPIT PREVIEW */}
            {activeProductTab === 'skyvision' && (
              <div className="space-y-4 text-left w-full">
                <div className="flex justify-between items-center text-[9px] text-[#A1A1AA] uppercase border-b border-zinc-900/40 pb-2.5 font-mono">
                  <span className="font-bold text-white bg-indigo-500/20 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20">SKYVISION MODEL PREVIEW</span>
                  <span className="text-zinc-650 uppercase">Configure Strike parameters live</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch pt-1">
                  
                  {/* Left panel control config */}
                  <div className="md:col-span-5 bg-zinc-950/80 p-4 border border-zinc-900/60 rounded-xl space-y-4 font-mono">
                    <div className="space-y-1.5">
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Select Strike Option Bias</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => setDemoIsCall(true)}
                          className={`py-1.5 text-[9px] font-bold rounded-lg uppercase tracking-wide transition-all border ${
                            demoIsCall
                              ? 'bg-indigo-500/20 text-white border-indigo-500'
                              : 'bg-black text-zinc-550 border-zinc-900 hover:text-zinc-300'
                          }`}
                        >
                          Calls (Bullish)
                        </button>
                        <button
                          onClick={() => setDemoIsCall(false)}
                          className={`py-1.5 text-[9px] font-bold rounded-lg uppercase tracking-wide transition-all border ${
                            !demoIsCall
                              ? 'bg-rose-500/20 text-white border-rose-500'
                              : 'bg-black text-zinc-550 border-zinc-900 hover:text-zinc-300'
                          }`}
                        >
                          Puts (Bearish)
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[8px] text-zinc-550 font-bold uppercase tracking-wide">
                        <span>Strike Distance</span>
                        <span className="text-white">
                          {demoStrikeOffset === -2 && '-2.0% ITM Deep'}
                          {demoStrikeOffset === -1 && '-1.0% ITM Conservative'}
                          {demoStrikeOffset === 0 && 'ATM Target Strike'}
                          {demoStrikeOffset === 1 && '+1.0% OTM Aggressive'}
                          {demoStrikeOffset === 2 && '+2.0% OTM Highly Speculative'}
                        </span>
                      </div>
                      
                      {/* Active click slider index buttons */}
                      <div className="grid grid-cols-5 gap-1.5 bg-black p-1 rounded-lg border border-zinc-900">
                        {[-2, -1, 0, 1, 2].map((offset) => (
                          <button
                            key={offset}
                            onClick={() => setDemoStrikeOffset(offset)}
                            className={`py-1 rounded text-[9px] font-black pointer-events-auto cursor-pointer ${
                              demoStrikeOffset === offset
                                ? 'bg-white text-black font-extrabold'
                                : 'text-zinc-500 hover:text-zinc-200'
                            }`}
                          >
                            {offset > 0 ? `+${offset}` : offset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-black/60 p-2.5 rounded-lg border border-zinc-900/60 space-y-1">
                      <span className="text-[7.5px] text-zinc-650 uppercase block font-bold leading-none">Decision recommendation</span>
                      <p className="text-[10px] text-zinc-400 font-sans leading-snug">
                        Interactive models demonstrate strike boundaries instantly. Tweak values to calculate parameters.
                      </p>
                    </div>
                  </div>

                  {/* Right panel calculated outputs */}
                  <div className="md:col-span-7 bg-[#050506]/90 p-4 border border-zinc-900 rounded-xl flex flex-col justify-between space-y-4">
                    <div className="space-y-3 font-mono">
                      
                      {/* Header values */}
                      <div className="flex justify-between items-center border-b border-zinc-900/40 pb-2">
                        <div>
                          <span className="text-zinc-555 text-[8.5px] block font-bold uppercase leading-none">Active Target Asset</span>
                          <span className="text-white font-black text-xs uppercase block tracking-tight mt-0.5">
                            SPX 7620 {demoIsCall ? 'CALL' : 'PUT'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-555 text-[8.5px] block font-bold uppercase leading-none">Live Mid</span>
                          <span className="text-emerald-400 font-black text-xs block">
                            ${(12.50 + demoStrikeOffset * -3.4).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Health Indicator bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] text-zinc-500 font-bold uppercase">
                          <span>Decision Score Value</span>
                          <span className={`${demoStrikeOffset < 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {93 - Math.abs(demoStrikeOffset) * 8}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              demoStrikeOffset < 1 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${93 - Math.abs(demoStrikeOffset) * 8}%` }}
                          />
                        </div>
                      </div>

                      {/* Targets Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
                        <div className="bg-zinc-950 border border-zinc-900/60 p-2 rounded-lg">
                          <span className="text-zinc-650 block text-[7px] font-bold">ENTRY</span>
                          <span className="text-white font-bold block text-[9.5px]">
                            ${(11.20 + demoStrikeOffset * -3.1).toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-zinc-950 border border-zinc-900/60 p-2 rounded-lg">
                          <span className="text-zinc-650 block text-[7px] font-bold">GOALPOST 1</span>
                          <span className="text-emerald-400 font-bold block text-[9.5px]">
                            ${((11.20 + demoStrikeOffset * -3.1) * 1.3).toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-zinc-950 border border-zinc-900/60 p-2 rounded-lg">
                          <span className="text-indigo-400 block text-[7px] font-bold">GOALPOST 2</span>
                          <span className="text-indigo-400 font-bold block text-[9.5px]">
                            ${((11.20 + demoStrikeOffset * -3.1) * 1.8).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Active strategy badge */}
                      <div className="flex justify-between items-center text-[8.5px] bg-zinc-950/40 px-2 py-1.5 border border-zinc-900 rounded-lg">
                        <span className="text-zinc-550 uppercase font-black">Strategic Bias:</span>
                        <span className="text-white uppercase font-black tracking-wider">
                          {demoStrikeOffset <= -1 && 'ACCUMULATE (DEEP DELTA)'}
                          {demoStrikeOffset === 0 && 'ACTIVE Bullish CONFIDENCE'}
                          {demoStrikeOffset >= 1 && 'SCALP MOMENTUM EXPOSURE'}
                        </span>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 3. PINPOINT GEXBOT PREVIEW */}
            {activeProductTab === 'gexbot' && (
              <div className="space-y-4 text-left w-full">
                <div className="flex justify-between items-center text-[9px] text-[#A1A1AA] uppercase border-b border-zinc-900/40 pb-2.5 font-mono">
                  <span className="font-bold text-white bg-emerald-500/20 text-[#30d158] px-2.5 py-0.5 rounded-full border border-emerald-500/20">PINPOINT MARKET GPS PREVIEW</span>
                  <span className="text-zinc-650">Hover bars to inspect dealer positioning</span>
                </div>

                <div className="space-y-3 font-mono">
                  <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                    Option dealers are forced to constantly hedge. By plotting of these clusters, we index the exact support/resistance boundaries where index swings are pinned.
                  </p>

                  <div className="space-y-2 pt-1 font-mono">
                    {[
                      { strike: 5300, gamma: '+12.4M', bias: 'Strong Customer Long Floor', description: 'Dealers are loaded with long delta. High probability bounce floor on downside tests.' },
                      { strike: 5310, gamma: '+4.1M', bias: 'Dealer Delta Transition Zone', description: 'Neutral friction bounds where momentum stabilizes.' },
                      { strike: 5320, gamma: '-8.9M', bias: 'Overhead Pin Risk', description: 'Negative gamma floor where volatility accelerates on breaks.' },
                      { strike: 5330, gamma: '-18.2M', bias: 'Momemtum Flip Trigger', description: 'Dealer short hedging acceleration zone with intense price gravity.' },
                      { strike: 5340, gamma: '+22.5M', bias: 'OVERHEAD CALL WALL', description: 'Absolute ceiling for the option expiration frame. Heavy defensive selling floor.' }
                    ].map((row, idx) => (
                      <div 
                        key={idx}
                        onMouseEnter={() => setHoveredGexStrike(idx)}
                        onMouseLeave={() => setHoveredGexStrike(null)}
                        className={`p-2 rounded-xl border transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 cursor-pointer relative overflow-hidden ${
                          hoveredGexStrike === idx 
                            ? 'bg-zinc-900/80 border-white/20' 
                            : 'bg-zinc-950/40 border-zinc-900/40'
                        }`}
                      >
                        {/* Interactive dynamic gauge bar behind */}
                        <div 
                          className={`absolute top-0 left-0 bottom-0 pointer-events-none opacity-5 transition-all duration-300 ${
                            row.gamma.startsWith('+') ? 'bg-[#30d158]' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.abs(row.gamma.includes('22') ? 100 : row.gamma.includes('18') ? 85 : row.gamma.includes('12') ? 60 : row.gamma.includes('8') ? 45 : 20)}%` }}
                        />

                        <div className="flex items-center gap-3 relative z-10">
                          <span className="text-white font-black text-xs block w-16">
                            SPX {row.strike}
                          </span>
                          <span className={`text-[8.5px] font-black uppercase inline-block px-1.5 py-0.5 rounded ${
                            row.gamma.startsWith('+') ? 'bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {row.gamma} GEX
                          </span>
                        </div>

                        <div className="text-left sm:text-right relative z-10 w-full sm:w-auto">
                          <span className="text-[#A1A1AA] text-[9.5px] font-black block">
                            {row.bias}
                          </span>
                          <span className="text-zinc-650 text-[8.5px] uppercase block tracking-wider">
                            {hoveredGexStrike === idx ? row.description : 'Hover to inspect strike description'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            )}

            {/* CTA action footer bar inside preview */}
            <div className="mt-5 border-t border-zinc-900/60 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 font-mono">
              <span className="text-[8.5px] text-zinc-550 uppercase font-black text-left">
                * Simulated live modules feed rendering mathematical options context.
              </span>
              <button
                onClick={onEnterApp}
                className="py-2.5 px-6 bg-zinc-900 hover:bg-white hover:text-black text-white text-[9px] font-extrabold uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 border border-zinc-800 shadow-md cursor-pointer hover:scale-[1.01]"
              >
                <span>Launch Full Subscriber Terminal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      </motion.section>

      {/* ==================================================
          TACTICAL MEMBERSHIP SUBSCRIPTION MATRICES
          ================================================== */}
      <motion.section 
        id="pricing-matrices" 
        initial={{ opacity: 0, y: 50, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 py-10 px-6 max-w-4xl mx-auto w-full border-t border-zinc-900"
      >
        <div className="text-center space-y-2 mb-8">
          <span className="text-zinc-500 text-[9px] font-mono uppercase tracking-[0.3em] block">
            SUBSCRIPTION MODELS & PLATFORM SERVICES
          </span>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans">
            Simple Subscriptions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono items-stretch">
          
          {/* DISCORD CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -4, boxShadow: "0 25px 50px -12px rgba(52, 199, 89, 0.08)" }}
            className="apple-glass rounded-2xl p-6 flex flex-col justify-between relative transition-all duration-300"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-baseline border-b border-zinc-900/40 pb-3">
                <div>
                  <span className="text-zinc-500 text-[8.5px] uppercase tracking-wider block font-bold">Platform</span>
                  <span className="text-[10px] font-mono font-black text-rose-400 block mt-1">COMMUNITY CHAT</span>
                </div>
                <div className="text-right">
                  <span className="text-[#A1A1AA] text-[10px] block font-bold">DISCORD</span>
                  <span className="text-xl font-black text-white">$49</span>
                  <span className="text-[8px] text-zinc-650 block">/ Month</span>
                </div>
              </div>

              <div className="space-y-2 text-[10px] font-sans">
                <span className="text-[9px] text-[#71717A] block uppercase font-mono tracking-wider font-bold">Inclusions:</span>
                <ul className="space-y-2 font-mono text-[9px]">
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#30d158] shrink-0" />
                    <span>Real-time Discord Chat & Alerts</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#30d158] shrink-0" />
                    <span>Daily Option Discovery Reports</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#30d158] shrink-0" />
                    <span>Verified Historic Trade Archive</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-5">
              <button 
                onClick={onEnterApp}
                className="w-full py-2.5 bg-zinc-900/90 hover:bg-white hover:text-black border border-zinc-800 text-zinc-300 font-bold uppercase tracking-widest text-[9px] rounded-lg transition-all duration-300 cursor-pointer"
              >
                Subscribe to Discord
              </button>
            </div>
          </motion.div>

          {/* SKYVISION CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            whileHover={{ scale: 1.04, y: -6 }}
            className="apple-glass-bright rounded-2xl p-6 flex flex-col justify-between relative shadow-2xl transition-all duration-300 border-2 border-white/25"
          >
            <div className="absolute top-0 right-10 -translate-y-1/2 bg-white text-black text-[7px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
              RECOMMENDED SUBSCRIPTION
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                <div>
                  <span className="text-zinc-500 text-[8.5px] uppercase tracking-wider block font-bold">Dashboard</span>
                  <span className="text-[10px] font-mono font-black text-indigo-400 block mt-1 uppercase">DECISION ENGINE</span>
                </div>
                <div className="text-right">
                  <span className="text-white text-[10px] block font-black">SKYVISION</span>
                  <span className="text-xl font-black text-white">$99</span>
                  <span className="text-[8px] text-zinc-450 block">/ Month</span>
                </div>
              </div>

              <div className="space-y-2 text-[10px] font-sans">
                <span className="text-[9px] text-[#71717A] block uppercase font-mono tracking-wider font-bold">Inclusions:</span>
                <ul className="space-y-2 font-mono text-[9px]">
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="font-medium text-white">Full Discord Integration</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#30d158] shrink-0" />
                    <span>SkyVision Decision Dashboard</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#30d158] shrink-0" />
                    <span>Real-time Trade Health Indexes</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#30d158] shrink-0" />
                    <span>Option Goalposts (T1, T2, T3)</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#30d158] shrink-0" />
                    <span>Expected P&L Calculations</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-5">
              <button 
                onClick={onEnterApp}
                className="w-full py-2.5 bg-white text-black font-extrabold uppercase tracking-widest text-[9px] rounded-lg hover:bg-zinc-200 hover:scale-[1.01] transition-all duration-300 cursor-pointer shadow-lg"
              >
                Subscribe to SkyVision
              </button>
            </div>
          </motion.div>

          {/* PINPOINT GEXBOT CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -4, boxShadow: "0 25px 50px -12px rgba(16, 185, 129, 0.08)" }}
            className="apple-glass rounded-2xl p-6 flex flex-col justify-between relative transition-all duration-300"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-baseline border-b border-zinc-900/40 pb-3">
                <div>
                  <span className="text-zinc-500 text-[8.5px] uppercase tracking-wider block font-bold">Automated GEX</span>
                  <span className="text-[10px] font-mono font-black text-emerald-400 block mt-1 uppercase">POSITION TRACKING</span>
                </div>
                <div className="text-right">
                  <span className="text-[#A1A1AA] text-[10px] block font-bold">PINPOINT GEXBOT</span>
                  <span className="text-xl font-black text-white">$249</span>
                  <span className="text-[8px] text-zinc-650 block">/ Month</span>
                </div>
              </div>

              <div className="space-y-2 text-[10px] font-sans">
                <span className="text-[9px] text-[#71717A] block uppercase font-mono tracking-wider font-bold">Inclusions:</span>
                <ul className="space-y-2 font-mono text-[9px]">
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="font-medium text-white">Full SkyVision Features</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#30d158] shrink-0" />
                    <span>Pinpoint Gexbot Live Feed</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#30d158] shrink-0" />
                    <span>Live Gamma Exposure Grids</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#30d158] shrink-0" />
                    <span>Dealer Positioning Heatmaps</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#30d158] shrink-0" />
                    <span>Boundary Expiration Pin Zones</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-5">
              <button 
                onClick={onEnterApp}
                className="w-full py-2.5 bg-zinc-900/90 hover:bg-white hover:text-black border border-zinc-800 text-zinc-300 font-bold uppercase tracking-widest text-[9px] rounded-lg transition-all duration-300 cursor-pointer"
              >
                Access Pinpoint Gexbot
              </button>
            </div>
          </motion.div>

        </div>
      </motion.section>

      {/* Pristine Minimal Footer - No telemetry noise clutter */}
      <motion.footer 
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="border-t border-zinc-900 bg-[#000000] py-12 px-6 text-center text-[10px] text-zinc-650 font-mono mt-auto relative z-10 max-w-4xl mx-auto w-full"
      >
        <p>&copy; 2026 ARBOR CAPITAL GROUP & SLAYER NETWORKS CO. ALL RIGHTS RESERVED.</p>
        <p className="mt-1 text-[8px] text-zinc-700 uppercase tracking-widest">
          Slayer provides real-time mathematical decision guidelines. No investment advising is rendered.
        </p>
      </motion.footer>

    </div>
  );
}
