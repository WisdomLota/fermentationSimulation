/**
 * Client-Side Simulation Engine
 *
 * Runs the complete batch fermentation simulation in the browser.
 * This is a self-contained port of the backend models so the UI
 * can provide instant feedback without network round-trips.
 *
 * The math is identical to src/models/ and src/simulation/ on
 * the server — just packaged for direct use in React components.
 */

import type { KineticParams, ReactorConditions, SimConfig, SimulationOutput } from '../types/simulation';

// ── Monod Growth Rate ─────────────────────────────────

function monodGrowthRate(S: number, muMax: number, Ks: number): number {
  if (S <= 0) return 0;
  return muMax * S / (Ks + S);
}

// ── RK4 Single Step ───────────────────────────────────

type DerivFn = (t: number, y: number[]) => number[];

function rk4Step(f: DerivFn, t: number, y: number[], dt: number): number[] {
  const k1 = f(t, y);
  const k2 = f(t + dt / 2, y.map((v, i) => v + dt / 2 * k1[i]));
  const k3 = f(t + dt / 2, y.map((v, i) => v + dt / 2 * k2[i]));
  const k4 = f(t + dt, y.map((v, i) => v + dt * k3[i]));

  return y.map((v, i) =>
    Math.max(0, v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]))
  );
}

// ── Batch Simulation ──────────────────────────────────

export function runBatchSimulation(
  kinetics: KineticParams,
  conditions: ReactorConditions,
  config: SimConfig
): SimulationOutput {
  const { muMax, Ks, alpha, beta, Yxs } = kinetics;
  const { S0, X0, P0 } = conditions;
  const { totalTime, dt } = config;

  // Derivative function for the coupled ODE system
  const derivatives: DerivFn = (_t, state) => {
    const [X, S] = state;
    if (S <= 0 || X <= 0) return [0, 0, 0];

    const mu = monodGrowthRate(S, muMax, Ks);
    return [
      mu * X,                         // dX/dt
      -(1 / Yxs) * mu * X,            // dS/dt
      alpha * mu * X + beta * X,       // dP/dt
    ];
  };

  // Integration
  const time: number[] = [0];
  const states: number[][] = [[X0, S0, P0]];
  let state = [X0, S0, P0];
  let t = 0;
  const steps = Math.ceil(totalTime / dt);
  const recordEvery = Math.max(1, Math.floor(0.25 / dt));

  for (let i = 0; i < steps; i++) {
    state = rk4Step(derivatives, t, state, dt);
    t += dt;
    if (i % recordEvery === 0 || i === steps - 1) {
      time.push(Number(t.toFixed(4)));
      states.push([...state]);
    }
  }

  // Unpack
  const biomass = states.map(s => s[0]);
  const substrate = states.map(s => s[1]);
  const product = states.map(s => s[2]);
  const growthRate = substrate.map(S => monodGrowthRate(S, muMax, Ks));

  // Summary
  const finalBiomass = biomass[biomass.length - 1];
  const finalEthanol = product[product.length - 1];
  const residualSubstrate = substrate[substrate.length - 1];
  const substrateConsumed = S0 - residualSubstrate;
  const actualYield = substrateConsumed > 0 ? finalEthanol / substrateConsumed : 0;
  const yieldEfficiency = Math.min((actualYield / 0.511) * 100, 100);
  const threshold90 = S0 * 0.10;
  const time90Idx = substrate.findIndex(S => S <= threshold90);
  const time90 = time90Idx >= 0 ? time[time90Idx] : null;
  const peakGrowthRate = Math.max(...growthRate);

  return {
    time, biomass, substrate, product, growthRate,
    summary: {
      finalBiomass, finalEthanol, residualSubstrate,
      substrateConsumed, yieldEfficiency, time90, peakGrowthRate,
    },
  };
}
