/**
 * Tests for Monod Growth Kinetics
 *
 * These tests verify the mathematical behavior of the Monod equation
 * against known analytical properties. Each test case corresponds to
 * a physical scenario the team should understand for the defense.
 */

import { monodGrowthRate, biomassRate, substrateRate } from '../models/monod';
import { DEFAULT_KINETIC_PARAMS } from '../models/parameters';
import type { KineticParameters } from '../models/parameters';

const params = DEFAULT_KINETIC_PARAMS;

describe('Monod Growth Rate — monodGrowthRate()', () => {

  test('should return 0 when substrate is 0 (no food = no growth)', () => {
    const mu = monodGrowthRate(0, params);
    expect(mu).toBe(0);
  });

  test('should return 0 for negative substrate (guard clause)', () => {
    const mu = monodGrowthRate(-5, params);
    expect(mu).toBe(0);
  });

  test('should return μ_max/2 when S = K_s (definition of K_s)', () => {
    // This is the DEFINITION of Ks: the substrate concentration
    // at which growth rate is exactly half of maximum
    const mu = monodGrowthRate(params.Ks, params);
    expect(mu).toBeCloseTo(params.muMax / 2, 6);
  });

  test('should approach μ_max when S >> K_s (substrate abundant)', () => {
    // At very high substrate, growth should be near maximum
    const highSubstrate = params.Ks * 1000; // 1000x the saturation constant
    const mu = monodGrowthRate(highSubstrate, params);
    expect(mu).toBeCloseTo(params.muMax, 3);
  });

  test('should be approximately linear when S << K_s', () => {
    // At very low substrate: μ ≈ (μ_max / K_s) * S
    const lowS = params.Ks * 0.01;
    const mu = monodGrowthRate(lowS, params);
    const linearApprox = (params.muMax / params.Ks) * lowS;
    expect(mu).toBeCloseTo(linearApprox, 4);
  });

  test('should increase monotonically with substrate', () => {
    const concentrations = [0.1, 0.5, 1.0, 5.0, 10.0, 50.0, 100.0];
    let previousMu = 0;
    for (const S of concentrations) {
      const mu = monodGrowthRate(S, params);
      expect(mu).toBeGreaterThan(previousMu);
      previousMu = mu;
    }
  });

  test('should never exceed μ_max', () => {
    const veryHighS = 10000;
    const mu = monodGrowthRate(veryHighS, params);
    expect(mu).toBeLessThanOrEqual(params.muMax);
  });
});

describe('Biomass Rate — biomassRate()', () => {

  test('dX/dt = μ * X — should scale with biomass', () => {
    const S = 50; // plenty of substrate
    const X1 = 1.0;
    const X2 = 2.0;

    const rate1 = biomassRate(X1, S, params);
    const rate2 = biomassRate(X2, S, params);

    // Double biomass → double growth rate (at same μ)
    expect(rate2).toBeCloseTo(rate1 * 2, 6);
  });

  test('should return 0 when biomass is 0', () => {
    const rate = biomassRate(0, 100, params);
    expect(rate).toBeCloseTo(0);
  });

  test('should return 0 when substrate is 0', () => {
    const rate = biomassRate(5, 0, params);
    expect(rate).toBeCloseTo(0);
  });
});

describe('Substrate Rate — substrateRate()', () => {

  test('should always be negative (substrate is consumed)', () => {
    const rate = substrateRate(5, 50, params);
    expect(rate).toBeLessThan(0);
  });

  test('should be 0 when no biomass (nothing to consume substrate)', () => {
    const rate = substrateRate(0, 100, params);
    expect(rate).toBeCloseTo(0);
  });

  test('should be 0 when no substrate (nothing to consume)', () => {
    const rate = substrateRate(5, 0, params);
    expect(rate).toBeCloseTo(0);
  });

  test('consumption rate magnitude should increase with biomass', () => {
    const S = 50;
    const rate1 = Math.abs(substrateRate(1, S, params));
    const rate2 = Math.abs(substrateRate(5, S, params));
    expect(rate2).toBeGreaterThan(rate1);
  });
});
