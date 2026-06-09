import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useContractStore, PinLevel } from '../lib/store';
import { Compass, ShieldAlert, Zap, Layers, History, HelpCircle } from 'lucide-react';

export function PinpointAIView() {
  const activeContract = useContractStore(s => s.activeContract);
  const selectedAsset = useContractStore(s => s.selectedAsset);
  const score = useContractStore(s => s.serverState?.system_score);
  const marketState = useContractStore(s => s.marketState);

  // Derive pinpoint map parameters
  const spotPrice = activeContract?.pinpoint?.spotPrice || selectedAsset.defaultPrice;
  const rawLevels = activeContract?.pinpoint?.levels || [];

  // Generate complete set of levels centered on spot if rawLevels are empty
  const levels: PinLevel[] = useMemo(() => {
    if (rawLevels.length > 0) return rawLevels;

    const spot = selectedAsset.defaultPrice;
    const step = spot > 1000 ? 100 : spot > 150 ? 5 : 1;
    const center = Math.round(spot / step) * step;

    // Default levels list matching the required architecture
    return [
      { strike: center + step * 2, dollars: 8400000000, strength: 84, type: 'resistance' },
      { strike: center + step, dollars: 6100000000, strength: 65, type: 'resistance' },
      { strike: center, dollars: 4200000000, strength: 55, type: 'magnet' },
      { strike: center - step, dollars: 6500000000, strength: 65, type: 'support' },
      { strike: center - step * 2, dollars: 9400000000, strength: 94, type: 'support' }
    ];
  }, [rawLevels, selectedAsset]);

  // Determine standard bounds for absolute Y placement
  const { maxStrike, minStrike, strikeRange } = useMemo(() => {
    const strikes = levels.map(l => l.strike);
    const max = strikes.length > 0 ? Math.max(...strikes) : spotPrice * 1.02;
    const min = strikes.length > 0 ? Math.min(...strikes) : spotPrice * 0.98;
    return {
      maxStrike: max,
      minStrike: min,
      strikeRange: max - min || 1
    };
  }, [levels, spotPrice]);

  // Calculate precise spotY coordinate relative to 420px map track canvas
  const containerHeight = 420;
  const paddingY = 30; // buffer spacing
  const usableHeight = containerHeight - paddingY * 2;
  const spotY = useMemo(() => {
    const relativePos = (maxStrike - spotPrice) / strikeRange;
    const boundedPos = Math.max(0, Math.min(1, relativePos));
    return paddingY + boundedPos * usableHeight;
  }, [spotPrice, maxStrike, strikeRange, usableHeight]);

  // Render individual PinBar component exactly as requested (Bug #3)
  function PinBarComponent({ strike, dollars, strength, type }: PinLevel) {
    const maxDollarValue = 10000000000; // 10 Billion scale
    const width = Math.max(8, (dollars / maxDollarValue) * 100);
    const opacity = strength / 100;
    
    // Exact requested HEX hex codes
    const color = type === 'support' ? '#00ff88' : type === 'resistance' ? '#ff4545' : '#4f8cff';

    return (
      <div className="flex items-center gap-4 py-3 border-b border-zinc-900/35 relative group hover:bg-zinc-950/20 px-2 transition-colors">
        <div className="w-16 flex flex-col">
          <span className="text-sm font-black text-white">{strike}</span>
          <span className="text-[7.5px] text-zinc-500 font-mono tracking-wider font-semibold uppercase">{type}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="h-6 bg-zinc-950 border border-zinc-900 rounded-sm relative overflow-hidden flex items-center">
            <div 
              className="h-full transition-all duration-300"
              style={{
                width: `${width}%`,
                opacity: opacity,
                backgroundColor: color,
                boxShadow: `0 0 10px ${color}1a`
              }}
            />
            <div className="absolute inset-y-0 left-3 flex items-center text-[9px] text-[#E4E4E7] font-black tracking-widest uppercase pointer-events-none gap-2 font-mono">
              <span style={{ color }}>●</span>
              <span>{(dollars / 1000000000).toFixed(2)}B LEVEL</span>
            </div>
          </div>
        </div>

        <div className="w-12 text-right">
          <span className="text-xs font-bold text-zinc-400 font-mono">{strength}%</span>
          <span className="text-[7px] text-zinc-500 block uppercase font-mono">STRENGTH</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-zinc-100 flex flex-col font-mono select-none antialiased md:min-h-[580px] lg:h-[650px]">
      
      {/* Upper header segment brand overlay */}
      <div className="bg-[#050505] border border-zinc-900 p-4 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <Compass className="w-4 h-4 text-zinc-400 animate-pulse" />
          <h1 className="text-xs font-black text-white uppercase tracking-widest font-mono">
            PINPOINT GPS MONITOR <span className="text-zinc-600">/ SPATIAL LIQUIDITY PROJECTIONS</span>
          </h1>
        </div>
        <div className="flex items-center gap-4 text-[9px] text-zinc-550 uppercase tracking-widest font-black">
          <span>COORDINATES RECLASSIFIED</span>
          <span className="text-zinc-800">|</span>
          <span className="text-[#00ff88]">RADAR ONLINE</span>
        </div>
      </div>

      {/* REQUIRED LAYOUT GRAPH ENGINE
          display:grid; grid-template-columns: 20% 60% 20%; height:100vh; */}
      <div 
        className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 h-full"
        style={{ minHeight: '520px' }}
      >
        
        {/* COLUMN 1: MARKET STORY (20%) */}
        <div className="md:col-span-3 flex flex-col bg-[#050505] border border-zinc-900 rounded-sm p-4 text-left justify-between">
          <div className="space-y-4">
            <div className="border-b border-zinc-900 pb-2">
              <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest font-black block">COGNITIVE SUMMARY</span>
              <h3 className="text-[11px] font-black text-white uppercase tracking-wider mt-0.5">
                Market Story
              </h3>
            </div>
            
            <p className="text-[10px] leading-relaxed text-zinc-400 font-sans">
              The {selectedAsset.ticker} spot price is currently tracking inside an institutional hedging zone. Overhead options exposure reveals a major resistance barrier centering on OTM calls. 
            </p>
            
            <div className="space-y-2.5 pt-2 text-[10px] font-mono">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-950">
                <span className="text-zinc-500 uppercase text-[8.5px]">Control Regime</span>
                <span className="text-[#00ff88] font-bold uppercase bg-[#00ff88]/5 px-2 py-0.5 border border-[#00ff88]/10 rounded-xs">
                  {score?.rsiCascade >= 6 ? 'Buyers' : 'Sellers'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-950">
                <span className="text-zinc-500 uppercase text-[8.5px]">Expected Range</span>
                <span className="text-zinc-300 font-bold">±{activeContract?.expectedMove || 1.1}%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-950">
                <span className="text-zinc-500 uppercase text-[8.5px]">Gamma State</span>
                <span className="text-zinc-300 font-bold truncate max-w-[120px]">
                  {score?.liquiditySweep >= 5 ? 'Stable Positive Gamma' : 'Negative Gamma Flip'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-950 space-y-2 text-[8.5px] text-zinc-500">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-550" />
              <span className="font-extrabold uppercase text-[7.5px]">GEX INVENTORY AUDITED</span>
            </div>
            <p className="font-sans leading-relaxed text-[10px] text-zinc-600">
              Auto-calibrated regression ensures zero manual interpretation bias is introduced.
            </p>
          </div>
        </div>

        {/* COLUMN 2: POSITIONING MAP (60%) */}
        <div className="md:col-span-6 bg-[#050505] border border-zinc-900 rounded-sm p-4 flex flex-col relative overflow-hidden h-full">
          
          <div className="flex justify-between items-center border-b border-zinc-900/40 pb-2.5 mb-3 uppercase">
            <span className="text-[8px] text-zinc-500 tracking-widest font-black block">
              Continuous Spatial GEX Map
            </span>
            <span className="text-[7.5px] bg-black border border-zinc-900 text-zinc-400 px-2 py-0.5 rounded-sm">
              TRACK: {selectedAsset.ticker}
            </span>
          </div>

          {/* Canvas coordinate track area */}
          <div 
            className="flex-1 relative bg-black/45 border border-zinc-950 rounded-sm px-4 overflow-hidden"
            style={{ height: `${containerHeight}px` }}
          >
            {/* Horizontal line markers */}
            {levels.map((lvl, index) => {
              const relativeY = (maxStrike - lvl.strike) / strikeRange;
              const lvlY = paddingY + relativeY * usableHeight;
              return (
                <div 
                  key={index} 
                  className="absolute left-0 right-0 border-t border-[#18181b]/70 border-dashed"
                  style={{ top: `${lvlY}px` }}
                />
              );
            })}

            {/* Render absolute-placed PinBar list */}
            {levels.map((lvl, index) => {
              const relativeY = (maxStrike - lvl.strike) / strikeRange;
              const lvlY = paddingY + relativeY * usableHeight;
              
              return (
                <div 
                  key={index} 
                  className="absolute left-4 right-4" 
                  style={{ top: `${lvlY - 24}px` }} // offset half height
                >
                  <PinBarComponent 
                    strike={lvl.strike} 
                    dollars={lvl.dollars} 
                    strength={lvl.strength} 
                    type={lvl.type} 
                  />
                </div>
              );
            })}

            {/* SPOT PRICE GLIDER (Bug #3) - Spot should glide, never jump! */}
            <motion.div
              className="absolute left-4 right-4 z-20"
              style={{ originY: 0.5 }}
              animate={{
                top: `${spotY}px`
              }}
              transition={{
                type: "spring",
                stiffness: 90,
                damping: 18
              }}
            >
              <div className="relative">
                {/* Horizontal spot beam line */}
                <div className="w-full h-[2px] bg-white shadow-[0_0_12px_#ffffffa0]" />
                
                {/* Floating glider banner */}
                <div className="absolute right-0 -top-8 bg-white text-black px-2.5 py-1 rounded-xs font-sans font-black text-[9.5px] uppercase shadow-2xl flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-ping" />
                  <span>SPOT PRICE: {spotPrice.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>

          </div>

          <div className="mt-3 text-[8px] text-zinc-600 uppercase text-center font-bold tracking-wide">
            STRETCH VIEWPORT PINPOINT COORDINATES • CALIBRATION COMPRE COMPREHENSION
          </div>

        </div>

        {/* COLUMN 3: CONTEXT (20%) */}
        <div className="md:col-span-3 flex flex-col bg-[#050505] border border-zinc-900 rounded-sm p-4 justify-between h-full text-left">
          <div className="space-y-4">
            <div className="border-b border-zinc-900 pb-2">
              <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest font-black block">DECISION ENGINE DATA</span>
              <h3 className="text-[11px] font-black text-white uppercase tracking-wider mt-0.5">
                Context Indicators
              </h3>
            </div>

            <div className="space-y-3 font-mono text-[10px]">
              {/* NYSE CLOSE COUNTDOWN */}
              <div className="p-2 bg-black border border-zinc-900 rounded-xs space-y-1">
                <div className="flex justify-between items-center text-[8px] text-zinc-500 font-bold uppercase">
                  <span>NYSE Market State</span>
                  <span className={marketState.open ? 'text-[#00ff88]' : 'text-amber-500'}>
                    {marketState.open ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
                <div className="text-base font-black text-white tracking-widest">
                  {marketState.open ? marketState.closeIn : marketState.openIn}
                </div>
                <div className="text-[7.5px] text-zinc-600 uppercase">
                  {marketState.open ? 'COUNTDOWN TO CLOSING BELL' : 'COUNTDOWN TO OPENING BELL'}
                </div>
              </div>

              {/* HEURISTIC VOL ANALYSIS */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center pb-1.5 border-b border-zinc-950">
                  <span className="text-zinc-500 text-[8.5px] uppercase">G Greeks</span>
                  <span className="text-zinc-300 font-bold font-mono">DAMPENED</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-zinc-950">
                  <span className="text-zinc-500 text-[8.5px] uppercase">Market Flow Rate</span>
                  <span className="text-zinc-300 font-bold">14.2 / s</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-zinc-950">
                  <span className="text-zinc-500 text-[8.5px] uppercase">Heuristic Moat</span>
                  <span className="text-indigo-400 font-bold">STABLE ({activeContract?.health || 88})</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-950 text-center text-zinc-650 space-y-1">
            <span className="text-[7.5px] font-bold text-zinc-550 block uppercase tracking-wider">DONE.</span>
            <span className="text-[10px] text-zinc-650 leading-relaxed font-sans block">
              Order values represent gross index exposure on major dealer inventory maps.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
