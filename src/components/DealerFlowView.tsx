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
import { ASSET_LIST } from '../data';

const fmtBn = (v: number) => `${v >= 0 ? '+' : '−'}$${Math.abs(v / 1e9).toFixed(2)}B`;
const fmtMn = (v: number) => `${v >= 0 ? '+' : '−'}$${Math.abs(v / 1e6).toFixed(1)}M`;
const fmtGreek = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1e9) {
    return `${v >= 0 ? '+' : '−'}$${(abs / 1e9).toFixed(2)}B`;
  }
  return `${v >= 0 ? '+' : '−'}$${(abs / 1e6).toFixed(1)}M`;
};

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
// Exposure profile chart (strikegex-style horizontal bars for GEX/DEX/VEX)
// ----------------------------------------------------------------
function ExposureProfileChart({ profile, decimals, type }: { profile: any; decimals: number; type: 'gex' | 'vex' | 'dex' }) {
  const themeMode = useContractStore(s => s.themeMode);
  const isLight = themeMode === 'light';

  const rows = useMemo(() => {
    const strikes: any[] = profile?.strikes || [];
    const mapped = strikes.map(s => {
      let callValue = 0, putValue = 0, netValue = 0;
      if (type === 'gex') {
        callValue = s.callGex;
        putValue = s.putGex;
        netValue = s.netGex;
      } else if (type === 'dex') {
        callValue = s.callDex || 0;
        putValue = s.putDex || 0;
        netValue = s.netDex || 0;
      } else if (type === 'vex') {
        callValue = s.callVex || 0;
        putValue = s.putVex || 0;
        netValue = s.netVex || 0;
      }
      return {
        strike: s.strike,
        callValue,
        putValue,
        netValue,
        callOi: s.callOi,
        putOi: s.putOi,
        callVolume: s.callVolume,
        putVolume: s.putVolume
      };
    });

    // Render at most 21 strikes centered around spot for readability.
    if (mapped.length <= 21) return mapped;
    const sorted = [...mapped].sort((a, b) => a.strike - b.strike);
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
  }, [profile, type]);

  if (!rows || rows.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 font-mono text-[11px]">
        Awaiting options chain data to calculate {type.toUpperCase()} profile...
      </div>
    );
  }

  const maxAbs = Math.max(...rows.map((r: any) => Math.max(Math.abs(r.callValue), Math.abs(r.putValue), Math.abs(r.netValue))), 1);
  const sortedDesc = [...rows].sort((a, b) => b.strike - a.strike);

  // Find the strike with max values for walls/pins dynamically for this exposure type
  const maxCallValStrike = rows.reduce((max, cur) => Math.abs(cur.callValue) > Math.abs(max.callValue) ? cur : max, rows[0])?.strike;
  const maxPutValStrike = rows.reduce((max, cur) => Math.abs(cur.putValue) > Math.abs(max.putValue) ? cur : max, rows[0])?.strike;

  const typeUpper = type.toUpperCase();
  const callColor = type === 'gex' ? 'emerald' : type === 'dex' ? 'sky' : 'indigo';
  const putColor = 'rose';

  const spotLine = useMemo(() => {
    if (!profile?.spot || rows.length === 0) return null;
    const strikes = rows.map((r: any) => r.strike);
    const maxStrike = Math.max(...strikes);
    const minStrike = Math.min(...strikes);
    const strikeRange = maxStrike - minStrike;
    
    const clampedSpot = Math.max(minStrike, Math.min(maxStrike, profile.spot));
    const pct = strikeRange > 0 ? (maxStrike - clampedSpot) / strikeRange : 0.5;
    
    // Each row is h-6 (24px) + space-y-[3px] (3px) = 27px.
    // The header is roughly 23px high.
    // The center of the i-th row is at: 23px + 12px + i * 27px.
    const spotY = 23 + 12 + pct * (rows.length - 1) * 27;
    return { spotY };
  }, [rows, profile?.spot]);

  return (
    <div className="space-y-[3px] relative">
      {/* Axis header */}
      <div className={`flex items-center text-[8px] font-black tracking-widest uppercase pb-1.5 border-b mb-1.5 ${
        isLight ? 'text-zinc-500 border-zinc-200' : 'text-zinc-600 border-zinc-900'
      }`}>
        <div className="w-[72px] shrink-0">Strike</div>
        <div className="flex-1 flex">
          <div className="flex-1 text-right pr-2 text-rose-400/70">← Put {typeUpper}</div>
          <div className={`w-px ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`} />
          <div className={`flex-1 pl-2 ${
            type === 'gex' ? 'text-emerald-400/70' : type === 'dex' ? 'text-sky-400/70' : 'text-indigo-400/70'
          }`}>Call {typeUpper} →</div>
        </div>
        <div className="w-[64px] text-right shrink-0">Net</div>
      </div>

      {sortedDesc.map((r: any) => {
        const callW = Math.min(100, (Math.abs(r.callValue) / maxAbs) * 100);
        const putW = Math.min(100, (Math.abs(r.putValue) / maxAbs) * 100);

        // Highlight max strikes
        const isCallMax = r.strike === maxCallValStrike;
        const isPutMax = r.strike === maxPutValStrike;
        const isSpot = Math.abs(r.strike - profile.spot) < 0.001; // exact match check or close to spot
        
        // Find if spot is between this strike and next
        const idx = sortedDesc.findIndex(row => row.strike === r.strike);
        const nextRow = sortedDesc[idx + 1];
        const flipBetween = nextRow && profile.gammaFlip > nextRow.strike && profile.gammaFlip <= r.strike;

        return (
          <div key={r.strike} className={`flex items-center text-[10px] h-6 border-b border-zinc-900/10 dark:border-zinc-900/30 ${
            isSpot ? (isLight ? 'bg-zinc-100/80' : 'bg-white/[0.03]') : ''
          }`}>
            {/* Strike column */}
            <div className={`w-[72px] shrink-0 text-[10px] font-bold font-mono pl-1 ${
              isSpot ? (isLight ? 'text-zinc-900 font-extrabold' : 'text-white') : isLight ? 'text-zinc-550' : 'text-zinc-500'
            }`}>
              {r.strike.toFixed(0)}
              {isCallMax && (
                <span className={`ml-1 text-[7px] align-middle font-black ${
                  type === 'gex' ? 'text-emerald-500 dark:text-emerald-400' : type === 'dex' ? 'text-sky-500 dark:text-sky-400' : 'text-indigo-500 dark:text-indigo-400'
                }`}>MAX</span>
              )}
              {isPutMax && <span className="text-rose-500 dark:text-rose-400 ml-1 text-[7px] align-middle font-black">MAX</span>}
            </div>

            <div className="flex-1 flex items-center h-full">
              {/* Put side */}
              <div className="relative group/put flex-1 flex justify-end items-center h-full pr-[1px]">
                <div
                  className={`h-[11px] rounded-l-[2px] ${isPutMax ? 'bg-rose-500' : 'bg-rose-500/55'} cursor-help`}
                  style={{ width: `${putW}%` }}
                />
                
                {/* Left Hover details for Put */}
                <div className={`absolute left-0 top-full mt-0.5 z-30 hidden group-hover/put:block border rounded-[4px] p-2 text-[9px] font-mono whitespace-nowrap shadow-2xl backdrop-blur-md pointer-events-none ring-1 ${
                  isLight 
                    ? 'bg-white border-rose-200/80 ring-rose-500/5 text-zinc-650' 
                    : 'bg-[#050506]/95 border-rose-500/35 ring-rose-500/10 text-zinc-300'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                    <span className={`font-black tracking-widest uppercase text-[8px] ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>PUT {typeUpper} OVERLAY</span>
                    <span className={isLight ? 'text-zinc-300' : 'text-zinc-650'}>|</span>
                    <span className={`font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>STRIKE {r.strike.toFixed(0)}</span>
                  </div>
                  <div className="space-y-0.5 text-left">
                    <div>{typeUpper}: <span className={`font-extrabold ${isLight ? 'text-rose-600' : 'text-rose-300'}`}>{fmtGreek(r.putValue)}</span></div>
                    <div>Open Interest: <span className={`font-bold ${isLight ? 'text-zinc-800' : 'text-zinc-100'}`}>{r.putOi.toLocaleString()}</span></div>
                    <div>Volume: <span className={`font-bold ${isLight ? 'text-zinc-800' : 'text-zinc-100'}`}>{r.putVolume.toLocaleString()}</span></div>
                  </div>
                </div>
              </div>

              <div className={`w-px self-stretch ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`} />

              {/* Call side */}
              <div className="relative group/call flex-1 flex justify-start items-center h-full pl-[1px]">
                <div
                  className={`h-[11px] rounded-r-[2px] ${
                    isCallMax
                      ? type === 'gex' ? 'bg-emerald-500' : type === 'dex' ? 'bg-sky-500' : 'bg-indigo-500'
                      : type === 'gex' ? 'bg-emerald-500/55' : type === 'dex' ? 'bg-sky-500/55' : 'bg-indigo-500/55'
                  } cursor-help`}
                  style={{ width: `${callW}%` }}
                />

                {/* Right Hover details for Call */}
                <div className={`absolute right-0 top-full mt-0.5 z-30 hidden group-hover/call:block border rounded-[4px] p-2 text-[9px] font-mono whitespace-nowrap shadow-2xl backdrop-blur-md pointer-events-none ring-1 ${
                  isLight 
                    ? 'bg-white border-zinc-200/80 ring-zinc-555/5 text-zinc-650' 
                    : 'bg-[#050506]/95 border-zinc-900 ring-zinc-850 text-zinc-300'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      type === 'gex' ? 'bg-emerald-400' : type === 'dex' ? 'bg-sky-400' : 'bg-indigo-400'
                    }`} />
                    <span className={`font-black tracking-widest uppercase text-[8px] ${
                      isLight
                        ? type === 'gex' ? 'text-emerald-600' : type === 'dex' ? 'text-sky-600' : 'text-indigo-600'
                        : type === 'gex' ? 'text-emerald-400' : type === 'dex' ? 'text-sky-400' : 'text-indigo-400'
                    }`}>CALL {typeUpper} OVERLAY</span>
                    <span className={isLight ? 'text-zinc-300' : 'text-zinc-650'}>|</span>
                    <span className={`font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>STRIKE {r.strike.toFixed(0)}</span>
                  </div>
                  <div className="space-y-0.5 text-left">
                    <div>{typeUpper}: <span className={`font-extrabold ${
                      isLight
                        ? type === 'gex' ? 'text-emerald-600' : type === 'dex' ? 'text-sky-600' : 'text-indigo-600'
                        : type === 'gex' ? 'text-emerald-300' : type === 'dex' ? 'text-sky-300' : 'text-indigo-300'
                    }`}>{fmtGreek(r.callValue)}</span></div>
                    <div>Open Interest: <span className={`font-bold ${isLight ? 'text-zinc-800' : 'text-zinc-100'}`}>{r.callOi.toLocaleString()}</span></div>
                    <div>Volume: <span className={`font-bold ${isLight ? 'text-zinc-800' : 'text-zinc-100'}`}>{r.callVolume.toLocaleString()}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Column */}
            <div className={`w-[64px] shrink-0 text-right text-[8.5px] font-mono pr-1 ${
              r.netValue >= 0 
                ? type === 'gex' ? 'text-emerald-400/90' : type === 'dex' ? 'text-sky-400/90' : 'text-indigo-400/90' 
                : 'text-rose-400/90'
            }`}>
              {fmtGreek(r.netValue)}
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

      {/* FLOATING LASER SPOT GLIDER */}
      {spotLine && (
        <motion.div
          className="absolute left-0 right-0 z-20 pointer-events-none"
          style={{ top: 0, originY: 0.5 }}
          animate={{
            y: spotLine.spotY
          }}
          transition={{
            type: "spring",
            stiffness: 90,
            damping: 18
          }}
        >
          <div className="relative flex items-center">
            {/* Laser beam emitter core */}
            <div className={`absolute -left-1.5 w-2.5 h-2.5 bg-white rounded-full border animate-pulse ${
              type === 'gex' 
                ? 'border-emerald-400 shadow-[0_0_8px_rgba(48,209,88,0.8)]' 
                : type === 'dex' 
                  ? 'border-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.8)]' 
                  : 'border-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]'
            }`} />
            
            {/* White-to-accent gradient laser glow line */}
            <div className={`w-full h-[1.5px] bg-gradient-to-r from-white to-transparent ${
              type === 'gex' 
                ? 'via-emerald-400 shadow-[0_0_6px_rgba(48,209,88,0.4)]' 
                : type === 'dex' 
                  ? 'via-sky-400 shadow-[0_0_6px_rgba(14,165,233,0.4)]' 
                  : 'via-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.4)]'
            }`} />
            
            {/* Floating centered coordinates tag */}
            <div className={`absolute left-1/2 -translate-x-1/2 -top-3 px-2 py-0.5 rounded-xs font-mono font-black text-[7.5px] uppercase shadow-lg flex items-center gap-1 border z-30 ${
              isLight 
                ? 'bg-white text-zinc-900 border-zinc-200' 
                : 'bg-black/90 text-white border-zinc-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-ping ${
                type === 'gex' ? 'bg-emerald-400' : type === 'dex' ? 'bg-sky-400' : 'bg-indigo-400'
              }`} />
              <span>SPOT: {profile.spot.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>
      )}
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
  const setSelectedAsset = useContractStore(s => s.setSelectedAsset);
  const selectedTimeframe = useContractStore(s => s.selectedTimeframe);
  const [activeEngineView, setActiveEngineView] = useState<'profile' | 'physics'>('profile');

  // Load contract selector parameters to map Call/Put styles (or white-glass defaults)
  const selectedOptionType = useContractStore(s => s.selectedOptionType);
  const selectedStrike = useContractStore(s => s.selectedStrike);
  const isContractLocked = useContractStore(s => s.isContractLocked);
  const activeTab = useContractStore(s => s.activeTab);
  const themeMode = useContractStore(s => s.themeMode);
  const isLight = themeMode === 'light';

  const isConSelected = isContractLocked && activeTab === 'skyvision';
  const isCall = selectedOptionType === 'C';

  // Dynamic Theme Styling Object (Neutral Glass-White vs calls green vs puts red)
  const theme = useMemo(() => {
    if (isLight) {
      if (!isConSelected) {
        return {
          accent: 'black',
          text: 'text-zinc-650',
          border: 'border-zinc-200 hover:border-zinc-350',
          cardBg: 'bg-white border border-zinc-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)]',
          chipBg: 'bg-zinc-100 border border-zinc-200 text-zinc-650',
          iconColor: 'text-zinc-550',
          headerIconBg: 'bg-zinc-100 border border-zinc-200',
          glow: 'rgba(0, 0, 0, 0.01)',
          primaryText: 'text-zinc-900',
          buttonActive: 'bg-zinc-900 border border-zinc-950 text-white shadow-sm',
          buttonInactive: 'bg-zinc-50 border border-zinc-250 text-zinc-500 hover:text-zinc-800 hover:border-zinc-350',
          gexNetPlus: 'text-emerald-600 font-bold',
          gexNetMinus: 'text-rose-600',
          themeSuffix: 'neutral',
          headerColor: 'text-zinc-900',
        };
      }
      
      if (isCall) {
        return {
          accent: 'emerald',
          text: 'text-emerald-700',
          border: 'border-emerald-200 hover:border-emerald-350',
          cardBg: 'bg-[#e6fcf0] border border-emerald-200/80 shadow-[0_4px_24px_rgba(16,185,129,0.03)]',
          chipBg: 'bg-emerald-100 border border-emerald-200 text-emerald-800',
          iconColor: 'text-emerald-600',
          headerIconBg: 'bg-emerald-100 border border-emerald-200',
          glow: 'rgba(16, 185, 129, 0.04)',
          primaryText: 'text-emerald-950',
          buttonActive: 'bg-emerald-600 border border-emerald-750 text-white shadow-sm',
          buttonInactive: 'bg-emerald-50 border border-emerald-250 text-emerald-600 hover:bg-emerald-100',
          gexNetPlus: 'text-emerald-600 font-bold',
          gexNetMinus: 'text-rose-600',
          themeSuffix: 'call',
          headerColor: 'text-emerald-950',
        };
      } else {
        return {
          accent: 'rose',
          text: 'text-rose-700',
          border: 'border-rose-200 hover:border-rose-350',
          cardBg: 'bg-[#fdf2f2] border border-rose-200/80 shadow-[0_4px_24px_rgba(244,63,94,0.03)]',
          chipBg: 'bg-rose-100 border border-rose-200 text-rose-800',
          iconColor: 'text-rose-600',
          headerIconBg: 'bg-rose-100 border border-rose-200',
          glow: 'rgba(244, 63, 94, 0.04)',
          primaryText: 'text-rose-955',
          buttonActive: 'bg-rose-600 border border-rose-750 text-white shadow-sm',
          buttonInactive: 'bg-rose-50 border border-rose-250 text-rose-650 hover:bg-rose-100',
          gexNetPlus: 'text-emerald-600 font-bold',
          gexNetMinus: 'text-rose-600',
          themeSuffix: 'put',
          headerColor: 'text-rose-955',
        };
      }
    }

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
      {/* Index Selector (Level 2 Brand Header Context) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#050505] border border-zinc-900 p-3.5 rounded-sm gap-2">
        <div className="flex gap-2 items-center">
          <Zap className="w-4 h-4 text-zinc-400 animate-pulse" />
          <span className="text-[8.5px] text-zinc-550 uppercase tracking-widest font-black">SLAYER ACTIVE TERMINAL CORE // DEALER INVENTORY</span>
        </div>
        
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-black p-0.5 border border-zinc-900 rounded-sm">
            {ASSET_LIST.map(asset => (
              <button
                key={asset.ticker}
                type="button"
                onClick={() => setSelectedAsset(asset)}
                className={`px-3.5 py-1 text-[9px] uppercase font-black tracking-widest rounded-xs transition-all cursor-pointer ${
                  selectedAsset.ticker === asset.ticker
                    ? 'bg-zinc-800 text-white font-extrabold shadow'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {asset.ticker}
              </button>
            ))}
          </div>
        </div>
      </div>
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
            {/* GEX PROFILE */}
            <div className={`${theme.cardBg} rounded-lg p-5`} id="gex-profile-chart-panel">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-[#a1a1aa] uppercase">
                  <Layers className={`w-3.5 h-3.5 ${theme.iconColor}`} />
                  Gamma Exposure (GEX)
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
              <ExposureProfileChart profile={profile} decimals={selectedAsset.decimals} type="gex" />

              {/* GEX footer */}
              {profile && (
                <div className="mt-4 pt-3 border-t border-zinc-900/60 grid grid-cols-3 gap-2 text-center" id="gex-profile-chart-oi-footer">
                  <div>
                    <div className="text-[7.5px] text-zinc-500 font-black uppercase tracking-widest">Call GEX</div>
                    <div className="text-[11px] font-mono text-emerald-300 font-bold">{fmtGreek(profile.strikes.reduce((acc, cur) => acc + (cur.callGex || 0), 0))}</div>
                  </div>
                  <div>
                    <div className="text-[7.5px] text-zinc-500 font-black uppercase tracking-widest">Put GEX</div>
                    <div className="text-[11px] font-mono text-rose-300 font-bold">{fmtGreek(profile.strikes.reduce((acc, cur) => acc + (cur.putGex || 0), 0))}</div>
                  </div>
                  <div>
                    <div className="text-[7.5px] text-zinc-500 font-black uppercase tracking-widest">Net GEX</div>
                    <div className="text-[11px] font-mono text-white font-bold">{fmtGreek(profile.netGex)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* DEX PROFILE */}
            <div className={`${theme.cardBg} rounded-lg p-5`} id="dex-profile-chart-panel">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-[#a1a1aa] uppercase">
                  <Waves className={`w-3.5 h-3.5 ${theme.iconColor}`} />
                  Delta Exposure (DEX)
                  <span className="text-zinc-700">|</span>
                  <span className="text-zinc-550">$ per 1% spot move</span>
                </div>
                <div className="flex items-center gap-3 text-[8px] font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1 text-sky-400">
                    <span className="w-2 h-2 rounded-[2px] bg-sky-500/70 inline-block" /> Calls
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2 h-2 rounded-[2px] bg-rose-500/70 inline-block" /> Puts
                  </span>
                </div>
              </div>
              <ExposureProfileChart profile={profile} decimals={selectedAsset.decimals} type="dex" />

              {/* DEX footer */}
              {profile && (
                <div className="mt-4 pt-3 border-t border-zinc-900/60 grid grid-cols-3 gap-2 text-center" id="dex-profile-chart-footer">
                  <div>
                    <div className="text-[7.5px] text-zinc-500 font-black uppercase tracking-widest">Call DEX</div>
                    <div className="text-[11px] font-mono text-sky-300 font-bold">{fmtGreek(profile.strikes.reduce((acc, cur) => acc + (cur.callDex || 0), 0))}</div>
                  </div>
                  <div>
                    <div className="text-[7.5px] text-zinc-500 font-black uppercase tracking-widest">Put DEX</div>
                    <div className="text-[11px] font-mono text-rose-300 font-bold">{fmtGreek(profile.strikes.reduce((acc, cur) => acc + (cur.putDex || 0), 0))}</div>
                  </div>
                  <div>
                    <div className="text-[7.5px] text-zinc-500 font-black uppercase tracking-widest">Net DEX</div>
                    <div className="text-[11px] font-mono text-white font-bold">{fmtGreek(profile.strikes.reduce((acc, cur) => acc + (cur.netDex || 0), 0))}</div>
                  </div>
                </div>
              )}
            </div>

            {/* VEX PROFILE */}
            <div className={`${theme.cardBg} rounded-lg p-5`} id="vex-profile-chart-panel">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-[#a1a1aa] uppercase">
                  <Zap className={`w-3.5 h-3.5 ${theme.iconColor}`} />
                  Vega Exposure (VEX)
                  <span className="text-zinc-700">|</span>
                  <span className="text-zinc-550">$ per 1% vol shift</span>
                </div>
                <div className="flex items-center gap-3 text-[8px] font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1 text-indigo-400">
                    <span className="w-2 h-2 rounded-[2px] bg-indigo-500/70 inline-block" /> Calls
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2 h-2 rounded-[2px] bg-rose-500/70 inline-block" /> Puts
                  </span>
                </div>
              </div>
              <ExposureProfileChart profile={profile} decimals={selectedAsset.decimals} type="vex" />

              {/* VEX footer */}
              {profile && (
                <div className="mt-4 pt-3 border-t border-zinc-900/60 grid grid-cols-3 gap-2 text-center" id="vex-profile-chart-footer">
                  <div>
                    <div className="text-[7.5px] text-zinc-500 font-black uppercase tracking-widest">Call VEX</div>
                    <div className="text-[11px] font-mono text-indigo-300 font-bold">{fmtGreek(profile.strikes.reduce((acc, cur) => acc + (cur.callVex || 0), 0))}</div>
                  </div>
                  <div>
                    <div className="text-[7.5px] text-zinc-500 font-black uppercase tracking-widest">Put VEX</div>
                    <div className="text-[11px] font-mono text-rose-300 font-bold">{fmtGreek(profile.strikes.reduce((acc, cur) => acc + (cur.putVex || 0), 0))}</div>
                  </div>
                  <div>
                    <div className="text-[7.5px] text-zinc-500 font-black uppercase tracking-widest">Net VEX</div>
                    <div className="text-[11px] font-mono text-white font-bold">{fmtGreek(profile.strikes.reduce((acc, cur) => acc + (cur.netVex || 0), 0))}</div>
                  </div>
                </div>
              )}
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
