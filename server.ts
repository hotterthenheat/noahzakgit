/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { ASSET_LIST, generateInitialCandles, TIMEFRAMES } from './src/data';
import { 
  calculateSystemScoreFromCandles, 
  calculateV11Metrics, 
  calculateV10Metrics 
} from './src/lib/v11Math';
import { Candle, V8TradeRecord, AssetInfo, TimeframeVal } from './src/types';

const app = express();
app.set('trust proxy', true);
const PORT = 3000;

// API middleware
app.use(express.json());

// In-memory persistent database states for the backend
interface ServerDb {
  candles: Record<string, Candle[]>; // key like "SPX-5m" => Candle[]
  v8Trades: V8TradeRecord[];
}

const db: ServerDb = {
  candles: {},
  v8Trades: [
    {
      id: 'v8-trade-1',
      timestamp: '2026-06-08 10:25',
      underlying: 'SPX',
      contract: 'SPX 7650C',
      direction: 'BULLISH',
      entryPrice: 4.20,
      underlyingPrice: 7623.00,
      iv: 14.8,
      greeks: { delta: 0.58, gamma: 0.08, theta: -1.2, vega: 0.15 },
      vwapState: 'Above VWAP Alignment',
      rsiState: 'Oversold RSI Cascade Bullish Divergence Anchor',
      structureState: 'Break of Structure (BOS)',
      rvolState: 'High RVOL Support',
      gexState: 'High Put Wall Support',
      dealerPositioning: 'Dealer Short Gamma Hedging',
      expectedReturn: 88,
      expectedDrawdown: 18,
      probabilityPositive: 88,
      thesisStability: 91,
      recommendation: 'HOLD', // strictly mapped to 4 states
      target1: 5.60,
      target2: 7.20,
      target3: 9.50,
      stretchTarget: 14.00,
      stopLoss: 3.10,
      target1Hit: true,
      target2Hit: true,
      target3Hit: false,
      stretchTargetHit: false,
      target1HitTime: 11,
      target2HitTime: 24,
      target3HitTime: null,
      stretchTargetHitTime: null,
      maxGain: 71.4,
      maxDrawdown: 6.5,
      timeTaken: 34,
      whatTargetReachedFirst: 'Target 1',
      finalOutcome: 'Target 2 Winner',
      failureReasons: []
    },
    {
      id: 'v8-trade-2',
      timestamp: '2026-06-08 09:40',
      underlying: 'NDX',
      contract: 'NDX 18200P',
      direction: 'BEARISH',
      entryPrice: 85.00,
      underlyingPrice: 18250.00,
      iv: 18.2,
      greeks: { delta: -0.48, gamma: 0.05, theta: -1.8, vega: 0.22 },
      vwapState: 'Below VWAP Crossing',
      rsiState: 'RSI Bearish Momentum Expansion',
      structureState: 'Change of Character (CHoCH)',
      rvolState: 'High RVOL Support',
      gexState: 'Net Negative GEX Pressure',
      dealerPositioning: 'Dealer Short Gamma Hedging',
      expectedReturn: 75,
      expectedDrawdown: 25,
      probabilityPositive: 75,
      thesisStability: 82,
      recommendation: 'HOLD', // strictly mapped to 4 states
      target1: 110.00,
      target2: 145.00,
      target3: 180.00,
      stretchTarget: 250.00,
      stopLoss: 60.00,
      target1Hit: true,
      target2Hit: false,
      target3Hit: false,
      stretchTargetHit: false,
      target1HitTime: 18,
      target2HitTime: null,
      target3HitTime: null,
      stretchTargetHitTime: null,
      maxGain: 29.4,
      maxDrawdown: 14.2,
      timeTaken: 45,
      whatTargetReachedFirst: 'Target 1',
      finalOutcome: 'Target 1 Winner',
      failureReasons: []
    }
  ]
};

// Initialize in-memory candles on bootstrap for all assets + timeframe parameters
const initializeCandles = () => {
  for (const asset of ASSET_LIST) {
    for (const tf of TIMEFRAMES) {
      const key = `${asset.ticker}-${tf.val}`;
      db.candles[key] = generateInitialCandles(asset, tf.val, 46);
    }
  }
};
initializeCandles();

// Simulation ticks run continuously server-side
const TICK_INTERVAL = 3000; // 3 seconds
setInterval(() => {
  // 1. Tick candles for all assets in loop
  for (const asset of ASSET_LIST) {
    for (const tf of TIMEFRAMES) {
      const key = `${asset.ticker}-${tf.val}`;
      const prev = db.candles[key];
      if (!prev || prev.length === 0) continue;

      const last = prev[prev.length - 1];
      // Random walk close price simulation bounds
      const range = asset.defaultPrice * asset.volatility * 0.0012;
      const change = (Math.random() - 0.49) * (range / 3);
      const updatedClose = Number((last.close + change).toFixed(asset.decimals));
      
      const updatedHigh = Number(Math.max(last.high, updatedClose).toFixed(asset.decimals));
      const updatedLow = Number(Math.min(last.low, updatedClose).toFixed(asset.decimals));

      prev[prev.length - 1] = {
        ...last,
        close: updatedClose,
        high: updatedHigh,
        low: updatedLow
      };
    }
  }

  // 2. Tick active trade outcomes in simulation loop
  db.v8Trades = db.v8Trades.map((t) => {
    if (t.finalOutcome !== 'Active') return t;

    // Retrieve live underlying spot price from SPX-5m, NDX-5m, etc.
    const assetObj = ASSET_LIST.find(a => a.ticker === t.underlying) || ASSET_LIST[0];
    const assetCandles = db.candles[`${assetObj.ticker}-5m`];
    const latestClose = assetCandles ? assetCandles[assetCandles.length - 1].close : assetObj.defaultPrice;

    const elapsedMinutes = t.timeTaken + 1;

    // Emulate option premium ticks
    const isC = t.contract.endsWith('C');
    const priceChange = latestClose - t.underlyingPrice;
    const deltaMove = isC ? priceChange : -priceChange;
    const optionDiff = Math.abs(t.greeks.delta) * deltaMove;
    const thetaDecay = (t.greeks.theta / 390) * elapsedMinutes;
    const randomNoise = (Math.random() - 0.5) * 0.015 * t.entryPrice;

    const currentOptionPremium = Math.max(0.10, Number((t.entryPrice + optionDiff + thetaDecay + randomNoise).toFixed(2)));

    // Calculate trial performance metrics
    const trialGain = ((currentOptionPremium - t.entryPrice) / t.entryPrice) * 100;
    const newMaxGain = Number(Math.max(t.maxGain, trialGain).toFixed(1));

    const trialDrawdown = ((t.entryPrice - currentOptionPremium) / t.entryPrice) * 100;
    const newMaxDrawdown = Number(Math.max(t.maxDrawdown, trialDrawdown).toFixed(1));

    // Evaluate target alerts
    const t1Hit = t.target1Hit || currentOptionPremium >= t.target1;
    const t1HitTime = t.target1Hit ? t.target1HitTime : (currentOptionPremium >= t.target1 ? elapsedMinutes : null);

    const t2Hit = t.target2Hit || currentOptionPremium >= t.target2;
    const t2HitTime = t.target2Hit ? t.target2HitTime : (currentOptionPremium >= t.target2 ? elapsedMinutes : null);

    const t3Hit = t.target3Hit || currentOptionPremium >= t.target3;
    const t3HitTime = t.target3Hit ? t.target3HitTime : (currentOptionPremium >= t.target3 ? elapsedMinutes : null);

    const stretchHit = t.stretchTargetHit || currentOptionPremium >= t.stretchTarget;
    const stretchHitTime = t.stretchTargetHit ? t.stretchTargetHitTime : (currentOptionPremium >= t.stretchTarget ? elapsedMinutes : null);

    const stopHit = currentOptionPremium <= t.stopLoss;

    let outcome: 'Target 1 Winner' | 'Target 2 Winner' | 'Target 3 Winner' | 'Stretch Winner' | 'Failure' | 'Active' = 'Active';
    let whatTargetFirst = t.whatTargetReachedFirst;

    if (stopHit) {
      outcome = 'Failure';
      if (whatTargetFirst === 'None') whatTargetFirst = 'Stop Loss';
    } else if (stretchHit) {
      outcome = 'Stretch Winner';
      if (whatTargetFirst === 'None') whatTargetFirst = 'Stretch Target';
    } else if (t3Hit) {
      outcome = 'Target 3 Winner';
      if (whatTargetFirst === 'None') whatTargetFirst = 'Target 3';
    } else if (t2Hit) {
      outcome = 'Target 2 Winner';
      if (whatTargetFirst === 'None') whatTargetFirst = 'Target 2';
    } else if (t1Hit) {
      outcome = 'Target 1 Winner';
      if (whatTargetFirst === 'None') whatTargetFirst = 'Target 1';
    }

    let fails = [...t.failureReasons];
    if (outcome === 'Failure' && fails.length === 0) {
      fails.push('Theta decay premium erosion near local resistance zone');
    }

    const wasActive = t.finalOutcome === 'Active';
    const isClosedNow = outcome !== 'Active';
    const calculatedCloseTs = wasActive && isClosedNow
      ? new Date().toISOString().replace('T', ' ').substring(0, 16)
      : t.closeTs;

    return {
      ...t,
      maxGain: newMaxGain,
      maxDrawdown: newMaxDrawdown,
      timeTaken: elapsedMinutes,
      target1Hit: t1Hit,
      target1HitTime: t1HitTime,
      target2Hit: t2Hit,
      target2HitTime: t2HitTime,
      target3Hit: t3Hit,
      target3HitTime: t3HitTime,
      stretchTargetHit: stretchHit,
      stretchTargetHitTime: stretchHitTime,
      whatTargetReachedFirst: whatTargetFirst,
      finalOutcome: outcome,
      failureReasons: fails,
      closeTs: calculatedCloseTs,
      recommendation: isClosedNow ? 'EXIT' : 'HOLD' // strict 4 position states
    };
  });

  // 3. Broadcast to all active Server-Sent Events subscribers
  broadcastSSE();
}, TICK_INTERVAL);

// SSE connection pool
interface SSEClient {
  id: number;
  res: any;
  params: {
    asset: string;
    timeframe: string;
    isCall: boolean;
    strike: number | null;
    positionOpen: boolean;
  };
}
let sseClients: SSEClient[] = [];
let clientIndex = 0;

// Broadcaster matches and computes the Universal JSON Payload
const broadcastSSE = () => {
  for (const client of sseClients) {
    try {
      const payload = constructPayload(client.params);
      client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (e) {
      console.error("Error writing SSE to client", client.id, e);
    }
  }
};

// Generates the server-assembled payload (The Universal Payload)
const constructPayload = (params: {
  asset: string;
  timeframe: string;
  isCall: boolean;
  strike: number | null;
  positionOpen: boolean;
}) => {
  const assetName = params.asset || 'SPX';
  const timeframe = params.timeframe || '5m';
  const isCall = params.isCall;
  const positionOpen = params.positionOpen;

  const asset = ASSET_LIST.find(a => a.ticker === assetName) || ASSET_LIST[0];
  const candles = db.candles[`${asset.ticker}-${timeframe}`] || generateInitialCandles(asset, timeframe as TimeframeVal, 46);
  const lastPrice = candles[candles.length - 1].close;

  // Option strike defaulting
  const step = asset.defaultPrice > 1000 ? 100 : asset.defaultPrice > 150 ? 5 : 1;
  const optionStrike = params.strike || Math.round(lastPrice / step) * step + (isCall ? step : -step);

  // Re-calculate the system scores and calculations strictly backend-side
  const dir = isCall ? 1 : -1;
  const systemScore = calculateSystemScoreFromCandles(candles, dir, asset.volatility);

  // Dynamic premium formulation based on underlying closeness
  const strikeDistance = Math.abs(lastPrice - optionStrike);
  const normalizedDistance = strikeDistance / lastPrice;
  const volBuffer = asset.volatility * 0.15;
  const premiumBase = isCall 
    ? (lastPrice * 0.003) / Math.exp(normalizedDistance * 60)
    : (lastPrice * 0.0035) / Math.exp(normalizedDistance * 65);
  const optionPremiumFloat = Math.max(0.20, Number((premiumBase * (1 + volBuffer)).toFixed(2)));

  // Calculate V11 / V10 structures
  const metricsV11 = calculateV11Metrics(asset, isCall, systemScore, optionPremiumFloat, optionStrike);
  const metricsV10 = calculateV10Metrics(asset, isCall, systemScore, optionPremiumFloat);

  // Strict mapping: decision can only be: 'ENTER', 'HOLD', 'REDUCE', 'EXIT'
  // Let's resolve what decision to emit
  let finalDecision: 'ENTER' | 'HOLD' | 'REDUCE' | 'EXIT' = 'ENTER';
  if (positionOpen) {
    if (metricsV11.decision === 'EXIT') finalDecision = 'EXIT';
    else if (metricsV11.decision === 'REDUCE') finalDecision = 'REDUCE';
    else finalDecision = 'HOLD';
  } else {
    if (metricsV11.decision === 'BUY') finalDecision = 'ENTER';
    else finalDecision = 'EXIT';
  }

  // Pinpoint translation directives: hides all raw GEX/Greeks values, provides narrative
  const pinpointLevels = [-4, -3, -2, -1, 0, 1, 2, 3, 4].map(fact => {
    const strike = optionStrike + (fact * step);
    const isSpotLevel = Math.abs(strike - lastPrice) <= step / 2;
    
    let label = 'neutral';
    let narrative = 'LIQUIDITY VOID GAP';
    let strength = 30;
    let intensity = 20;
    let expectedInfluence = 'Mild reaction likely';
    let exposureInfo = '+$0.4B Dealer Gaps';

    if (fact === 2) {
      label = 'resistance';
      narrative = 'EXTREME RESISTANCE — OVERHEAD CAPITAL CEILING';
      strength = 94;
      intensity = 95;
      expectedInfluence = 'Strong overhead resistance barrier';
      exposureInfo = '+$4.2B Positioning Gex';
    } else if (fact === -2) {
      label = 'support';
      narrative = 'MAJOR SUPPORT — CALL CONCENTRATION BID';
      strength = 94;
      intensity = 95;
      expectedInfluence = 'Strong institutional floor level';
      exposureInfo = '-$3.8B Positioning Gex';
    } else if (fact === 1) {
      label = 'resistance';
      narrative = 'HEAVY SELLER PRESSURE CEILING';
      strength = 65;
      intensity = 70;
      expectedInfluence = 'Moderate barrier';
      exposureInfo = '+$2.1B Positioning Gex';
    } else if (fact === -1) {
      label = 'support';
      narrative = 'MAJOR SUPPORT BID FLOOR';
      strength = 65;
      intensity = 70;
      expectedInfluence = 'Moderate floor';
      exposureInfo = '-$1.9B Positioning Gex';
    } else if (fact === 0) {
      label = 'zone';
      narrative = 'STABLE GRAVITY PIN ZONE';
      strength = 45;
      intensity = 55;
      expectedInfluence = 'High attraction zone';
      exposureInfo = '+$0.1B Equilibrium';
    } else if (fact > 2) {
      label = 'neutral';
      narrative = 'EXTREME RESISTANCE BUFFER';
      strength = 22;
      intensity = 30;
      expectedInfluence = 'Low interest margin';
      exposureInfo = '+$0.8B Volatility Pocket';
    } else if (fact < -2) {
      label = 'neutral';
      narrative = 'LIQUIDITY BUFFER EXPANSION';
      strength = 22;
      intensity = 30;
      expectedInfluence = 'Low interest margin';
      exposureInfo = '-$0.3B Liquidity Buffer';
    } else if (fact > 0) {
      label = 'neutral';
      narrative = 'BULLISH PIN ZONE — SELLER ABSORPTION AREA';
      strength = 30;
      intensity = 40;
      expectedInfluence = 'Mild resistance';
      exposureInfo = '+$0.6B Delta Stream';
    } else {
      label = 'neutral';
      narrative = 'BEARISH PIN ZONE — SELLER PRESSURE DEPTH';
      strength = 30;
      intensity = 40;
      expectedInfluence = 'Mild support';
      exposureInfo = '-$0.5B Delta Stream';
    }

    return {
      strike,
      isSpotLevel,
      label,
      narrative,
      strength,
      intensity,
      expectedInfluence,
      exposureInfo,
      isCallWall: fact === 2,
      isPutWall: fact === -2,
      isGammaFlip: fact === -1
    };
  });

  // Detailed provenance trail values
  const provenance = {
    inputs: {
      underlying_price: lastPrice,
      volatility: asset.volatility,
      timeframe,
      option_type: isCall ? 'C' : 'P',
      strike: optionStrike
    },
    formula: "SkyVision Core Intelligence Score formula v11.3 + Math Calibration Regression Bounds",
    timestamp: new Date().toISOString(),
    confidence: metricsV11.posteriorWinRate >= 80 ? 'HIGH' : metricsV11.posteriorWinRate >= 65 ? 'MODERATE' : 'STRETCH',
    sample_size: metricsV11.sampleSize,
    version: "11.3 (Audited Server Core)",
    audit_id: `aud-v11-${asset.ticker}-${Date.now()}-${Math.floor(Math.random() * 100000)}`
  };

  // Pre-calculated Targets section
  const mappedTargets = metricsV11.targets.map(t => ({
    label: t.label,
    price: Number(t.price.toFixed(asset.decimals)),
    optionValue: Number(t.optionValue.toFixed(2)),
    probability: t.probability,
    expectedTimeMinutes: t.expectedTimeMinutes,
    historicalHitRate: t.historicalHitRate,
    expectedDrawdownPct: t.expectedDrawdownPct,
    riskReward: t.riskReward,
    confidenceInterval: t.confidenceInterval
  }));

  // Render Discovery Shelves
  const discovery = {
    mispricedCalls: [
      { 
        asset: ASSET_LIST.find(a => a.ticker === 'SPX')!, 
        strike: 7630, 
        isCall: true, 
        health: 91, 
        marketPrice: 4.20, 
        modelValue: 6.80, 
        discount: '38% Underpriced', 
        status: 'Extreme Call Wall Support' 
      },
      { 
        asset: ASSET_LIST.find(a => a.ticker === 'QQQ')!, 
        strike: 448, 
        isCall: true, 
        health: 86, 
        marketPrice: 2.10, 
        modelValue: 3.10, 
        discount: '32% Underpriced', 
        status: 'Accumulating Buy Flow' 
      },
      { 
        asset: ASSET_LIST.find(a => a.ticker === 'SPY')!, 
        strike: 515, 
        isCall: true, 
        health: 89, 
        marketPrice: 3.10, 
        modelValue: 4.40, 
        discount: '29% Underpriced', 
        status: 'Dealer Squeeze Vector' 
      }
    ],
    mispricedPuts: [
      { 
        asset: ASSET_LIST.find(a => a.ticker === 'SPX')!, 
        strike: 7615, 
        isCall: false, 
        health: 93, 
        marketPrice: 3.80, 
        modelValue: 5.90, 
        discount: '35% Underpriced', 
        status: 'Dealer Gamma Support Hedge' 
      },
      { 
        asset: ASSET_LIST.find(a => a.ticker === 'NDX')!, 
        strike: 18200, 
        isCall: false, 
        health: 90, 
        marketPrice: 85.00, 
        modelValue: 122.00, 
        discount: '30% Underpriced', 
        status: 'Block Bid Concentration' 
      },
      { 
        asset: ASSET_LIST.find(a => a.ticker === 'QQQ')!, 
        strike: 442, 
        isCall: false, 
        health: 85, 
        marketPrice: 1.80, 
        modelValue: 2.50, 
        discount: '28% Underpriced', 
        status: 'Put Wall Over-extension' 
      }
    ],
    mostImproved: [
      { 
        asset: ASSET_LIST.find(a => a.ticker === 'SPY')!, 
        strike: 512, 
        isCall: true, 
        health: 88, 
        marketPrice: 4.80, 
        modelValue: 6.20, 
        discount: '+14 pts health gap', 
        status: 'Momentum Influx Shift' 
      },
      { 
        asset: ASSET_LIST.find(a => a.ticker === 'NDX')!, 
        strike: 18270, 
        isCall: true, 
        health: 89, 
        marketPrice: 145.00, 
        modelValue: 178.00, 
        discount: '+9 pts health gap', 
        status: 'Institutional Flow Build' 
      }
    ],
    nearInvalidation: [
      { 
        asset: ASSET_LIST.find(a => a.ticker === 'SPX')!, 
        strike: 7610, 
        isCall: false, 
        health: 48, 
        marketPrice: 1.20, 
        modelValue: 0.40, 
        discount: 'Overpriced Risk Zone', 
        status: 'Below Dealer GEX Support Floor' 
      },
      { 
        asset: ASSET_LIST.find(a => a.ticker === 'QQQ')!, 
        strike: 440, 
        isCall: false, 
        health: 51, 
        marketPrice: 0.90, 
        modelValue: 0.50, 
        discount: 'Overpriced Risk Zone', 
        status: 'Liquidity Void Invalidation' 
      }
    ]
  };

  return {
    contract: `${asset.ticker} ${optionStrike}${isCall ? 'C' : 'P'}`,
    recommendation: finalDecision, //ENTER, HOLD, REDUCE, EXIT
    trade_health: Math.round(metricsV11.posteriorWinRate), // represents trade health integer
    provenance,
    position_management: {
      momentum: systemScore.momentumAcceleration >= 7 ? 'ACCELERATING' : 'DEGRADED',
      dealer_support: metricsV11.dealer.dealerPressureIndex >= 6 ? 'IMPROVING' : 'WEAK',
      liquidity: metricsV11.liquidity.liquidityScore >= 70 ? 'STRONG' : 'MODERATE',
      risk: metricsV11.tailRisk.tailRiskScore <= 0.45 ? 'FALLING' : 'ELEVATED',
      decision_reason: metricsV11.decisionReason
    },
    expected_move: {
      pct: `±${(metricsV11.surface.expectedMovePct * 100).toFixed(1)}%`,
      range: `±${(asset.defaultPrice * metricsV11.surface.expectedMovePct).toFixed(1)} pts`,
      term_structure: metricsV11.surface.termStructure,
      skew: metricsV11.surface.skewCurve,
      ivRank: metricsV11.surface.ivRank,
      ivPercentile: metricsV11.surface.ivPercentile
    },
    targets: mappedTargets,
    pinpoint_map: {
      spot_price: lastPrice,
      step,
      levels: pinpointLevels
    },
    discovery,
    trade_archive: db.v8Trades,
    system_score: systemScore,
    metricsV11,
    metricsV10,
    candles,
    optionPremiumFloat,
    optionStrike
  };
};

// --- SERVING API ENDPOINTS ---

const getSessionFromCookies = (cookieHeader?: string) => {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/slayer_session=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
};

// Sandbox Session Activator setting httpOnly cookies
app.get('/api/auth/sandbox', (req, res) => {
  res.redirect('/api/auth/callback?provider=sandbox&name=Sandbox%20Quant%20User&email=sandbox@slayer.io');
});

app.get('/api/auth/callback', (req, res) => {
  const { provider, name, email } = req.query;
  const userSession = {
    authenticated: true,
    provider: provider || 'sandbox',
    name: name || 'Sandbox Quant User',
    email: email || 'sandbox@slayer.io',
    avatar: 'https://cdn.discordapp.com/embed/avatars/0.png'
  };

  const serializedSession = encodeURIComponent(JSON.stringify(userSession));
  
  // Set securing httpOnly cookie!
  res.cookie('slayer_session', serializedSession, {
    httpOnly: true,
    secure: false, // Let's use false so it works in nested preview iframes too!
    sameSite: 'lax',
    path: '/',
    maxAge: 3600 * 24 * 7 * 1000 // 7 days
  });

  res.redirect('/');
});

app.get('/api/auth/session', (req, res) => {
  const session = getSessionFromCookies(req.headers.cookie);
  if (session) {
    res.json(session);
  } else {
    res.json({ authenticated: false });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.cookie('slayer_session', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0)
  });
  res.json({ success: true });
});

// Server-Sent Events Endpoint
app.get('/api/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Content-Encoding': 'none'
  });

  const parsedAsset = String(req.query.asset || 'SPX');
  const parsedTimeframe = String(req.query.timeframe || '5m');
  const parsedIsCall = req.query.isCall === 'true';
  const parsedStrike = req.query.strike ? Number(req.query.strike) : null;
  const parsedPositionOpen = req.query.positionOpen === 'true';

  const clientId = ++clientIndex;
  const clientObj: SSEClient = {
    id: clientId,
    res,
    params: {
      asset: parsedAsset,
      timeframe: parsedTimeframe,
      isCall: parsedIsCall,
      strike: parsedStrike,
      positionOpen: parsedPositionOpen
    }
  };

  sseClients.push(clientObj);

  // Send initial payload immediately
  const initialPayload = constructPayload(clientObj.params);
  res.write(`data: ${JSON.stringify(initialPayload)}\n\n`);

  // Handle client disconnection
  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// Create and enter simulated trade endpoint
app.post('/api/trades/add', (req, res) => {
  const { 
    underlying, 
    contract, 
    direction, 
    entryPrice, 
    underlyingPrice, 
    iv,
    target1,
    target2,
    target3,
    stretchTarget,
    stopLoss
  } = req.body;

  const newTrade: V8TradeRecord = {
    id: `v8-log-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    underlying: underlying || 'SPX',
    contract: contract || 'SPX 7630C',
    direction: direction || 'BULLISH',
    entryPrice: Number(entryPrice) || 4.20,
    underlyingPrice: Number(underlyingPrice) || 7623.00,
    iv: Number(iv) || 15,
    greeks: {
      delta: direction === 'BULLISH' ? 0.58 : -0.48,
      gamma: 0.08,
      theta: -1.2,
      vega: 0.15
    },
    vwapState: 'Above VWAP Alignment',
    rsiState: 'Oversold Bounce Anchor',
    structureState: 'Displaced Mitigation (BOS)',
    rvolState: 'Expanding Relative Volume',
    gexState: 'Net Positive GEX Support',
    dealerPositioning: 'Dealer Gamma Support Base',
    expectedReturn: 88,
    expectedDrawdown: 18,
    probabilityPositive: 88,
    thesisStability: 90,
    recommendation: 'HOLD', // strict state
    target1: Number(target1) || (Number(entryPrice) * 1.3),
    target2: Number(target2) || (Number(entryPrice) * 1.7),
    target3: Number(target3) || (Number(entryPrice) * 2.2),
    stretchTarget: Number(stretchTarget) || (Number(entryPrice) * 3.0),
    stopLoss: Number(stopLoss) || (Number(entryPrice) * 0.7),
    target1Hit: false,
    target2Hit: false,
    target3Hit: false,
    stretchTargetHit: false,
    target1HitTime: null,
    target2HitTime: null,
    target3HitTime: null,
    stretchTargetHitTime: null,
    maxGain: 0.0,
    maxDrawdown: 0.0,
    timeTaken: 0,
    whatTargetReachedFirst: 'None',
    finalOutcome: 'Active',
    failureReasons: []
  };

  db.v8Trades.unshift(newTrade);
  
  // Instantly broadcast update
  broadcastSSE();

  res.json({ success: true, trade: newTrade });
});

// Clear trades array endpoint
app.post('/api/trades/clear', (req, res) => {
  db.v8Trades = [];
  broadcastSSE();
  res.json({ success: true });
});


// Start Express with Vite dev server middleware in dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend files in production build
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SkyVision Backend] Running on http://localhost:${PORT}`);
  });
}

startServer();
