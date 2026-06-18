/**
 * 0DTE Options Intraday Backtesting Engine (Method B)
 * Recalculates GEX profiles and evaluates trading strategies on a minute-by-minute scale
 */

import { ThetaClient, ThetaQuoteSnapshot } from './thetaClient';
import { buildGexProfile } from './gexEngine';
import { calculateAnalyticGreeks } from './v11Math';
import { LiveOptionContract } from './marketDataProvider';

// Helper to parse CLI arguments (e.g., --step=900)
const args = process.argv.slice(2);
const getArg = (name: string, fallback: string): string => {
  const match = args.find(a => a.startsWith(`--${name}=`));
  return match ? match.split('=')[1] : fallback;
};

// Dynamic Backtester configuration
const CONFIG = {
  ticker: getArg('ticker', 'SPX'),
  // Historical dates range format YYYYMMDD
  startDate: getArg('start', '20260601'),
  endDate: getArg('end', '20260605'),
  
  // Resolution of GEX recalculation in seconds (60 = 1 minute, 900 = 15 minutes)
  stepSeconds: Number(getArg('step', '60')),
  
  // Trading Strategy thresholds
  takeProfitPct: Number(getArg('tp', '0.008')),  // 0.8% underlying price move for profit exit
  stopLossPct: Number(getArg('sl', '0.004')),    // 0.4% underlying price move for stop-loss exit
  
  // Hours of trading session in seconds since midnight (9:35 AM to 3:59 PM EST)
  marketOpenSec: 34500,  // 09:35 AM
  marketCloseSec: 57540  // 03:59 PM
};

interface Position {
  date: string;
  type: 'CALL' | 'PUT';
  entryTime: string;
  entryPrice: number;
  triggerWall: number;
  status: 'ACTIVE' | 'WIN' | 'LOSS' | 'CLOSED_EOD';
  exitPrice?: number;
  exitTime?: string;
}

async function runBacktest() {
  console.log(`\n==================================================`);
  console.log(`🚀 STARTING 0DTE MINUTE-BY-MINUTE BACKTEST ENGINE`);
  console.log(`==================================================`);
  console.log(`Asset: ${CONFIG.ticker}`);
  console.log(`Date Range: ${CONFIG.startDate} to ${CONFIG.endDate}`);
  console.log(`TP Target: ${(CONFIG.takeProfitPct * 100).toFixed(2)}% | SL Stop: ${(CONFIG.stopLossPct * 100).toFixed(2)}%`);
  console.log(`GEX Scan Interval: ${CONFIG.stepSeconds}s (1 minute)`);
  console.log(`Connecting to local Theta Terminal on port 25503...`);

  const client = new ThetaClient();
  const tradeHistory: Position[] = [];

  // Generate date list between startDate and endDate
  const dates = getDatesList(CONFIG.startDate, CONFIG.endDate);

  for (const date of dates) {
    console.log(`\n--------------------------------------------`);
    console.log(`📅 Processing Trading Session: ${formatDateDash(date)}`);
    console.log(`--------------------------------------------`);

    // Fetch historical 1-minute stock candles to simulate the session index price
    const candles = await client.fetchHistoricalUnderlyingCandles(CONFIG.ticker, date, date);
    if (!candles || candles.length === 0) {
      console.log(`⚠️ No underlying stock candle data found for ${date}. Skipping.`);
      continue;
    }

    // Map candles by their timestamp (seconds since midnight) for fast lookup
    const priceMap = new Map<number, number>();
    for (const c of candles) {
      // Theta Data timestamp fields or time values
      const timeStr = c.time || c.time_str || ''; // e.g. "09:30:00"
      if (timeStr) {
        const sec = client.timeToSeconds(timeStr.substring(0, 5));
        priceMap.set(sec, c.close || c.price || 0);
      }
    }

    let activePosition: Position | null = null;
    let tradesCountToday = 0;

    // Simulate minute-by-minute session loop
    for (let sec = CONFIG.marketOpenSec; sec <= CONFIG.marketCloseSec; sec += CONFIG.stepSeconds) {
      const timeStr = client.secondsToTime(sec);
      const spotPrice = priceMap.get(sec);

      if (!spotPrice || spotPrice <= 0) {
        continue; // No price candle for this minute
      }

      // 1. Manage active trades
      if (activePosition) {
        const entryPrice = activePosition.entryPrice;
        const tpTarget = activePosition.type === 'CALL' ? entryPrice * (1 + CONFIG.takeProfitPct) : entryPrice * (1 - CONFIG.takeProfitPct);
        const slStop = activePosition.type === 'CALL' ? entryPrice * (1 - CONFIG.stopLossPct) : entryPrice * (1 + CONFIG.stopLossPct);

        const isTakeProfit = activePosition.type === 'CALL' ? spotPrice >= tpTarget : spotPrice <= tpTarget;
        const isStopLoss = activePosition.type === 'CALL' ? spotPrice <= slStop : spotPrice >= slStop;

        if (isTakeProfit) {
          activePosition.status = 'WIN';
          activePosition.exitPrice = spotPrice;
          activePosition.exitTime = timeStr;
          console.log(`✨ [WIN EXIT] ${activePosition.type} target hit at ${timeStr}. Spot: ${spotPrice.toFixed(2)} (Entry: ${entryPrice.toFixed(2)}, Target: ${tpTarget.toFixed(2)})`);
          tradeHistory.push(activePosition);
          activePosition = null;
        } else if (isStopLoss) {
          activePosition.status = 'LOSS';
          activePosition.exitPrice = spotPrice;
          activePosition.exitTime = timeStr;
          console.log(`🚨 [STOP LOSS EXIT] ${activePosition.type} stopped out at ${timeStr}. Spot: ${spotPrice.toFixed(2)} (Entry: ${entryPrice.toFixed(2)}, Stop: ${slStop.toFixed(2)})`);
          tradeHistory.push(activePosition);
          activePosition = null;
        } else if (sec >= CONFIG.marketCloseSec - CONFIG.stepSeconds) {
          // Close at market close
          activePosition.status = 'CLOSED_EOD';
          activePosition.exitPrice = spotPrice;
          activePosition.exitTime = timeStr;
          console.log(`⏰ [EOD EXIT] Position closed out at market end. Spot: ${spotPrice.toFixed(2)}`);
          tradeHistory.push(activePosition);
          activePosition = null;
        }
        continue; // skip entry signal checks if already holding
      }

      // 2. Scan GEX profile and check signal triggers
      // Limit to 1 trade per day max to prevent over-trading in mock/sandbox environments
      if (tradesCountToday >= 1) {
        continue;
      }

      // Fetch options snapshots
      const optionChain = await client.fetchHistorical0DteChain(CONFIG.ticker, date, timeStr);
      if (!optionChain || optionChain.length === 0) {
        continue;
      }

      // Map to LiveOptionContract to feed into the GEX engine
      // DTE = 0.0001 (approx 0 for 0DTE contracts)
      const dteDays = 0.05; // 0DTE is expiring today
      const mappedContracts: LiveOptionContract[] = optionChain.map((c, i) => {
        const greeks = calculateAnalyticGreeks(spotPrice, c.strike, dteDays, c.impliedVolatility, c.type === 'C');
        return {
          contract: `OPT-${c.strike}-${c.type}-${i}`,
          strike: c.strike,
          type: c.type,
          oi: c.openInterest || 100, // Fallback if OI is unpopulated
          volume: c.volume,
          impliedVolatility: c.impliedVolatility,
          greeks: {
            delta: greeks.delta,
            gamma: greeks.gamma,
            theta: greeks.theta,
            vega: greeks.vega
          },
          bid: c.bid,
          ask: c.ask,
          lastPrice: (c.bid + c.ask) / 2
        };
      });

      const gexProfile = buildGexProfile(mappedContracts, spotPrice, dteDays / 365);
      if (!gexProfile) {
        continue;
      }

      // Strategy Signals:
      // - Buy CALL if price breaks above King Call Wall (resistance breakout)
      // - Buy PUT if price breaks below Barney Put Wall (support breakdown)
      const callWall = gexProfile.callWall;
      const putWall = gexProfile.putWall;

      if (spotPrice > callWall) {
        activePosition = {
          date,
          type: 'CALL',
          entryTime: timeStr,
          entryPrice: spotPrice,
          triggerWall: callWall,
          status: 'ACTIVE'
        };
        tradesCountToday++;
        console.log(`📈 [SIGNAL TRIGGERED] BUY CALL at ${timeStr}. Spot: ${spotPrice.toFixed(2)} broke above Call Wall: ${callWall}`);
      } else if (spotPrice < putWall) {
        activePosition = {
          date,
          type: 'PUT',
          entryTime: timeStr,
          entryPrice: spotPrice,
          triggerWall: putWall,
          status: 'ACTIVE'
        };
        tradesCountToday++;
        console.log(`📉 [SIGNAL TRIGGERED] BUY PUT at ${timeStr}. Spot: ${spotPrice.toFixed(2)} broke below Put Wall: ${putWall}`);
      }
    }
  }

  printReport(tradeHistory);
}

function getDatesList(startStr: string, endStr: string): string[] {
  // Simple helper to generate dates between YYYYMMDD
  const dates: string[] = [];
  const start = new Date(
    Number(startStr.substring(0, 4)),
    Number(startStr.substring(4, 6)) - 1,
    Number(startStr.substring(6, 8))
  );
  const end = new Date(
    Number(endStr.substring(0, 4)),
    Number(endStr.substring(4, 6)) - 1,
    Number(endStr.substring(6, 8))
  );

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends
    
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${yyyy}${mm}${dd}`);
  }
  return dates;
}

function formatDateDash(dateStr: string): string {
  return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
}

function printReport(history: Position[]) {
  console.log(`\n==================================================`);
  console.log(`📊 0DTE BACKTEST PERFORMANCE REPORT`);
  console.log(`==================================================`);
  const total = history.length;
  if (total === 0) {
    console.log(`No trades generated during the simulation window.`);
    return;
  }

  const wins = history.filter(p => p.status === 'WIN').length;
  const losses = history.filter(p => p.status === 'LOSS').length;
  const eodCloses = history.filter(p => p.status === 'CLOSED_EOD').length;

  const winRate = (wins / (wins + losses)) * 100;

  console.log(`Total Triggers Generated: ${total}`);
  console.log(`Win Trades (Take Profit): ${wins}`);
  console.log(`Loss Trades (Stop Loss):  ${losses}`);
  console.log(`End of Day Closeouts:     ${eodCloses}`);
  console.log(`--------------------------------------------------`);
  console.log(`Win Rate (excluding EOD): ${isNaN(winRate) ? '—' : winRate.toFixed(2)}%`);
  console.log(`==================================================\n`);
}

// Run backtester
runBacktest().catch(err => {
  console.error('Fatal backtest engine error:', err);
});
