/**
 * Fed-Batch Fermentation Simulation
 *
 * ═══════════════════════════════════════════════════════════════
 * HOW FED-BATCH DIFFERS FROM BATCH (Ahmed's defense explanation)
 * ═══════════════════════════════════════════════════════════════
 *
 * In batch mode, everything is sealed at the start — no flow in or out.
 * In fed-batch, we ADD fresh substrate solution during fermentation
 * through a feed stream, but we DON'T remove anything.
 *
 * Why do this?
 *   - Prevents substrate inhibition (too much glucose hurts yeast)
 *   - Extends the exponential growth phase
 *   - Achieves higher final ethanol than batch alone
 *   - Used in ~70% of industrial ethanol production
 *
 * The mass balances now include a FEED TERM:
 *
 * Volume changes over time:
 *   dV/dt = F(t)
 *   where F = feed flow rate (L/h)
 *
 * Biomass (X) — diluted by incoming volume:
 *   dX/dt = μ·X - (F/V)·X
 *   The -(F/V)·X term accounts for dilution: adding volume
 *   with no cells reduces the cell concentration.
 *
 * Substrate (S) — consumed by cells, replenished by feed:
 *   dS/dt = -(1/Yxs)·μ·X + (F/V)·(Sf - S)
 *   The +(F/V)·(Sf - S) term: feed brings in substrate at
 *   concentration Sf, diluting/replenishing the reactor.
 *
 * Product (P) — produced by cells, diluted by volume:
 *   dP/dt = α·μ·X + β·X - (F/V)·P
 *
 * Note: The dilution factor D = F/V changes over time because
 * V increases as feed is added. This makes the system more
 * complex than batch — it's a time-varying ODE system.
 * ═══════════════════════════════════════════════════════════════
 */

import type { DerivativeFunction, SimulationResult } from '../utils/ode-solver';
import { monodGrowthRate } from '../models/monod';
import { integrate } from '../utils/ode-solver';
import type { KineticParameters } from '../models/parameters';

// ── Fed-Batch specific parameters ─────────────────────

export interface FedBatchParams {
  /** Feed flow rate (L/h) — constant or pulsed */
  feedRate: number;

  /** Feed substrate concentration (g/L) — how concentrated the feed is */
  feedSubstrate: number;

  /** Initial reactor volume (L) */
  initialVolume: number;

  /** Maximum reactor volume (L) — feed stops when reached */
  maxVolume: number;

  /** Feed strategy: constant flow or pulse at intervals */
  feedStrategy: 'constant' | 'pulse';

  /** For pulse strategy: interval between pulses (hours) */
  pulseInterval?: number;

  /** For pulse strategy: volume per pulse (L) */
  pulseVolume?: number;
}

export const DEFAULT_FEDBATCH_PARAMS: FedBatchParams = {
  feedRate: 0.1,         // L/h
  feedSubstrate: 500,    // g/L — concentrated feed
  initialVolume: 1.0,    // L
  maxVolume: 3.0,        // L
  feedStrategy: 'constant',
};

// ── Fed-Batch result type ─────────────────────────────

export interface FedBatchResult {
  time: number[];
  biomass: number[];
  substrate: number[];
  product: number[];
  growthRate: number[];
  volume: number[];
  dilutionRate: number[];
  summary: FedBatchSummary;
}

export interface FedBatchSummary {
  finalBiomass: number;
  finalEthanol: number;
  residualSubstrate: number;
  finalVolume: number;
  totalSubstrateFed: number;
  yieldEfficiency: number;
  peakGrowthRate: number;
}

// ── Derivative function ───────────────────────────────

export function createFedBatchDerivatives(
  kinetics: KineticParameters,
  fbParams: FedBatchParams
): DerivativeFunction {
  return (_t: number, state: number[]): number[] => {
    const [X, S, P, V] = state;

    if (X <= 0 || V <= 0) return [0, 0, 0, 0];

    const mu = monodGrowthRate(S, kinetics);

    // Determine current feed rate
    let F = 0;
    if (V < fbParams.maxVolume) {
      if (fbParams.feedStrategy === 'constant') {
        F = fbParams.feedRate;
      } else if (fbParams.feedStrategy === 'pulse') {
        // Pulse feeding: feed is on during specific intervals
        const interval = fbParams.pulseInterval ?? 6;
        const tMod = _t % interval;
        // Feed for 30 minutes every interval
        F = tMod < 0.5 ? (fbParams.pulseVolume ?? 0.2) / 0.5 : 0;
      }
      // Don't exceed max volume
      if (V + F * 0.05 > fbParams.maxVolume) {
        F = Math.max(0, (fbParams.maxVolume - V) / 0.05);
      }
    }

    const D = F / V; // Dilution rate (h⁻¹)
    const Sf = fbParams.feedSubstrate;

    // dX/dt = μ·X - D·X (growth minus dilution)
    const dXdt = mu * X - D * X;

    // dS/dt = -(1/Yxs)·μ·X + D·(Sf - S) (consumption + feed)
    const dSdt = -(1 / kinetics.Yxs) * mu * X + D * (Sf - S);

    // dP/dt = α·μ·X + β·X - D·P (production minus dilution)
    const dPdt = kinetics.alpha * mu * X + kinetics.beta * X - D * P;

    // dV/dt = F (volume increases with feed)
    const dVdt = F;

    return [dXdt, dSdt, dPdt, dVdt];
  };
}

// ── Run simulation ────────────────────────────────────

export function runFedBatchSimulation(
  kinetics: KineticParameters,
  S0: number,
  X0: number,
  P0: number,
  fbParams: FedBatchParams,
  totalTime: number,
  dt: number
): FedBatchResult {
  const V0 = fbParams.initialVolume;
  const initialState = [X0, S0, P0, V0];
  const derivatives = createFedBatchDerivatives(kinetics, fbParams);

  const raw: SimulationResult = integrate(derivatives, initialState, totalTime, dt);

  const biomass = raw.states.map(s => s[0]);
  const substrate = raw.states.map(s => s[1]);
  const product = raw.states.map(s => s[2]);
  const volume = raw.states.map(s => s[3]);
  const growthRate = substrate.map(S => monodGrowthRate(S, kinetics));
  const dilutionRate = volume.map((V, i) => {
    if (V >= fbParams.maxVolume || V <= 0) return 0;
    return fbParams.feedStrategy === 'constant' ? fbParams.feedRate / V : 0;
  });

  const finalBiomass = biomass[biomass.length - 1];
  const finalEthanol = product[product.length - 1];
  const residualSubstrate = substrate[substrate.length - 1];
  const finalVolume = volume[volume.length - 1];
  const totalSubstrateFed = (finalVolume - V0) * fbParams.feedSubstrate;
  const totalSubstrate = S0 * V0 + totalSubstrateFed;
  const totalEthanol = finalEthanol * finalVolume;
  const actualYield = totalSubstrate > 0 ? totalEthanol / totalSubstrate : 0;
  const yieldEfficiency = Math.min((actualYield / 0.511) * 100, 100);
  const peakGrowthRate = Math.max(...growthRate);

  return {
    time: raw.time,
    biomass, substrate, product, growthRate, volume, dilutionRate,
    summary: {
      finalBiomass, finalEthanol, residualSubstrate,
      finalVolume, totalSubstrateFed, yieldEfficiency, peakGrowthRate,
    },
  };
}
