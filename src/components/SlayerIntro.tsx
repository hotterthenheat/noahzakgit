/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useContractStore } from '../lib/store';
import { FeatureMatrix } from './FeatureMatrix';
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
  onEnterApp: (targetTab?: string) => void;
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
  const [activeHeroIdx, setActiveHeroIdx] = useState<'SPX' | 'NDX' | 'QQQ' | 'SPY' | 'RUT'>('SPX');

  // Synchronize with external selectedAsset when it updates
  useEffect(() => {
    if (['SPX', 'NDX', 'QQQ', 'SPY', 'RUT'].includes(selectedAsset.ticker)) {
      setActiveHeroIdx(selectedAsset.ticker as any);
    }
  }, [selectedAsset]);
  
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
    RUT: { ticker: 'RUT 2020C', health: 92, move: '+31%', status: 'Strengthening', isCall: true },
  };

  const activeOpp = heroOpportunities[activeHeroIdx];

  const handleLaunchToActiveOpportunity = () => {
    // Clear any selected strike so it brings the user to the front of Sky's Eye
    useContractStore.getState().setSelectedStrike(null);
    onEnterApp('skyvision');
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      id="slayer-ecosystem-landing" 
      className="min-h-screen bg-transparent text-[#D4D4D8] flex flex-col font-sans selection:bg-white selection:text-black overflow-y-auto relative pb-20 select-none antialiased"
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
          {(['SPX', 'NDX', 'QQQ', 'SPY', 'RUT'] as const).map((ticker) => (
            <button
              key={ticker}
              onClick={() => {
                setActiveHeroIdx(ticker);
                const targetAsset = ASSET_LIST.find(a => a.ticker === ticker);
                if (targetAsset) {
                  setSelectedAsset(targetAsset);
                }
              }}
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
          SCROLL FEATURE MATRIX
          ================================================== */}
      <FeatureMatrix onEnterApp={onEnterApp} />

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
                onClick={() => onEnterApp('arbor')}
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
                onClick={() => onEnterApp('skyvision')}
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
                onClick={() => onEnterApp('pinpoint')}
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
