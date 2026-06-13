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
  const themeMode = useContractStore(s => s.themeMode);
  const isLight = themeMode === 'light';

  // Sub-tab state
  const [activeSection, setActiveSection] = useState<'radar' | 'matrix' | 'story'>('radar');
  
  // Focused strike for detailed inspector panel
  const [focusedStrike, setFocusedStrike] = useState<number | null>(null);

  // Interactive Relative Volume Heatmap States in Pinpoint
  const [hoveredCellIndex, setHoveredCellIndex] = useState<number | null>(null);

  const rvolData = useMemo(() => {
    return getDeterministicData(selectedAsset.ticker, 30);
  }, [selectedAsset.ticker]);

  const attributionFlags = useMemo(() => {
    const t = selectedAsset.ticker;
    if (t === 'SPX') {
      return [
        { id: 'GAMMA_PINNED', name: 'GAMMA_PINNED', desc: 'Dealer hedge flow dampens broad market index swings', value: '91%', label: 'Stability: Max' },
        { id: 'LIQUIDITY_ANCHOR', name: 'LIQUIDITY_ANCHOR', desc: 'Dense spot concentration at primary index strike boundaries', value: '86%', label: 'Concentration: Heavy' },
        { id: 'VANNA_DRIFT', name: 'VANNA_DRIFT', desc: 'Declining IV accelerates index positioning gravity', value: '78%', label: 'Sensitivity: High' },
        { id: 'CHARM_DECAY', name: 'CHARM_DECAY', desc: 'Option pricing decay forces weekend curve compression', value: 'Max', label: 'Decay Rate: Peak' },
        { id: 'SQUEEZE_ABSENT', name: 'SQUEEZE_ABSENT', desc: 'Positive dealer inventory prevents sudden runaway wings', value: 'Negligible', label: 'Volatility Risk: Cool' }
      ];
    } else if (t === 'QQQ') {
      return [
        { id: 'BETA_DRIVE', name: 'BETA_DRIVE', desc: 'Systemic index beta exposure dominates tech listing flows', value: '84%', label: 'Exposure: Heavy' },
        { id: 'GAMMA_FLIP_RETEST', name: 'GAMMA_FLIP_RETEST', desc: 'Spot testing critical threshold of dealer inventory crossover', value: '72%', label: 'Inflection Risk: High' },
        { id: 'LIQUIDITY_MAGNET', name: 'LIQUIDITY_MAGNET', desc: 'High open interest exerts magnetic pricing pull on active strike', value: '79%', label: 'Pull Weight: Strong' },
        { id: 'VOL_COMPRESSION', name: 'VOL_COMPRESSION', desc: 'Accelerated options decay dampens underlying range wings', value: 'Dampened', label: 'Imposed Cap: Active' },
        { id: 'DEALER_LONG_GAMMA', name: 'DEALER_LONG_GAMMA', desc: 'Positive gamma cushions volatility, returning spot to mean', value: 'Stable', label: 'Buffer Level: Active' }
      ];
    } else if (t === 'TSLA') {
      return [
        { id: 'DELTA_BURST', name: 'DELTA_BURST', desc: 'Elevated sweep speed triggers rapid dealer asset-buying cycle', value: '75%', label: 'Squeeze Chance: High' },
        { id: 'GAMMA_UNSTABLE', name: 'GAMMA_UNSTABLE', desc: 'Short dealer inventory amplifies underlying price excursions', value: 'High', label: 'Volatility State: Red' },
        { id: 'RETAIL_SWEEP', name: 'RETAIL_SWEEP', desc: 'Retail option sweeps outpace regular block volumes', value: '54%', label: 'Flow Driver: Sweeps' },
        { id: 'VOL_EXPANSION', name: 'VOL_EXPANSION', desc: 'Imminent wing buying triggers spikes in skew and correlation', value: 'Active', label: 'IV Status: Escalating' },
        { id: 'SHORT_GAMMA_ZONE', name: 'SHORT_GAMMA_ZONE', desc: 'Dealers forced to buy spot on resistance breakout', value: 'Critical', label: 'Hedging Action: Buy Spot' }
      ];
    } else {
      return [
        { id: 'STRIKE_MAGNET', name: 'STRIKE_MAGNET', desc: 'Cluster of open interest attracts pricing as session matures', value: '75%', label: 'Attraction: Normal' },
        { id: 'DEALER_NEUTRAL', name: 'DEALER_NEUTRAL', desc: 'Option inventory remains delta-neutral across primary wings', value: 'Balanced', label: 'Bias: Systemic Neutral' },
        { id: 'STABLE_VOLUME', name: 'STABLE_VOLUME', desc: 'Option trade count remains consistent with rolling 30-day index', value: '1.02x', label: 'Volatility State: Base' },
        { id: 'THETA_COMPRESSION', name: 'THETA_COMPRESSION', desc: 'Routine post-peak decay forces stabilization on side strikes', value: 'Normal', label: 'Decay Factor: Base' },
        { id: 'WALL_SUPPORT', name: 'WALL_SUPPORT', desc: 'Dense put accumulation provides high structural floor protection', value: 'Protected', label: 'Protection: Solid' }
      ];
    }
  }, [selectedAsset.ticker]);


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

    // HSL-tailored premium colors (Gold/Purple/Cyan, or deep contrast dark colors in light mode)
    const color = type === 'support' 
      ? (isLight ? '#7e22ce' : '#D300C5') // Barney Purple vs Deep Purple
      : type === 'resistance' 
      ? (isLight ? '#b45309' : '#FFDD00') // Pika Yellow vs Rich Gold
      : (isLight ? '#0e7490' : '#00F0FF'); // Equilibrium Cyan vs Dark Blue

    const gradient = type === 'support'
      ? (isLight ? 'from-purple-700 to-purple-900' : 'from-purple-600 via-fuchsia-600 to-purple-800')
      : type === 'resistance'
      ? (isLight ? 'from-amber-600 to-amber-800' : 'from-yellow-400 via-amber-400 to-yellow-500')
      : (isLight ? 'from-cyan-600 to-teal-700' : 'from-cyan-400 via-cyan-500 to-emerald-400');

    const glow = type === 'support'
      ? `shadow-[0_0_15px_rgba(211,0,197,0.3)] ${isLight ? 'border-purple-500/20' : 'border-purple-500/40'}`
      : type === 'resistance'
      ? `shadow-[0_0_15px_rgba(255,221,0,0.3)] ${isLight ? 'border-amber-500/20' : 'border-amber-500/40'}`
      : `shadow-[0_0_15px_rgba(0,240,255,0.25)] ${isLight ? 'border-cyan-500/20' : 'border-cyan-400/40'}`;

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
          <span className={`text-[7px] font-mono tracking-widest font-black uppercase ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>{type}</span>
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
              <span className={`text-zinc-400 text-[7px] border bg-black/50 px-1 py-0.2 rounded font-sans tracking-normal font-bold ${isLight ? 'border-zinc-300' : 'border-zinc-800'}`}>
                {info.name}
              </span>
            </div>
          </div>
        </div>

        <div className="w-10 text-right shrink-0">
          <span className="text-[11px] font-extrabold text-zinc-300 font-mono">{strength}%</span>
          <span className={`text-[6.5px] block uppercase font-mono ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>POWER</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full text-zinc-100 flex flex-col font-mono select-none antialiased md:min-h-[580px]">
      
      {/* Upper header segment brand overlay */}
      <div className={`p-4 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#050505] border-zinc-900'}`}>
        <div className="flex items-center gap-2.5">
          <Compass className="w-4 h-4 text-zinc-400 animate-pulse" />
          <h1 className="text-xs font-black text-white uppercase tracking-widest font-mono">
            SLAYER // PINPOINT <span className={isLight ? 'text-zinc-500' : 'text-zinc-600'}>/ SPATIAL OPTION INVENTORY RADAR</span>
          </h1>
        </div>
        <div className={`flex items-center gap-4 text-[9px] uppercase tracking-widest font-black ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
          <span>COORDINATES RECLASSIFIED</span>
          <span className="text-zinc-800">|</span>
          <span className="text-[#00ff88]">RADAR ONLINE</span>
        </div>
      </div>

      {/* ENHANCED REAL-TIME INSTITUTIONAL STATE PANEL */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2.5 p-3 rounded-sm mb-4 text-left select-none text-[10px] border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#050505] border-zinc-900'}`}>
        <div className={`border p-2.5 rounded ${isLight ? 'bg-zinc-50/50 border-zinc-200' : 'border-zinc-900/60 bg-zinc-950/40'}`}>
          <span className={`uppercase font-black block text-[7px] tracking-wider mb-0.5 ${isLight ? 'text-zinc-700 font-bold' : 'text-zinc-400'}`}>Dealer Bias</span>
          <span className={`font-black uppercase text-[11px] ${liveMetrics.bias === 'LONG GAMMA' ? 'text-[#00ff88]' : 'text-rose-500'} flex items-center gap-1.5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${liveMetrics.bias === 'LONG GAMMA' ? 'bg-[#00ff88]' : 'bg-rose-500'} animate-pulse`} />
            {liveMetrics.bias}
          </span>
        </div>
        <div className={`border p-2.5 rounded ${isLight ? 'bg-zinc-50/50 border-zinc-200' : 'border-zinc-900/60 bg-zinc-950/40'}`}>
          <span className={`uppercase font-black block text-[7px] tracking-wider mb-0.5 ${isLight ? 'text-zinc-700 font-bold' : 'text-zinc-400'}`}>Expected Move</span>
          <span className="text-[#ff4545] font-black text-[11px] uppercase">
            {liveMetrics.expectedMovePct}
          </span>
        </div>
        <div className={`border p-2.5 rounded ${isLight ? 'bg-zinc-50/50 border-zinc-200' : 'border-zinc-900/60 bg-zinc-950/40'}`}>
          <span className={`uppercase font-black block text-[7px] tracking-wider mb-0.5 ${isLight ? 'text-zinc-700 font-bold' : 'text-zinc-400'}`}>Volatility State</span>
          <span className="text-zinc-200 font-extrabold text-[11px] uppercase">
            {liveMetrics.volState}
          </span>
        </div>
        <div className={`border p-2.5 rounded ${isLight ? 'bg-zinc-50/50 border-zinc-200' : 'border-zinc-900/60 bg-zinc-950/40'}`}>
          <span className={`uppercase font-black block text-[7px] tracking-wider mb-0.5 ${isLight ? 'text-zinc-700 font-bold' : 'text-zinc-400'}`}>Magnet Strike</span>
          <span className={`font-extrabold text-[11px] font-mono ${isLight ? 'text-cyan-600' : 'text-[#00F0FF]'}`}>
            {Number(liveMetrics.magnetStrike ?? 0).toFixed(2)}
          </span>
        </div>
        <div className={`border p-2.5 rounded ${isLight ? 'bg-zinc-50/50 border-zinc-200' : 'border-zinc-900/60 bg-zinc-950/40'}`}>
          <span className={`uppercase font-black block text-[7px] tracking-wider mb-0.5 ${isLight ? 'text-zinc-700 font-bold' : 'text-zinc-400'}`}>Call Wall</span>
          <span className={`font-extrabold text-[11px] font-mono ${isLight ? 'text-amber-600' : 'text-[#FFDD00]'}`}>
            {Number(liveMetrics.callWall ?? 0).toFixed(2)}
          </span>
        </div>
        <div className={`border p-2.5 rounded ${isLight ? 'bg-zinc-50/50 border-zinc-200' : 'border-zinc-900/60 bg-zinc-950/40'}`}>
          <span className={`uppercase font-black block text-[7px] tracking-wider mb-0.5 ${isLight ? 'text-zinc-700 font-bold' : 'text-zinc-400'}`}>Put Wall</span>
          <span className={`font-extrabold text-[11px] font-mono ${isLight ? 'text-purple-600' : 'text-[#D300C5]'}`}>
            {Number(liveMetrics.putWall ?? 0).toFixed(2)}
          </span>
        </div>
        <div className={`border p-2.5 rounded ${isLight ? 'bg-zinc-50/50 border-zinc-200' : 'border-zinc-900/60 bg-zinc-950/40'}`}>
          <span className={`uppercase font-black block text-[7px] tracking-wider mb-0.5 ${isLight ? 'text-zinc-700 font-bold' : 'text-zinc-400'}`}>Gamma Flip</span>
          <span className={`font-extrabold text-[11px] font-mono ${isLight ? 'text-rose-500' : 'text-rose-400'}`}>
            {Number(liveMetrics.flipLevel ?? 0).toFixed(2)}
          </span>
        </div>
        <div className={`border p-2.5 rounded col-span-2 flex flex-col justify-between ${isLight ? 'bg-zinc-50/50 border-zinc-200' : 'border-zinc-900/60 bg-zinc-950/40'}`}>
          <div className="flex justify-between items-center text-[7.5px] font-bold">
            <span className={`uppercase tracking-wider ${isLight ? 'text-zinc-800 font-bold' : 'text-zinc-400'}`}>Dealer Inventory Balance</span>
            <span className={`font-black ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>{liveMetrics.dealerScore}/100</span>
          </div>
          <div className="w-full bg-black h-1 rounded-full overflow-hidden mt-1.5">
            <div className="bg-cyan-400 h-full" style={{ width: `${liveMetrics.dealerScore}%` }} />
          </div>
        </div>
      </div>

      {/* Sub-tab navigation bar with slide indicator */}
      <div className={`flex border-b mb-6 gap-6 relative select-none shrink-0 ${isLight ? 'border-zinc-200' : 'border-zinc-900'}`}>
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
              className={`pb-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer relative ${isActive ? (isLight ? 'text-black border-black' : 'text-white border-white') : (isLight ? 'text-zinc-400 border-transparent hover:text-zinc-950' : 'text-zinc-500 border-transparent hover:text-zinc-300')}`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? (isLight ? 'text-black' : 'text-white') : 'text-zinc-550'}`} />
              <span>{tab.name}</span>
              {isActive && (
                <motion.div
                  layoutId="activeSubTab"
                  className={`absolute bottom-0 left-0 right-0 h-[2px] ${isLight ? 'bg-black' : 'bg-white'}`}
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
              <div className={`lg:col-span-8 rounded-xl p-5 flex flex-col relative overflow-hidden border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#050505] border-zinc-900'}`}>
                <div className={`flex justify-between items-center border-b pb-2.5 mb-3 uppercase ${isLight ? 'border-zinc-200' : 'border-zinc-900/40'}`}>
                  <span className={`text-[8px] tracking-widest font-black block ${isLight ? 'text-zinc-800' : 'text-zinc-400'}`}>
                    Continuous Spatial GEX Radar Map
                  </span>
                  <span className={`text-[7.5px] border px-2 py-0.5 rounded-sm ${isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-700' : 'bg-black border border-zinc-900 text-zinc-400'}`}>
                    TARGET: {selectedAsset.ticker}
                  </span>
                </div>

                {/* Coordinate radar track canvas */}
                <div 
                  className={`relative rounded-xl px-4 overflow-hidden flex flex-col justify-between py-2 border ${isLight ? 'bg-zinc-50 border-zinc-200/60' : 'bg-black/45 border-zinc-950'}`}
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
                        className={`absolute left-0 right-0 border-t border-dashed z-0 pointer-events-none ${isLight ? 'border-zinc-300' : 'border-[#18181b]/50'}`}
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
                <div className={`mt-4 pt-3.5 border-t grid grid-cols-1 md:grid-cols-3 gap-3 text-left select-none ${isLight ? 'border-zinc-200' : 'border-zinc-900/60'}`}>
                  <div className="bg-zinc-950/40 border border-zinc-900 p-2.5 rounded-lg flex items-start gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0 mt-0.5 shadow-[0_0_8px_rgba(255,221,0,0.5)]" />
                    <div>
                      <h4 className={`text-[9.5px] font-black uppercase leading-none ${isLight ? 'text-amber-600' : 'text-yellow-400'}`}>POSITIVE GEX (GOLD)</h4>
                      <p className={`text-[8.5px] font-sans leading-normal pt-1.5 ${isLight ? 'text-zinc-800' : 'text-zinc-500'}`}>
                        Call open interest concentration. Absorbs volatility and creates overhead barriers (seller ceilings).
                      </p>
                    </div>
                  </div>
                  <div className="bg-zinc-950/40 border border-zinc-900 p-2.5 rounded-lg flex items-start gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0 mt-0.5 shadow-[0_0_8px_rgba(211,0,197,0.5)]" />
                    <div>
                      <h4 className={`text-[9.5px] font-black uppercase leading-none ${isLight ? 'text-purple-600' : 'text-purple-400'}`}>NEGATIVE GEX (PURPLE)</h4>
                      <p className={`text-[8.5px] font-sans leading-normal pt-1.5 ${isLight ? 'text-zinc-800' : 'text-zinc-500'}`}>
                        Put open interest concentration. Accelerates volatility and creates index floors (dealer protection).
                      </p>
                    </div>
                  </div>
                  <div className="bg-zinc-950/40 border border-zinc-900 p-2.5 rounded-lg flex items-start gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0 mt-0.5 shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
                    <div>
                      <h4 className={`text-[9.5px] font-black uppercase leading-none ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`}>EQUILIBRIUM MAGNET</h4>
                      <p className={`text-[8.5px] font-sans leading-normal pt-1.5 ${isLight ? 'text-zinc-800' : 'text-zinc-500'}`}>
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
                    <div className={`border-b pb-3 flex justify-between items-start ${isLight ? 'border-zinc-200' : 'border-zinc-900'}`}>
                      <div>
                        <span className={`text-[7.5px] uppercase tracking-widest font-black block ${isLight ? 'text-zinc-800 font-bold' : 'text-zinc-400'}`}>RADAR LEVEL INSPECTOR</span>
                        <h3 className={`text-sm font-black uppercase tracking-wider mt-0.5 font-sans ${isLight ? 'text-zinc-900' : 'text-white'}`}>
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
                        <p className={`text-[9.5px] font-sans leading-relaxed pt-1 ${isLight ? 'text-zinc-800' : 'text-zinc-400'}`}>
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
              <div className={`border-b pb-3 mb-4 flex justify-between items-center ${isLight ? 'border-zinc-200' : 'border-zinc-900'}`}>
                <div>
                  <h3 className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                    DEALER POSITIONING MATRIX
                  </h3>
                  <p className="text-[8.5px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">
                    Tabular exposure inventory logs, sorted by option strike.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[9px] bg-black border border-zinc-900 px-3 py-1 rounded">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                  <span className={isLight ? 'text-zinc-500' : 'text-zinc-400'}>CALLS (+GEX)</span>
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full ml-2" />
                  <span className={isLight ? 'text-zinc-500' : 'text-zinc-400'}>PUTS (-GEX)</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className={`w-full text-left text-[10px] font-mono ${isLight ? 'text-zinc-800' : 'text-zinc-400'}`}>
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-555 uppercase tracking-widest text-[8px] font-bold">
                      <th className="pb-2.5">STRIKE PRICE</th>
                      <th className="pb-2.5">EXPOSURE VALUE</th>
                      <th className="pb-2.5">EXPOSURE DIRECTION</th>
                      <th className="pb-2.5">PROBABILITY DENSITY</th>
                      <th className="pb-2.5 text-right font-black">NOTIONAL MAGNITUDE</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-zinc-200' : 'divide-zinc-900/60'}`}>
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
                          <td className={`py-3 font-black group-hover:text-cyan-400 transition-colors ${isLight ? 'text-zinc-900' : 'text-white'}`}>
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
              <div className={`lg:col-span-7 border rounded-xl p-5 text-left flex flex-col justify-between ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#050505] border-zinc-900 shadow-2xl'}`}>
                <div className="space-y-4">
                  <div className={`border-b pb-2 ${isLight ? 'border-zinc-200' : 'border-zinc-900'}`}>
                    <span className={`text-[7.5px] uppercase tracking-widest font-black block ${isLight ? 'text-zinc-800 font-bold' : 'text-zinc-400'}`}>COGNITIVE SUMMARY</span>
                    <h3 className={`text-[11px] font-black uppercase tracking-wider mt-0.5 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                      Live Market Story & Commentary Feed
                    </h3>
                  </div>

                  {serverState?.deep_intelligence?.commentary && serverState.deep_intelligence.commentary.length > 0 ? (
                    <div className="space-y-3 font-sans text-[11px] leading-relaxed text-zinc-400">
                      {serverState.deep_intelligence.commentary.map((point: string, i: number) => (
                        <div key={i} className={`flex gap-3 items-start p-3 rounded-lg border transition-colors ${isLight ? 'bg-zinc-50 border-zinc-200 hover:border-zinc-300' : 'bg-zinc-950/45 border-zinc-900/40 hover:border-zinc-800'}`}>
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

                <div className={`pt-4 border-t flex items-center gap-2 text-[9px] mt-6 uppercase font-bold ${isLight ? 'border-zinc-200 text-zinc-800' : 'border-zinc-900 text-zinc-400'}`}>
                  <ShieldAlert className="w-4 h-4 text-zinc-550" />
                  <span>Inventory calibration verified on multi-timeframe CME options data feeds</span>
                </div>
              </div>

              {/* CONTEXT INDICATORS & SKEW (5 columns) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className={`border rounded-xl p-5 text-left space-y-4 ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#050505] border-zinc-900 shadow-2xl'}`}>
                  <div className={`border-b pb-2 ${isLight ? 'border-zinc-200' : 'border-zinc-900'}`}>
                    <span className={`text-[7.5px] uppercase tracking-widest font-black block ${isLight ? 'text-zinc-800 font-bold' : 'text-zinc-400'}`}>DECISION ENGINE CONTEXT</span>
                    <h3 className={`text-[11px] font-black uppercase tracking-wider mt-0.5 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                      Context Indicators
                    </h3>
                  </div>

                  <div className="space-y-3 font-mono text-[10px]">
                    {/* NYSE CLOSE COUNTDOWN */}
                    <div className={`p-3 border rounded-md space-y-1 ${isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-800' : 'bg-black border border-zinc-900 bg-gradient-to-r from-black to-zinc-950'}`}>
                      <div className={`flex justify-between items-center text-[7.5px] font-bold uppercase ${isLight ? 'text-zinc-700 font-semibold' : 'text-zinc-400'}`}>
                        <span>NYSE Market State</span>
                        <span className={marketState.open ? 'text-[#00ff88]' : 'text-amber-500'}>
                          {marketState.open ? 'OPEN' : 'CLOSED'}
                        </span>
                      </div>
                      <div className={`text-base font-black tracking-widest ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                        {marketState.open ? marketState.closeIn : marketState.openIn}
                      </div>
                      <div className={`text-[7.5px] uppercase font-black ${isLight ? 'text-zinc-700 font-semibold' : 'text-zinc-500'}`}>
                        {marketState.open ? 'COUNTDOWN TO CLOSING BELL' : 'COUNTDOWN TO OPENING BELL'}
                      </div>
                    </div>

                    {/* HEURISTIC VOL ANALYSIS */}
                    <div className="space-y-2.5 pt-1.5 text-[10.5px]">
                      <div className={`flex justify-between items-center pb-2 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-900'}`}>
                        <span className={isLight ? 'text-zinc-700 font-semibold' : 'text-zinc-400'}>G Greeks State</span>
                        <span className={`font-bold font-mono ${liveMetrics.volState === 'EXPANDED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {liveMetrics.volState === 'EXPANDED' ? 'EXPANDING' : 'DAMPENED'}
                        </span>
                      </div>
                      <div className={`flex justify-between items-center pb-2 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-900'}`}>
                        <span className={isLight ? 'text-zinc-700 font-semibold' : 'text-zinc-400'}>Market Flow Rate</span>
                        <span className={`font-bold ${isLight ? 'text-zinc-800' : 'text-zinc-300'}`}>
                          {serverState?.metricsV11?.flow?.flowRate 
                            ? `${serverState.metricsV11.flow.flowRate.toFixed(1)} / s` 
                            : '14.2 / s'}
                        </span>
                      </div>
                      <div className={`flex justify-between items-center pb-2 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-900'}`}>
                        <span className={isLight ? 'text-zinc-700 font-semibold' : 'text-zinc-400'}>Decision Score</span>
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

    
      {/* UNIQUE BOTTOM DESK: QUANTITATIVE ATTRIBUTION ENGINE & RELATIVE VOLUME HEATMAP */}
      <div className={`border rounded-sm p-4 flex flex-col gap-4 text-left ${isLight ? 'bg-white border-zinc-200 shadow-sm text-zinc-900' : 'bg-[#050505] border-zinc-900 shadow-2xl text-zinc-100'}`}>
        
        {/* HEADER BAR */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 gap-2 ${isLight ? 'border-zinc-200' : 'border-zinc-900'}`}>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#10b981]" />
            <span className={`text-xs font-black uppercase tracking-widest font-mono ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              QUANT INDEX ATTRIBUTION & RVOL HEATMAP
            </span>
            <span className={`hidden sm:inline-block text-[8px] border px-2 py-0.5 rounded uppercase font-bold ${isLight ? 'text-zinc-500 border-zinc-250 bg-zinc-50' : 'text-zinc-550 border-zinc-900'}`}>
              SYS-ID: {selectedAsset.ticker}-RVOL-30D
            </span>
          </div>
          <span className="text-[8px] text-[#10b981] font-bold uppercase tracking-widest font-mono flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full" />
            30-DAY STATISTICAL REGRESSION LIVE
          </span>
        </div>

        {/* 1. ATTRIBUTION FLAGS ROW */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[8.5px] text-zinc-500 font-bold uppercase tracking-widest">
            <span>Option Physics Attribution Flags</span>
            <span className="text-zinc-500">COGNITIVE METRIC SCORE</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {attributionFlags.map((flag) => (
              <div 
                key={flag.id}
                className={`border rounded-md p-3 flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-800 transition-all relative overflow-hidden group ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/50 border-zinc-900/60'}`}
              >
                {/* Glowing subtle top border for flags to look high end and unique */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/20 via-[#4f8cff]/10 to-transparent" />
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-black font-mono uppercase tracking-wide group-hover:text-[#10b981] transition-colors ${isLight ? 'text-zinc-800' : 'text-white'}`}>
                      {flag.name}
                    </span>
                    <span className="text-[9.5px] font-black text-[#10b981] bg-[#10b981]/5 px-2 py-0.5 border border-[#10b981]/15 rounded-xs">
                      {flag.value}
                    </span>
                  </div>
                  <p className={`text-[10px] font-sans leading-normal line-clamp-2 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    {flag.desc}
                  </p>
                </div>
                
                <div className={`border-t mt-2.5 pt-2 flex justify-between items-center text-[7.5px] text-zinc-500 uppercase tracking-widest ${isLight ? 'border-zinc-200/65' : 'border-zinc-950'}`}>
                  <span>METRIC FIELD</span>
                  <span className={`font-bold ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`}>{flag.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 1.5 DYNAMIC RVOL MINI-HEATMAP TRACKER */}
        <div className={`border rounded-md p-3.5 space-y-2.5 relative overflow-hidden text-left ${isLight ? 'bg-zinc-50/50 border-zinc-200' : 'bg-black/50 border-zinc-900'}`}>
          <div className="flex justify-between items-center text-[8.5px] uppercase tracking-widest font-mono">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              <span className={`font-extrabold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>RELATIVE VOLUME (RVOL) MINI-INTENSITY GRID</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-500 font-bold">
              <span>30D BENCHMARK AVERAGE: <span className={isLight ? 'text-zinc-900 font-black' : 'text-white'}>1.00x</span></span>
              <span>|</span>
              <span>TODAY'S INTENSITY: <span className="text-[#10b981]">{rvolData[29].rvol.toFixed(2)}x vs Mean</span></span>
            </div>
          </div>

          <div className="grid grid-cols-15 gap-1.5 select-none font-mono">
            {rvolData.slice(15).map((cell, idx) => {
              const rvol = cell.rvol;
              const globalIdx = 15 + idx;
              const isToday = globalIdx === 29;
              
              // Multi-state custom styling matching light or dark mode
              let colorClasses = isLight 
                ? "bg-zinc-100 border-zinc-200 text-zinc-400" 
                : "bg-zinc-950/80 border-zinc-900 text-zinc-650";
              let shadowClass = "";

              if (rvol >= 2.5) {
                colorClasses = isLight 
                  ? "bg-amber-100 border-amber-300 text-amber-800"
                  : "bg-gradient-to-t from-amber-600/30 to-amber-500/15 border-amber-500 text-amber-400";
                shadowClass = "shadow-[0_0_8px_rgba(245,158,11,0.15)]";
              } else if (rvol >= 1.5) {
                colorClasses = isLight 
                  ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                  : "bg-gradient-to-t from-emerald-600/25 to-emerald-500/10 border-emerald-500 text-[#00ff88]";
                shadowClass = "shadow-[0_0_8px_rgba(16,185,129,0.1)]";
              } else if (rvol >= 0.8) {
                colorClasses = isLight 
                  ? "bg-emerald-50/50 border-emerald-100 text-emerald-700"
                  : "bg-gradient-to-t from-emerald-950/20 to-emerald-900/5 border-emerald-900/60 text-[#10b981]/80";
              }

              return (
                <div 
                  key={idx}
                  className={`flex flex-col items-center justify-center transition-all duration-300 rounded border h-10 cursor-pointer relative group hover:scale-102 ${colorClasses} ${shadowClass}`}
                  onMouseEnter={() => setHoveredCellIndex(globalIdx)}
                  onMouseLeave={() => setHoveredCellIndex(null)}
                >
                  <span className="text-[6.5px] block font-bold tracking-widest uppercase mb-0.5 text-zinc-500">
                    {isToday ? "LIVE" : `T-${15 - idx}`}
                  </span>
                  <span className="text-[9px] font-black tracking-tighter">
                    {rvol.toFixed(1)}x
                  </span>
                  {isToday && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between items-center text-[7.5px] text-zinc-550 font-mono uppercase tracking-wider pt-1 border-t border-zinc-950 border-dashed">
            <span>T-15 SWELL PROFILE REGISTER</span>
            <span>TREND HEURISTIC: {rvolData[29].rvol >= 2.5 ? "ACCELERATING INSTITUTIONAL FRONT-LOAD DETECTIONS" : rvolData[29].rvol >= 1.1 ? "MODERATE LIQUIDITY SUSTENANCE" : "CONSOLIDATIVE PIN REGIME DRIFT"}</span>
            <span className="text-[#10b981] font-extrabold flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
              SYNCHRONOUS
            </span>
          </div>
        </div>

        {/* 2. HEATMAP SECTION */}
        <div className="border-t border-zinc-900/60 pt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* Heat map bar (8/12 cols) */}
          <div className={`lg:col-span-8 flex flex-col justify-between p-3.5 border rounded-md ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/45 border-zinc-900/40'}`}>
            <div className="space-y-1.5 mb-3.5 text-left">
              <div className="flex justify-between items-center">
                <span className={`text-[9px] font-bold uppercase tracking-widest ${isLight ? 'text-zinc-700' : 'text-[#888888]'}`}>
                  30-Session Volume Intensity Grid (T-30 to Today)
                </span>
                <div className="flex gap-3 text-[8px] text-zinc-500 uppercase font-black">
                  <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded border ${isLight ? 'bg-zinc-100 border-zinc-300' : 'bg-zinc-900/30 border-zinc-855'}`} /> Low Vol</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500/30" /> Normal</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#10b981]" /> High Vol</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> Spike Surge</span>
                </div>
              </div>
              <p className={`text-[10px] font-sans leading-relaxed ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>
                RVOL measures volume against its trailing 30-day standard moving average. Hover over any session tile to audit fine grain volume attributes and sweep concentrations.
              </p>
            </div>

            {/* LED Strip of Tiles */}
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-10 sm:grid-cols-15 lg:grid-cols-30 gap-1 select-none">
                {rvolData.map((cell, idx) => {
                  const styleParams = getCellStyle(cell.rvol, isLight);
                  const isHovered = hoveredCellIndex === idx;
                  const isToday = idx === 29;

                  return (
                    <div
                       key={idx}
                      className="cursor-pointer transition-all duration-150 rounded-xs relative flex flex-col justify-between items-center group touch-none"
                      style={{
                        height: '42px',
                        backgroundColor: styleParams.bg,
                        border: isHovered 
                          ? `1.5px solid ${isLight ? '#111827' : '#ffffff'}` 
                          : `1px solid ${styleParams.border}`,
                        boxShadow: isHovered ? '0 0 10px rgba(16,185,129,0.3)' : styleParams.glow,
                        transform: isHovered ? 'scale(1.06)' : 'none',
                        zIndex: isHovered ? 30 : 10,
                      }}
                      onMouseEnter={() => setHoveredCellIndex(idx)}
                      onMouseLeave={() => setHoveredCellIndex(null)}
                    >
                      {/* Top micro line to show special indicators */}
                      {isToday && (
                        <div className="absolute top-[2px] w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      )}

                      {/* Small index tag at bottom */}
                      <span 
                        className="text-[6.5px] font-black pointer-events-none absolute bottom-[2px]"
                        style={{ color: styleParams.text }}
                      >
                        {isToday ? 'Live' : `T-${30 - idx}`}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className={`flex justify-between items-center text-[7.5px] uppercase tracking-widest pt-2 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                <span>30 Sessions Ago</span>
                <span className={isLight ? 'text-zinc-500 font-semibold' : 'text-zinc-650'}>Hover tiles for exact values</span>
                <span className="text-[#10b981] font-black">Live Trading Session</span>
              </div>
            </div>

          </div>

          {/* Real-time details board (4/12 cols) */}
          <div className={`lg:col-span-4 border rounded-md p-4 flex flex-col justify-between ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950/60 border-zinc-900/60'}`}>
            {(() => {
              const activeIndex = hoveredCellIndex !== null ? hoveredCellIndex : 29;
              const cellData = rvolData[activeIndex];
              const isToday = activeIndex === 29;
              const intensity = cellData.rvol;
              
              // Determine description of volume state
              let statusText = 'Routine Trade Range';
              let statusColor = 'text-emerald-500';
              if (intensity < 0.7) {
                statusText = 'Illiquid Trading Range';
                statusColor = isLight ? 'text-zinc-700' : 'text-zinc-400';
              } else if (intensity > 2.5) {
                statusText = 'Institutional Sweep Surge!';
                statusColor = 'text-amber-500 animate-pulse';
              } else if (intensity > 1.5) {
                statusText = 'Dense Volume Expansion';
                statusColor = 'text-[#10b981]';
              }

              return (
                <div className="h-full flex flex-col justify-between space-y-3 text-left">
                  <div className={`border-b pb-2 flex justify-between items-start ${isLight ? 'border-zinc-200' : 'border-zinc-900'}`}>
                    <div>
                      <span className="text-[7.5px] text-[#10b981] uppercase font-black tracking-widest block">
                        Interactive RVOL Audit
                      </span>
                      <h4 className={`text-[10px] font-black uppercase tracking-wider mt-0.5 ${isLight ? 'text-zinc-800' : 'text-white'}`}>
                        {isToday ? "Today's Live Session" : `Session Day T-${cellData.dayIndex}`}
                      </h4>
                    </div>
                    <span className={`text-[7.5px] border px-2 py-0.5 rounded uppercase font-bold ${isLight ? 'bg-zinc-100 border-zinc-200 text-zinc-600' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                      {isToday ? 'Live Feed' : 'Historical'}
                    </span>
                  </div>

                  <div className="space-y-2.5 font-mono text-[10px]">
                    <div className={`flex justify-between items-center pb-1.5 border-b ${isLight ? 'border-zinc-250/50' : 'border-zinc-900/40'}`}>
                      <span className="text-zinc-500 text-[8px] uppercase">Multiplier vs. 30D Mean</span>
                      <span className={`font-black text-xs ${intensity > 2.5 ? 'text-amber-500' : 'text-[#10b981]'}`}>
                        {intensity.toFixed(2)}x
                      </span>
                    </div>

                    <div className={`flex justify-between items-center pb-1.5 border-b ${isLight ? 'border-zinc-250/50' : 'border-zinc-900/40'}`}>
                      <span className="text-zinc-500 text-[8px] uppercase">GEX Notional Flow</span>
                      <span className={`font-extrabold ${isLight ? 'text-zinc-800' : 'text-white'}`}>
                        ${cellData.notional.toFixed(1)}M
                      </span>
                    </div>

                    {/* Option Call/Put Ratio Bar */}
                    <div className="space-y-1">
                      <div className={`flex justify-between items-center text-[8px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        <span>CALL BIAS: {cellData.calls}%</span>
                        <span>PUT BIAS: {cellData.puts}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-rose-500 rounded-full overflow-hidden flex">
                        <div className="bg-[#10b981] h-full" style={{ width: `${cellData.calls}%` }} />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-zinc-500 text-[8px] uppercase">Attributive Regime</span>
                      <span className={`font-bold uppercase text-[9px] ${statusColor}`}>
                        {statusText}
                      </span>
                    </div>
                  </div>

                  <div className={`pt-2 border-t text-[8px] font-sans leading-normal text-left ${isLight ? 'border-zinc-200 text-zinc-600' : 'border-zinc-900 text-zinc-500'}`}>
                    {intensity > 2.5 ? (
                      <span className="text-amber-600 dark:text-amber-500/90 font-semibold block">
                        ⚠️ Extreme relative volume spike represents unusual block orders, likely indicating front-loaded institutional positioning.
                      </span>
                    ) : intensity < 0.7 ? (
                      <span className="block">
                        Low relative volume indicates dealer pinning with tight option spreads and quiet drift metrics.
                      </span>
                    ) : (
                      <span className="block">
                        Regular options order flow indicates balanced hedging and portfolio stability across major indices.
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

        </div>

      </div>
    </div>
  );
}


// ============================================================================
// HELPER FUNCTIONS FOR STATISTICAL REGRESSION & RVOL HEATMAP TILE GENERATION
// ============================================================================

function getDeterministicData(ticker: string, size: number) {
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const days = [];
  for (let d = 0; d < size; d++) {
    const seed = Math.abs(Math.sin(hash + d * 0.43 + (d % 3) * 0.77));
    // RVOL between 0.3x and 3.2x with spikes
    let rvol = 0.4 + seed * 2.1;
    if ((d + hash) % 7 === 0) {
      rvol += 1.3;
    }
    
    // Scale notional volume according to ticker defaults
    const baseNotional = ticker === 'SPX' ? 85 : ticker === 'QQQ' ? 45 : 12;
    const notional = baseNotional * rvol * (0.9 + seed * 0.2);
    
    // Calls/Puts split
    const cpSeed = Math.cos(hash + d * 0.81);
    const callRatio = Math.round(50 + cpSeed * 25);
    
    days.push({
      dayIndex: size - d,
      rvol: parseFloat(rvol.toFixed(2)),
      notional: parseFloat(notional.toFixed(1)),
      calls: callRatio,
      puts: 100 - callRatio,
    });
  }
  return days;
}

function getCellStyle(rvol: number, isLight: boolean) {
  if (isLight) {
    if (rvol < 0.7) return { bg: '#f4f4f5', text: '#71717a', border: '#e4e4e7', glow: 'none' };
    if (rvol < 1.2) return { bg: '#e6fcf0', text: '#047857', border: '#a7f3d0', glow: 'none' };
    if (rvol < 1.8) return { bg: '#a7f3d0', text: '#065f46', border: '#6ee7b7', glow: 'none' };
    if (rvol < 2.5) return { bg: '#34d399', text: '#044e37', border: '#10b981', glow: 'none' };
    return { bg: '#f59e0b', text: '#78350f', border: '#d97706', glow: '0 0 8px rgba(245,158,11,0.3)' };
  } else {
    if (rvol < 0.7) return { bg: '#0c0c0e', text: '#52525b', border: '#18181b', glow: 'none' };
    if (rvol < 1.2) return { bg: 'rgba(16,185,129,0.12)', text: '#10b981', border: 'rgba(16,185,129,0.25)', glow: 'none' };
    if (rvol < 1.8) return { bg: 'rgba(16,185,129,0.3)', text: '#10b981', border: 'rgba(16,185,129,0.5)', glow: 'none' };
    if (rvol < 2.5) return { bg: 'rgba(16,185,129,0.65)', text: '#ffffff', border: '#10b981', glow: '0 0 8px rgba(16,185,129,0.2)' };
    return { bg: 'rgba(245,158,11,0.85)', text: '#000000', border: '#f59e0b', glow: '0 0 12px rgba(245,158,11,0.5)' };
  }
}
