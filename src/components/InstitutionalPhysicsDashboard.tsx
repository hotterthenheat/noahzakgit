/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  RotateCcw,
  Sliders,
  HelpCircle,
  Activity,
  Zap,
  Layers,
  Sparkles,
  ShieldAlert,
  Clock,
  TrendingUp,
  Gauge,
  Briefcase,
  Flame,
  ArrowRight,
  RefreshCw,
  Skull
} from 'lucide-react';
import { GexProfileData, GexStrikeDetail } from '../types';
import { useContractStore } from '../lib/store';

// PDF & CDF Helpers
function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.39894228 * Math.exp(-x * x / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x > 0 ? 1 - p : p;
}

// Option Greeks mathematical payload
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

interface DashboardProps {
  profile: GexProfileData;
  ticker: string;
  decimals: number;
}

export function InstitutionalPhysicsDashboard({ profile, ticker, decimals }: DashboardProps) {
  const strikes: GexStrikeDetail[] = useMemo(() => profile?.strikes || [], [profile]);
  const baseSpot = profile?.spot || 5000;
  
  // States for 3D Mesh
  const [rot, setRot] = useState<number>(35);
  const [elev, setElev] = useState<number>(45);
  const [zoom, setZoom] = useState<number>(1.0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, isDown: false });

  // States for Active Greeks Contract
  const availableStrikes = useMemo(() => {
    if (strikes.length > 0) return strikes.map(s => s.strike);
    return [Math.round(baseSpot), Math.round(baseSpot * 0.98), Math.round(baseSpot * 1.02)];
  }, [strikes, baseSpot]);
  const [selectedStrike, setSelectedStrike] = useState<number>(availableStrikes[0] || Math.round(baseSpot));
  useEffect(() => {
    if (availableStrikes.length > 0 && !availableStrikes.includes(selectedStrike)) {
      setSelectedStrike(availableStrikes[Math.floor(availableStrikes.length / 2)]);
    }
  }, [availableStrikes, selectedStrike]);

  const [testSpot, setTestSpot] = useState<number>(baseSpot);
  useEffect(() => {
    setTestSpot(baseSpot);
  }, [baseSpot]);

  const [testSigma, setTestSigma] = useState<number>(profile?.expectedMovePct ? profile.expectedMovePct * 10 : 0.15);
  const [selectedContractType, setSelectedContractType] = useState<'neutral' | 'call' | 'put'>('neutral');

  // Global Store values to seamlessly sync option states with the 3D surface grid
  const storeOptionType = useContractStore(s => s.selectedOptionType);
  const storeStrikeGlobal = useContractStore(s => s.selectedStrike);
  const setStoreOptionType = useContractStore(s => s.setSelectedOptionType);
  const setStoreStrikeGlobal = useContractStore(s => s.setSelectedStrike);

  // Synchronize 3D surface map and local inputs when global strike or type changes
  useEffect(() => {
    if (storeStrikeGlobal === null) {
      setSelectedContractType('neutral');
    } else {
      setSelectedContractType(storeOptionType === 'C' ? 'call' : 'put');
      setSelectedStrike(storeStrikeGlobal);
    }
  }, [storeStrikeGlobal, storeOptionType]);

  // Math calculated Greeks results
  const subGreeks = useMemo(() => {
    return calculateGreeksTS(testSpot, selectedStrike, 0.05, testSigma, 0.045, 0.012, selectedContractType === 'neutral' ? 'call' : selectedContractType);
  }, [testSpot, selectedStrike, testSigma, selectedContractType]);

  // States for Cascade Simulator
  const [simSpot, setSimSpot] = useState<number>(baseSpot);
  useEffect(() => {
    setSimSpot(baseSpot);
  }, [baseSpot]);

  const [simPositionSide, setSimPositionSide] = useState<'Calls' | 'Puts'>('Calls');
  const [liquidityRegime, setLiquidityRegime] = useState<'normal' | 'event' | 'systemic'>('normal');
  const [isRunningSim, setIsRunningSim] = useState<boolean>(false);
  const [simSteps, setSimSteps] = useState<any[]>([]);
  const [simOutputLog, setSimOutputLog] = useState<string[]>([]);
  const [macroMultiplier, setMacroMultiplier] = useState<number>(1.0);

  // States for Event Divergence Panel
  const [pastPositioning, setPastPositioning] = useState<'BULLISH SKEW' | 'BEARISH SKEW'>('BULLISH SKEW');
  const [announcementOutput, setAnnouncementOutput] = useState<'POSITIVE OUTCOME' | 'NEGATIVE OUTCOME'>('POSITIVE OUTCOME');

  // Calculation for Divergence Risk
  const divergenceAnalysis = useMemo(() => {
    const isMatching = 
      (pastPositioning === 'BULLISH SKEW' && announcementOutput === 'POSITIVE OUTCOME') ||
      (pastPositioning === 'BEARISH SKEW' && announcementOutput === 'NEGATIVE OUTCOME');
    
    let riskLevel: 'LOW' | 'HIGH' | 'EXTREME' = 'LOW';
    let shockMultiplier = 1.0;
    let comment = '';

    if (pastPositioning === 'BULLISH SKEW' && announcementOutput === 'NEGATIVE OUTCOME') {
      riskLevel = 'EXTREME';
      shockMultiplier = 2.45;
      comment = 'Over-leveraged option buyers trapped. Forced selling cascade of delta hedges creates immediate downside spiral.';
    } else if (pastPositioning === 'BEARISH SKEW' && announcementOutput === 'POSITIVE OUTCOME') {
      riskLevel = 'EXTREME';
      shockMultiplier = 2.15;
      comment = 'Dealers caught heavily short upside calls as IV implodes can create rapid, forced buying pressure (Vanna squeeze).';
    } else {
      riskLevel = 'LOW';
      comment = 'Aligns with existing institutional skew grids. Orderly deleveraging post-announcement.';
    }

    return { riskLevel, shockMultiplier, comment };
  }, [pastPositioning, announcementOutput]);

  // States for MOC Auction imbalance
  const [imbalanceSide, setImbalanceSide] = useState<'BUY' | 'SELL' | 'NEUTRAL'>('NEUTRAL');
  const [imbalanceSize, setImbalanceSize] = useState<number>(250); // Millions
  const [clockMinutes, setClockMinutes] = useState<number>(45); // 15:45 - 16:00

  const isMocActive = clockMinutes >= 50;
  const mocIntensity = useMemo(() => {
    if (!isMocActive) return 0;
    const progress = (clockMinutes - 50) / 10; // 0..1
    const sizeWeight = imbalanceSize >= 500 ? 1.5 : 0.8;
    return progress * sizeWeight;
  }, [clockMinutes, isMocActive, imbalanceSize]);

  // Campaign States machine
  const [oiTrend, setOiTrend] = useState<number>(55); // Rate
  const [volVelocity, setVolVelocity] = useState<number>(42);
  const campaignMachine = useMemo(() => {
    const acceleration = oiTrend * 1.5 + volVelocity * 0.8;
    let status = 'SPECULATIVE EXPOSURE';
    let completion = 50;
    let badgeColor = 'text-sky-400 border-sky-400/30 bg-sky-500/10';

    if (acceleration > 120) {
      status = 'EXHAUSTION CLIMAX';
      completion = 95;
      badgeColor = 'text-rose-400 border-rose-400/30 bg-rose-500/10';
    } else if (acceleration > 80) {
      status = 'ACTIVE INST. CAMPAIGN';
      completion = 78;
      badgeColor = 'text-amber-400 border-amber-400/30 bg-amber-500/10';
    } else if (acceleration > 45) {
      status = 'SECURE ACCUMULATION';
      completion = 48;
      badgeColor = 'text-emerald-400 border-emerald-400/30 bg-emerald-500/10';
    } else {
      status = 'POSITION BUILDING / SHUFFLE';
      completion = 20;
      badgeColor = 'text-zinc-400 border-zinc-700 bg-zinc-900/60';
    }

    return { status, completion, badgeColor, acceleration };
  }, [oiTrend, volVelocity]);

  // Handle Dragging Canvas to Rotate 3D topography
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    mouseRef.current = { x: e.clientX, y: e.clientY, isDown: true };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mouseRef.current.isDown) return;
    const dx = e.clientX - mouseRef.current.x;
    const dy = e.clientY - mouseRef.current.y;
    mouseRef.current = { x: e.clientX, y: e.clientY, isDown: true };

    setRot(prev => {
      let next = prev - dx * 0.5;
      if (next > 180) next -= 360;
      if (next < -180) next += 360;
      return next;
    });

    setElev(prev => {
      const next = prev + dy * 0.5;
      return Math.max(15, Math.min(85, next));
    });
  };

  const handleMouseUpOrLeave = () => {
    mouseRef.current.isDown = false;
  };

  // 3D Canvas Rendering Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resolution scaling for retina
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    
    // Fill background of the canvas area with a beautiful subtle glass-white glow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, 0, w, h);
    
    // Draw an extra soft central light reflection
    const cx = w / 2;
    const cy = h / 2 - 10;
    const gradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, Math.max(w, h) * 0.75);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Generate 3D Grid points
    const gridSize = 25; // 25x25 points grid
    const points: { xProj: number; yProj: number; zVal: number; x3: number; y3: number; z3: number }[][] = [];

    // Grid coordinates
    const scaleFactor = 1.3 * zoom;
    const maxValOnAxis = 200;

    // Nearest strikes to represent peaks
    const peaks = strikes.slice(0, 5).map(s => ({
      strikeOfs: (s.strike - baseSpot) / baseSpot * maxValOnAxis * 1.5,
      netGex: s.netGex
    }));

    for (let i = 0; i < gridSize; i++) {
      const u = (i / (gridSize - 1) - 0.5) * 2; // -1 to 1
      const xVal3d = u * maxValOnAxis;

      points[i] = [];
      for (let j = 0; j < gridSize; j++) {
        const v = (j / (gridSize - 1) - 0.5) * 2; // -1 to 1
        const yVal3d = v * maxValOnAxis;

        // Compute simulated Z using the active mathematical formula for hedging topography
        // Combine a saddle shape (variance shift vs spot shift) with spikes near strike GEX walls
        let zVal3d = 12 * Math.sin(u * 3) * Math.cos(v * 3);

        // Add GEX Peak/Troughs influences based on the contract selection state
        if (selectedContractType === 'call') {
          peaks.forEach(peak => {
            const dist = Math.abs(xVal3d - peak.strikeOfs);
            if (dist < 40) {
              const influence = Math.cos((dist / 40) * Math.PI / 2); // 1 to 0
              const magnitude = Math.max(30, Math.abs(peak.netGex || 40) * 0.55);
              zVal3d += magnitude * influence * (1 - Math.abs(v) * 0.4);
            }
          });
        } else if (selectedContractType === 'put') {
          peaks.forEach(peak => {
            const dist = Math.abs(xVal3d - peak.strikeOfs);
            if (dist < 40) {
              const influence = Math.cos((dist / 40) * Math.PI / 2); // 1 to 0
              const magnitude = Math.max(30, Math.abs(peak.netGex || 45) * 0.55);
              zVal3d -= magnitude * influence * (1 - Math.abs(v) * 0.4);
            }
          });
        } else {
          // Neutral: a symmetrical balance shift representing standard hedging options equilibrium
          peaks.forEach((peak, idx) => {
            const dist = Math.abs(xVal3d - peak.strikeOfs);
            if (dist < 40) {
              const influence = Math.cos((dist / 40) * Math.PI / 2); // 1 to 0
              const sign = idx % 2 === 0 ? 1 : -1;
              zVal3d += 18 * sign * influence * (1 - Math.abs(v) * 0.4);
            }
          });
        }

        // Add volatility variance warp (saddle)
        zVal3d += (u * u - v * v) * 8;

        // Limit range
        zVal3d = Math.max(-100, Math.min(100, zVal3d));

        // 3D Rotations
        const radRot = (rot * Math.PI) / 180;
        const radElev = (elev * Math.PI) / 180;

        // Yaw Rotation around Z-axis
        const rx1 = xVal3d * Math.cos(radRot) - yVal3d * Math.sin(radRot);
        const ry1 = xVal3d * Math.sin(radRot) + yVal3d * Math.cos(radRot);

        // Pitch forward Elevation (Rotation around horizontal grid axis)
        const rx2 = rx1;
        const ry2 = ry1 * Math.cos(radElev) - zVal3d * Math.sin(radElev);
        const rz2 = ry1 * Math.sin(radElev) + zVal3d * Math.cos(radElev);

        // Projected 2D points centered
        const px = cx + rx2 * scaleFactor;
        const py = cy + ry2 * scaleFactor - 15;

        points[i][j] = {
          xProj: px,
          yProj: py,
          zVal: zVal3d,
          x3: xVal3d,
          y3: yVal3d,
          z3: zVal3d
        };
      }
    }

    // Render wireframe rows to make depth sorting simpler
    ctx.lineWidth = 0.95;

    for (let i = 0; i < gridSize - 1; i++) {
      for (let j = 0; j < gridSize - 1; j++) {
        const p0 = points[i][j];
        const p1 = points[i + 1][j];
        const p2 = points[i + 1][j + 1];
        const p3 = points[i][j + 1];

        // Average height for color mapping
        const avgZ = (p0.zVal + p1.zVal + p2.zVal + p3.zVal) / 4;

        // Color mapped by GEX pressure vector (Emerald for support/long gamma, Rose for resistance/short gamma, Indigo for neutral)
        let strokeColor = 'rgba(255, 255, 255, 0.4)';
        let fillColor = 'rgba(255, 255, 255, 0.05)';

        if (selectedContractType === 'call') {
          // Emerald tones for call options
          const strength = Math.min(1.0, Math.max(0, (avgZ + 50) / 100));
          strokeColor = `rgba(16, 185, 129, ${0.28 + strength * 0.47})`;
          fillColor = `rgba(16, 185, 129, ${0.01 + strength * 0.09})`;
        } else if (selectedContractType === 'put') {
          // Rose red tones for put options
          const strength = Math.min(1.0, Math.max(0, (avgZ + 50) / 100));
          strokeColor = `rgba(244, 63, 94, ${0.28 + strength * 0.47})`;
          fillColor = `rgba(244, 63, 94, ${0.01 + strength * 0.09})`;
        } else {
          // Dynamic translucent white frosted glass looks
          const strength = Math.min(1.0, Math.max(0, (avgZ + 50) / 100));
          strokeColor = `rgba(255, 255, 255, ${0.28 + strength * 0.37})`;
          fillColor = `rgba(255, 255, 255, ${0.01 + strength * 0.06})`;
        }

        ctx.fillStyle = fillColor;
        ctx.strokeStyle = strokeColor;

        // Poly draw
        ctx.beginPath();
        ctx.moveTo(p0.xProj, p0.yProj);
        ctx.lineTo(p1.xProj, p1.yProj);
        ctx.lineTo(p2.xProj, p2.yProj);
        ctx.lineTo(p3.xProj, p3.yProj);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Draw central spot axis crosshair on topography
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 4]);

    // Center longitudinal vector line
    const startY = points[Math.floor(gridSize / 2)][0];
    const endY = points[Math.floor(gridSize / 2)][gridSize - 1];
    ctx.beginPath();
    ctx.moveTo(startY.xProj, startY.yProj);
    ctx.lineTo(endY.xProj, endY.yProj);
    ctx.stroke();

    // Center lateral vector line
    const startX = points[0][Math.floor(gridSize / 2)];
    const endX = points[gridSize - 1][Math.floor(gridSize / 2)];
    ctx.beginPath();
    ctx.moveTo(startX.xProj, startX.yProj);
    ctx.lineTo(endX.xProj, endX.yProj);
    ctx.stroke();
    
    ctx.setLineDash([]); // clear dash

    // UI overlays: Draw bounding box anchors or direction indicator lines
    if (selectedContractType === 'call') {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
    } else if (selectedContractType === 'put') {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.9)';
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    }
    ctx.font = 'bold 8px monospace';
    // Label call wall peak
    const rightSidePt = points[gridSize - 1][Math.floor(gridSize / 2)];
    ctx.fillText('+SPOT SHIFT', rightSidePt.xProj + 5, rightSidePt.yProj);

    const leftSidePt = points[0][Math.floor(gridSize / 2)];
    ctx.fillText('-SPOT SHIFT', leftSidePt.xProj - 72, leftSidePt.yProj);

    const topVolPt = points[Math.floor(gridSize / 2)][gridSize - 1];
    ctx.fillText('+IV VARIATION', topVolPt.xProj - 34, topVolPt.yProj + 14);

  }, [rot, elev, zoom, strikes, baseSpot, profile, selectedContractType]);

  // Execute Hedging Cascade Simulation Method
  const triggerCascadeSimulation = () => {
    if (isRunningSim) return;
    setIsRunningSim(true);
    setSimSteps([]);
    setSimOutputLog(['[INIT] Acquiring dealer order grids...']);

    // Set dynamic parameters based on selected options
    const multiplier = liquidityRegime === 'normal' ? 1.0 : liquidityRegime === 'event' ? 0.35 : 0.10;
    setMacroMultiplier(multiplier);

    const logs: string[] = [
      `[LAUNCH] Cascade simulation started for ${ticker} under ${liquidityRegime.toUpperCase()} regime.`,
      `[CONFIG] Liquidity capacity coefficient adjusted to ${multiplier.toFixed(2)}x.`,
      `[FLOW] Initial injection trigger: ${simPositionSide === 'Calls' ? '+15,000 Call Gamma Hedging blocks buys' : '-18,500 Put Gamma Hedging blocks sells'}.`,
    ];

    let currentSpot = simSpot;
    const computedSteps: any[] = [];
    const stepCount = 25;
    let index = 0;

    const runLoop = setInterval(() => {
      if (index >= stepCount) {
        clearInterval(runLoop);
        setIsRunningSim(false);
        setSimSteps(computedSteps);
        setSimOutputLog(prev => [...prev, `[COMPLETE] Simulation terminated. Systemic state resolved. Convergence reached.`]);
        return;
      }

      // Physics Math for spot change
      // Delta dollars vector formula: dS = G * Y / L
      const spotDeviationPct = (currentSpot - baseSpot) / baseSpot;
      const decayCoeff = Math.exp(-index * 0.12); // step decay of trade size
      
      // Compute exposure influence dynamically using Black-Scholes Greeks
      const testStrike = selectedStrike;
      const greeks = calculateGreeksTS(currentSpot, testStrike, 0.05 - index * 0.001, 0.15, 0.045, 0.012, simPositionSide === 'Calls' ? 'call' : 'put');
      
      const resValY = 0.00015; // Resilience impact
      const exposureSign = simPositionSide === 'Calls' ? 1 : -1;
      
      // Systemic Delta feedback looping
      const netGammaFlow = greeks.gamma * currentSpot * 14000 * decayCoeff * exposureSign;
      const priceImpact = (netGammaFlow * resValY) / multiplier; // dS
      
      const newSpot = currentSpot + priceImpact;
      const shiftPct = ((newSpot - simSpot) / simSpot) * 100;

      // Classify systemic vulnerability index
      // High speed means unstable acceleration
      const speedAbs = Math.abs(greeks.speed) * 1e5;
      let fragilityType = 'STABLE';
      let fragilityColor = 'text-emerald-400';
      if (speedAbs > 8) {
        fragilityType = 'CRITICAL OVER-EXPOSURE';
        fragilityColor = 'text-rose-500 font-black'; // Removed animate-pulse
      } else if (speedAbs > 3.5) {
        fragilityType = 'SENSITIVE FRICTION';
        fragilityColor = 'text-amber-400 font-bold';
      }

      const logText = `Step ${String(index + 1).padStart(2, '0')}: Spot shifts to $${newSpot.toFixed(decimals)} | Flow: ${netGammaFlow >= 0 ? '+' : ''}${(netGammaFlow / 1e6).toFixed(1)}M | Impact: ${priceImpact >= 0 ? '+' : ''}${priceImpact.toFixed(2)} pts | Stability: ${fragilityType}`;
      
      computedSteps.push({
        step: index + 1,
        spotValue: newSpot,
        pointImpact: priceImpact,
        volRate: speedAbs,
        impactPct: shiftPct,
        fragility: fragilityType,
        color: priceImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'
      });

      // Advance spot
      currentSpot = newSpot;
      setSimOutputLog(prev => [...prev, logText]);
      index++;
    }, 90);
  };

  return (
    <div className="space-y-4 text-white" id="microstructure-physics-view">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        
        {/* =============== LEFT: 3D TOPOGRAPHY MAP & GREEKS =============== */}
        <div className="xl:col-span-2 space-y-4">
          <div className="apple-glass-bright bg-white/[0.07] border-white/15 shadow-[0_8px_32px_0_rgba(255,255,255,0.02)] backdrop-blur-md rounded-lg p-5 flex flex-col justify-between h-[420px] relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-500" /> {/* Removed animate-pulse */}
                  MAPPING REAL-TIME DEALER HEDGING TOPOGRAPHY (3D SURFACE)
                </h3>
                <p className="text-[8px] text-zinc-500 font-mono tracking-wider uppercase mt-1">
                  Spot pricing shift (X) × Volatility implied shift (Y) × Net Delta Dollars Exposure (Z)
                </p>
              </div>

              {/* Angle rotation HUD badge */}
              <div className="flex gap-2 text-[8px] font-mono text-zinc-400">
                <span className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-xs">ROT: {rot.toFixed(0)}°</span>
                <span className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-xs">ELEV: {elev.toFixed(0)}°</span>
                <span className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-xs">ZOOM: {zoom.toFixed(1)}x</span>
              </div>
            </div>

            {/* Mouse rotation instruction label */}
            <div className="absolute left-6 bottom-5 z-20 text-[7px] text-zinc-500 font-mono flex items-center gap-1 uppercase bg-black/60 px-2 py-1 border border-zinc-950/20 rounded-xs">
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></span> {/* Removed animate-ping & emerald-500 */}
              Drag mouse on grid canvas to rotate terrain freely
            </div>

            {/* Scale controls */}
            <div className="absolute right-5 bottom-5 z-20 flex flex-col gap-1 bg-black/60 p-2 border border-zinc-950/20 rounded-md">
              <span className="text-[7px] text-zinc-500 font-bold uppercase mb-1">Canvas Scale</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setZoom(z => Math.max(0.6, z - 0.1))} 
                  className="w-5 h-5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[9px] font-bold pb-0.5"
                >
                  -
                </button>
                <span className="text-[8.5px] font-mono w-6 text-center text-zinc-300">{(zoom * 100).toFixed(0)}%</span>
                <button 
                  onClick={() => setZoom(z => Math.min(1.8, z + 0.1))} 
                  className="w-5 h-5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[9px] font-bold pb-0.5"
                >
                  +
                </button>
              </div>
            </div>

            {/* 3D Wireframe Canvas */}
            <div className="flex-1 flex items-center justify-center pointer-events-auto">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                className="w-full h-full cursor-grab active:cursor-grabbing max-h-[340px]"
              />
            </div>
          </div>

          {/* ================= BLACK-SCHOLES OPTIONS MATHEMATICS HUD ================= */}
          <div className="apple-glass rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                BLACK-SCHOLES CORE MODEL & THIRD-ORDER HIGHER SOLVER
              </h3>
              <div className="flex bg-zinc-900 border border-zinc-800 rounded-sm p-0.5 text-[8.5px] font-mono gap-1">
                <button 
                  onClick={() => {
                    setSelectedContractType('neutral');
                    setStoreStrikeGlobal(null);
                  }} 
                  className={`px-2 py-0.5 rounded-sm transition-all uppercase font-sans text-[7.5px] font-black tracking-widest ${selectedContractType === 'neutral' ? 'bg-white/10 border border-white/20 text-white font-extrabold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  NEUTRAL GLASS
                </button>
                <button 
                  onClick={() => {
                    setSelectedContractType('call');
                    setStoreOptionType('C');
                    if (storeStrikeGlobal === null) {
                      setStoreStrikeGlobal(availableStrikes[Math.floor(availableStrikes.length / 2)] || 5000);
                    }
                  }} 
                  className={`px-2 py-0.5 rounded-sm transition-all uppercase font-sans text-[7.5px] font-black tracking-widest ${selectedContractType === 'call' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  CALLS
                </button>
                <button 
                  onClick={() => {
                    setSelectedContractType('put');
                    setStoreOptionType('P');
                    if (storeStrikeGlobal === null) {
                      setStoreStrikeGlobal(availableStrikes[Math.floor(availableStrikes.length / 2)] || 5000);
                    }
                  }} 
                  className={`px-2 py-0.5 rounded-sm transition-all uppercase font-sans text-[7.5px] font-black tracking-widest ${selectedContractType === 'put' ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400 font-extrabold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  PUTS
                </button>
              </div>
            </div>

            {/* Inputs grid selector */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-black/40 border border-zinc-900 p-4 rounded-md">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[8px] font-black tracking-widest text-zinc-500 uppercase">
                  <span>Selected Strike</span>
                  <span className="text-white font-mono font-bold">${selectedStrike}</span>
                </div>
                <select 
                  value={selectedStrike} 
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSelectedStrike(val);
                    setStoreStrikeGlobal(val);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-850 px-2 py-1 text-[11px] font-mono text-zinc-300 rounded focus:outline-none"
                >
                  {availableStrikes.map(s => (
                    <option key={s} value={s}>Strike ${s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[8px] font-black tracking-widest text-zinc-500 uppercase">
                  <span>Underlying Asset</span>
                  <span className="text-zinc-300 font-mono font-bold">${testSpot.toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" 
                    min={baseSpot * 0.95} 
                    max={baseSpot * 1.05} 
                    step={1} 
                    value={testSpot} 
                    onChange={(e) => setTestSpot(Number(e.target.value))} 
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[8px] font-black tracking-widest text-zinc-500 uppercase">
                  <span>Volatility (IV)</span>
                  <span className="text-zinc-300 font-mono font-bold">{(testSigma * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" 
                    min={0.03} 
                    max={0.45} 
                    step={0.005} 
                    value={testSigma} 
                    onChange={(e) => setTestSigma(Number(e.target.value))} 
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <button 
                  onClick={() => {
                    setTestSpot(baseSpot);
                    setTestSigma(profile?.expectedMovePct ? profile.expectedMovePct * 10 : 0.15);
                  }} 
                  className="w-full bg-zinc-900 border border-zinc-850 py-1 px-3 text-[8.5px] font-black tracking-widest uppercase text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors rounded-sm flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  RECODE ENGINE ABSOLUTES
                </button>
              </div>
            </div>

            {/* Calculated Options Greeks metrics */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {[
                { label: 'Delta (Δ)', value: subGreeks.delta.toFixed(4), comment: '1st order spot sensitivity', color: 'text-zinc-100' },
                { label: 'Gamma (Γ)', value: subGreeks.gamma.toFixed(5), comment: 'Acceleration vector of Delta', color: 'text-emerald-400' },
                { label: 'Vanna (V)', value: subGreeks.vanna.toFixed(4), comment: 'Spot vs Vol skew covariance', color: 'text-amber-400' },
                { label: 'Charm (C)', value: subGreeks.charm.toFixed(4), comment: 'Hedging drift over duration', color: 'text-sky-400' },
                { label: 'Speed (S)', value: subGreeks.speed.toFixed(6), comment: '3rd order Gamma acceleration', color: 'text-purple-400' },
                { label: 'Color (Co)', value: subGreeks.color.toFixed(6), comment: 'Decay velocity of Gamma', color: 'text-rose-400' },
              ].map(item => (
                <div key={item.label} className="bg-black/50 border border-zinc-950 p-2.5 rounded hover:border-zinc-800 transition-colors">
                  <div className="text-[7px] text-zinc-500 font-extrabold uppercase tracking-wider">{item.label}</div>
                  <div className={`text-[12px] font-mono font-bold mt-1 ${item.color}`}>{item.value}</div>
                  <div className="text-[6.5px] text-zinc-650 font-sans tracking-wide leading-tight mt-1">{item.comment}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* =============== RIGHT RAIL: DOCKED SYSTEMS CONTROL CENTRE =============== */}
        <div className="space-y-4">
          
          {/* CONTROL TAB 1: RECURSIVE CASCADES SIMULATION */}
          <div className="apple-glass rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <h3 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                25-STEP RECURSIVE HEDGING SIMULATOR
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>

            <p className="text-[8.5px] text-zinc-500 leading-relaxed uppercase tracking-wider font-mono">
              Simulates cascade loop: Spot moves ➔ Greeks mutate ➔ Dealers forced to buy / sell underlying spot recursively ➔ System reaches convergence.
            </p>

            <div className="space-y-3">
              {/* Simulator settings */}
              <div className="bg-zinc-950/60 border border-zinc-900 rounded p-3 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Starting Spot Injection</span>
                  <span className="text-xs font-mono font-bold text-white">${simSpot.toFixed(0)}</span>
                </div>
                <input 
                  type="range" 
                  min={baseSpot * 0.98} 
                  max={baseSpot * 1.02} 
                  step={2} 
                  value={simSpot} 
                  onChange={(e) => setSimSpot(Number(e.target.value))} 
                  className="w-full h-1 bg-zinc-900 appearance-none cursor-pointer accent-emerald-500"
                  disabled={isRunningSim}
                />

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[7.5px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Vector Bias Direction</span>
                    <div className="grid grid-cols-2 bg-zinc-900 p-0.5 border border-zinc-850 rounded">
                      <button 
                        onClick={() => setSimPositionSide('Calls')} 
                        className={`text-[8px] font-bold py-0.5 uppercase tracking-widest rounded-xs ${simPositionSide === 'Calls' ? 'bg-emerald-500/10 text-emerald-400 font-black' : 'text-zinc-500'}`}
                        disabled={isRunningSim}
                      >
                        Calls
                      </button>
                      <button 
                        onClick={() => setSimPositionSide('Puts')} 
                        className={`text-[8px] font-bold py-0.5 uppercase tracking-widest rounded-xs ${simPositionSide === 'Puts' ? 'bg-rose-500/10 text-rose-400 font-black' : 'text-zinc-500'}`}
                        disabled={isRunningSim}
                      >
                        Puts
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[7.5px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Liquidity Capacity Mode</span>
                    <select
                      value={liquidityRegime}
                      onChange={(e: any) => setLiquidityRegime(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-zinc-300 rounded"
                      disabled={isRunningSim}
                    >
                      <option value="normal">Normal (1.0x)</option>
                      <option value="event">Macro Event (0.35x)</option>
                      <option value="systemic">Systemic thin (0.10x)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Start Simulation Trigger */}
              <button
                onClick={triggerCascadeSimulation}
                disabled={isRunningSim}
                className={`w-full py-2.5 font-mono text-[9px] font-black tracking-widest uppercase border rounded transition-all flex items-center justify-center gap-2 ${
                  isRunningSim 
                    ? 'bg-amber-500/10 border-amber-500 text-amber-500 cursor-not-allowed' 
                    : 'bg-emerald-500/10 border-emerald-500 text-emerald-400 hover:bg-emerald-500/25 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                }`}
              >
                {isRunningSim ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    COMPUTING INTER-ITERATION COUPLINGS...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    LAUNCH 25-STEP RECURSIVE FLOW SIMULATOR
                  </>
                )}
              </button>

              {/* Live Simulated Steps Console Console */}
              <div className="bg-black/60 border border-zinc-950 rounded-sm p-3 h-[180px] overflow-y-auto font-mono text-[8.5px] text-zinc-400 space-y-1 scrollbar-thin">
                {simOutputLog.map((log, i) => (
                  <div key={i} className="leading-snug">
                    <span className="text-zinc-650 mr-1">[{new Date().toLocaleTimeString(undefined, {hour12:false})}]</span>
                    <span className={log.includes('Step') ? (log.includes('Spot shifts to') && simPositionSide === 'Calls' ? 'text-emerald-400/95 font-bold' : 'text-rose-400/95 font-bold') : 'text-zinc-450'}>
                      {log}
                    </span>
                  </div>
                ))}
                {simOutputLog.length === 0 && (
                  <div className="text-zinc-650 italic text-center py-12 uppercase tracking-widest text-[8px]">
                    System Idle. Ready for simulated stress tests.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CONTROL TAB 2: MACRO EVENT DEVIATIONS */}
          <div className="apple-glass rounded-lg p-5 space-y-3.5">
            <h3 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              EVENT DIVERGENCE & COLLIDING SKEWS PROFILE
            </h3>

            <p className="text-[8.5px] text-zinc-500 leading-normal uppercase font-mono">
              Evaluates position vulnerability and liquidity impact when implied volatility crashes post-macro news.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[7.5px] text-zinc-500 font-extrabold uppercase tracking-wide block mb-1">Pre-Announcement Skew</span>
                <select 
                  value={pastPositioning} 
                  onChange={(e: any) => setPastPositioning(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 p-1.5 text-[8.5px] font-mono text-zinc-300 rounded"
                >
                  <option value="BULLISH SKEW">BULLISH CALL BOUGHT SKEW</option>
                  <option value="BEARISH SKEW">BEARISH PUT BOUGHT SKEW</option>
                </select>
              </div>

              <div>
                <span className="text-[7.5px] text-zinc-500 font-extrabold uppercase tracking-wide block mb-1">Surprise Outcome State</span>
                <select 
                  value={announcementOutput} 
                  onChange={(e: any) => setAnnouncementOutput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 p-1.5 text-[8.5px] font-mono text-zinc-300 rounded"
                >
                  <option value="POSITIVE OUTCOME">POSITIVE SURPRISE METRIC</option>
                  <option value="NEGATIVE OUTCOME">NEGATIVE SURPRISE METRIC</option>
                </select>
              </div>
            </div>

            {/* Calculated Risk Vector Outputs */}
            <div className="bg-zinc-950/70 border border-zinc-900 rounded p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Unwind Risk Factor</span>
                <span className={`px-2 py-0.5 rounded text-[8.5px] font-black tracking-widest border uppercase ${
                  divergenceAnalysis.riskLevel === 'EXTREME' 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                  {divergenceAnalysis.riskLevel}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Volatility Vanna Shock Multiplier</span>
                <span className={`text-[12.5px] font-mono font-black ${divergenceAnalysis.riskLevel === 'EXTREME' ? 'text-amber-400' : 'text-zinc-300'}`}>
                  {divergenceAnalysis.shockMultiplier.toFixed(2)}x Exposure Drift
                </span>
              </div>

              <div className="text-[8.5px] text-zinc-400 leading-normal border-l-2 border-zinc-800 pl-2">
                {divergenceAnalysis.comment}
              </div>
            </div>
          </div>

          {/* CONTROL TAB 3: MOC AUCTION POWER-HOUR INCURSIONS */}
          <div className="apple-glass rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <h3 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                POWER-HOUR MOC AUCTION PROCESSOR
              </h3>
              <span className={`h-2 w-2 rounded-full ${isMocActive ? 'bg-rose-500' : 'bg-zinc-700'}`}></span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <span className="text-[7.5px] text-zinc-500 font-bold uppercase tracking-wide block">Intraday Trade Time</span>
                <span className="text-[10px] font-mono font-bold block text-white">15:{clockMinutes} EST</span>
                <input 
                  type="range" 
                  min={40} 
                  max={60} 
                  value={clockMinutes} 
                  onChange={(e) => setClockMinutes(Number(e.target.value))} 
                  className="w-full bg-zinc-900 accent-indigo-500 h-1 rounded appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[7.5px] text-zinc-500 font-bold uppercase tracking-wide block">MOC Auction Side</span>
                <div className="grid grid-cols-3 bg-zinc-900/60 p-0.5 border border-zinc-800 rounded">
                  {['BUY', 'NEUTRAL', 'SELL'].map(mode => (
                    <button 
                      key={mode} 
                      onClick={() => setImbalanceSide(mode as any)}
                      className={`text-[7px] font-black py-0.5 uppercase rounded-xs transition-all ${
                        imbalanceSide === mode 
                          ? (mode === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : mode === 'SELL' ? 'bg-rose-500/10 text-rose-400' : 'bg-zinc-850 text-white') 
                          : 'text-zinc-500 hover:text-zinc-400'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[7.5px] text-zinc-500 font-bold uppercase tracking-wider">
                <span>Imbalance Size Amount (Min Threshold $500M)</span>
                <span className="text-white font-mono font-bold">${imbalanceSize} Million</span>
              </div>
              <input 
                type="range" 
                min={100} 
                max={2000} 
                step={50} 
                value={imbalanceSize} 
                onChange={(e) => setImbalanceSize(Number(e.target.value))} 
                className="w-full bg-zinc-900 accent-indigo-500 h-1 rounded appearance-none cursor-pointer"
              />
            </div>

            <div className={`p-3 rounded border transition-all ${
              isMocActive && imbalanceSide !== 'NEUTRAL'
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' 
                : 'bg-zinc-900/40 border-zinc-950 text-zinc-500'
            }`}>
              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest pb-1 border-b border-zinc-850/20 mb-1.5">
                <span>State Engine status</span>
                <span>{isMocActive ? 'ACTIVE MOC IN-FORCE' : 'STANDBY LOCKOUT'}</span>
              </div>
              <p className="text-[8.5px] leading-relaxed">
                {isMocActive
                  ? (imbalanceSide === 'NEUTRAL'
                      ? 'Power hour phase detected. Imbalance vector remains neutral. Expected orderly close.'
                      : `Late stage ${imbalanceSide} imbalance found. Executing incremental index volume delta weight: ${(imbalanceSize * mocIntensity).toFixed(1)}M delta-dollars.`)
                  : 'Time of day preceding standard 15:50 EST MOC deadline. Auction imbalance tracking deactivated.'
                }
              </p>
            </div>
          </div>
          
          {/* CONTROL TAB 4: STATE-MACHINE CAMPAIGN DYNAMICS */}
          <div className="apple-glass rounded-lg p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <h3 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                CAMPAIGN STATE-MACHINE ENGINE
              </h3>
              <span className={`px-2 py-0.5 rounded text-[7.5px] font-black tracking-widest uppercase border ${campaignMachine.badgeColor}`}>
                {campaignMachine.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-[7.5px] text-zinc-500 font-bold uppercase block">Open Interest Momentum</span>
                <input 
                  type="range" 
                  min={10} 
                  max={100} 
                  value={oiTrend} 
                  onChange={(e) => setOiTrend(Number(e.target.value))} 
                  className="w-full bg-zinc-900 accent-zinc-500 h-1 rounded appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[7.5px] text-zinc-500 font-bold uppercase block">Trading volume velocity</span>
                <input 
                  type="range" 
                  min={10} 
                  max={100} 
                  value={volVelocity} 
                  onChange={(e) => setVolVelocity(Number(e.target.value))} 
                  className="w-full bg-zinc-900 accent-zinc-500 h-1 rounded appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[7.5px] text-zinc-500 font-extrabold uppercase uppercase">
                <span>Campaign completion score</span>
                <span className="text-white font-mono font-bold">{campaignMachine.completion}%</span>
              </div>
              <div className="h-2 rounded-full border border-zinc-850 bg-zinc-950 overflow-hidden relative">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-amber-500 transition-all duration-300"
                  style={{ width: `${campaignMachine.completion}%` }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
