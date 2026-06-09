import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  Percent, 
  Activity
} from 'lucide-react';
import { AssetInfo } from '../types';
import { ASSET_LIST } from '../data';

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

// ==========================================
// BUG #10: OPPORTUNITY CARD (Individual Slides)
// ==========================================
interface OpportunityCardProps {
  item: any;
  tagText: string;
  tagColor: string;
  onSelect: () => void;
  key?: string;
}
export function OpportunityCard({ item, tagText, tagColor, onSelect }: OpportunityCardProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-[#050505] border border-zinc-900 hover:border-zinc-800 rounded-sm p-4.5 flex flex-col justify-between gap-4 shrink-0 w-[275px] font-mono shadow-xl text-left"
    >
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-white text-[11px] font-black uppercase bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded-xs">
            {item.asset.ticker} {item.strike}{item.isCall ? 'C' : 'P'}
          </span>
          <span className={`text-[7.5px] font-extrabold px-2 py-0.5 rounded-xs border uppercase ${tagColor}`}>
            {tagText}
          </span>
        </div>
        <p className="text-[10px] text-zinc-400 font-medium leading-relaxed uppercase">
          {item.narrative}
        </p>
      </div>

      <div className="border-t border-b border-zinc-950 py-3 text-[10.5px] space-y-1.5 bg-black/25 px-2 rounded-xs">
        <div className="flex justify-between">
          <span className="text-zinc-650 uppercase text-[8px]">Decision Score</span>
          <span className="font-extrabold text-white">{item.health} pts</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-650 uppercase text-[8px]">Expected P&L</span>
          <span className="font-bold text-emerald-400">{item.expectedMove}</span>
        </div>
      </div>

      <button
        onClick={onSelect}
        className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-[8.5px] text-white font-extrabold uppercase tracking-widest rounded-xs transition-all cursor-pointer"
      >
        Open Analysis →
      </button>
    </motion.div>
  );
}

// ==========================================
// BUG #10: OPPORTUNITY ROW (Horizontal Containers)
// ==========================================
interface OpportunityRowProps {
  children: React.ReactNode;
}
export function OpportunityRow({ children }: OpportunityRowProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
      {children}
    </div>
  );
}

export function DiscoveryView({
  systemScore,
  discovery,
  onSelectContract
}: DiscoveryViewProps) {
  
  const shelves = useMemo(() => {
    const spx = ASSET_LIST[0]; // SPX
    const ndx = ASSET_LIST[1]; // NDX
    const spy = ASSET_LIST[2]; // SPY
    const qqq = ASSET_LIST[3]; // QQQ

    // Shelf 1: HIGHEST CONVICTION
    const highestConviction = [
      { asset: spx, strike: 7620, isCall: true, health: 96, expectedMove: '+42%', status: 'Strengthening', narrative: 'Strong dealer buy wall backing this SPX node.' },
      { asset: spy, strike: 448, isCall: true, health: 93, expectedMove: '+36%', status: 'Improving', narrative: 'Unusually clean volume profile confirms call momentum.' },
      { asset: qqq, strike: 515, isCall: true, health: 91, expectedMove: '+29%', status: 'Supportive', narrative: 'Dealer block purchases confirm near-term floor.' }
    ];

    // Shelf 2: MOST IMPROVED
    const mostImproved = [
      { asset: ndx, strike: 18300, isCall: true, health: 89, expectedMove: '+55%', status: 'Accelerating', narrative: 'Rapid jump in scoring index over the last 15 minutes.' },
      { asset: qqq, strike: 512, isCall: true, health: 88, expectedMove: '+32%', status: 'Improving', narrative: 'Dealer short blocks have dissolved, freeing up room.' }
    ];

    // Shelf 3: MOST MISPRICED
    const mostMispriced = [
      { asset: spy, strike: 442, isCall: false, health: 85, expectedMove: '+24%', status: 'Neutral', narrative: 'Valuation curve points to an extreme temporary discount.' },
      { asset: spx, strike: 7650, isCall: true, health: 83, expectedMove: '+18%', status: 'Stabilizing', narrative: 'Priced exceptionally cheap relative to general spot move.' }
    ];

    // Shelf 4: NEAR INVALIDATION
    const nearInvalidation = [
      { asset: spx, strike: 7610, isCall: false, health: 48, expectedMove: '-15%', status: 'Falling', narrative: 'Slipped past main dealer GEX hedge floor. High alert.' },
      { asset: spy, strike: 440, isCall: false, health: 51, expectedMove: '-10%', status: 'Slowing', narrative: 'Liquidity sweep void detected below current level.' }
    ];

    // Shelf 5: UNUSUAL POSITIONING
    const unusualPositioning = [
      { asset: ndx, strike: 18250, isCall: true, health: 84, expectedMove: '+48%', status: 'Strengthening', narrative: 'Unusual high volume cluster and rapid speed matched.' },
      { asset: spy, strike: 450, isCall: false, health: 76, expectedMove: '+15%', status: 'Unusual', narrative: 'Block institutional hedging activity detected.' }
    ];

    return {
      highestConviction,
      mostImproved,
      mostMispriced,
      nearInvalidation,
      unusualPositioning
    };
  }, []);

  const centerpiece = {
    asset: ASSET_LIST[0],
    ticker: 'SPX',
    strike: 7620,
    isCall: true,
    health: 96,
    expectedMove: '+42%',
    status: 'Strong Buy',
    narrative: 'Heavy institutional volume cluster matched. Dealer buy walls are perfectly positioned. High likelihood of rapid upward price resolution.'
  };

  return (
    <div className="space-y-6 animate-fadeIn font-mono text-zinc-300 max-w-5xl mx-auto w-full px-1 select-none text-left">
      
      {/* Upper header segment overlay */}
      <div className="bg-[#050505] border border-zinc-900 p-4 rounded-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <h1 className="text-xs font-black text-white uppercase tracking-widest">
            OPPORTUNITY CAROUSEL COCKPIT <span className="text-zinc-600">/ DIRECT SHELVED THESES</span>
          </h1>
        </div>
        <div className="text-[8.5px] text-zinc-550 uppercase tracking-widest font-black">
          DETECTION ACTIVE
        </div>
      </div>

      {/* ==================================================
          A. SELECTED CENTERPIECE (THE CONVICTION MAXIMA)
          ================================================== */}
      <div className="bg-[#050505] border-2 border-white rounded-sm p-6 md:p-8 relative overflow-hidden shadow-2xl space-y-6">
        
        {/* Top absolute-placed coordinate stripe */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-white" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 pb-4 border-b border-zinc-900">
          <div>
            <span className="text-[8px] text-zinc-500 tracking-[0.25em] font-black uppercase block">THE HIGH CONVICTION SYSTEM MAXIMA</span>
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
              THE BEST OPPORTUNITY RIGHT NOW
            </h2>
          </div>
          <span className="text-[9px] bg-white text-black font-extrabold px-3 py-1 rounded-sm uppercase tracking-widest">
            HEALTH 96
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-white text-2xl font-black bg-black border border-zinc-900 px-3 py-1.5 rounded-xs tracking-wider">
                {centerpiece.ticker} {centerpiece.strike}C
              </span>
              <span className="text-emerald-400 text-[9.5px] font-black border border-emerald-900/45 bg-emerald-950/20 px-2.5 py-1 rounded uppercase tracking-widest">
                {centerpiece.status}
              </span>
            </div>

            <p className="text-xs font-medium text-zinc-300 font-sans leading-relaxed uppercase">
              {centerpiece.narrative}
            </p>
          </div>

          <div className="md:col-span-4 bg-zinc-950 p-4 border border-zinc-900 rounded-xs grid grid-cols-2 gap-3 text-left">
            <div>
              <span className="text-[7.5px] text-zinc-500 block uppercase font-bold tracking-wider">Decision Score</span>
              <span className="text-base font-black text-white mt-0.5 block">{centerpiece.health} pts</span>
            </div>
            <div>
              <span className="text-[7.5px] text-zinc-500 block uppercase font-bold tracking-wider">Expected P&L</span>
              <span className="text-base font-extrabold text-emerald-400 mt-0.5 block">{centerpiece.expectedMove}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => onSelectContract(centerpiece.asset, centerpiece.strike, centerpiece.isCall)}
            className="px-8 py-3 bg-white hover:bg-zinc-100 text-black font-extrabold uppercase tracking-widest text-[10px] rounded-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Open Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* ==========================================================
          B. THE CURATED SLIDING SHELVES IN OPPORTUNITY CAROUSELS
          ========================================================== */}
      <div className="space-y-8 pt-2">
        
        {/* SHELF 1: HIGHEST CONVICTION */}
        <div className="space-y-3.5 pl-3 border-l-2 border-white">
          <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 leading-none">
            <Award className="w-4 h-4 text-white" />
            Highest Conviction Setup Nodes
          </span>
          <OpportunityRow>
            {shelves.highestConviction.map(item => (
              <OpportunityCard 
                key={`conviction-${item.asset.ticker}-${item.strike}`}
                item={item} 
                tagText="CONVICTION" 
                tagColor="text-white border-white bg-white/5"
                onSelect={() => onSelectContract(item.asset, item.strike, item.isCall)}
              />
            ))}
          </OpportunityRow>
        </div>

        {/* SHELF 2: MOST IMPROVED */}
        <div className="space-y-3.5 pl-3 border-l-2 border-indigo-400">
          <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 leading-none">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Most Improved Scoring Vectors
          </span>
          <OpportunityRow>
            {shelves.mostImproved.map(item => (
              <OpportunityCard 
                key={`improved-${item.asset.ticker}-${item.strike}`}
                item={item} 
                tagText="IMPROVED" 
                tagColor="text-indigo-400 border-indigo-950 bg-indigo-950/15"
                onSelect={() => onSelectContract(item.asset, item.strike, item.isCall)}
              />
            ))}
          </OpportunityRow>
        </div>

        {/* SHELF 3: MOST MISPRICED */}
        <div className="space-y-3.5 pl-3 border-l-2 border-emerald-400">
          <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 leading-none">
            <Percent className="w-4 h-4 text-emerald-400" />
            Most Mispriced Spot Offsets
          </span>
          <OpportunityRow>
            {shelves.mostMispriced.map(item => (
              <OpportunityCard 
                key={`mispriced-${item.asset.ticker}-${item.strike}`}
                item={item} 
                tagText="MISPRICED" 
                tagColor="text-emerald-400 border-emerald-950 bg-emerald-950/15"
                onSelect={() => onSelectContract(item.asset, item.strike, item.isCall)}
              />
            ))}
          </OpportunityRow>
        </div>

        {/* SHELF 4: NEAR INVALIDATION */}
        <div className="space-y-3.5 pl-3 border-l-2 border-red-500">
          <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 leading-none">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Near Invalidation Boundary Alerts
          </span>
          <OpportunityRow>
            {shelves.nearInvalidation.map(item => (
              <OpportunityCard 
                key={`invalidation-${item.asset.ticker}-${item.strike}`}
                item={item} 
                tagText="INVALIDATION" 
                tagColor="text-red-400 border-red-950 bg-red-950/15"
                onSelect={() => onSelectContract(item.asset, item.strike, item.isCall)}
              />
            ))}
          </OpportunityRow>
        </div>

      </div>

    </div>
  );
}
