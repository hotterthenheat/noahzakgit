/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DEALER FLOW — gamma exposure profile, dealer buying pressure, and the
 * Displacement Zones × Volatility Engine. Every figure on this page is
 * computed server-side from the live Tradier chain + real candles (or the
 * clearly-labeled deterministic model when offline).
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useContractStore } from '../lib/store';
import { InteractiveChart } from './InteractiveChart';
import { InstitutionalPhysicsDashboard } from './InstitutionalPhysicsDashboard';
import {
  Waves,
  Crosshair,
  Magnet,
  Activity,
  Gauge,
  Layers,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Droplets,
  Play,
  Share2,
  RefreshCw,
  Skull,
  TrendingUp,
  Clock,
  Briefcase,
  Sliders,
  HelpCircle
} from 'lucide-react';

const fmtBn = (v: number) => `${v >= 0 ? '+' : '−'}$${Math.abs(v / 1e9).toFixed(2)}B`;
const fmtMn = (v: number) => `${v >= 0 ? '+' : '−'}$${Math.abs(v / 1e6).toFixed(1)}M`;

function FeedChip({ feed }: { feed?: string }) {
  const live = feed === 'LIVE_TRADIER' || feed === 'LIVE_POLYGON';
  return (
    <span
      className={`px-1.5 py-0.5 rounded-xs text-[7.5px] font-black tracking-widest uppercase border ${
        live
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
      }`}
    >
      {live ? (feed === 'LIVE_TRADIER' ? 'LIVE TRADIER' : 'LIVE POLYGON') : 'MODEL'}
    </span>
  );
}

// ----------------------------------------------------------------
// GEX profile chart (strikegex-style horizontal bars)
// ----------------------------------------------------------------
function GexProfileChart({ profile, decimals }: { profile: any; decimals: number }) {
  const rows = useMemo(() => {
    const strikes: any[] = profile?.strikes || [];
    // Render at most 21 strikes centered around spot for readability.
    if (strikes.length <= 21) return strikes;
    const sorted = [...strikes].sort((a, b) => a.strike - b.strike);
    let centerIdx = 0;
    let best = Infinity;
    sorted.forEach((r, i) => {
      const d = Math.abs(r.strike - profile.spot);
      if (d < best) {
        best = d;
        centerIdx = i;
      }
    });
    const lo = Math.max(0, centerIdx - 10);
    return sorted.slice(lo, lo + 21);
  }, [profile]);

  if (!profile || rows.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-zinc-600 text-xs uppercase tracking-widest">
        No chain data — GEX profile unresolved
      </div>
    );
  }

  const maxAbs = Math.max(...rows.map((r: any) => Math.max(Math.abs(r.callGex), Math.abs(r.putGex), Math.abs(r.netGex))), 1);
  const sortedDesc = [...rows].sort((a, b) => b.strike - a.strike);

  return (
    <div className="space-y-[3px]">
      {/* Axis header */}
      <div className="flex items-center text-[8px] font-black tracking-widest text-zinc-600 uppercase pb-1.5 border-b border-zinc-900 mb-1.5">
        <div className="w-[72px] shrink-0">Strike</div>
        <div className="flex-1 flex">
          <div className="flex-1 text-right pr-2 text-rose-400/70">← Put GEX</div>
          <div className="w-px bg-zinc-800" />
          <div className="flex-1 pl-2 text-emerald-400/70">Call GEX →</div>
        </div>
        <div className="w-[64px] text-right shrink-0">Net</div>
      </div>

      {sortedDesc.map((r: any) => {
        const callW = Math.min(100, (Math.abs(r.callGex) / maxAbs) * 100);
        const putW = Math.min(100, (Math.abs(r.putGex) / maxAbs) * 100);
        const isCallWall = r.strike === profile.callWall;
        const isPutWall = r.strike === profile.putWall;
        const isMagnet = r.strike === profile.magnet;
        const isSpot = Math.abs(r.strike - profile.spot) === Math.min(...rows.map((x: any) => Math.abs(x.strike - profile.spot)));
        const flipBetween =
          profile.gammaFlip > Math.min(r.strike, profile.spot) - 1e9 &&
          Math.abs(r.strike - profile.gammaFlip) <= (sortedDesc.length > 1 ? Math.abs(sortedDesc[0].strike - sortedDesc[1].strike) / 2 : 1);

        return (
          <div key={r.strike} className="group relative" id={`gex-strike-${r.strike}`}>
            <div
              className={`flex items-center h-[17px] rounded-[3px] transition-colors ${
                isSpot ? 'bg-white/[0.05] ring-1 ring-white/20' : 'hover:bg-white/[0.03]'
              }`}
            >
              <div
                className={`w-[72px] shrink-0 text-[10px] font-bold font-mono pl-1 ${
                  isSpot ? 'text-white' : isCallWall || isPutWall ? 'text-zinc-200' : 'text-zinc-500'
                }`}
              >
                {r.strike.toFixed(decimals > 1 ? 0 : 0)}
                {isCallWall && <span className="text-emerald-400 ml-1 text-[7px] align-middle font-black">CW</span>}
                {isPutWall && <span className="text-rose-400 ml-1 text-[7px] align-middle font-black">PW</span>}
                {isMagnet && !isCallWall && !isPutWall && (
                  <span className="text-amber-400 ml-1 text-[7px] align-middle font-black">PIN</span>
                )}
              </div>
              <div className="flex-1 flex items-center h-full">
                {/* Put side */}
                <div className="flex-1 flex justify-end items-center h-full pr-[1px]">
                  <div
                    className={`h-[11px] rounded-l-[2px] ${isPutWall ? 'bg-rose-405' : 'bg-rose-500/55'}`}
                    style={{ width: `${putW}%` }}
                  />
                </div>
                <div className="w-px self-stretch bg-zinc-800" />
                {/* Call side */}
                <div className="flex-1 flex items-center h-full pl-[1px]">
                  <div
                    className={`h-[11px] rounded-r-[2px] ${isCallWall ? 'bg-emerald-405' : 'bg-emerald-500/55'}`}
                    style={{ width: `${callW}%` }}
                  />
                </div>
              </div>
              <div
                className={`w-[64px] shrink-0 text-right text-[8.5px] font-mono pr-1 ${
                  r.netGex >= 0 ? 'text-emerald-400/90' : 'text-rose-400/90'
                }`}
              >
                {fmtBn(r.netGex)}
              </div>
            </div>

            {flipBetween && (
              <div className="flex items-center gap-2 py-[1px]">
                <div className="flex-1 border-t border-dashed border-amber-500/60" />
                <span className="text-[7.5px] font-black tracking-widest text-amber-400 uppercase">
                  γ-FLIP {profile.gammaFlip.toFixed(0)}
                </span>
                <div className="flex-1 border-t border-dashed border-amber-500/60" />
              </div>
            )}

            {/* Hover details */}
            <div className="absolute left-[76px] top-full mt-0.5 z-30 hidden group-hover:block bg-black border border-zinc-800 rounded-sm px-2.5 py-1.5 text-[8.5px] font-mono whitespace-nowrap shadow-2xl">
              <span className="text-emerald-400 font-bold">C: {fmtBn(r.callGex)} · OI {r.callOi.toLocaleString()} · Vol {r.callVolume.toLocaleString()}</span>
              <span className="text-zinc-650 mx-1.5">|</span>
              <span className="text-rose-400 font-bold">P: {fmtBn(r.putGex)} · OI {r.putOi.toLocaleString()} · Vol {r.putVolume.toLocaleString()}</span>
            </div>
          </div>
        );
      })}

      {/* Spot marker footer */}
      <div className="flex items-center gap-2 pt-2">
        <div className="flex-1 border-t border-white/30" />
        <span className="text-[8px] font-black tracking-widest text-white uppercase font-sans">
          SPOT {profile.spot.toFixed(2)}
        </span>
        <div className="flex-1 border-t border-white/30" />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Dealer pressure gauge (−100 sell … +100 buy)
// ----------------------------------------------------------------
function PressureGauge({ gauge, theme }: { gauge: any; theme: any }) {
  const p = gauge?.pressure ?? 0;
  const pct = (p + 100) / 2; // 0..100
  const color = p >= 25 ? '#10b981' : p <= -25 ? '#f43f5e' : '#f59e0b';
  
  // Choose gradient based on selected theme context: Call (emerald/green), Put (rose/red), Neutral (glass white)
  const gradientClass = theme.themeSuffix === 'call'
    ? 'bg-gradient-to-r from-zinc-850 via-zinc-800 to-emerald-500/25 border-emerald-500/15'
    : theme.themeSuffix === 'put'
    ? 'bg-gradient-to-r from-rose-500/25 via-zinc-800 to-zinc-850 border-rose-500/15'
    : 'bg-gradient-to-r from-zinc-850 via-zinc-800/80 to-zinc-850 border-white/10';

  return (
    <div className="space-y-3" id="dealer-pressure-gauge-container">
      <div className={`relative h-3.5 rounded-full ${gradientClass} border overflow-visible`}>
        <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-650" />
        <div
          className="absolute -top-1 w-[3px] h-5 rounded-full"
          style={{ 
            left: `calc(${pct}% - 1.5px)`, 
            backgroundColor: color, 
            boxShadow: `0 0 10px ${color}` 
          }}
        />
      </div>
      <div className="flex justify-between text-[8px] font-black tracking-widest text-[#a1a1aa] uppercase">
        <span className="text-rose-400/80 font-bold">Dealer Selling</span>
        <span style={{ color }} className="text-[13px] font-mono leading-none font-black">
          {p > 0 ? '+' : ''}
          {p}
        </span>
        <span className="text-emerald-400/80 font-bold">Dealer Buying</span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Volatility Engine banner
// ----------------------------------------------------------------
function VolatilityEngineCard({ vol, expectedMovePct, spot, theme }: { vol: any; expectedMovePct?: number; spot?: number; theme: any }) {
  if (!vol) return null;
  
  let regimeColor = 'text-zinc-300 border-white/10 bg-[#FFFFFF]/[0.02]';
  if (vol.regime === 'EXPANSION') {
    regimeColor = 'text-rose-400 border-rose-500/30 bg-rose-500/10 font-bold';
  } else if (vol.regime === 'COMPRESSION') {
    regimeColor = 'text-sky-400 border-sky-500/30 bg-sky-500/10 font-bold';
  }

  return (
    <div className={`${theme.cardBg} rounded-lg p-4 space-y-3.5`} id="volatility-engine-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-[#a1a1aa] uppercase">
          <Gauge className={`w-3.5 h-3.5 ${theme.iconColor}`} />
          Volatility Engine
        </div>
        <div className="flex items-center gap-1.5">
          {vol.squeeze && (
            <span className="px-1.5 py-0.5 rounded-xs text-[7.5px] font-black tracking-widest uppercase bg-sky-500/15 border border-sky-500/40 text-sky-300">
              SQUEEZE ARMED
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-xs text-[8px] font-black tracking-widest uppercase border ${regimeColor}`}>
            {vol.regime}
          </span>
        </div>
      </div>

      {/* Energy bar */}
      <div>
        <div className="flex justify-between text-[8px] text-[#a1a1aa] font-bold uppercase tracking-widest mb-1">
          <span>Expansion Energy</span>
          <span className="text-white font-mono text-[10px] font-black">{vol.energy}/100</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-950 border border-zinc-900 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-amber-400 to-rose-500"
            style={{ width: `${vol.energy}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-black/40 border border-zinc-900 rounded-sm py-2">
          <div className="text-[7.5px] text-zinc-500 font-black uppercase tracking-widest animate-none">ATR %ile</div>
          <div className="text-[13px] font-mono text-white font-bold">{vol.atrPercentile}</div>
        </div>
        <div className="bg-black/40 border border-zinc-900 rounded-sm py-2">
          <div className="text-[7.5px] text-zinc-500 font-black uppercase tracking-widest animate-none">ATR Slope</div>
          <div className={`text-[13px] font-mono font-bold ${vol.atrSlope >= 1 ? 'text-rose-450' : 'text-sky-450'}`}>
            {vol.atrSlope}×
          </div>
        </div>
        <div className="bg-black/40 border border-zinc-900 rounded-sm py-2">
          <div className="text-[7.5px] text-zinc-500 font-black uppercase tracking-widest animate-none">Exp Move</div>
          <div className="text-[13px] font-mono text-amber-300 font-bold">
            {expectedMovePct && spot ? `±${(spot * expectedMovePct).toFixed(0)}` : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Pure Market Microstructure & Mathematical Physics Helpers
// ----------------------------------------------------------------
function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.39894228 * Math.exp(-x * x / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x > 0 ? 1 - p : p;
}

interface OptionGreekPayload {
  delta: number;
  gamma: number;
  vanna: number;
  charm: number;
  speed: number;
  color: number;
}

function calculateGreeksTS(
  S: number,
  K: number,
  t: number,
  sigma: number,
  r: number,
  q: number,
  option_type: "call" | "put"
): OptionGreekPayload {
  if (t <= 0) t = 1e-4;
  if (sigma <= 0) sigma = 1e-3;

  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * t) / (sigma * Math.sqrt(t));
  const d2 = d1 - sigma * Math.sqrt(t);

  const n_prime_d1 = normalPdf(d1);
  const N_d1 = normalCdf(d1);

  // Delta & Gamma
  const delta = option_type === "call"
    ? Math.exp(-q * t) * N_d1
    : Math.exp(-q * t) * (N_d1 - 1);
  const gamma = (Math.exp(-q * t) * n_prime_d1) / (S * sigma * Math.sqrt(t));

  // Second-Order (Vanna, Charm)
  const vanna = -Math.exp(-q * t) * n_prime_d1 * (d2 / sigma);
  const charm_base = Math.exp(-q * t) * n_prime_d1 * ((r - q) / (sigma * Math.sqrt(t)) - d2 / (2 * t));
  const charm = option_type === "call"
    ? q * Math.exp(-q * t) * N_d1 - charm_base
    : -q * Math.exp(-q * t) * (1 - N_d1) - charm_base;

  // Third-Order (Speed, Color)
  const speed = -(gamma / S) * (1 + (d1 / (sigma * Math.sqrt(t))));
  const color = -(Math.exp(-q * t) * n_prime_d1 / (2 * S * t * sigma * Math.sqrt(t))) * (1 + d1 * ((r - q) / (sigma * Math.sqrt(t)) - d2 / (2 * t)));

  return { delta, gamma, vanna, charm, speed, color };
}

// ----------------------------------------------------------------
// Main view
// ----------------------------------------------------------------
export function DealerFlowView() {
  const serverState = useContractStore(s => s.serverState);
  const selectedAsset = useContractStore(s => s.selectedAsset);
  const selectedTimeframe = useContractStore(s => s.selectedTimeframe);
  const [activeEngineView, setActiveEngineView] = useState<'profile' | 'physics'>('profile');

  // Load contract selector parameters to map Call/Put styles (or white-glass defaults)
  const selectedOptionType = useContractStore(s => s.selectedOptionType);
  const selectedStrike = useContractStore(s => s.selectedStrike);
  const isContractLocked = useContractStore(s => s.isContractLocked);
  const activeTab = useContractStore(s => s.activeTab);

  const isConSelected = isContractLocked && activeTab === 'skyvision';
  const isCall = selectedOptionType === 'C';

  // Dynamic Theme Styling Object (Neutral Glass-White vs calls green vs puts red)
  const theme = useMemo(() => {
    if (!isConSelected) {
      return {
        accent: 'white',
        text: 'text-zinc-250',
        border: 'border-white/10 hover:border-white/15',
        cardBg: 'bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(255,255,255,0.01)]',
        chipBg: 'bg-white/5 border border-white/10 text-zinc-300',
        iconColor: 'text-zinc-350',
        headerIconBg: 'bg-white/[0.04] border border-white/10',
        glow: 'rgba(255, 255, 255, 0.05)',
        primaryText: 'text-white',
        buttonActive: 'bg-white/10 border border-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.06)]',
        buttonInactive: 'bg-[#060607]/45 border border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800',
        gexNetPlus: 'text-zinc-200 font-bold',
        gexNetMinus: 'text-zinc-400',
        themeSuffix: 'neutral',
        headerColor: 'text-white',
      };
    }
    
    if (isCall) {
      return {
        accent: 'emerald',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20 hover:border-emerald-500/35',
        cardBg: 'bg-emerald-950/[0.08] backdrop-blur-md border border-emerald-500/15 shadow-[0_8px_32px_0_rgba(16,185,129,0.01)]',
        chipBg: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300',
        iconColor: 'text-emerald-400',
        headerIconBg: 'bg-emerald-500/10 border border-emerald-500/20',
        glow: 'rgba(16, 185, 129, 0.06)',
        primaryText: 'text-emerald-355',
        buttonActive: 'bg-emerald-500/10 border border-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.12)]',
        buttonInactive: 'bg-[#060607]/45 border border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800',
        gexNetPlus: 'text-emerald-400/90 font-bold',
        gexNetMinus: 'text-rose-400/90',
        themeSuffix: 'call',
        headerColor: 'text-emerald-400',
      };
    } else {
      return {
        accent: 'rose',
        text: 'text-rose-400',
        border: 'border-rose-500/20 hover:border-rose-500/35',
        cardBg: 'bg-rose-950/[0.08] backdrop-blur-md border border-rose-500/15 shadow-[0_8px_32px_0_rgba(244,63,94,0.01)]',
        chipBg: 'bg-rose-500/10 border border-rose-500/20 text-rose-300',
        iconColor: 'text-rose-400',
        headerIconBg: 'bg-rose-500/10 border border-rose-500/20',
        glow: 'rgba(244, 63, 94, 0.06)',
        primaryText: 'text-rose-355',
        buttonActive: 'bg-rose-500/10 border border-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.12)]',
        buttonInactive: 'bg-[#060607]/45 border border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800',
        gexNetPlus: 'text-emerald-400/90 font-bold',
        gexNetMinus: 'text-rose-400/90',
        themeSuffix: 'put',
        headerColor: 'text-rose-400',
      };
    }
  }, [isConSelected, isCall]);

  const profile = serverState?.gex_profile;
  const gauge = serverState?.dealer_flow;
  const disp = serverState?.displacement;
  const candles = serverState?.candles || [];
  const dm = serverState?.deep_intelligence?.dealer_metrics;

  if (!serverState || !profile || !gauge || !disp) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[460px] bg-black/30 border border-zinc-900 rounded-lg p-8 text-center space-y-4" id="dealerflow-data-pending">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Waves className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-[11px] font-black tracking-widest text-white uppercase font-sans">
            DEALER FLOW REGISTRATION PENDING
          </h2>
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
            Acquiring real-time hedging profiles, order flow matrices, and displacement zones. Select any strike or option type to boot the provider.
          </p>
        </div>
        <div className="flex items-center gap-2 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          <span className="text-[8px] font-mono tracking-widest text-zinc-400 font-bold uppercase">
            CONNECTING TO STREAM PROVIDER...
          </span>
        </div>
      </div>
    );
  }

  const stateChip = (state: string) => {
    const map: Record<string, string> = {
      ARMED: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
      TESTED: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      HELD: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      COMPLETED: 'bg-zinc-700/30 border-zinc-600 text-zinc-300',
      INVALIDATED: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      ACTIVE: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      MITIGATED: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    };
    return map[state] || 'bg-zinc-800 border-zinc-700 text-zinc-300';
  };

  return (
    <div className="w-full space-y-4" id="dealerflow-main-workspace-view">
      {/* ============== HEADER STRIP ============== */}
      <div className={`${theme.cardBg} rounded-lg px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-4 justify-between`} id="dealerflow-header-strip">
        <div className="flex items-center gap-3.5">
          <div className={`w-9 h-9 rounded-md flex items-center justify-center ${theme.headerIconBg}`}>
            <Waves className={`w-4.5 h-4.5 ${theme.iconColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-widest text-white uppercase font-sans">
                Dealer Flow — {selectedAsset.ticker}
              </h1>
              <FeedChip feed={profile?.feed} />
            </div>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">
              Gamma exposure · hedging pressure · displacement zones · volatility engine · {selectedTimeframe}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {[
            { label: 'Net GEX', value: profile ? fmtBn(profile.netGex) : '—', tone: profile?.netGex >= 0 ? 'text-emerald-450 font-bold' : 'text-rose-450 font-bold', icon: <Layers className="w-3 h-3" /> },
            { label: 'Call Wall', value: profile?.callWall?.toFixed(0) ?? '—', tone: 'text-emerald-400 font-bold', icon: <ArrowUpRight className="w-3 h-3" /> },
            { label: 'Put Wall', value: profile?.putWall?.toFixed(0) ?? '—', tone: 'text-rose-400 font-bold', icon: <ArrowDownRight className="w-3 h-3" /> },
            { label: 'γ-Flip', value: profile?.gammaFlip?.toFixed(0) ?? '—', tone: 'text-amber-400 font-bold', icon: <Crosshair className="w-3 h-3" /> },
            { label: 'Pin Magnet', value: profile?.magnet?.toFixed(0) ?? '—', tone: 'text-sky-400 font-bold', icon: <Magnet className="w-3 h-3" /> },
          ].map(card => (
            <div key={card.label} className="bg-black/50 border border-zinc-900/60 rounded-md px-3 py-2 min-w-[86px]" id={`card-${card.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="flex items-center gap-1 text-[7.5px] font-black tracking-widest text-zinc-500 uppercase">
                {card.icon}
                {card.label}
              </div>
              <div className={`text-[13px] font-mono ${card.tone}`}>{card.value}</div>
            </div>
          ))}
        </div>
      </div>
      {/* ============== SUB-TABS SELECTOR SEAMLESS GRIDS ============== */}
      <div className="flex flex-wrap gap-2.5 justify-start items-center" id="dealerflow-subtabs-bar">
        <button
          onClick={() => setActiveEngineView('profile')}
          className={`flex items-center gap-2 px-4.5 py-2.5 font-mono text-[9px] font-black uppercase tracking-wider border rounded transition-all cursor-pointer ${
            activeEngineView === 'profile'
              ? theme.buttonActive
              : theme.buttonInactive
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          HEDGING PROFILE & LIQUIDITY MATRIX
        </button>
        <button
          onClick={() => setActiveEngineView('physics')}
          className={`flex items-center gap-2 px-4.5 py-2.5 font-mono text-[9px] font-black uppercase tracking-wider border rounded transition-all cursor-pointer ${
            activeEngineView === 'physics'
              ? 'bg-amber-500/10 border-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.12)]'
              : 'bg-[#060607]/45 border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          ARBOR INST. PHYSICS ENGINE & CASCADES
        </button>
      </div>

      {activeEngineView === 'profile' ? (
        <>
          {/* ============== MAIN GRID ============== */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4" id="dealerflow-main-grid">
            {/* GEX PROFILE (left, 2 cols) */}
            <div className={`${theme.cardBg} rounded-lg p-5`} id="gex-profile-chart-panel">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-[#a1a1aa] uppercase">
                  <Layers className={`w-3.5 h-3.5 ${theme.iconColor}`} />
                  Gamma Exposure By Strike
                  <span className="text-zinc-700">|</span>
                  <span className="text-zinc-550">$ per 1% move</span>
                </div>
                <div className="flex items-center gap-3 text-[8px] font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-[2px] bg-emerald-500/70 inline-block" /> Calls
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2 h-2 rounded-[2px] bg-rose-500/70 inline-block" /> Puts
                  </span>
                </div>
              </div>
              <GexProfileChart profile={profile} decimals={selectedAsset.decimals} />

              {/* OI footer */}
              {profile && (
                <div className="mt-4 pt-3 border-t border-zinc-900/60 grid grid-cols-3 gap-2 text-center" id="gex-profile-chart-oi-footer">
                  <div>
                    <div className="text-[7.5px] text-zinc-500 font-black uppercase tracking-widest">Call OI</div>
                    <div className="text-[12px] font-mono text-emerald-300 font-bold">{profile.totalCallOi?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[7.5px] text-zinc-500 font-black uppercase tracking-widest">Put OI</div>
                    <div className="text-[12px] font-mono text-rose-300 font-bold">{profile.totalPutOi?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[7.5px] text-zinc-500 font-black uppercase tracking-widest">C/P Ratio</div>
                    <div className="text-[12px] font-mono text-white font-bold">{profile.callPutOiRatio}</div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT RAIL */}
            <div className="space-y-4" id="dealerflow-right-rail-panel">
              {/* Dealer pressure */}
              <div className={`${theme.cardBg} rounded-lg p-4 space-y-3.5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-[#a1a1aa] uppercase">
                    <Activity className={`w-3.5 h-3.5 ${theme.iconColor}`} />
                    Dealer Buying Pressure
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-xs text-[8px] font-black tracking-widest uppercase border ${
                      (gauge?.bias || dm?.bias) === 'LONG GAMMA'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-bold'
                    }`}
                  >
                    {gauge?.bias || dm?.bias || '—'}
                  </span>
                </div>

                <PressureGauge gauge={gauge} theme={theme} />

                <p className="text-[9.5px] leading-relaxed text-zinc-400 border-l-2 border-zinc-800 pl-2.5">
                  {gauge?.headline || 'Awaiting chain data to resolve hedging pressure.'}
                </p>

                {/* Component provenance */}
                <div className="space-y-1.5 pt-1">
                  {(gauge?.components || []).map((c: any) => (
                    <div key={c.name} className="flex items-center gap-2" title={c.detail}>
                      <span className="w-[104px] shrink-0 text-[8px] text-zinc-500 font-bold uppercase tracking-wider">
                        {c.name}
                      </span>
                      <div className="flex-1 h-[5px] rounded-full bg-zinc-900 relative overflow-hidden">
                        <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-700" />
                        <div
                          className={`absolute inset-y-0 ${c.value >= 0 ? 'left-1/2 bg-emerald-500/80' : 'right-1/2 bg-rose-500/80'} rounded-full`}
                          style={{ width: `${Math.min(Math.abs(c.value) * 50, 50)}%` }}
                        />
                      </div>
                      <span className={`w-9 text-right text-[8.5px] font-mono font-bold ${c.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {(c.value * c.weight).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Volatility engine */}
              <VolatilityEngineCard vol={disp?.volatility} expectedMovePct={profile?.expectedMovePct} spot={profile?.spot} theme={theme} />

              {/* Structure read */}
              <div className={`${theme.cardBg} rounded-lg p-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-[#a1a1aa] uppercase">
                    <Crosshair className={`w-3.5 h-3.5 ${theme.iconColor}`} />
                    Market Structure (ICT)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-xs text-[8px] font-black tracking-widest uppercase border ${
                        disp?.structure?.trend === 'bullish'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                          : disp?.structure?.trend === 'bearish'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-bold'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-350'
                      }`}
                    >
                      {disp?.structure?.trend || 'neutral'}
                    </span>
                    {disp?.structure?.pricePosition && (
                      <span className="px-2 py-0.5 rounded-xs text-[8px] font-black tracking-widest uppercase border bg-zinc-950 border-zinc-800 text-zinc-400">
                        {disp.structure.pricePosition}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                  {(disp?.structure?.events || []).slice(-6).reverse().map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between text-[9px] font-mono bg-black/40 border border-zinc-900 rounded px-2 py-1">
                      <span className={`font-black ${e.kind === 'CHoCH' ? 'text-amber-450 font-bold' : e.direction === 'bullish' ? 'text-emerald-450' : 'text-rose-455'}`}>
                        {e.kind} {e.direction === 'bullish' ? '▲' : '▼'}
                      </span>
                      <span className="text-zinc-500">@ {Number(e.price).toFixed(selectedAsset.decimals)}</span>
                    </div>
                  ))}
                  {(!disp?.structure?.events || disp.structure.events.length === 0) && (
                    <div className="text-zinc-650 text-[9px] italic text-center py-2">No confirmed breaks in window</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ============== DISPLACEMENT INTELLIGENCE ROW ============== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="dealerflow-displacement-row">
            {/* Displacement zones */}
            <div className={`${theme.cardBg} rounded-lg p-4`} id="displacement-zones-panel">
              <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-[#a1a1aa] uppercase mb-3">
                <Zap className={`w-3.5 h-3.5 ${theme.iconColor}`} />
                Displacement Zones
                <span className="text-zinc-550 ml-auto font-mono text-[8px]">{(disp?.zones || []).length} tracked</span>
              </div>
              <div className="space-y-1.5 max-h-[230px] overflow-y-auto pr-1">
                {(disp?.zones || []).slice().reverse().map((z: any) => (
                  <div key={z.id} className="bg-black/40 border border-zinc-900 rounded-sm px-2.5 py-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-black uppercase ${z.type === 'bullish' ? 'text-emerald-450' : 'text-rose-400'}`}>
                        {z.type === 'bullish' ? '▲' : '▼'} {z.bottom.toFixed(selectedAsset.decimals)} – {z.top.toFixed(selectedAsset.decimals)}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-xs text-[7px] font-black tracking-widest uppercase border ${stateChip(z.state)}`}>
                        {z.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[8px] font-mono text-zinc-500">
                      <span>FORCE {z.atrMultiple}×ATR</span>
                      <span>BODY {(z.bodyDominance * 100).toFixed(0)}%</span>
                      <span className="text-amber-400 font-bold">SCORE {z.score}</span>
                    </div>
                  </div>
                ))}
                {(!disp?.zones || disp.zones.length === 0) && (
                  <div className="text-zinc-650 text-[9px] italic text-center py-6">
                    No displacement candles in the active window
                  </div>
                )}
              </div>
            </div>

            {/* Fair value gaps */}
            <div className={`${theme.cardBg} rounded-lg p-4`} id="fair-value-gaps-panel">
              <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-[#a1a1aa] uppercase mb-3">
                <Layers className={`w-3.5 h-3.5 ${theme.iconColor}`} />
                Fair Value Gaps
                <span className="text-zinc-550 ml-auto font-mono text-[8px]">{(disp?.fvgs || []).length} mapped</span>
              </div>
              <div className="space-y-1.5 max-h-[230px] overflow-y-auto pr-1">
                {(disp?.fvgs || []).slice().reverse().map((f: any) => (
                  <div key={f.id} className="bg-black/40 border border-zinc-900 rounded-sm px-2.5 py-1.5 flex items-center justify-between">
                    <div>
                      <span className={`text-[9px] font-black uppercase ${f.type === 'bullish' ? 'text-emerald-450' : 'text-rose-400'}`}>
                        {f.type === 'bullish' ? '▲ BISI' : '▼ SIBI'}
                      </span>
                      <span className="text-[8.5px] font-mono text-zinc-400 ml-2">
                        {f.bottom.toFixed(selectedAsset.decimals)} – {f.top.toFixed(selectedAsset.decimals)}
                      </span>
                      <div className="text-[7.5px] text-zinc-600 font-mono mt-0.5">EQ {f.equilibrium.toFixed(selectedAsset.decimals)}</div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-xs text-[7px] font-black tracking-widest uppercase border ${stateChip(f.state)}`}>
                      {f.state}
                    </span>
                  </div>
                ))}
                {(!disp?.fvgs || disp.fvgs.length === 0) && (
                  <div className="text-zinc-650 text-[9px] italic text-center py-6">No open imbalances detected</div>
                )}
              </div>
            </div>

            {/* Liquidity sweeps */}
            <div className={`${theme.cardBg} rounded-lg p-4`} id="liquidity-raids-panel">
              <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-[#a1a1aa] uppercase mb-3">
                <Droplets className={`w-3.5 h-3.5 ${theme.iconColor}`} />
                Liquidity Raids
                <span className="text-zinc-650 ml-auto font-mono text-[8px]">{(disp?.sweeps || []).length} events</span>
              </div>
              <div className="space-y-1.5 max-h-[230px] overflow-y-auto pr-1">
                {(disp?.sweeps || []).slice().reverse().map((s: any) => (
                  <div key={s.id} className="bg-black/40 border border-zinc-900 rounded-sm px-2.5 py-1.5 flex items-center justify-between">
                    <span className={`text-[8.5px] font-black uppercase ${s.type === 'bullish' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.label}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400">@ {Number(s.price).toFixed(selectedAsset.decimals)}</span>
                  </div>
                ))}
                {(!disp?.sweeps || disp.sweeps.length === 0) && (
                  <div className="text-zinc-650 text-[9px] italic text-center py-6">No stops taken in window</div>
                )}
              </div>
            </div>
          </div>

          {/* ============== CHART WITH ZONES ============== */}
          <div className={`${theme.cardBg} rounded-lg p-5`} id="displacement-overlay-chart-panel">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-[#a1a1aa] uppercase">
                <ShieldAlert className={`w-3.5 h-3.5 ${theme.iconColor}`} />
                Price Action — displacement & imbalance overlay
              </div>
              <FeedChip feed={serverState?.candle_feed} />
            </div>
            <div className="h-[300px] w-full">
              <InteractiveChart
                candles={candles}
                fvgs={disp?.fvgs || []}
                liquidityEvents={disp?.sweeps || []}
                timeframe={selectedTimeframe}
                selectedTicker={selectedAsset.ticker}
                priceDecimals={selectedAsset.decimals}
                showFVGs={true}
                showLiquiditySweeps={true}
                showDisplacementEvents={true}
              />
            </div>
          </div>
        </>
      ) : (
        <div id="institutional-physics-dash-wrapper">
          <InstitutionalPhysicsDashboard
            profile={profile}
            ticker={selectedAsset.ticker}
            decimals={selectedAsset.decimals}
          />
        </div>
      )}
    </div>
  );
}
