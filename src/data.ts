/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssetInfo, Candle, FairValueGap, LiquidityEvent, TimeframeVal } from './types';

export const ASSET_LIST: AssetInfo[] = [
  {
    key: 'SPX',
    ticker: 'SPX',
    name: 'S&P 500 Index',
    type: 'INDEXES',
    defaultPrice: 7623.00,
    decimals: 2,
    spread: 0.50,
    volatility: 0.55,
    unit: 'USD',
    forecastScale: 0.12,
    stabilityMax: 0.040,
  },
  {
    key: 'QQQ',
    ticker: 'QQQ',
    name: 'Invesco QQQ Trust',
    type: 'ETFS',
    defaultPrice: 445.50,
    decimals: 2,
    spread: 0.02,
    volatility: 0.8,
    unit: 'USD',
    forecastScale: 0.14,
    stabilityMax: 0.045,
  },
  {
    key: 'NDX',
    ticker: 'NDX',
    name: 'Nasdaq 100 Index',
    type: 'INDEXES',
    defaultPrice: 18250.00,
    decimals: 2,
    spread: 1.50,
    volatility: 0.75,
    unit: 'USD',
    forecastScale: 0.18,
    stabilityMax: 0.050,
  },
  {
    key: 'SPY',
    ticker: 'SPY',
    name: 'SPDR S&P 500 ETF',
    type: 'ETFS',
    defaultPrice: 512.30,
    decimals: 2,
    spread: 0.02,
    volatility: 0.6,
    unit: 'USD',
    forecastScale: 0.10,
    stabilityMax: 0.035,
  }
];

export const TIMEFRAMES: { val: TimeframeVal; label: string; minMultiplier: number }[] = [
  { val: '1m', label: '1 Minute', minMultiplier: 1 },
  { val: '2m', label: '2 Minutes', minMultiplier: 2 },
  { val: '3m', label: '3 Minutes', minMultiplier: 3 },
  { val: '5m', label: '5 Minutes', minMultiplier: 5 },
  { val: '15m', label: '15 Minutes', minMultiplier: 15 },
  { val: '30m', label: '30 Minutes', minMultiplier: 30 },
  { val: '1h', label: '1 Hour', minMultiplier: 60 },
  { val: '4h', label: '4 Hours', minMultiplier: 240 },
  { val: '1D', label: 'Daily', minMultiplier: 1440 },
  { val: '1W', label: 'Weekly', minMultiplier: 10080 },
];

/**
 * Generates initial candlesticks and simulates institutional trading conditions
 */
export function generateInitialCandles(asset: AssetInfo, timeframe: TimeframeVal, count = 46): Candle[] {
  const candles: Candle[] = [];
  const basePrice = asset.defaultPrice;
  const vol = asset.volatility;
  
  // Set timeframe scale factors
  let tfScale = 1;
  const tfObj = TIMEFRAMES.find(t => t.val === timeframe);
  if (tfObj) {
    tfScale = Math.sqrt(tfObj.minMultiplier) * 0.15 + 0.85;
  }

  let currentPrice = basePrice * (1 - vol * 0.015); // Start slightly lower to build a trend pattern
  let accumulatedVolPrice = 0;
  let accumulatedVol = 0;
  
  const startTime = Date.now() - count * 15 * 60000;

  for (let i = 0; i < count; i++) {
    const timestamp = startTime + i * 15 * 60000;
    
    // Create random-walk price bars, but add institutional expansion pockets
    let isHeavyDisplacement = false;
    let displacementDir: 'bullish' | 'bearish' | null = null;
    let biasFactor = 0.05; // general bullish bias for neat look
    
    // Inject institutional displacement on specific historic candles (e.g., at i=12, i=24, i=35)
    if (i === 15 || i === 28 || i === 38) {
      isHeavyDisplacement = true;
      displacementDir = i === 28 ? 'bearish' : 'bullish';
      biasFactor = i === 28 ? -2.2 * vol : 2.5 * vol;
    } else if (i > 15 && i < 22) {
      // gentle pullbacks
      biasFactor = -0.3 * vol;
    } else if (i > 28 && i < 33) {
      // bearish momentum continuation
      biasFactor = -0.6 * vol;
    } else {
      biasFactor = (Math.random() - 0.44) * 0.4 * vol;
    }

    const priceChange = basePrice * (biasFactor / 100) * tfScale;
    const open = currentPrice;
    const close = currentPrice + priceChange;
    
    let high = Math.max(open, close) + (Math.random() * 0.08 * vol * basePrice) / 100;
    let low = Math.min(open, close) - (Math.random() * 0.08 * vol * basePrice) / 100;
    
    // Stretch candle body for institutional displacement
    if (isHeavyDisplacement) {
      if (displacementDir === 'bullish') {
        high = close + (Math.random() * 0.01 * basePrice) / 100;
        low = open - (Math.random() * 0.005 * basePrice) / 100;
      } else {
        high = open + (Math.random() * 0.005 * basePrice) / 100;
        low = close - (Math.random() * 0.01 * basePrice) / 100;
      }
    }

    const absBody = Math.abs(close - open);
    const range = high - low;

    // Relative volume expands during institutional activity
    const baseVolume = 100000 * (asset.decimals === 5 ? 0.01 : 1);
    let volume = Math.floor(baseVolume * (0.5 + Math.random() * 1.5));
    if (isHeavyDisplacement) {
      volume = Math.floor(baseVolume * (3.5 + Math.random() * 2));
    } else if (Math.abs(priceChange) > (basePrice * vol * 0.003)) {
      volume = Math.floor(baseVolume * (1.8 + Math.random() * 1.2));
    }

    currentPrice = close;

    // VWAP calculation
    const typicalPrice = (high + low + close) / 3;
    accumulatedVolPrice += typicalPrice * volume;
    accumulatedVol += volume;
    const vwap = accumulatedVolPrice / accumulatedVol;

    // Create Candle Structure
    candles.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
      vwap,
      isDisplacement: isHeavyDisplacement,
      displacementType: displacementDir,
      relativeVolume: Number((volume / baseVolume).toFixed(2))
    });
  }

  // Calculate dynamic momentum and secondary filters on the set
  return candles;
}

/**
 * Calculates Fair Value Gaps on the current set of candles.
 */
export function calculateFVGs(candles: Candle[]): FairValueGap[] {
  const fvgs: FairValueGap[] = [];
  
  // Need at least 3 candles to establish a gap (i-2, i-1, i)
  for (let i = 2; i < candles.length; i++) {
    const cPrevPrev = candles[i - 2];
    const cMiddle = candles[i - 1];
    const cCurr = candles[i];
    
    // Bullish FVG check
    // Low of current candle [i] is above High of previous-previous candle [i-2]
    if (cCurr.low > cPrevPrev.high) {
      // Body of middle candle must be substantially large to denote genuine institutional imbalance
      const cMiddleBody = Math.abs(cMiddle.close - cMiddle.open);
      const cMiddleTotal = cMiddle.high - cMiddle.low;
      
      if (cMiddleBody > 0.4 * cMiddleTotal || cMiddle.isDisplacement) {
        const top = cCurr.low;
        const bottom = cPrevPrev.high;
        const eq = bottom + (top - bottom) / 2;
        
        fvgs.push({
          id: `fvg-bull-${i}`,
          type: 'bullish',
          top,
          bottom,
          equilibrium: eq,
          state: 'ARMED',
          createdAtIdx: i
        });
      }
    }
    
    // Bearish FVG check
    // High of current candle [i] is below Low of previous-previous candle [i-2]
    if (cCurr.high < cPrevPrev.low) {
      const cMiddleBody = Math.abs(cMiddle.close - cMiddle.open);
      const cMiddleTotal = cMiddle.high - cMiddle.low;
      
      if (cMiddleBody > 0.4 * cMiddleTotal || cMiddle.isDisplacement) {
        const top = cPrevPrev.low;
        const bottom = cCurr.high;
        const eq = bottom + (top - bottom) / 2;
        
        fvgs.push({
          id: `fvg-bear-${i}`,
          type: 'bearish',
          top,
          bottom,
          equilibrium: eq,
          state: 'ARMED',
          createdAtIdx: i
        });
      }
    }
  }

  // Simulate states and updates on those FVGs as price continues to interact:
  // TESTED: when price moves back inside the gap
  // HELD: when price touches the gap (but doesn't cross the equilibrium or bottom of bullish gap / top of bearish gap) and bounces
  // INVALIDATED: when price closes fully below the bullish gap / above the bearish gap
  // COMPLETED: when price fills the entire gap
  fvgs.forEach(fvg => {
    let touched = false;
    let closedPastEq = false;
    let fullyBroken = false;
    
    // Look at candles after the creation index
    for (let j = fvg.createdAtIdx + 1; j < candles.length; j++) {
      const candle = candles[j];
      
      if (fvg.type === 'bullish') {
        // Did price enter the gap?
        if (candle.low <= fvg.top && candle.high >= fvg.bottom) {
          touched = true;
          fvg.testedAtIdx = j;
          
          if (candle.low < fvg.equilibrium) {
            closedPastEq = true;
          }
          
          // Close below bottom of bullish FVG is invalidation
          if (candle.close < fvg.bottom) {
            fullyBroken = true;
            fvg.invalidatedAtIdx = j;
            break;
          }
        }
      } else {
        // Bearish
        // Did price enter the gap?
        if (candle.high >= fvg.bottom && candle.low <= fvg.top) {
          touched = true;
          fvg.testedAtIdx = j;
          
          if (candle.high > fvg.equilibrium) {
            closedPastEq = true;
          }
          
          // Close above top of bearish FVG is invalidation
          if (candle.close > fvg.top) {
            fullyBroken = true;
            fvg.invalidatedAtIdx = j;
            break;
          }
        }
      }
    }

    if (fullyBroken) {
      fvg.state = 'INVALIDATED';
    } else if (touched) {
      if (closedPastEq) {
        fvg.state = 'TESTED';
      } else {
        fvg.state = 'HELD';
      }
    } else {
      fvg.state = 'ARMED';
    }
  });

  return fvgs;
}

/**
 * Calculates liquidity sweeps
 */
export function calculateLiquidityEvents(candles: Candle[]): LiquidityEvent[] {
  const events: LiquidityEvent[] = [];
  
  for (let i = 8; i < candles.length; i++) {
    const prevCandles = candles.slice(i - 8, i);
    const highs = prevCandles.map(c => c.high);
    const lows = prevCandles.map(c => c.low);
    const localMax = Math.max(...highs);
    const localMin = Math.min(...lows);
    
    const curr = candles[i];
    
    // Liquidity Sweep High: Price went above local max of past 8 candles, but closed lower
    if (curr.high > localMax && curr.close < localMax) {
      events.push({
        id: `liq-swp-h-${i}`,
        label: i % 3 === 0 ? 'External Liquidity Grab' : 'Liquidity Sweep High',
        price: localMax,
        candleIdx: i,
        type: 'bearish'
      });
    }
    
    // Liquidity Sweep Low: Price went below local min of past 8 candles, but closed higher
    if (curr.low < localMin && curr.close > localMin) {
      events.push({
        id: `liq-swp-l-${i}`,
        label: i % 5 === 0 ? 'Stop Run' : (i % 3 === 0 ? 'Internal Liquidity Grab' : 'Liquidity Sweep Low'),
        price: localMin,
        candleIdx: i,
        type: 'bullish'
      });
    }
  }
  
  return events;
}

/**
 * Calculates EMA for a given length
 */
export function calculateEMA(candles: Candle[], length: number): number[] {
  const emas: number[] = [];
  if (candles.length === 0) return emas;
  
  const k = 2 / (length + 1);
  let ema = candles[0].close;
  emas.push(ema);
  
  for (let i = 1; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    emas.push(ema);
  }
  return emas;
}
