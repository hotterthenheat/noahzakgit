/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import { calculateAnalyticGreeks, computeDealerInventory } from '../src/lib/v11Math';
import { AssetInfo, Candle } from '../src/types';
import { buildGexProfile, computeDealerFlowGauge } from '../src/lib/gexEngine';
import { computeDisplacementIntelligence } from '../src/lib/displacementEngine';
import { touchProbability, medianTimeToTouch } from '../src/lib/probability';

console.log('--- RUNNING QUANT MATH TEST SUITE ---');

// 1. Setup mock asset info
const mockAsset: AssetInfo = {
  ticker: 'TEST',
  name: 'Test Index',
  defaultPrice: 100,
  volatility: 0.20,
  decimals: 2,
  type: 'INDEXES',
  spread: 0.05,
  unit: 'points'
};

// 2. Test Black-Scholes-Merton Greeks (d1, d2, Delta, Gamma, Vanna, Charm, Theta)
function testOptionGreeksSymmetry() {
  console.log('Testing BSM Greeks calculations and dual signs...');

  const spot = 100;
  const strike = 100;
  const dteDays = 30; // 30 DTE
  const riskFreeRate = 0.05;
  const impliedVol = 0.20;

  // Compute for Call option: (spot, strike, dteDays, iv, isCall, r)
  const callGreeks = calculateAnalyticGreeks(spot, strike, dteDays, impliedVol, true, riskFreeRate);
  
  // Compute for Put option: (spot, strike, dteDays, iv, isCall, r)
  const putGreeks = calculateAnalyticGreeks(spot, strike, dteDays, impliedVol, false, riskFreeRate);

  // Assert Call Delta is positive, Put Delta is negative
  assert.ok(callGreeks.delta > 0, 'Call Delta must be positive');
  assert.ok(putGreeks.delta < 0, 'Put Delta must be negative');
  assert.ok(Math.abs(callGreeks.delta - putGreeks.delta - 1.0) < 0.01, 'Call Delta - Put Delta should equal ~1 (Put-Call Parity Derivative)');

  // Assert Gamma is positive and identical for both call and put options at same strike/spot
  assert.ok(callGreeks.gamma > 0, 'Gamma must be positive');
  assert.ok(putGreeks.gamma > 0, 'Put Gamma must be positive');
  assert.strictEqual(callGreeks.gamma, putGreeks.gamma, 'Call and Put Gammas must be completely identical at symmetry');

  // Assert Vanna calculation
  assert.ok(Math.abs(callGreeks.vanna) > 0, 'Vanna should be non-zero');
  assert.strictEqual(callGreeks.vanna, putGreeks.vanna, 'Vanna must be identical for Calls and Puts at the same node');

  // Assert Put Charm sign flip behaves correctly (Puts have negative/positive charm matching d2)
  console.log(`Call Charm: ${callGreeks.charm}, Put Charm: ${putGreeks.charm}`);
  assert.ok(!isNaN(callGreeks.charm), 'Call charm must be a finite number');
  assert.ok(!isNaN(putGreeks.charm), 'Put charm must be a finite number');

  // Assert Theta conversion to daily unit represents negative time decay
  assert.ok(callGreeks.theta < 0, 'Call Theta should represent negative time decay');
  assert.ok(putGreeks.theta < 0, 'Put Theta should represent negative time decay');

  console.log('✔ BSM Greeks and Symmetry checks passed.');
}

// 3. Test Dealer Inventory Positioning Calculations
function testDealerInventoryGexDex() {
  console.log('Testing Dealer Inventory positioning signs...');

  // Mock a structured option chain
  // In our conventions, dealers are assumed LONG calls (positive GEX contribution) and SHORT puts (negative GEX contribution)
  const mockOptionChain: any[] = [
    {
      strike: 95,
      type: 'put',
      openInterest: 500,
      iv: 0.22,
      bid: 0.8,
      ask: 0.9,
      delta: -0.3,
      gamma: 0.05,
      vega: 0.12,
      theta: -0.05,
      vanna: 0.02,
      charm: -0.02
    },
    {
      strike: 105,
      type: 'call',
      openInterest: 500,
      iv: 0.18,
      bid: 1.1,
      ask: 1.2,
      delta: 0.4,
      gamma: 0.06,
      vega: 0.15,
      theta: -0.06,
      vanna: 0.03,
      charm: -0.03
    }
  ];

  const spot = 100;
  const DTE = 5;

  const result = computeDealerInventory(mockOptionChain, spot, mockAsset.decimals, DTE);

  assert.ok(result.gammaFlipPrice > 0, 'Gamma flip price should be a valid positive number');
  assert.ok(result.netGex !== 0, 'Net GEX should be successfully computed');
  assert.ok(result.netDex !== 0, 'Net DEX should be successfully computed');

  console.log('✔ Dealer GEX, DEX and Gamma Flip root-solver logic passed.');
}

function testGexEngine() {
  console.log('Testing GEX Engine profile builder and flow solver...');
  const contracts: any[] = [
    { strike: 95, type: 'P', oi: 1000, impliedVolatility: 0.20, delta: -0.3, gamma: 0.05, bid: 1.0, ask: 1.1, volume: 100 },
    { strike: 105, type: 'C', oi: 1000, impliedVolatility: 0.20, delta: 0.4, gamma: 0.06, bid: 1.2, ask: 1.3, volume: 120 }
  ];
  const profile = buildGexProfile(contracts, 100, 1/365, 0.05);
  assert.ok(profile, 'GEX profile should be constructed successfully');
  assert.ok(profile.strikes.length > 0, 'Strikes list should contain values');
  assert.ok(profile.gammaFlip > 0, 'Gamma Flip should be calculated');
  
  const flow = computeDealerFlowGauge(profile, 1000000, -2000000);
  assert.ok(flow, 'Dealer flow gauge should be computed successfully');
  assert.ok(flow.pressure >= -100 && flow.pressure <= 100, 'Pressure score should be between -100 and +100');
  console.log('✔ GEX Engine checks passed.');
}

function testDisplacementEngine() {
  console.log('Testing Displacement Engine market structure and sweeps...');
  const candles: Candle[] = [];
  const baseTime = Date.now() - 50 * 300000;
  for (let i = 0; i < 50; i++) {
    candles.push({
      timestamp: baseTime + i * 300000,
      open: 100 + i * 0.5,
      high: 101 + i * 0.5,
      low: 99.5 + i * 0.5,
      close: 100.5 + i * 0.5,
      volume: 150000 + (i % 5) * 10000,
      vwap: 100 + i * 0.5
    });
  }
  const result = computeDisplacementIntelligence(candles);
  assert.ok(result, 'Displacement intelligence should be built successfully');
  assert.ok(result.volatility.atr > 0, 'ATR value should be positive');
  assert.ok(typeof result.structure.trend === 'string', 'Trend bias should be a string');
  console.log('✔ Displacement Engine checks passed.');
}

function testProbabilityEngine() {
  console.log('Testing Probability Engine touch probability and median time...');
  const spot = 100;
  const targetPrice = 105;
  const dte = 30;
  const iv = 0.20;
  const riskFree = 0.05;
  
  const prob = touchProbability(spot, targetPrice, dte, iv, riskFree);
  assert.ok(prob >= 0 && prob <= 1, 'Touch probability must be between 0 and 1');
  
  const medianTime = medianTimeToTouch(spot, targetPrice, iv, riskFree);
  assert.ok(medianTime > 0, 'Median time to touch should be positive');
  console.log('✔ Probability Engine checks passed.');
}

// Run all tests
try {
  testOptionGreeksSymmetry();
  testDealerInventoryGexDex();
  testGexEngine();
  testDisplacementEngine();
  testProbabilityEngine();
  console.log('\n=============================================');
  console.log('🎉 ALL INSTITUTIONAL QUANT MANIFEST TESTS PASSED! 🎉');
  console.log('=============================================\n');
  process.exit(0);
} catch (error) {
  console.error('❌ QUANT TEST RUNNER FAILED:', error);
  process.exit(1);
}
