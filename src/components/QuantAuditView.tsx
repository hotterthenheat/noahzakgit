import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { AssetInfo, SystemScore, V8TradeRecord } from '../types';

interface QuantAuditViewProps {
  selectedAsset: AssetInfo;
  isCall: boolean;
  systemScore: SystemScore;
  optionPremium: number;
  trades: V8TradeRecord[];
  onClearTrades: () => void;
}

interface AuditRecord {
  id: string;
  contract: string;
  ticker: string;
  type: 'CALL' | 'PUT';
  time: string;
  outcome: string;
  pnl: number;
  status: 'ACTIVE' | 'GAIN' | 'STOP LOSS' | 'PARTIAL CLOSE' | 'INVALIDATED' | 'MANUAL EXIT';
  details: string;
}

export function QuantAuditView({
  selectedAsset,
  isCall,
  systemScore,
  optionPremium,
  trades,
  onClearTrades
}: QuantAuditViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tickerFilter, setTickerFilter] = useState<string>('ALL');

  // Map dynamic user-created trades into audit records
  const dynamicCalls = useMemo(() => {
    return trades
      .filter(t => t.direction === 'BULLISH' || t.contract.endsWith('C'))
      .map((t, idx) => {
        const pnlVal = parseFloat((t.expectedReturn * 105).toFixed(1));
        const ticker = t.underlying.replace('I:', '');
        const entryTime = t.timestamp || '11:02 AM';
        return {
          id: `user-call-${t.id || idx}`,
          contract: t.contract,
          ticker,
          type: 'CALL' as const,
          time: t.target1Hit ? `${entryTime} (Hit)` : 'ACTIVE SESSION',
          outcome: t.target1Hit ? `GAIN (+${pnlVal}%)` : 'ACTIVE',
          pnl: pnlVal,
          status: t.finalOutcome.includes('Failure') ? 'STOP LOSS' as const : (t.target1Hit ? 'GAIN' as const : 'ACTIVE' as const),
          details: `Dynamic active contract called out at spot price. Technical parameters matching sequence buy indicators.`
        };
      });
  }, [trades]);

  const dynamicPuts = useMemo(() => {
    return trades
      .filter(t => t.direction === 'BEARISH' || t.contract.endsWith('P'))
      .map((t, idx) => {
        const pnlVal = parseFloat((t.expectedReturn * 105).toFixed(1));
        const ticker = t.underlying.replace('I:', '');
        const entryTime = t.timestamp || '10:01 PM';
        return {
          id: `user-put-${t.id || idx}`,
          contract: t.contract,
          ticker,
          type: 'PUT' as const,
          time: t.target1Hit ? `${entryTime} (Hit)` : 'ACTIVE SESSION',
          outcome: t.target1Hit ? `GAIN (+${pnlVal}%)` : 'ACTIVE',
          pnl: pnlVal,
          status: t.finalOutcome.includes('Failure') ? 'STOP LOSS' as const : (t.target1Hit ? 'GAIN' as const : 'ACTIVE' as const),
          details: `Dynamic active bearish contract called out. Order patterns indicate short gamma slope validation.`
        };
      });
  }, [trades]);

  // Static high fidelity ledger rows mirroring user image perfectly
  const staticCalls: AuditRecord[] = [
    { 
      id: 'sc-1', 
      contract: 'SPX 7650C', 
      ticker: 'SPX',
      type: 'CALL', 
      time: 'ACTIVE SESSION', 
      outcome: 'GAIN (+880%)', 
      pnl: 880, 
      status: 'ACTIVE', 
      details: 'Option contracts called on critical spot alignment. Institutional block bidding carried valuation through major resistance nodes.' 
    },
    { 
      id: 'sc-2', 
      contract: 'NDX 18200C', 
      ticker: 'NDX',
      type: 'CALL', 
      time: '11:02 AM', 
      outcome: 'GAIN (+38%)', 
      pnl: 38, 
      status: 'GAIN', 
      details: 'Trend validation indicators triggered on sequential buy blocks at the 18200 historical support wall.' 
    },
    { 
      id: 'sc-3', 
      contract: 'SPY 448C', 
      ticker: 'SPY',
      type: 'CALL', 
      time: '12:03 PM', 
      outcome: 'GAIN (+76%)', 
      pnl: 76, 
      status: 'GAIN', 
      details: 'Index delta compression initiated a target 2 level breach. Fast trade execution carried premium values to profit-taking target.' 
    },
    { 
      id: 'sc-4', 
      contract: 'SPX 7650C', 
      ticker: 'SPX',
      type: 'CALL', 
      time: '13:04 AM', 
      outcome: 'STOP LOSS (-18%)', 
      pnl: -18, 
      status: 'STOP LOSS', 
      details: 'Pivot invalidation occurred as underlying fell below structural threshold. Controlled boundary stop initiated.' 
    },
    { 
      id: 'sc-5', 
      contract: 'NDX 18300C', 
      ticker: 'NDX',
      type: 'CALL', 
      time: '14:05 PM', 
      outcome: 'PARTIAL CLOSE (+8%)', 
      pnl: 8, 
      status: 'PARTIAL CLOSE', 
      details: 'Gamma slope moderation detected on the live order book. Position reduced by 50% to lock premium gains.' 
    },
    { 
      id: 'sc-6', 
      contract: 'QQQ 515C', 
      ticker: 'QQQ',
      type: 'CALL', 
      time: '10:08 AM', 
      outcome: 'GAIN (+15%)', 
      pnl: 15, 
      status: 'GAIN', 
      details: 'CBOE book flow demand expanded briefly. Contracts exited at target 1 on momentum change.' 
    },
    { 
      id: 'sc-7', 
      contract: 'SPX 7620C', 
      ticker: 'SPX',
      type: 'CALL', 
      time: '11:09 PM', 
      outcome: 'GAIN (+44%)', 
      pnl: 44, 
      status: 'GAIN', 
      details: 'Sustained pricing momentum above key support block. Targets hit sequencially on afternoon order compression.' 
    },
    { 
      id: 'sc-8', 
      contract: 'NDX 18200C', 
      ticker: 'NDX',
      type: 'CALL', 
      time: '13:11 PM', 
      outcome: 'GAIN (+38%)', 
      pnl: 38, 
      status: 'GAIN', 
      details: 'Spot re-entry criteria confirmed. Option premium appreciated with direct delta response.' 
    }
  ];

  const staticPuts: AuditRecord[] = [
    { 
      id: 'sp-1', 
      contract: 'NDX 18200P', 
      ticker: 'NDX',
      type: 'PUT', 
      time: 'ACTIVE SESSION', 
      outcome: 'GAIN (+750%)', 
      pnl: 750, 
      status: 'ACTIVE', 
      details: 'Vanna hedge re-alignment acceleration triggered severe downward compression. Premium expanded aggressively.' 
    },
    { 
      id: 'sp-2', 
      contract: 'QQQ 492P', 
      ticker: 'QQQ',
      type: 'PUT', 
      time: '10:01 PM', 
      outcome: 'INVALIDATED (-15%)', 
      pnl: -15, 
      status: 'INVALIDATED', 
      details: 'Spot trend shifted. Immediate stop criteria applied to mitigate contract decay exposure.' 
    },
    { 
      id: 'sp-3', 
      contract: 'SPY 445P', 
      ticker: 'SPY',
      type: 'PUT', 
      time: '15:06 AM', 
      outcome: 'MANUAL EXIT (-24%)', 
      pnl: -24, 
      status: 'MANUAL EXIT', 
      details: 'Manual filter intervention applied as spot indicators flattened near major expiration wall.' 
    },
    { 
      id: 'sp-4', 
      contract: 'SPX 7640P', 
      ticker: 'SPX',
      type: 'PUT', 
      time: '9:07 PM', 
      outcome: 'STOP LOSS (-12%)', 
      pnl: -12, 
      status: 'STOP LOSS', 
      details: 'Protective boundary stop executed automatically as buyers defended index crossover pivot.' 
    },
    { 
      id: 'sp-5', 
      contract: 'QQQ 492P', 
      ticker: 'QQQ',
      type: 'PUT', 
      time: '12:10 AM', 
      outcome: 'INVALIDATED (-15%)', 
      pnl: -15, 
      status: 'INVALIDATED', 
      details: 'Risk-aversion protocol active. Left position after short-term support validation.' 
    },
    { 
      id: 'sp-6', 
      contract: 'SPY 445P', 
      ticker: 'SPY',
      type: 'PUT', 
      time: '10:15 PM', 
      outcome: 'MANUAL EXIT (-24%)', 
      pnl: -24, 
      status: 'MANUAL EXIT', 
      details: 'Consolidated trade parameters called for manual exposure halt on spot recovery.' 
    },
    { 
      id: 'sp-7', 
      contract: 'SPX 7640P', 
      ticker: 'SPX',
      type: 'PUT', 
      time: '11:16 AM', 
      outcome: 'STOP LOSS (-12%)', 
      pnl: -12, 
      status: 'STOP LOSS', 
      details: 'Exited on initial indicator breach to guarantee safety boundary preservation.' 
    },
    { 
      id: 'sp-8', 
      contract: 'QQQ 492P', 
      ticker: 'QQQ',
      type: 'PUT', 
      time: '14:19 PM', 
      outcome: 'INVALIDATED (-15%)', 
      pnl: -15, 
      status: 'INVALIDATED', 
      details: 'Volatility structure changes invalidated the technical downside momentum profile.' 
    }
  ];

  // Combined pools
  const allCalls = useMemo(() => {
    const list = [...dynamicCalls, ...staticCalls];
    if (tickerFilter === 'ALL') return list;
    return list.filter(item => item.ticker === tickerFilter);
  }, [dynamicCalls, staticCalls, tickerFilter]);

  const allPuts = useMemo(() => {
    const list = [...dynamicPuts, ...staticPuts];
    if (tickerFilter === 'ALL') return list;
    return list.filter(item => item.ticker === tickerFilter);
  }, [dynamicPuts, staticPuts, tickerFilter]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'GAIN':
      case 'PARTIAL CLOSE':
        return 'bg-[#011409]/80 border border-[#00ff88]/25 text-[#00ff88]';
      case 'STOP LOSS':
      case 'INVALIDATED':
      case 'MANUAL EXIT':
      default:
        return 'bg-[#140203]/80 border border-[#ff453a]/25 text-[#ff453a]';
    }
  };

  return (
    <div className="font-mono text-zinc-350 max-w-full mx-auto w-full px-1 animate-fadeIn select-none space-y-6" id="quant-audit-workspace">
      
      {/* Top Header Row matching visual */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 gap-4">
        <div className="text-left">
          <span className="text-[10px] text-[#00ff88] uppercase tracking-[0.2em] font-bold block mb-1">
            • PERFORMANCE LEDGER
          </span>
          <h2 className="text-xl md:text-2xl font-bold tracking-wider text-white uppercase font-sans">
            ACCOUNTABILITY REGISTRY
          </h2>
        </div>

        {/* Buttons right aligned */}
        <div className="flex items-center gap-3">
          {/* Ticker select buttons inside */}
          <div className="flex gap-1 bg-black/50 p-0.5 border border-zinc-900 rounded mr-2">
            {['ALL', 'SPX', 'NDX', 'QQQ', 'SPY'].map((t) => (
              <button
                key={t}
                onClick={() => setTickerFilter(t)}
                className={`px-2 py-0.5 text-[8.5px] font-black rounded-xs transition-all ${
                  tickerFilter === t 
                    ? 'bg-zinc-800 text-white' 
                    : 'text-zinc-550 hover:text-zinc-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button 
            onClick={onClearTrades}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-[#ff453a] border border-[#ff453a]/20 hover:border-[#ff453a]/40 text-[9.5px] font-bold uppercase rounded-[4px] cursor-pointer transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET ACTIVE SESSION</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/60 text-zinc-400 border border-zinc-800 text-[9.5px] font-bold uppercase rounded-[4px]">
            <CheckCircle2 className="w-3 h-3 text-[#00ff88]" />
            <span>SYNCED LEDGER</span>
          </div>
        </div>
      </div>

      {/* Symmetric stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#050506]/35 border border-zinc-900 p-4 rounded-md text-left">
          <span className="text-[8px] text-zinc-500 uppercase tracking-widest block">CALL ENTRIES</span>
          <span className="text-2xl font-bold text-[#00ff88] block mt-1">201</span>
          <span className="text-[7.5px] text-zinc-550 uppercase tracking-wider block mt-0.5">BULLISH EXECUTIONS</span>
        </div>

        <div className="bg-[#050506]/35 border border-zinc-900 p-4 rounded-md text-left">
          <span className="text-[8px] text-zinc-500 uppercase tracking-widest block">PUT ENTRIES</span>
          <span className="text-2xl font-bold text-[#ff453a] block mt-1">101</span>
          <span className="text-[7.5px] text-zinc-550 uppercase tracking-wider block mt-0.5">BEARISH EXECUTIONS</span>
        </div>

        <div className="bg-[#050506]/35 border border-zinc-900 p-4 rounded-md text-left">
          <span className="text-[8px] text-zinc-500 uppercase tracking-widest block">HIT VALIDITY</span>
          <span className="text-2xl font-bold text-white block mt-1">71.0%</span>
          <span className="text-[7.5px] text-zinc-550 uppercase tracking-wider block mt-0.5">HISTORICAL ACCURACY</span>
        </div>

        <div className="bg-[#050506]/35 border border-zinc-900 p-4 rounded-md text-left">
          <span className="text-[8px] text-zinc-500 uppercase tracking-widest block">TOTAL REGISTRY SIZE</span>
          <span className="text-2xl font-bold text-white block mt-1">302</span>
          <span className="text-[7.5px] text-zinc-550 uppercase tracking-wider block mt-0.5">AUDIT LOG COVERAGE</span>
        </div>
      </div>

      {/* Split Columns Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        
        {/* Calls Column */}
        <div className="space-y-3.5">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-widest text-[#00ff88]">
              <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full inline-block animate-pulse" />
              <span>BULLISH CONTRACTS (CALLS)</span>
            </div>
            <span className="bg-zinc-950 border border-zinc-900 px-1.5 py-0.5 text-[8px] uppercase font-bold text-zinc-400 rounded-sm">
              {allCalls.length} LOGGED
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {allCalls.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div key={item.id} className="transition-all">
                  <div 
                    onClick={() => toggleExpand(item.id)}
                    className="flex justify-between items-center bg-[#070709]/90 hover:bg-[#0b0b0e] border border-zinc-900 hover:border-zinc-800 p-3 rounded-lg transition-all cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {/* Arrow Icon block */}
                      <div className="w-8 h-8 rounded bg-[#101015] border border-zinc-800/80 flex items-center justify-center text-emerald-400">
                        <ArrowUpRight className="w-4 h-4 text-[#00ff88]" />
                      </div>

                      <div className="text-left space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold tracking-wide">{item.contract}</span>
                          <span className="text-[7.5px] px-1 bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 rounded-xs uppercase">CALL</span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-zinc-500">
                          <Clock className="w-2.5 h-2.5 text-zinc-650" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 font-black uppercase text-[9.5px] tracking-wide rounded ${getStatusStyle(item.status)}`}>
                        {item.outcome}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />}
                    </div>
                  </div>

                  {/* Expansion Drawer */}
                  {isExpanded && (
                    <div className="p-4 bg-[#020202]/50 border-x border-b border-zinc-900/60 rounded-b-lg text-left text-[10px] space-y-2 uppercase leading-relaxed text-zinc-400 animate-slideDown">
                      <div className="border-b border-zinc-950 pb-1.5 flex justify-between items-center">
                        <span className="font-extrabold text-[#00ff88]">CALL CONTEXT PROVENANCE TRACK LOG</span>
                        <span className="text-zinc-600 text-[8px] font-sans">STATUS: ARCHIVED TRANSACTION</span>
                      </div>
                      <p className="text-zinc-350 tracking-wide">{item.details}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Puts Column */}
        <div className="space-y-3.5">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-widest text-[#ff453a]">
              <span className="w-1.5 h-1.5 bg-[#ff453a] rounded-full inline-block animate-pulse" />
              <span>BEARISH CONTRACTS (PUTS)</span>
            </div>
            <span className="bg-zinc-950 border border-zinc-900 px-1.5 py-0.5 text-[8px] uppercase font-bold text-zinc-400 rounded-sm">
              {allPuts.length} LOGGED
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {allPuts.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div key={item.id} className="transition-all">
                  <div 
                    onClick={() => toggleExpand(item.id)}
                    className="flex justify-between items-center bg-[#070709]/90 hover:bg-[#0b0b0e] border border-zinc-900 hover:border-zinc-800 p-3 rounded-lg transition-all cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {/* Arrow Icon block */}
                      <div className="w-8 h-8 rounded bg-[#101015] border border-zinc-800/80 flex items-center justify-center text-rose-450">
                        <ArrowDownRight className="w-4 h-4 text-[#ff453a]" />
                      </div>

                      <div className="text-left space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold tracking-wide">{item.contract}</span>
                          <span className="text-[7.5px] px-1 bg-rose-950/40 text-rose-400 border border-rose-900/40 rounded-xs uppercase">PUT</span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-zinc-500">
                          <Clock className="w-2.5 h-2.5 text-zinc-650" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 font-black uppercase text-[9.5px] tracking-wide rounded ${getStatusStyle(item.status)}`}>
                        {item.outcome}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />}
                    </div>
                  </div>

                  {/* Expansion Drawer */}
                  {isExpanded && (
                    <div className="p-4 bg-[#020202]/50 border-x border-b border-zinc-900/60 rounded-b-lg text-left text-[10px] space-y-2 uppercase leading-relaxed text-zinc-400 animate-slideDown">
                      <div className="border-b border-zinc-950 pb-1.5 flex justify-between items-center">
                        <span className="font-extrabold text-[#ff453a]">PUT CONTEXT PROVENANCE TRACK LOG</span>
                        <span className="text-zinc-600 text-[8px] font-sans">STATUS: ARCHIVED TRANSACTION</span>
                      </div>
                      <p className="text-zinc-350 tracking-wide">{item.details}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Button at bottom */}
      <div className="pt-6 pb-2 text-center">
        <button className="px-6 py-2 bg-zinc-950 hover:bg-[#0d0d10] text-[#888890] hover:text-white border border-zinc-900 hover:border-zinc-800 text-[10px] font-black tracking-widest uppercase transition-colors rounded">
          LOAD 100 MORE HISTORICAL RECORDS
        </button>
      </div>

      {/* Synchronized footer */}
      <div className="text-center font-sans">
        <span className="text-zinc-600 font-mono text-[8px] uppercase tracking-[0.25em]">
          ⛓ HIGH-ACCURACY REGISTER SYNCHRONIZED ACROSS PARALLEL QUANT LEDGERS
        </span>
      </div>

    </div>
  );
}
