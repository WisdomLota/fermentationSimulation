/**
 * Tests for Luedeking-Piret Product Formation Model
 *
 * These tests verify ethanol production rate calculations.
 * Key concepts for the defense:
 *   - The two-term structure (growth-associated vs maintenance)
 *   - Why β matters in stationary phase
 *   - Yield efficiency relative to theoretical maximum
 */

import { productRate, yieldEfficiency } from '../models/luedekingPiret';
import { DEFAULT_KINETIC_PARAMS } from '../models/parameters';
import { describe, test, expect } from '@jest/globals';

const params = DEFAULT_KINETIC_PARAMS;

describe('Product Formation Rate — productRate()', () => {

  test('should return 0 when biomass is 0', () => {
    const rate = productRate(0, 100, params);
    expect(rate).toBe(0);
  });

  test('should still produce when substrate is 0 (β term)', () => {
    // When S = 0, μ = 0, but β·X should still contribute
    // This is non-growth-associated (maintenance) production
    const X = 5;
    const rate = productRate(X, 0, params);

    // Only β·X should remain
    expect(rate).toBeCloseTo(params.beta * X, 6);
    expect(rate).toBeGreaterThan(0);
  });

  test('growth-associated term should dominate during active growth', () => {
    // High substrate → high μ → α·μ·X >> β·X
    const X = 5;
    const S = 100; // plenty of substrate

    // Calculate the two terms separately for comparison
    const mu = params.muMax * S / (params.Ks + S);
    const growthTerm = params.alpha * mu * X;
    const maintenanceTerm = params.beta * X;

    expect(growthTerm).toBeGreaterThan(maintenanceTerm * 5);

    // Total rate should equal sum
    const totalRate = productRate(X, S, params);
    expect(totalRate).toBeCloseTo(growthTerm + maintenanceTerm, 6);
  });

  test('should increase with biomass concentration', () => {
    const S = 50;
    const rate1 = productRate(1, S, params);
    const rate2 = productRate(5, S, params);
    expect(rate2).toBeGreaterThan(rate1);
  });

  test('should be positive whenever biomass is present', () => {
    // Regardless of substrate level, if X > 0, production should be positive
    // because β·X always contributes
    const testCases = [
      { X: 1, S: 0 },
      { X: 1, S: 0.1 },
      { X: 1, S: 100 },
      { X: 10, S: 50 },
    ];

    for (const { X, S } of testCases) {
      expect(productRate(X, S, params)).toBeGreaterThan(0);
    }
  });
});

describe('Yield Efficiency — yieldEfficiency()', () => {

  test('should return 0 when no substrate consumed', () => {
    expect(yieldEfficiency(0, 10)).toBe(0);
  });

  test('should return ~100% at theoretical maximum yield (0.511 g/g)', () => {
    // Theoretical: 100g glucose → 51.1g ethanol
    const efficiency = yieldEfficiency(100, 51.1);
    expect(efficiency).toBeCloseTo(100, 0);
  });

  test('typical fermentation should be 85-95% efficient', () => {
    // With Yps = 0.46: 100g glucose → 46g ethanol
    // Efficiency = 0.46 / 0.511 ≈ 90%
    const efficiency = yieldEfficiency(100, 46);
    expect(efficiency).toBeGreaterThan(85);
    expect(efficiency).toBeLessThan(95);
  });

  test('should cap at 100%', () => {
    // Impossible in practice, but guard against numerical artifacts
    const efficiency = yieldEfficiency(10, 100);
    expect(efficiency).toBeLessThanOrEqual(100);
  });
});
