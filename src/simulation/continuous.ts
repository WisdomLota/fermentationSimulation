/**
 * Continuous Stirred-Tank Reactor (CSTR) Simulation
 *
 * ═══════════════════════════════════════════════════════════════
 * HOW CONTINUOUS DIFFERS FROM BATCH AND FED-BATCH
 * ═══════════════════════════════════════════════════════════════
 *
 * In continuous mode, fresh medium flows IN and fermented broth
 * flows OUT at the same rate, keeping the volume constant.
 * This creates a steady-state operation where concentrations
 * eventually stop changing — the system reaches equilibrium.
 *
 * Key concept: DILUTION RATE
 *   D = F/V (h⁻¹)
 *   where F = flow rate (L/h), V = reactor volume (L)
 *
 * Critical insight for the defense:
 *   At steady state: μ = D (growth rate equals dilution rate)
 *   If D > μ_max: WASHOUT — cells are removed faster than they grow
 *                  → the reactor goes empty, fermentation fails
 *   If D < μ_max: cells establish steady state at some equilibrium
 *
 * Mass balances (constant volume V):
 *
 * Biomass:
 *   dX/dt = μ·X - D·X = (μ - D)·X
 *   At steady state: μ = D → cells grow exactly as fast as they leave
 *
 * Substrate:
 *   dS/dt = D·(Sf - S) - (1/Yxs)·μ·X
 *   Feed brings in Sf, outflow removes S, cells consume at rate μ·X/Yxs
 *
 * Product:
 *   dP/dt = α·μ·X + β·X - D·P
 *   Production minus what leaves in the outflow
 *
 * Unlike batch (which has a defined end), continuous operation
 * runs indefinitely. We simulate until steady state is reached
 * or for a user-specified duration.
 * ═══════════════════════════════════════════════════════════════
 */

import type { DerivativeFunction, SimulationResult } from '../utils/ode-solver';
import { monodGrowthRate } from '../models/monod';
import { integrate } from '../utils/ode-solver';
import type { KineticParameters } from '../models/parameters';

// ── Continuous-specific parameters ────────────────────

export interface ContinuousParams {
  /** Dilution rate D = F/V (h⁻¹) */
  dilutionRate: number;

  /** Feed substrate concentration (g/L) */
  feedSubstrate: number;

  /** Reactor volume (L) — constant in CSTR */
  volume: number;
}

export const DEFAULT_CONTINUOUS_PARAMS: ContinuousParams = {
  dilutionRate: 0.15,    // h⁻¹ — must be < μ_max to avoid washout
  feedSubstrate: 100,    // g/L
  volume: 5.0,           // L
};

// ── Result type ───────────────────────────────────────

export interface ContinuousResult {
  time: number[];
  biomass: number[];
  substrate: number[];
  product: number[];
  growthRate: number[];
  summary: ContinuousSummary;
}

export interface ContinuousSummary {
  /** Steady-state biomass concentration (g/L) */
  steadyStateBiomass: number;
  /** Steady-state ethanol concentration (g/L) */
  steadyStateEthanol: number;
  /** Steady-state substrate concentration (g/L) */
  steadyStateSubstrate: number;
  /** Whether washout occurred (D > μ_max) */
  washout: boolean;
  /** Ethanol productivity (g/L·h) = D × P_ss */
  productivity: number;
  /** Time to reach ~95% of steady state (hours) */
  timeToSteadyState: number | null;
  /** Critical dilution rate for this system */
  criticalDilutionRate: number;
}

// ── Derivative function ───────────────────────────────

export function createContinuousDerivatives(
  kinetics: KineticParameters,
  cParams: ContinuousParams
): DerivativeFunction {
  return (_t: number, state: number[]): number[] => {
    const [X, S, P] = state;
    const D = cParams.dilutionRate;
    const Sf = cParams.feedSubstrate;

    if (X <= 0) {
      // Washout: no cells, just substrate flowing through
      const dSdt = D * (Sf - S);
      return [0, dSdt, -D * P];
    }

    const mu = monodGrowthRate(S, kinetics);

    // dX/dt = (μ - D)·X
    const dXdt = (mu - D) * X;

    // dS/dt = D·(Sf - S) - (1/Yxs)·μ·X
    const dSdt = D * (Sf - S) - (1 / kinetics.Yxs) * mu * X;

    // dP/dt = α·μ·X + β·X - D·P
    const dPdt = kinetics.alpha * mu * X + kinetics.beta * X - D * P;

    return [dXdt, dSdt, dPdt];
  };
}

// ── Analytical steady-state (for comparison) ──────────

export function analyticalSteadyState(
  kinetics: KineticParameters,
  cParams: ContinuousParams
): { Xss: number; Sss: number; Pss: number; washout: boolean } {
  const D = cParams.dilutionRate;
  const Sf = cParams.feedSubstrate;
  const { muMax, Ks, Yxs, alpha, beta } = kinetics;

  // Critical dilution rate: D_crit = μ_max · Sf / (Ks + Sf)
  const Dcrit = muMax * Sf / (Ks + Sf);

  if (D >= Dcrit) {
    // Washout: no cells survive
    return { Xss: 0, Sss: Sf, Pss: 0, washout: true };
  }

  // Steady-state substrate: S_ss = Ks · D / (μ_max - D)
  const Sss = Ks * D / (muMax - D);

  // Steady-state biomass: X_ss = Yxs · (Sf - S_ss)
  const Xss = Yxs * (Sf - Sss);

  // Steady-state product: P_ss = (α·D + β) · X_ss / D
  const Pss = (alpha * D + beta) * Xss / D;

  return { Xss, Sss, Pss, washout: false };
}

// ── Run simulation ────────────────────────────────────

export function runContinuousSimulation(
  kinetics: KineticParameters,
  S0: number,
  X0: number,
  P0: number,
  cParams: ContinuousParams,
  totalTime: number,
  dt: number
): ContinuousResult {
  const initialState = [X0, S0, P0];
  const derivatives = createContinuousDerivatives(kinetics, cParams);

  const raw: SimulationResult = integrate(derivatives, initialState, totalTime, dt);

  const biomass = raw.states.map(s => s[0]);
  const substrate = raw.states.map(s => s[1]);
  const product = raw.states.map(s => s[2]);
  const growthRate = substrate.map(S => monodGrowthRate(S, kinetics));

  // Detect washout
  const finalX = biomass[biomass.length - 1];
  const washout = finalX < 0.01;

  // Calculate steady-state values (last 10% of simulation)
  const ssStart = Math.floor(biomass.length * 0.9);
  const ssBiomass = biomass.slice(ssStart);
  const ssSubstrate = substrate.slice(ssStart);
  const ssProduct = product.slice(ssStart);

  const avgBiomass = ssBiomass.reduce((a, b) => a + b, 0) / ssBiomass.length;
  const avgSubstrate = ssSubstrate.reduce((a, b) => a + b, 0) / ssSubstrate.length;
  const avgProduct = ssProduct.reduce((a, b) => a + b, 0) / ssProduct.length;

  // Productivity = D × P_ss (g/L·h)
  const productivity = washout ? 0 : cParams.dilutionRate * avgProduct;

  // Time to steady state: when biomass is within 5% of final average
  let timeToSS: number | null = null;
  if (!washout) {
    const threshold = avgBiomass * 0.95;
    const ssIdx = biomass.findIndex(X => X >= threshold);
    timeToSS = ssIdx >= 0 ? raw.time[ssIdx] : null;
  }

  // Critical dilution rate
  const Dcrit = kinetics.muMax * cParams.feedSubstrate /
    (kinetics.Ks + cParams.feedSubstrate);

  return {
    time: raw.time,
    biomass, substrate, product, growthRate,
    summary: {
      steadyStateBiomass: avgBiomass,
      steadyStateEthanol: avgProduct,
      steadyStateSubstrate: avgSubstrate,
      washout,
      productivity,
      timeToSteadyState: timeToSS,
      criticalDilutionRate: Dcrit,
    },
  };
}
