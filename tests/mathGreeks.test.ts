import assert from 'assert';
import { calculateAnalyticGreeks } from '../src/lib/v11Math';

console.log('--- RUNNING DEGENERATE GREEKS MATH SAFETY SUITE ---');

function testZeroDte() {
  console.log('Testing Greeks boundary behavior on expiration day (DTE = 0)...');
  const greeksCall = calculateAnalyticGreeks(100, 100, 0, 0.20, true);
  const greeksPut = calculateAnalyticGreeks(100, 100, 0, 0.20, false);

  assert.ok(!isNaN(greeksCall.delta), 'Call Delta on 0 DTE must not be NaN');
  assert.ok(!isNaN(greeksPut.delta), 'Put Delta on 0 DTE must not be NaN');
  assert.ok(isFinite(greeksCall.gamma), 'Call Gamma on 0 DTE must be finite');
  assert.ok(isFinite(greeksCall.speed), 'Call Speed on 0 DTE must be finite');
  assert.ok(isFinite(greeksCall.vanna), 'Call Vanna on 0 DTE must be finite');
  assert.ok(isFinite(greeksCall.charm), 'Call Charm on 0 DTE must be finite');
  assert.ok(isFinite(greeksCall.theta), 'Call Theta on 0 DTE must be finite');
  console.log('✔ Expiration day check passed.');
}

function testZeroIv() {
  console.log('Testing Greeks behavior under flat zero volatility (IV = 0)...');
  const greeksCall = calculateAnalyticGreeks(100, 100, 30, 0.0, true);
  const greeksPut = calculateAnalyticGreeks(100, 100, 30, 0.0, false);

  assert.ok(!isNaN(greeksCall.delta), 'Call Delta with 0 IV must not be NaN');
  assert.ok(!isNaN(greeksPut.delta), 'Put Delta with 0 IV must not be NaN');
  assert.ok(isFinite(greeksCall.gamma), 'Call Gamma with 0 IV must be finite');
  assert.ok(isFinite(greeksCall.speed), 'Call Speed with 0 IV must be finite');
  assert.ok(isFinite(greeksCall.vanna), 'Call Vanna with 0 IV must be finite');
  assert.ok(isFinite(greeksCall.charm), 'Call Charm with 0 IV must be finite');
  console.log('✔ Flat zero volatility check passed.');
}

function testZeroSpot() {
  console.log('Testing Greeks behavior when underlying spot is near zero (Spot = 0)...');
  const greeksCall = calculateAnalyticGreeks(0, 100, 30, 0.20, true);
  const greeksPut = calculateAnalyticGreeks(0, 100, 30, 0.20, false);

  assert.ok(!isNaN(greeksCall.delta), 'Call Delta with 0 Spot must not be NaN');
  assert.ok(!isNaN(greeksPut.delta), 'Put Delta with 0 Spot must not be NaN');
  assert.ok(isFinite(greeksCall.gamma), 'Call Gamma with 0 Spot must be finite');
  assert.ok(isFinite(greeksCall.speed), 'Call Speed with 0 Spot must be finite');
  assert.ok(isFinite(greeksCall.vanna), 'Call Vanna with 0 Spot must be finite');
  assert.ok(isFinite(greeksCall.charm), 'Call Charm with 0 Spot must be finite');
  console.log('✔ Spot = 0 check passed.');
}

try {
  testZeroDte();
  testZeroIv();
  testZeroSpot();
  console.log('🎉 ALL BOUNDARY MATH SAFETY TESTS PASSED! 🎉');
  process.exit(0);
} catch (e) {
  console.error('❌ BOUNDARY MATH SUITE FAILED:', e);
  process.exit(1);
}
