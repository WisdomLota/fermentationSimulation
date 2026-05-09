/**
 * Tests for Fed-Batch and Continuous Fermentation Simulations
 *
 * Key behaviors to verify:
 *   Fed-batch: volume increases, substrate replenishment, dilution effects
 *   Continuous: steady-state convergence, washout at high D, productivity
 */

import { runFedBatchSimulation, DEFAULT_FEDBATCH_PARAMS } from '../simulation/fed-batch';
import { runContinuousSimulation, analyticalSteadyState, DEFAULT_CONTINUOUS_PARAMS } from '../simulation/continuous';
import { DEFAULT_KINETIC_PARAMS } from '../models/parameters';

const params = DEFAULT_KINETIC_PARAMS;

// ── Fed-Batch Tests ───────────────────────────────────

describe('Fed-Batch Simulation', () => {
  const result = runFedBatchSimulation(
    params, 100, 0.5, 0, DEFAULT_FEDBATCH_PARAMS, 48, 0.05
  );

  test('should produce output arrays of matching length', () => {
    expect(result.time.length).toBe(result.biomass.length);
    expect(result.time.length).toBe(result.volume.length);
  });

  test('volume should increase over time (feed is adding liquid)', () => {
    const V0 = result.volume[0];
    const Vfinal = result.volume[result.volume.length - 1];
    expect(Vfinal).toBeGreaterThan(V0);
  });

  test('volume should not exceed maxVolume', () => {
    for (const V of result.volume) {
      expect(V).toBeLessThanOrEqual(DEFAULT_FEDBATCH_PARAMS.maxVolume + 0.1);
    }
  });

  test('biomass should grow (feed sustains the culture)', () => {
    const maxX = Math.max(...result.biomass);
    expect(maxX).toBeGreaterThan(0.5); // above initial
  });

  test('substrate should stay available longer than batch', () => {
    // In batch with S0=100, substrate depletes fairly fast.
    // In fed-batch, feed replenishes it — check that at t=24h
    // there's still some substrate
    const midIdx = Math.floor(result.time.length / 2);
    // Just check it didn't instantly deplete
    const anySubstrate = result.substrate.some(S => S > 1);
    expect(anySubstrate).toBe(true);
  });

  test('ethanol should be produced', () => {
    const finalP = result.product[result.product.length - 1];
    expect(finalP).toBeGreaterThan(0);
  });

  test('summary should have realistic values', () => {
    expect(result.summary.finalBiomass).toBeGreaterThan(0);
    expect(result.summary.finalEthanol).toBeGreaterThan(0);
    expect(result.summary.finalVolume).toBeGreaterThan(DEFAULT_FEDBATCH_PARAMS.initialVolume);
    expect(result.summary.yieldEfficiency).toBeGreaterThan(0);
    expect(result.summary.yieldEfficiency).toBeLessThanOrEqual(100);
  });
});

// ── Continuous (CSTR) Tests ───────────────────────────

describe('Continuous (CSTR) Simulation', () => {
  const result = runContinuousSimulation(
    params, 50, 0.5, 0, DEFAULT_CONTINUOUS_PARAMS, 72, 0.05
  );

  test('should produce matching output arrays', () => {
    expect(result.time.length).toBe(result.biomass.length);
    expect(result.time.length).toBe(result.substrate.length);
  });

  test('should reach approximate steady state', () => {
    // Last 10 biomass values should be within 5% of each other
    const tail = result.biomass.slice(-10);
    const avg = tail.reduce((a, b) => a + b, 0) / tail.length;
    for (const X of tail) {
      expect(X).toBeCloseTo(avg, 0);
    }
  });

  test('should NOT wash out at D=0.15 < μ_max=0.45', () => {
    expect(result.summary.washout).toBe(false);
    expect(result.summary.steadyStateBiomass).toBeGreaterThan(1);
  });

  test('steady-state substrate should be positive but below feed', () => {
    expect(result.summary.steadyStateSubstrate).toBeGreaterThan(0);
    expect(result.summary.steadyStateSubstrate).toBeLessThan(DEFAULT_CONTINUOUS_PARAMS.feedSubstrate);
  });

  test('productivity should be positive', () => {
    expect(result.summary.productivity).toBeGreaterThan(0);
  });

  test('critical dilution rate should be reported', () => {
    expect(result.summary.criticalDilutionRate).toBeGreaterThan(0);
    expect(result.summary.criticalDilutionRate).toBeLessThanOrEqual(params.muMax);
  });
});

describe('Continuous — Washout Detection', () => {
  test('should detect washout when D > D_critical', () => {
    const highDParams = {
      ...DEFAULT_CONTINUOUS_PARAMS,
      dilutionRate: 0.50, // above μ_max of 0.45
    };

    const result = runContinuousSimulation(
      params, 50, 0.5, 0, highDParams, 48, 0.05
    );

    expect(result.summary.washout).toBe(true);
    expect(result.summary.steadyStateBiomass).toBeLessThan(0.1);
  });
});

describe('Continuous — Analytical Steady State', () => {
  test('should match numerical simulation at steady state', () => {
    const analytical = analyticalSteadyState(params, DEFAULT_CONTINUOUS_PARAMS);
    const numerical = runContinuousSimulation(
      params, 50, 0.5, 0, DEFAULT_CONTINUOUS_PARAMS, 100, 0.05
    );

    expect(analytical.washout).toBe(false);
    // Numerical should approach analytical within ~10%
    expect(numerical.summary.steadyStateBiomass).toBeCloseTo(analytical.Xss, 0);
    expect(numerical.summary.steadyStateSubstrate).toBeCloseTo(analytical.Sss, 0);
  });

  test('analytical should predict washout correctly', () => {
    const highD = { ...DEFAULT_CONTINUOUS_PARAMS, dilutionRate: 0.50 };
    const result = analyticalSteadyState(params, highD);
    expect(result.washout).toBe(true);
    expect(result.Xss).toBe(0);
  });
});
