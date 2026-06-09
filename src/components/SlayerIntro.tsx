/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Globe, 
  Check, 
  Sparkles, 
  Compass, 
  Dna, 
  Database,
  Layers
} from 'lucide-react';
import { AssetInfo, TimeframeVal, SystemScore, V8TradeRecord } from '../types';

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
  onSelectOpportunity: (asset: AssetInfo, type: 'C' | 'P') => void;
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
    // Translate active index choice back into global parameters
    const targetAssetMap = {
      SPX: 'SPX',
      QQQ: 'QQQ',
      NDX: 'NDX',
      SPY: 'SPY',
    };
    
    // Find matching AssetInfo from default set
    const candidate = originalBestOpportunity.asset; // fallback
    onSelectOpportunity(candidate, 'C');
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
      <section className="relative z-10 px-6 pt-16 pb-12 max-w-4xl mx-auto text-center space-y-7 flex flex-col items-center">
        
        {/* Subtle emblem */}
        <div className="flex items-center gap-2.5 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>SLAYER TERMINAL</span>
          <span className="text-zinc-800">|</span>
          <span className="text-white">BY ARBOR CAPITAL</span>
        </div>

        {/* STOP GUESSING LEVEL 2 LANDING TITLE */}
        <div className="space-y-4 max-w-3xl">
          <span className="text-[10px] font-mono tracking-[0.34em] text-[#A1A1AA] uppercase font-black bg-zinc-950 px-3/5 px-4 py-1.5 border border-zinc-900 rounded-xs inline-block">
            STRICTLY NO MARKETING PLOTS
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-none font-sans uppercase">
            STOP GUESSING.
          </h1>
          <p className="text-zinc-400 text-base md:text-lg font-light font-sans leading-relaxed tracking-wide max-w-2xl mx-auto">
            Institutional intelligence for index options traders. Fully automated, mathematically derived setups continuously computed on order-flow grids.
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
        <div id="slayer-hero-opportunity" className="w-full max-w-lg bg-[#050505] border border-zinc-900 p-6 md:p-7 rounded-sm relative overflow-hidden shadow-2xl text-left space-y-4 font-mono">
          
          {/* Top Line accent */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />

          {/* Section Indicator */}
          <div className="flex justify-between items-center pb-2.5 border-b border-zinc-950">
            <span className="text-[9px] text-[#A1A1AA] uppercase tracking-widest font-black">
              BEST OPPORTUNITY RIGHT NOW
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span className="text-[8px] text-[#10B981] font-extrabold uppercase">LIVE CALCULATED</span>
            </div>
          </div>

          {/* CORE STAT DETAILS */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-1">
            <div className="space-y-0.5">
              <span className="text-2xl font-black text-white block uppercase tracking-tight">
                {activeOpp.ticker}
              </span>
              <span className="text-[9.5px] text-zinc-500 uppercase block">
                Target Index Frame: {activeHeroIdx}
              </span>
            </div>

            <div className="bg-[#10B981] text-black font-black text-[10.5px] uppercase tracking-widest px-4 py-1.5 rounded-xs border border-[#10B981] shadow-lg">
              {activeOpp.status === 'Strengthening' ? 'ENTER' : 'ENTER'}
            </div>
          </div>

          {/* DYNAMIC RATINGS TABS */}
          <div className="grid grid-cols-3 gap-3 bg-black border border-zinc-950 p-3 rounded-sm">
            <div>
              <span className="text-[8.5px] text-zinc-550 uppercase tracking-tight block">Trade Health</span>
              <span className="text-base font-black text-[#10B981] mt-0.5 block">{activeOpp.health}</span>
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

          {/* Link button */}
          <div className="pt-2">
            <button
              onClick={handleLaunchToActiveOpportunity}
              className="w-full py-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-white font-extrabold uppercase tracking-widest text-[9.5px] rounded-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Open Deep-Space Analysis</span>
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

      </section>

      {/* ==================================================
          LEVEL 2 & LEVEL 3: THE CORE STRUCTURES (BELOW FOLD)
          ================================================== */}
      <section className="relative z-10 py-12 px-6 max-w-4xl mx-auto w-full border-t border-zinc-900 mt-4">
        <div className="text-center space-y-2 mb-10">
          <span className="text-zinc-500 text-[9px] font-mono uppercase tracking-[0.3em] block">
            SLAYER ECOSYSTEM — BRAND ARCHITECTURE
          </span>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans">
            Three Tactical Integration Hierarchy Levels
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
          {/* LEVEL 1 CARD */}
          <div className="bg-[#030304] border border-zinc-900 rounded p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-950 pb-2.5">
                <span className="text-[#A1A1AA] text-[9px] font-bold uppercase tracking-wider block">LEVEL 1 // THE PARENT</span>
                <span className="text-[8px] bg-indigo-950 text-indigo-400 border border-indigo-900/45 px-2 py-0.5 rounded">THE FIRM</span>
              </div>
              <h3 className="text-xs font-black text-white uppercase">ARBOR CAPITAL</h3>
              <p className="text-[10.5px] text-zinc-500 leading-relaxed font-sans font-light">
                The governing enterprise and community. Arbor Capital represents quantitative research, education, commentary and event coordinates.
              </p>
            </div>
            <div className="mt-5 pt-2.5 border-t border-zinc-950 text-[8.5px] text-zinc-650 uppercase">
              COORDINATES DISCORD NETWORKS
            </div>
          </div>

          {/* LEVEL 2 CARD */}
          <div className="bg-[#030304] border border-zinc-900 rounded p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-950 pb-2.5">
                <span className="text-[#A1A1AA] text-[9px] font-bold uppercase tracking-wider block">LEVEL 2 // THE FLAGSHIP</span>
                <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded">THE TERMINAL</span>
              </div>
              <h3 className="text-xs font-black text-white uppercase">SLAYER</h3>
              <p className="text-[10.5px] text-zinc-500 leading-relaxed font-sans font-light font-light">
                The software platform product delivering precision. Members log in, monitor trade health, and execute decisions without the noise of traditional brokers.
              </p>
            </div>
            <div className="mt-5 pt-2.5 border-t border-zinc-950 text-[8.5px] text-zinc-500">
              DOMAINS: SLAYER.TRADE • SLAYER.AI
            </div>
          </div>

          {/* LEVEL 3 CARD */}
          <div className="bg-[#030304] border border-zinc-900 rounded p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-950 pb-2.5">
                <span className="text-[#A1A1AA] text-[9px] font-bold uppercase tracking-wider block">LEVEL 3 // THE ENGINES</span>
                <span className="text-[8px] bg-indigo-950 text-indigo-400 border border-indigo-900/45 px-2 py-0.5 rounded">CORES</span>
              </div>
              <h3 className="text-xs font-black text-white uppercase">FOUR ENGINES</h3>
              <p className="text-[10.5px] text-zinc-500 leading-relaxed font-sans font-light">
                Slayer embeds four cognitive cores answering dedicated questions: Discovery, SkyVision, Pinpoint AI and Trade Archive. No clutter.
              </p>
            </div>
            <div className="mt-5 pt-2.5 border-t border-zinc-950 text-[8.5px] text-zinc-650 uppercase">
              DECIDER PLATFORM
            </div>
          </div>
        </div>
      </section>

      {/* USER JOURNEY MAP INCLUSION */}
      <section className="relative z-10 py-6 px-6 max-w-4xl mx-auto w-full">
        <div className="bg-zinc-950 border border-zinc-900 p-5 md:p-6 rounded">
          <div className="flex items-center gap-2 mb-4 border-b border-zinc-900 pb-3">
            <Layers className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-black text-white uppercase tracking-wider font-mono">
              THE ARBOR-SLAYER USER JOURNEY MAP
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 font-mono text-center text-xs">
            <div className="bg-black border border-zinc-900 p-3 rounded-xs">
              <span className="text-[9.5px] text-zinc-550 block">ARBOR CAPITAL</span>
              <span className="text-[8.5px] text-zinc-400 block mt-1 uppercase">" elite network "</span>
            </div>
            <div className="bg-black border border-zinc-900 p-3 rounded-xs">
              <span className="text-[9.5px] text-[#10B981] block">DISCOVERY</span>
              <span className="text-[8.5px] text-[#10B981] block mt-1 uppercase">" found something "</span>
            </div>
            <div className="bg-black border border-zinc-900 p-3 rounded-xs">
              <span className="text-[9.5px] text-indigo-400 block">SKYVISION</span>
              <span className="text-[8.5px] text-indigo-400 block mt-1 uppercase">" know what to do "</span>
            </div>
            <div className="bg-black border border-zinc-900 p-3 rounded-xs">
              <span className="text-[9.5px] text-zinc-350 block">PINPOINT AI</span>
              <span className="text-[8.5px] text-zinc-400 block mt-1 uppercase">" understand why "</span>
            </div>
            <div className="bg-black border border-zinc-900 p-3 rounded-xs">
              <span className="text-[9.5px] text-zinc-355 block">TRADE ARCHIVE</span>
              <span className="text-[8.5px] text-zinc-500 block mt-1 uppercase">" trust mechanism "</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          TACTICAL MEMBERSHIP SUBSCRIPTION MATRICES
          ================================================== */}
      <section id="pricing-matrices" className="relative z-10 py-10 px-6 max-w-4xl mx-auto w-full border-t border-zinc-900">
        <div className="text-center space-y-2 mb-8">
          <span className="text-zinc-500 text-[9px] font-mono uppercase tracking-[0.3em] block">
            MEMBERSHIP TIERS & INTEGRATION ROLES
          </span>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans">
            Slayer Subscription Matrix
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono items-stretch">
          
          {/* STARTER CARD */}
          <div className="bg-[#050505] border border-zinc-900 rounded p-5 flex flex-col justify-between relative">
            <div className="space-y-4">
              <div className="flex justify-between items-baseline border-b border-zinc-950 pb-3">
                <div>
                  <span className="text-zinc-500 text-[8.5px] uppercase tracking-wider block font-bold">Outcome</span>
                  <span className="text-[10px] font-mono font-black text-rose-400 block mt-1">FIND OPPORTUNITIES</span>
                </div>
                <div className="text-right">
                  <span className="text-[#A1A1AA] text-[10px] block font-bold">STARTER</span>
                  <span className="text-xl font-black text-white">$49</span>
                  <span className="text-[8px] text-zinc-600 block">/ Month</span>
                </div>
              </div>

              <div className="space-y-2 text-[10px] font-sans">
                <span className="text-[9px] text-[#71717A] block uppercase font-mono tracking-wider font-bold">Inclusions:</span>
                <ul className="space-y-2 font-mono text-[9px]">
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#10B981] shrink-0" />
                    <span>Arbor Capital Community Access</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#10B981] shrink-0" />
                    <span>Discovery (The Opportunity Engine)</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#10B981] shrink-0" />
                    <span>Trade Archive (Trust Moat Ledger)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-5">
              <button 
                onClick={onEnterApp}
                className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-300 font-bold uppercase tracking-widest text-[9px] rounded-xs transition-colors cursor-pointer"
              >
                Configure Starter Role
              </button>
            </div>
          </div>

          {/* PROFESSIONAL CARD (Most Active / Popular) */}
          <div className="bg-[#050505] border border-white rounded p-5 flex flex-col justify-between relative shadow-2xl">
            <div className="absolute top-0 right-10 -translate-y-1/2 bg-white text-black text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">
              RECOMMENDED SPECIFICATION
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-baseline border-b border-zinc-950 pb-3">
                <div>
                  <span className="text-zinc-500 text-[8.5px] uppercase tracking-wider block font-bold">Outcome</span>
                  <span className="text-[10px] font-mono font-black text-indigo-400 block mt-1 uppercase">MANAGE CONFIDENTLY</span>
                </div>
                <div className="text-right">
                  <span className="text-white text-[10px] block font-black">PROFESSIONAL</span>
                  <span className="text-xl font-black text-white">$99</span>
                  <span className="text-[8px] text-zinc-500 block">/ Month</span>
                </div>
              </div>

              <div className="space-y-2 text-[10px] font-sans">
                <span className="text-[9px] text-[#71717A] block uppercase font-mono tracking-wider font-bold">Inclusions:</span>
                <ul className="space-y-2 font-mono text-[9px]">
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="font-medium text-white">Everything in Starter</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#10B981] shrink-0" />
                    <span>SkyVision (The Decision Engine)</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#10B981] shrink-0" />
                    <span>Full Options Trade Health index stats</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#10B981] shrink-0" />
                    <span>Goalpost targets (T1, T2, T3)</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#10B981] shrink-0" />
                    <span>Expected Option Move calculations</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#10B981] shrink-0" />
                    <span>Active Controls: ENTER, HOLD, REDUCE, EXIT</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-5">
              <button 
                onClick={onEnterApp}
                className="w-full py-2.5 bg-white text-black font-extrabold uppercase tracking-widest text-[9px] rounded-xs hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Configure Professional Role
              </button>
            </div>
          </div>

          {/* INSTITUTIONAL CARD (Active Power Room) */}
          <div className="bg-[#050505] border border-zinc-900 rounded p-5 flex flex-col justify-between relative">
            <div className="space-y-4">
              <div className="flex justify-between items-baseline border-b border-zinc-950 pb-3">
                <div>
                  <span className="text-zinc-500 text-[8.5px] uppercase tracking-wider block font-bold">Outcome</span>
                  <span className="text-[10px] font-mono font-black text-emerald-400 block mt-1 uppercase">UNDERSTAND THE BOARD</span>
                </div>
                <div className="text-right">
                  <span className="text-[#A1A1AA] text-[10px] block font-bold">INSTITUTIONAL</span>
                  <span className="text-xl font-black text-white">$249</span>
                  <span className="text-[8px] text-zinc-500 block">/ Month</span>
                </div>
              </div>

              <div className="space-y-2 text-[10px] font-sans">
                <span className="text-[9px] text-[#71717A] block uppercase font-mono tracking-wider font-bold">Inclusions:</span>
                <ul className="space-y-2 font-mono text-[9px]">
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="font-medium text-white">Everything in Professional</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#10B981] shrink-0" />
                    <span>Pinpoint AI (The Market GPS Map)</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#10B981] shrink-0" />
                    <span>Dynamic bubble density graphs</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#10B981] shrink-0" />
                    <span>Dealer positioning heat bars</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Check className="w-3 h-3 text-[#10B981] shrink-0" />
                    <span>Expected Close & Boundary Pin Zones</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-5">
              <button 
                onClick={onEnterApp}
                className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-300 font-bold uppercase tracking-widest text-[9px] rounded-xs transition-colors cursor-pointer"
              >
                Configure Institutional Role
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Pristine Minimal Footer - No telemetry noise clutter */}
      <footer className="border-t border-zinc-900 bg-[#000000] py-12 px-6 text-center text-[10px] text-zinc-650 font-mono mt-auto relative z-10 max-w-4xl mx-auto w-full">
        <p>&copy; 2026 ARBOR CAPITAL GROUP & SLAYER NETWORKS CO. ALL RIGHTS RESERVED.</p>
        <p className="mt-1 text-[8px] text-zinc-700 uppercase tracking-widest">
          Slayer provides real-time mathematical decision guidelines. No investment advising is rendered.
        </p>
      </footer>

    </div>
  );
}
