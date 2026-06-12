import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useContractStore, PinLevel } from '../lib/store';
import { 
  Compass, 
  ShieldAlert, 
  Zap, 
  Layers, 
  History, 
  HelpCircle, 
  ArrowUpRight, 
  TrendingUp, 
  Info, 
  AlertTriangle 
} from 'lucide-react';

export function PinpointAIView() {
  const activeContract = useContractStore(s => s.activeContract);
  const selectedAsset = useContractStore(s => s.selectedAsset);
  const score = useContractStore(s => s.serverState?.system_score);
  const serverState = useContractStore(s => s.serverState);
  const marketState = useContractStore(s => s.marketState);

  // Sub-tab state
  const [activeSection, setActiveSection] = useState<'radar' | 'matrix' | 'story'>('radar');
  
  // Focused strike for detailed inspector panel
  const [focusedStrike, setFocusedStrike] = useState<number | null>(null);

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

  // Determine active focused strike index
  const activeFocusedStrike = useMemo(() => {
    if (focusedStrike !== null && levels.some(l => l.strike === focusedStrike)) {
      return focusedStrike;
    }
    const magnet = levels.find(l => l.type === 'magnet');
    if (magnet) return magnet.strike;
    return levels[0]?.strike || 0;
  }, [focusedStrike, levels]);

  const focusedLevel = useMemo(() => {
    return levels.find(l => l.strike === activeFocusedStrike) || levels[0];
  }, [activeFocusedStrike, levels]);

  // Retrieve metrics details
  const liveMetrics = useMemo(() => {
    const spot = selectedAsset.defaultPrice;
    const step = spot > 1000 ? 100 : spot > 150 ? 5 : 1;
    const center = Math.round(spot / step) * step;
    return {
      bias: serverState?.deep_intelligence?.dealer_metrics?.bias || 'LONG GAMMA',
      volState: serverState?.deep_intelligence?.dealer_metrics?.volState || 'COMPRESSED',
      magnetStrike: serverState?.deep_intelligence?.dealer_metrics?.magnetStrike || center,
      flipLevel: serverState?.deep_intelligence?.dealer_metrics?.flipLevel || (center - step),
      callWall: serverState?.deep_intelligence?.dealer_metrics?.callWall || (center + step * 2),
      putWall: serverState?.deep_intelligence?.dealer_metrics?.putWall || (center - step * 2),
      dealerScore: serverState?.deep_intelligence?.dealer_metrics?.dealerScore || 84,
      expectedMovePct: serverState?.expected_move?.pct || '±1.1%'
    };
  }, [serverState, selectedAsset]);

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

  // Calculate precise spotY coordinate relative to 480px map track canvas
  const containerHeight = 480;
  const paddingY = 40; // buffer spacing
  const usableHeight = containerHeight - paddingY * 2;
  const spotY = useMemo(() => {
    const relativePos = (maxStrike - spotPrice) / strikeRange;
    const boundedPos = Math.max(0, Math.min(1, relativePos));
    return paddingY + boundedPos * usableHeight;
  }, [spotPrice, maxStrike, strikeRange, usableHeight]);

  // Level classification and narrative labeling logic
  const getLevelInfo = (lvl: PinLevel) => {
    const index = levels.findIndex(l => l.strike === lvl.strike);
    const middleIndex = Math.floor(levels.length / 2);
    const offset = index - middleIndex;

    let name = 'Neutral GEX Cushion';
    let description = 'Stable dealer inventory cushion supporting quiet range play.';
    let isKing = false;
    let isPutWall = false;

    if (lvl.type === 'resistance') {
      if (lvl.strike === liveMetrics.callWall) {
        name = '👑 KING CALL WALL';
        description = 'Strongest overhead call concentration; dominant institutional selling wall.';
        isKing = true;
      } else {
        name = 'MAJOR CALL RESISTANCE';
        description = 'Elevated call open interest; acts as a moderate overhead cap on spot rallies.';
      }
    } else if (lvl.type === 'support') {
      if (lvl.strike === liveMetrics.putWall) {
        name = '🛑 BARNEY PUT WALL';
        description = 'Maximum downside dealer buyback floor; heavy put concentration protecting breakouts.';
        isPutWall = true;
      } else {
        name = 'MAJOR PUT SUPPORT';
        description = 'Protected institutional floor level supporting range consolidation.';
      }
    } else if (lvl.type === 'magnet' || lvl.strike === liveMetrics.magnetStrike) {
      name = '🎯 EQUILIBRIUM MAGNET';
      description = 'Spot price gravity pinning node; represents high attraction zone as options expire.';
    } else if (lvl.strength < 40) {
      name = '💨 AIR POCKET GAP';
      description = 'Liquidity void area; high probability of vacuum price acceleration on a breach.';
    }

    return { name, description, isKing, isPutWall };
  };

  // Render individual PinBar component in GEX Map
  function PinBarComponent({ strike, dollars, strength, type }: PinLevel) {
    const maxDollarValue = 10000000000; // 10 Billion scale
    const width = Math.max(8, (dollars / maxDollarValue) * 100);
    const opacity = strength / 100;
    
    const info = getLevelInfo({ strike, dollars, strength, type });
    const isFocused = strike === activeFocusedStrike;

    // HSL-tailored premium colors (Gold/Purple/Cyan)
    const color = type === 'support' 
      ? '#D300C5' // Barney Purple
      : type === 'resistance' 
      ? '#FFDD00' // Pika Yellow
      : '#00F0FF'; // Equilibrium Cyan

    const gradient = type === 'support'
      ? 'from-purple-600 via-fuchsia-600 to-purple-800'
      : type === 'resistance'
      ? 'from-yellow-400 via-amber-400 to-yellow-500'
      : 'from-cyan-400 via-cyan-500 to-emerald-400';

    const glow = type === 'support'
      ? 'shadow-[0_0_15px_rgba(211,0,197,0.3)] border-purple-500/40'
      : type === 'resistance'
      ? 'shadow-[0_0_15px_rgba(255,221,0,0.3)] border-amber-450/40'
      : 'shadow-[0_0_15px_rgba(0,240,255,0.25)] border-cyan-450/40';

    return (
      <motion.div 
        whileHover={{ scale: 1.015, x: 4 }}
        onClick={() => setFocusedStrike(strike)}
        className={`flex items-center gap-4 py-2 px-3.5 border rounded-lg cursor-pointer transition-all select-none ${
          isFocused 
            ? `bg-zinc-900/80 border-white/60 ${glow}` 
            : 'bg-zinc-950/45 border-zinc-900/60 hover:border-zinc-800/80 hover:bg-zinc-950/80'
        }`}
      >
        <div className="w-16 flex flex-col text-left shrink-0">
          <span className="text-sm font-black text-white">{strike}</span>
          <span className="text-[7px] text-zinc-500 font-mono tracking-widest font-black uppercase">{type}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="h-5 bg-black/60 border border-zinc-900/80 rounded-sm relative overflow-hidden flex items-center">
            <div 
              className={`h-full bg-gradient-to-r ${gradient} transition-all duration-300`}
              style={{
                width: `${width}%`,
                opacity: opacity
              }}
            />
            <div className="absolute inset-y-0 left-2.5 flex items-center text-[8.5px] text-[#E4E4E7] font-black tracking-widest uppercase pointer-events-none gap-2 font-mono">
              <span style={{ color }}>●</span>
              <span>{(dollars / 1e9).toFixed(2)}B POSITIONING</span>
              <span className="text-zinc-400 text-[7px] border border-zinc-850 bg-black/50 px-1 py-0.2 rounded font-sans tracking-normal font-bold">
                {info.name}
              </span>
            </div>
          </div>
        </div>

        <div className="w-10 text-right shrink-0">
          <span className="text-[11px] font-extrabold text-zinc-300 font-mono">{strength}%</span>
          <span className="text-[6.5px] text-zinc-500 block uppercase font-mono">POWER</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full text-zinc-100 flex flex-col font-mono select-none antialiased md:min-h-[580px]">
      
      {/* Upper header segment brand overlay */}
      <div className="bg-[#050505] border border-zinc-900 p-4 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <Compass className="w-4 h-4 text-zinc-400 animate-pulse" />
          <h1 className="text-xs font-black text-white uppercase tracking-widest font-mono">
            SLAYER // PINPOINT <span className="text-zinc-650">/ SPATIAL OPTION INVENTORY RADAR</span>
          </h1>
        </div>
        <div className="flex items-center gap-4 text-[9px] text-zinc-550 uppercase tracking-widest font-black">
          <span>COORDINATES RECLASSIFIED</span>
          <span className="text-zinc-800">|</span>
          <span className="text-[#00ff88]">RADAR ONLINE</span>
        </div>
      </div>

      {/* ENHANCED REAL-TIME INSTITUTIONAL STATE PANEL */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2.5 bg-[#050505] border border-zinc-900 p-3 rounded-sm mb-4 text-left select-none text-[10px]">
        <div className="border border-zinc-900/60 p-2.5 rounded bg-zinc-950/40">
          <span className="text-zinc-500 uppercase font-black block text-[7px] tracking-wider mb-0.5">Dealer Bias</span>
          <span className={`font-black uppercase text-[11px] ${liveMetrics.bias === 'LONG GAMMA' ? 'text-[#00ff88]' : 'text-rose-400'} flex items-center gap-1.5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${liveMetrics.bias === 'LONG GAMMA' ? 'bg-[#00ff88]' : 'bg-rose-400'} animate-pulse`} />
            {liveMetrics.bias}
          </span>
        </div>
        <div className="border border-zinc-900/60 p-2.5 rounded bg-zinc-950/40">
          <span className="text-zinc-500 uppercase font-black block text-[7px] tracking-wider mb-0.5">Expected Move</span>
          <span className="text-[#ff4545] font-black text-[11px] uppercase">
            {liveMetrics.expectedMovePct}
          </span>
        </div>
        <div className="border border-zinc-900/60 p-2.5 rounded bg-zinc-950/40">
          <span className="text-zinc-550 uppercase font-black block text-[7px] tracking-wider mb-0.5">Volatility State</span>
          <span className="text-zinc-200 font-extrabold text-[11px] uppercase">
            {liveMetrics.volState}
          </span>
        </div>
        <div className="border border-zinc-900/60 p-2.5 rounded bg-zinc-950/40">
          <span className="text-zinc-550 uppercase font-black block text-[7px] tracking-wider mb-0.5">Magnet Strike</span>
          <span className="text-[#00F0FF] font-extrabold text-[11px] font-mono">
            {Number(liveMetrics.magnetStrike ?? 0).toFixed(2)}
          </span>
        </div>
        <div className="border border-zinc-900/60 p-2.5 rounded bg-zinc-950/40">
          <span className="text-zinc-550 uppercase font-black block text-[7px] tracking-wider mb-0.5">Call Wall</span>
          <span className="text-yellow-450 font-extrabold text-[11px] font-mono">
            {Number(liveMetrics.callWall ?? 0).toFixed(2)}
          </span>
        </div>
        <div className="border border-zinc-900/60 p-2.5 rounded bg-zinc-950/40">
          <span className="text-zinc-550 uppercase font-black block text-[7px] tracking-wider mb-0.5">Put Wall</span>
          <span className="text-purple-450 font-extrabold text-[11px] font-mono">
            {Number(liveMetrics.putWall ?? 0).toFixed(2)}
          </span>
        </div>
        <div className="border border-zinc-900/60 p-2.5 rounded bg-zinc-950/40">
          <span className="text-zinc-550 uppercase font-black block text-[7px] tracking-wider mb-0.5">Gamma Flip</span>
          <span className="text-rose-400 font-extrabold text-[11px] font-mono">
            {Number(liveMetrics.flipLevel ?? 0).toFixed(2)}
          </span>
        </div>
        <div className="border border-zinc-900/60 p-2.5 rounded bg-zinc-950/40 col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center text-[7.5px] font-bold">
            <span className="text-zinc-500 uppercase tracking-wider">Dealer Inventory Balance</span>
            <span className="text-cyan-400 font-black">{liveMetrics.dealerScore}/100</span>
          </div>
          <div className="w-full bg-black h-1 rounded-full overflow-hidden mt-1.5">
            <div className="bg-cyan-400 h-full" style={{ width: `${liveMetrics.dealerScore}%` }} />
          </div>
        </div>
      </div>

      {/* Sub-tab navigation bar with slide indicator */}
      <div className="flex border-b border-zinc-900 mb-6 gap-6 relative select-none shrink-0">
        {([
          { id: 'radar', name: 'Spatial Density Radar', icon: Compass },
          { id: 'matrix', name: 'Dealer Inventory Matrix', icon: Layers },
          { id: 'story', name: 'Commentary & Vol Skew', icon: History }
        ] as const).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`pb-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer relative ${
                isActive ? 'text-white border-white' : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
              <span>{tab.name}</span>
              {isActive && (
                <motion.div
                  layoutId="activeSubTab"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-white"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* RENDER ACTIVE TAB WITH SMOOTH FADE-IN & SLIDE TRANSITIONS */}
      <div className="relative overflow-hidden w-full flex-1">
        <AnimatePresence mode="wait">
          {activeSection === 'radar' && (
            <motion.div
              key="radar"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              {/* RADAR MAP STAGE (8 columns) */}
              <div className="lg:col-span-8 bg-[#050505] border border-zinc-900 rounded-xl p-5 flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center border-b border-zinc-900/40 pb-2.5 mb-3 uppercase">
                  <span className="text-[8px] text-zinc-550 tracking-widest font-black block">
                    Continuous Spatial GEX Radar Map
                  </span>
                  <span className="text-[7.5px] bg-black border border-zinc-900 text-zinc-400 px-2 py-0.5 rounded-sm">
                    TARGET: {selectedAsset.ticker}
                  </span>
                </div>

                {/* Coordinate radar track canvas */}
                <div 
                  className="relative bg-black/45 border border-zinc-950 rounded-xl px-4 overflow-hidden flex flex-col justify-between py-2"
                  style={{ height: `${containerHeight}px` }}
                >
                  {/* Subtle scanning radar scanlines */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(18,18,24,0)_95%,rgba(0,240,255,0.06)_97%,rgba(0,240,255,0.1)_99%,rgba(18,18,24,0)_100%)] bg-[size:100%_120px] animate-radar-sweep pointer-events-none z-10" />

                  {/* Horizontal strike guideline markers */}
                  {levels.map((lvl, index) => {
                    const relativeY = (maxStrike - lvl.strike) / strikeRange;
                    const lvlY = paddingY + relativeY * usableHeight;
                    return (
                      <div 
                        key={index} 
                        className="absolute left-0 right-0 border-t border-[#18181b]/50 border-dashed z-0 pointer-events-none"
                        style={{ top: `${lvlY}px` }}
                      />
                    );
                  })}

                  {/* Absolute-placed level PinBars */}
                  {levels.map((lvl, index) => {
                    const relativeY = (maxStrike - lvl.strike) / strikeRange;
                    const lvlY = paddingY + relativeY * usableHeight;
                    
                    return (
                      <div 
                        key={index} 
                        className="absolute left-4 right-4 z-10" 
                        style={{ top: `${lvlY - 22}px` }} // offset half height
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

                  {/* FLOATING LASER SPOT GLIDER - Glides with spring motion */}
                  <motion.div
                    className="absolute left-4 right-4 z-20 pointer-events-none"
                    style={{ top: 0, originY: 0.5 }}
                    animate={{
                      y: spotY
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 90,
                      damping: 18
                    }}
                  >
                    <div className="relative flex items-center">
                      {/* Laser beam emitter core */}
                      <div className="absolute -left-1 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_#fff,0_0_20px_#00F0FF] border border-cyan-400 animate-pulse" />
                      
                      {/* White-to-cyan gradient laser glow sweep line */}
                      <div className="w-full h-[1.5px] bg-gradient-to-r from-white via-cyan-400 to-transparent shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
                      
                      {/* Floating glider coordinates card */}
                      <div className="absolute right-0 -top-8 bg-white text-black px-2.5 py-1 rounded-sm font-sans font-black text-[9.5px] uppercase shadow-2xl flex items-center gap-1.5 border border-cyan-300">
                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping" />
                        <span>SPOT PRICE: {(spotPrice ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </motion.div>

                </div>

                <div className="mt-3.5 text-[8px] text-zinc-650 uppercase text-center font-bold tracking-wider">
                  * Coordinates calibrate dynamically under institutional GEX inventory sweeps
                </div>

                {/* GEX Color Legend */}
                <div className="mt-4 pt-3.5 border-t border-zinc-900/60 grid grid-cols-1 md:grid-cols-3 gap-3 text-left select-none">
                  <div className="bg-zinc-950/40 border border-zinc-900 p-2.5 rounded-lg flex items-start gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0 mt-0.5 shadow-[0_0_8px_rgba(255,221,0,0.5)]" />
                    <div>
                      <h4 className="text-[9.5px] font-black text-yellow-400 uppercase leading-none">POSITIVE GEX (GOLD)</h4>
                      <p className="text-[8.5px] text-zinc-500 font-sans leading-normal pt-1.5">
                        Call open interest concentration. Absorbs volatility and creates overhead barriers (seller ceilings).
                      </p>
                    </div>
                  </div>
                  <div className="bg-zinc-950/40 border border-zinc-900 p-2.5 rounded-lg flex items-start gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0 mt-0.5 shadow-[0_0_8px_rgba(211,0,197,0.5)]" />
                    <div>
                      <h4 className="text-[9.5px] font-black text-purple-400 uppercase leading-none">NEGATIVE GEX (PURPLE)</h4>
                      <p className="text-[8.5px] text-zinc-500 font-sans leading-normal pt-1.5">
                        Put open interest concentration. Accelerates volatility and creates index floors (dealer protection).
                      </p>
                    </div>
                  </div>
                  <div className="bg-zinc-950/40 border border-zinc-900 p-2.5 rounded-lg flex items-start gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0 mt-0.5 shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
                    <div>
                      <h4 className="text-[9.5px] font-black text-cyan-400 uppercase leading-none">EQUILIBRIUM MAGNET</h4>
                      <p className="text-[8.5px] text-zinc-500 font-sans leading-normal pt-1.5">
                        Mixed concentration balance. Acts as a gravity well to pin the index near expiry.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* DETAILED RADAR INSPECTOR (4 columns) */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <motion.div 
                  whileHover={{ scale: 1.01, borderColor: "rgba(255, 255, 255, 0.15)" }}
                  onClick={() => setActiveSection('matrix')}
                  className="bg-[#050505] border border-zinc-900 rounded-xl p-5 text-left flex flex-col justify-between h-full min-h-[380px] relative overflow-hidden shadow-2xl cursor-pointer group"
                >
                  
                  <div className="relative z-10 space-y-4">
                    <div className="border-b border-zinc-900 pb-3 flex justify-between items-start">
                      <div>
                        <span className="text-[7.5px] text-zinc-550 uppercase tracking-widest font-black block">RADAR LEVEL INSPECTOR</span>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider mt-0.5 font-sans">
                          STRIKE {focusedLevel.strike}
                        </h3>
                      </div>
                      <span className={`px-2 py-0.5 text-[8.5px] font-black uppercase rounded border ${
                        focusedLevel.type === 'support' 
                          ? 'text-purple-400 border-purple-500/20 bg-purple-500/5' 
                          : focusedLevel.type === 'resistance' 
                          ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5' 
                          : 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5'
                      }`}>
                        {focusedLevel.type}
                      </span>
                    </div>

                    <div className="space-y-4 text-xs font-mono">
                      <div className="bg-black/40 border border-zinc-900/60 rounded-md p-3 space-y-1">
                        <span className="text-[7.5px] text-zinc-600 uppercase font-black block">STRUCTURE REGIME</span>
                        <span className="text-white font-black text-[12px] block">
                          {getLevelInfo(focusedLevel).name}
                        </span>
                        <p className="text-[9.5px] text-zinc-400 font-sans leading-relaxed pt-1">
                          {getLevelInfo(focusedLevel).description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-950/80 border border-zinc-900 p-2.5 rounded">
                          <span className="text-zinc-550 uppercase font-black block text-[7.5px] tracking-wider mb-0.5">EXPOSURE</span>
                          <span className="text-white font-black text-[11px]">
                            ${(focusedLevel.dollars / 1e9).toFixed(2)}B
                          </span>
                        </div>
                        <div className="bg-zinc-950/80 border border-zinc-900 p-2.5 rounded">
                          <span className="text-zinc-550 uppercase font-black block text-[7.5px] tracking-wider mb-0.5">REGRESSION POWER</span>
                          <span className="text-white font-black text-[11px]">
                            {focusedLevel.strength}%
                          </span>
                        </div>
                      </div>

                      {/* Delta decay metric */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[8px] text-zinc-550 font-bold uppercase">
                          <span>Delta Hedging Speed</span>
                          <span className="text-zinc-400">{focusedLevel.strength > 75 ? 'FAST DECAY' : 'STABILIZED'}</span>
                        </div>
                        <div className="w-full bg-black h-1 rounded-full overflow-hidden mt-1 relative">
                          <motion.div 
                            className={`h-full bg-gradient-to-r ${
                              focusedLevel.type === 'support' ? 'from-purple-600 to-fuchsia-555' : focusedLevel.type === 'resistance' ? 'from-yellow-400 to-amber-500' : 'from-cyan-400 to-emerald-450'
                            }`}
                            animate={{ width: `${focusedLevel.strength}%` }}
                            transition={{ duration: 1.2, ease: "easeInOut" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {focusedLevel.strength < 40 && (
                    <div className="mt-4 p-3 bg-rose-950/15 border border-rose-500/20 rounded-md flex gap-2 text-left relative z-10">
                      <AlertTriangle className="w-4 h-4 text-rose-450 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <h4 className="text-[9.5px] font-black text-rose-400 uppercase">LIQUIDITY AIR POCKET ALERT</h4>
                        <p className="text-[8.5px] text-rose-300/80 font-sans leading-snug">
                          Positioning vacuum detected. Standard market flows may experience sudden slippage if spot enters this zone.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-zinc-950 pt-4 mt-auto flex items-center justify-between text-[8px] text-zinc-650 uppercase font-bold relative z-10 w-full">
                    <span className="flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-zinc-600" />
                      Click map to inspect level
                    </span>
                    <span className="text-[#00F0FF] group-hover:underline font-black transition-all shrink-0">
                      VIEW MATRIX →
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeSection === 'matrix' && (
            <motion.div
              key="matrix"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="w-full bg-[#050505] border border-zinc-900 rounded-xl p-5 text-left shadow-2xl relative overflow-hidden"
            >
              <div className="border-b border-zinc-900 pb-3 mb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    DEALER POSITIONING MATRIX
                  </h3>
                  <p className="text-[8.5px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">
                    Tabular exposure inventory logs, sorted by option strike.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[9px] bg-black border border-zinc-900 px-3 py-1 rounded">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                  <span className="text-zinc-550">CALLS (+GEX)</span>
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full ml-2" />
                  <span className="text-zinc-550">PUTS (-GEX)</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px] font-mono text-zinc-400">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-555 uppercase tracking-widest text-[8px] font-bold">
                      <th className="pb-2.5">STRIKE PRICE</th>
                      <th className="pb-2.5">EXPOSURE VALUE</th>
                      <th className="pb-2.5">EXPOSURE DIRECTION</th>
                      <th className="pb-2.5">PROBABILITY DENSITY</th>
                      <th className="pb-2.5 text-right font-black">NOTIONAL MAGNITUDE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {levels.map((lvl, idx) => {
                      const info = getLevelInfo(lvl);
                      const isCallSide = lvl.type === 'resistance';
                      const isPutSide = lvl.type === 'support';
                      
                      return (
                        <tr 
                          key={idx} 
                          className={`hover:bg-zinc-950/80 transition-colors group cursor-pointer ${
                            lvl.strike === activeFocusedStrike ? 'bg-zinc-950/50' : ''
                          }`}
                          onClick={() => {
                            setFocusedStrike(lvl.strike);
                            setActiveSection('radar');
                          }}
                        >
                          <td className="py-3 font-black text-white group-hover:text-cyan-400 transition-colors">
                            {lvl.strike}
                          </td>
                          <td className={`py-3 font-bold ${
                            isCallSide ? 'text-yellow-400' : isPutSide ? 'text-purple-400' : 'text-cyan-400'
                          }`}>
                            ${(lvl.dollars / 1e9).toFixed(2)}B
                          </td>
                          <td className="py-3 uppercase text-[9px] font-semibold">
                            {info.name}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-24 bg-black h-1.5 rounded-full overflow-hidden border border-zinc-900">
                                <div 
                                  className={`h-full bg-gradient-to-r ${
                                    isCallSide ? 'from-yellow-400 to-amber-500' : isPutSide ? 'from-purple-600 to-fuchsia-500' : 'from-cyan-400 to-emerald-450'
                                  }`} 
                                  style={{ width: `${lvl.strength}%` }} 
                                />
                              </div>
                              <span className="text-zinc-400">{lvl.strength}%</span>
                            </div>
                          </td>
                          <td className="py-3 text-right font-bold text-white">
                            ${(lvl.dollars * 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeSection === 'story' && (
            <motion.div
              key="story"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* COMMENTARY FEED (7 columns) */}
              <div className="lg:col-span-7 bg-[#050505] border border-zinc-900 rounded-xl p-5 text-left shadow-2xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-zinc-900 pb-2">
                    <span className="text-[7.5px] text-zinc-550 uppercase tracking-widest font-black block">COGNITIVE SUMMARY</span>
                    <h3 className="text-[11px] font-black text-white uppercase tracking-wider mt-0.5">
                      Live Market Story & Commentary Feed
                    </h3>
                  </div>

                  {serverState?.deep_intelligence?.commentary && serverState.deep_intelligence.commentary.length > 0 ? (
                    <div className="space-y-3 font-sans text-[11px] leading-relaxed text-zinc-400">
                      {serverState.deep_intelligence.commentary.map((point: string, i: number) => (
                        <div key={i} className="flex gap-3 items-start bg-zinc-950/45 p-3 rounded-lg border border-zinc-900/40 hover:border-zinc-850 transition-colors">
                          <span className="text-cyan-400 shrink-0 mt-1">●</span>
                          <p className="leading-relaxed">{point}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] leading-relaxed text-zinc-400 font-sans p-3 bg-zinc-950/40 rounded-lg border border-zinc-900/40">
                      The {selectedAsset.ticker} spot price is currently tracking inside an institutional hedging zone. Overhead options exposure reveals a major resistance barrier centering on OTM calls. 
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-950 flex items-center gap-2 text-[9px] text-zinc-550 mt-6 uppercase font-bold">
                  <ShieldAlert className="w-4 h-4 text-zinc-550" />
                  <span>Inventory calibration verified on multi-timeframe CME options data feeds</span>
                </div>
              </div>

              {/* CONTEXT INDICATORS & SKEW (5 columns) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-[#050505] border border-zinc-900 rounded-xl p-5 text-left shadow-2xl space-y-4">
                  <div className="border-b border-zinc-900 pb-2">
                    <span className="text-[7.5px] text-zinc-550 uppercase tracking-widest font-black block">DECISION ENGINE CONTEXT</span>
                    <h3 className="text-[11px] font-black text-white uppercase tracking-wider mt-0.5">
                      Context Indicators
                    </h3>
                  </div>

                  <div className="space-y-3 font-mono text-[10px]">
                    {/* NYSE CLOSE COUNTDOWN */}
                    <div className="p-3 bg-black border border-zinc-900 rounded-md space-y-1 bg-gradient-to-r from-black to-zinc-950">
                      <div className="flex justify-between items-center text-[7.5px] text-zinc-550 font-bold uppercase">
                        <span>NYSE Market State</span>
                        <span className={marketState.open ? 'text-[#00ff88]' : 'text-amber-500'}>
                          {marketState.open ? 'OPEN' : 'CLOSED'}
                        </span>
                      </div>
                      <div className="text-base font-black text-white tracking-widest">
                        {marketState.open ? marketState.closeIn : marketState.openIn}
                      </div>
                      <div className="text-[7.5px] text-zinc-650 uppercase font-black">
                        {marketState.open ? 'COUNTDOWN TO CLOSING BELL' : 'COUNTDOWN TO OPENING BELL'}
                      </div>
                    </div>

                    {/* HEURISTIC VOL ANALYSIS */}
                    <div className="space-y-2.5 pt-1.5 text-[10.5px]">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-950">
                        <span className="text-zinc-500 text-[8.5px] uppercase">G Greeks State</span>
                        <span className={`font-bold font-mono ${liveMetrics.volState === 'EXPANDED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {liveMetrics.volState === 'EXPANDED' ? 'EXPANDING' : 'DAMPENED'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-950">
                        <span className="text-zinc-500 text-[8.5px] uppercase">Market Flow Rate</span>
                        <span className="text-zinc-300 font-bold">
                          {serverState?.metricsV11?.flow?.flowRate 
                            ? `${serverState.metricsV11.flow.flowRate.toFixed(1)} / s` 
                            : '14.2 / s'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-950">
                        <span className="text-zinc-500 text-[8.5px] uppercase">Decision Score</span>
                        <span className="text-[#4f8cff] font-bold">
                          {serverState?.trade_health || activeContract?.health || 88}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
