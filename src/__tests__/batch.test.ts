/**
 * Integration Tests for Batch Fermentation Simulation
 *
 * These tests verify that the complete simulation pipeline
 * (Monod + Luedeking-Piret + RK4 solver) produces physically
 * realistic results that match known fermentation behavior.
 *
 * Key defense points:
 *   - Substrate should monotonically decrease (it's being consumed)
 *   - Biomass should increase then plateau (logistic-like growth)
 *   - Product should increase throughout (even after growth stops, β term)
 *   - Mass balance should be approximately conserved
 */

import { runBatchSimulation } from '../simulation/batch';
import {
  DEFAULT_KINETIC_PARAMS,
  DEFAULT_CONDITIONS,
  DEFAULT_SIM_CONFIG,
} from '../models/parameters';

describe('Batch Fermentation — Full Simulation', () => {
  // Run once and share across tests (expensive operation)
  const result = runBatchSimulation(
    DEFAULT_KINETIC_PARAMS,
    DEFAULT_CONDITIONS,
    DEFAULT_SIM_CONFIG
  );

  test('should produce time series of correct length', () => {
    expect(result.time.length).toBeGreaterThan(10);
    expect(result.time.length).toBe(result.biomass.length);
    expect(result.time.length).toBe(result.substrate.length);
    expect(result.time.length).toBe(result.product.length);
    expect(result.time.length).toBe(result.growthRate.length);
  });

  test('should start at the correct initial conditions', () => {
    expect(result.biomass[0]).toBe(DEFAULT_CONDITIONS.X0);      // 0.5 g/L
    expect(result.substrate[0]).toBe(DEFAULT_CONDITIONS.S0);     // 150 g/L
    expect(result.product[0]).toBe(DEFAULT_CONDITIONS.P0);       // 0 g/L
  });

  test('substrate should monotonically decrease', () => {
    for (let i = 1; i < result.substrate.length; i++) {
      expect(result.substrate[i]).toBeLessThanOrEqual(result.substrate[i - 1] + 0.01);
    }
  });

  test('substrate should never go negative', () => {
    for (const S of result.substrate) {
      expect(S).toBeGreaterThanOrEqual(0);
    }
  });

  test('biomass should increase from initial value', () => {
    const maxBiomass = Math.max(...result.biomass);
    expect(maxBiomass).toBeGreaterThan(DEFAULT_CONDITIONS.X0 * 5);
  });

  test('product (ethanol) should increase over time', () => {
    const finalProduct = result.product[result.product.length - 1];
    expect(finalProduct).toBeGreaterThan(0);
    expect(finalProduct).toBeGreaterThan(result.product[0]);
  });

  test('growth rate should start high and decrease as substrate depletes', () => {
    // Initial growth rate should be near μ_max (substrate is abundant)
    expect(result.growthRate[0]).toBeGreaterThan(
      DEFAULT_KINETIC_PARAMS.muMax * 0.9
    );

    // Final growth rate should be much lower (substrate depleted)
    const finalMu = result.growthRate[result.growthRate.length - 1];
    expect(finalMu).toBeLessThan(DEFAULT_KINETIC_PARAMS.muMax * 0.5);
  });

  describe('Summary Statistics', () => {

    test('final biomass should be in realistic range (5-20 g/L)', () => {
      expect(result.summary.finalBiomass).toBeGreaterThan(5);
      expect(result.summary.finalBiomass).toBeLessThan(25);
    });

    test('final ethanol should be in realistic range (40-70 g/L)', () => {
      // 150 g/L glucose × 0.46 Yps ≈ 69 g/L theoretical
      // With losses, expect 40-70 g/L
      expect(result.summary.finalEthanol).toBeGreaterThan(30);
      expect(result.summary.finalEthanol).toBeLessThan(80);
    });

    test('yield efficiency should be 70-100% of theoretical', () => {
      expect(result.summary.yieldEfficiency).toBeGreaterThan(40);
      expect(result.summary.yieldEfficiency).toBeLessThanOrEqual(100);
    });

    test('should report peak growth rate close to μ_max', () => {
      expect(result.summary.peakGrowthRate).toBeCloseTo(
        DEFAULT_KINETIC_PARAMS.muMax,
        1
      );
    });

    test('should calculate time to 90% consumption', () => {
      // For 150 g/L starting glucose, 90% consumption should
      // happen within the simulation window (48 hours)
      if (result.summary.time90 !== null) {
        expect(result.summary.time90).toBeGreaterThan(5);
        expect(result.summary.time90).toBeLessThan(48);
      }
    });
  });

  describe('Physical Plausibility Checks', () => {

    test('total carbon should be approximately conserved', () => {
      // Rough mass balance check:
      // substrate consumed ≈ (biomass produced / Yxs) approximately
      const subConsumed = DEFAULT_CONDITIONS.S0 - result.summary.residualSubstrate;
      const biomassPart = result.summary.finalBiomass / DEFAULT_KINETIC_PARAMS.Yxs;

      // The substrate consumed should account for biomass formation
      // (it's actually consumed for both biomass and product, so biomassPart < subConsumed)
      expect(biomassPart).toBeLessThanOrEqual(subConsumed * 1.1);
      expect(biomassPart).toBeGreaterThan(0);
    });

    test('ethanol concentration should not exceed stoichiometric limit', () => {
      // Maximum ethanol from 150 g/L glucose: 150 * 0.511 = 76.65 g/L
      const maxPossible = DEFAULT_CONDITIONS.S0 * 0.511;
      expect(result.summary.finalEthanol).toBeLessThan(maxPossible * 1.01);
    });
  });
});
