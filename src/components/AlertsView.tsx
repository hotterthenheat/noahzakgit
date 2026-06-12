import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Terminal, AlertTriangle, CheckSquare, PlusCircle, Trash2, Layers, FileText } from 'lucide-react';
import { useContractStore } from '../lib/store';

interface AlertItem {
  id: string;
  timestamp: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  message: string;
  source: string;
}

export function AlertsView() {
  const selectedAsset = useContractStore((s) => s.selectedAsset);
  const serverState = useContractStore((s) => s.serverState);

  // Initial priority queue alerts
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'alt-5a21',
      timestamp: '14:22:04',
      priority: 'CRITICAL',
      type: 'LIQUIDITY SWEEP',
      message: 'Institutional sweep void detected immediately below SPX 7620 node. Net dealer GEX shelter buffers shifted 15% lower.',
      source: 'CBOE DIRECT FEED'
    },
    {
      id: 'alt-12b4',
      timestamp: '14:15:30',
      priority: 'HIGH',
      type: 'EXPECTED RANGE EXCURSION',
      message: 'Spot price deviated past first standard boundary threshold. Underlying volatility index expanding rapidly.',
      source: 'VOLATILITY PIPELINE'
    },
    {
      id: 'alt-88c9',
      timestamp: '14:02:11',
      priority: 'MEDIUM',
      type: 'GAMMA FLIP SHIFT',
      message: 'Dealer gamma profile rebalancing near active strike nodes. Re-hedging pressures build on short positions.',
      source: 'GEX SKEW ENGINE'
    },
    {
      id: 'alt-09f1',
      timestamp: '13:58:15',
      priority: 'LOW',
      type: 'TIME DECAY COMPILING',
      message: 'Theta parameters accelerated on front-month QQQ expiration sets as market enters consolidation block.',
      source: 'SURFACE MATRIX'
    }
  ]);

  const addSimulatedAlert = (priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => {
    const time = new Date().toLocaleTimeString();
    let newAlert: AlertItem;

    if (priority === 'CRITICAL') {
      newAlert = {
        id: `alt-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: time,
        priority: 'CRITICAL',
        type: 'TAIL EXCURSION WARNING',
        message: `Tail Risk VaR exceeded 95% boundaries on ${selectedAsset.ticker} index. Dynamic hedge safeguards activated.`,
        source: 'RISK CONTROL ENGINE'
      };
    } else if (priority === 'HIGH') {
      newAlert = {
        id: `alt-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: time,
        priority: 'HIGH',
        type: 'MOMENTUM VELOCITY ALIGNMENT',
        message: `High Timeframe trend agreement confirmed on ${selectedAsset.ticker}. Execution signals registered on V11.`,
        source: 'COPTIC TRACKER'
      };
    } else if (priority === 'MEDIUM') {
      newAlert = {
        id: `alt-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: time,
        priority: 'MEDIUM',
        type: 'VOLUME PROFILE SPIKE',
        message: `Trading volume expanded 3.2x normal standards over 5-minute index blocks. Spreads consolidating inside nodes.`,
        source: 'CME BLOCK SCANNER'
      };
    } else {
      newAlert = {
        id: `alt-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: time,
        priority: 'LOW',
        type: 'FEED SYNC NOTICE',
        message: `Direct clearing socket latency checked at 0.82 seconds. All data coordinates synchronized perfectly.`,
        source: 'TELEMETRY'
      };
    }

    setAlerts((prev) => [newAlert, ...prev]);
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  return (
    <div className="w-full text-zinc-300 flex flex-col font-mono select-none antialiased space-y-6">
      
      {/* 1. HEADER (COMMAND DECK) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#050505] border border-zinc-900 p-4 rounded-sm gap-2">
        <div className="flex gap-2 items-center">
          <Terminal className="w-4 h-4 text-zinc-450" />
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">
            SLAYER PRIORITIZED COMMAND ALERTS CENTRE // ACTIVE MONITORING
          </span>
        </div>
        <div className="flex items-center gap-1 bg-black p-1 border border-zinc-900 rounded-sm">
          <span className="text-[8.5px] uppercase tracking-widest text-zinc-400 px-2 font-black">
            ALERTS FILTERED BY INTENSITY
          </span>
        </div>
      </div>

      {/* 2. PRIMARY HERO CARD (Central Priorities Queue deck) */}
      <div className="w-full animate-fadeIn">
        <div className="bg-[#050505] border-2 border-white rounded-sm p-6 relative overflow-hidden shadow-2xl space-y-4">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-white" />

          {/* Core priority header */}
          <div className="border-b border-zinc-900 pb-3 flex justify-between items-start">
            <div className="text-left space-y-1">
              <span className="text-[8px] text-zinc-550 tracking-[0.25em] font-black block">SYSTEM SEVERITY DISPATCH QUEUE</span>
              <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans">
                TELEMETRY PRIORITY BOARD
              </h2>
            </div>
            <div className="text-right bg-zinc-950 px-2 py-1 border border-zinc-900 rounded-xs text-[10px]">
              <span className="text-zinc-500 uppercase text-[8px] block">CRITICAL CHECKS</span>
              <span className="text-[#ff4545] font-extrabold block text-sm">
                {alerts.filter(a => a.priority === 'CRITICAL').length}
              </span>
            </div>
          </div>

          <p className="text-[11px] font-sans text-zinc-455 leading-relaxed max-w-3xl font-light text-left">
            Dynamic threshold alerts sorted automatically on mathematical relevance. When a spot boundary slips or GEX imbalances cross established risk parameters, direct updates compile here in real-time.
          </p>

          {/* Symmetrical Alerts Feed Column Stack */}
          <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
            {alerts.length > 0 ? (
              alerts.map((al) => {
                // Color configuration strictly monochromatic or high-contrast neutral
                const priorityClasses = 
                  al.priority === 'CRITICAL'
                    ? 'text-white border-white bg-white/5'
                    : al.priority === 'HIGH'
                    ? 'text-zinc-300 border-zinc-600 bg-zinc-950'
                    : al.priority === 'MEDIUM'
                    ? 'text-zinc-400 border-zinc-800 bg-zinc-950'
                    : 'text-zinc-500 border-zinc-900 bg-black';

                return (
                  <motion.div
                    key={al.id}
                    layoutId={al.id}
                    className="p-4 bg-zinc-950 border border-zinc-900 hover:border-zinc-850 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-[8px] font-black border uppercase tracking-wider rounded-xs ${priorityClasses}`}>
                          {al.priority}
                        </span>
                        <span className="text-[9.5px] font-black text-white uppercase">{al.type}</span>
                        <span className="text-[7.5px] text-zinc-600 uppercase font-bold">•</span>
                        <span className="text-[8px] text-zinc-550 uppercase tracking-wider">{al.source}</span>
                      </div>
                      <p className="text-[10.5px] text-zinc-400 font-sans leading-normal">
                        {al.message}
                      </p>
                    </div>

                    <div className="text-right text-[8.5px] text-zinc-650 shrink-0 font-bold self-start sm:self-center font-mono">
                      {al.timestamp} GMT
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="py-12 text-center text-zinc-600 text-[10.5px] bg-zinc-950 border border-zinc-900 rounded-sm uppercase">
                <CheckSquare className="w-5 text-zinc-750 mx-auto mb-1" />
                <span>Zero prioritized incidents currently on telemetry stream channels.</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 3. SECONDARY ANALYSIS CARDS (Command Dispatch controls side-by-side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        
        {/* Simulate Controls */}
        <div className="bg-[#050505] p-5 border border-zinc-900 rounded-sm flex flex-col justify-between text-left space-y-4">
          <div className="space-y-2">
            <span className="text-[8px] text-zinc-550 block uppercase font-bold tracking-widest">COMMAND SIGNALS SIMULATOR</span>
            <h4 className="text-xs font-black text-white uppercase">DISPATCH MOCK THRESHOLDS</h4>
            <p className="text-[10.5px] text-zinc-500 font-sans leading-relaxed">
              Manually deploy simulated market events downstream. Verify compliance speeds, SMPP dispatch routing, and prioritizations.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => addSimulatedAlert('CRITICAL')}
              className="py-2.5 bg-white hover:bg-zinc-150 text-black font-extrabold uppercase rounded-xs transition-colors cursor-pointer text-[8.5px] tracking-widest flex items-center justify-center gap-1"
            >
              <PlusCircle className="w-3" />
              <span>TEST CRITICAL</span>
            </button>
            <button
              onClick={() => addSimulatedAlert('HIGH')}
              className="py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-white font-extrabold uppercase rounded-xs transition-colors cursor-pointer text-[8.5px] tracking-widest flex items-center justify-center gap-1"
            >
              <PlusCircle className="w-3" />
              <span>TEST HIGH</span>
            </button>
            <button
              onClick={() => addSimulatedAlert('MEDIUM')}
              className="py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 font-extrabold uppercase rounded-xs transition-colors cursor-pointer text-[8.5px] tracking-widest flex items-center justify-center gap-1"
            >
              <PlusCircle className="w-3" />
              <span>TEST MEDIUM</span>
            </button>
            <button
              onClick={() => addSimulatedAlert('LOW')}
              className="py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-500 font-extrabold uppercase rounded-xs transition-colors cursor-pointer text-[8.5px] tracking-widest flex items-center justify-center gap-1"
            >
              <PlusCircle className="w-3" />
              <span>TEST LOW</span>
            </button>
          </div>
        </div>

        {/* Flush actions */}
        <div className="bg-[#050505] p-5 border border-zinc-900 rounded-sm flex flex-col justify-between text-left space-y-4">
          <div className="space-y-2">
            <span className="text-[8px] text-zinc-550 block uppercase font-bold tracking-widest">INCIDENT CONSOLE HOUSEKEEPING</span>
            <h4 className="text-xs font-black text-white uppercase">FLUSH COMPLIANT LEDGERS</h4>
            <p className="text-[10.5px] text-zinc-500 font-sans leading-relaxed">
              Clear current active logs. This performing action maintains local isolation parameters, purging transient setup events completely on active node sessions.
            </p>
          </div>

          <button
            onClick={clearAlerts}
            disabled={alerts.length === 0}
            className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 font-extrabold uppercase rounded-xs cursor-pointer transition-all disabled:opacity-35 text-[8.5px] tracking-widest flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>FLUSH TERMINAL ALERTS QUEUE</span>
          </button>
        </div>

      </div>

      {/* 4. SUPPORTING INFORMATION */}
      <div className="bg-[#050505] border border-zinc-900 p-5 rounded-sm p-4.5 text-left space-y-3">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
          <Layers className="w-3.5 h-3.5 text-zinc-550" />
          <h4 className="text-[10.5px] font-black text-white uppercase tracking-wider block">
            CBOE Deviation Alarm Standards
          </h4>
        </div>
        <div className="text-[11px] leading-relaxed text-zinc-450 font-sans space-y-2">
          <p>
            Alarm triggers follow rigorous regulatory parameters aligned with SEC Rule 15c3-5 for high-performance visual terminal devices. System coordinates monitor continuous asset distributions using double-signed covariant algorithms, establishing immediate alarms under high-imbalance shifts:
          </p>
          <p>
            A Critical notification is registered when a spot value breaks past established Standard Deviations, or if GEX dealer protection falls below 4.2 Billion Dollars in the respective contract set.
          </p>
        </div>
      </div>

      {/* 5. STATUS BAR */}
      <div className="border border-zinc-900 bg-black min-h-[30px] p-2 pr-3 rounded-xs flex items-center justify-between text-[8px] text-zinc-550 uppercase tracking-widest pl-3 font-black">
        <span>INCIDENTS RECONCILED ACCORDING TO CBOE TELEMETRICS</span>
        <div className="flex items-center gap-1.5 text-white">
          <span className="h-1.5 w-1.5 bg-[#CCCCCC] rounded-full animate-pulse" />
          <span>DESK SECURED</span>
        </div>
      </div>

    </div>
  );
}
