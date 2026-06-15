/**
 * Client-Side Simulation Engine — All Three Reactor Modes
 */

import type { KineticParams, ReactorConditions, SimConfig, SimulationOutput, FedBatchConfig, ContinuousConfig } from '../types/simulation';

function monod(S: number, muMax: number, Ks: number): number {
  return S <= 0 ? 0 : muMax * S / (Ks + S);
}

// Death/decay rate constant (h⁻¹) — cells die when substrate is exhausted
export const kd = 0.01;

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

function integrate(f: DerivFn, init: number[], totalTime: number, dt: number) {
  const time: number[] = [0];
  const states: number[][] = [[...init]];
  let state = [...init], t = 0;
  const steps = Math.ceil(totalTime / dt);
  const rec = Math.max(1, Math.floor(0.25 / dt));
  for (let i = 0; i < steps; i++) {
    state = rk4Step(f, t, state, dt);
    t += dt;
    if (i % rec === 0 || i === steps - 1) {
      time.push(Number(t.toFixed(4)));
      states.push([...state]);
    }
  }
  return { time, states };
}

function buildSummary(S0: number, biomass: number[], substrate: number[], product: number[], time: number[], muMax: number, Ks: number) {
  const n = biomass.length - 1;
  const finalBiomass = biomass[n], finalEthanol = product[n], residualSubstrate = substrate[n];
  const substrateConsumed = S0 - residualSubstrate;
  const actualYield = substrateConsumed > 0 ? finalEthanol / substrateConsumed : 0;
  const yieldEfficiency = Math.min((actualYield / 0.511) * 100, 100);
  const t90Idx = substrate.findIndex(S => S <= S0 * 0.10);
  const time90 = t90Idx >= 0 ? time[t90Idx] : null;
  const peakGrowthRate = Math.max(...substrate.map(S => monod(S, muMax, Ks)));
  return { finalBiomass, finalEthanol, residualSubstrate, substrateConsumed, yieldEfficiency, time90, peakGrowthRate };
}

export function runBatchSimulation(k: KineticParams, c: ReactorConditions, cfg: SimConfig): SimulationOutput {
  const { muMax, Ks, alpha, beta, Yxs } = k;
  const deriv: DerivFn = (_t, s) => {
    const [X, S] = s;
    if (S <= 0 || X <= 0) return [0, 0, 0];
    const mu = monod(S, muMax, Ks);
    return [(mu - kd) * X, -(1 / Yxs) * mu * X, alpha * mu * X + beta * X];
  };
  const raw = integrate(deriv, [c.X0, c.S0, c.P0], cfg.totalTime, cfg.dt);
  const biomass = raw.states.map(s => s[0]), substrate = raw.states.map(s => s[1]), product = raw.states.map(s => s[2]);
  const growthRate = substrate.map(S => monod(S, muMax, Ks));
  return { time: raw.time, biomass, substrate, product, growthRate, summary: buildSummary(c.S0, biomass, substrate, product, raw.time, muMax, Ks) };
}

export function runFedBatchSimulation(k: KineticParams, c: ReactorConditions, cfg: SimConfig, fb: FedBatchConfig): SimulationOutput {
  const { muMax, Ks, alpha, beta, Yxs } = k;
  const deriv: DerivFn = (_t, s) => {
    const [X, S, P, V] = s;
    if (X <= 0 || V <= 0) return [0, 0, 0, 0];
    const mu = monod(S, muMax, Ks);
    let F = (_t >= fb.feedStartTime && V < fb.maxVolume) ? fb.feedRate : 0;
    if (V + F * cfg.dt > fb.maxVolume) F = Math.max(0, (fb.maxVolume - V) / cfg.dt);
    const D = F / V;
    return [(mu - kd) * X - D * X, -(1 / Yxs) * mu * X + D * (fb.feedSubstrate - S), alpha * mu * X + beta * X - D * P, F];
  };
  const raw = integrate(deriv, [c.X0, c.S0, c.P0, fb.initialVolume], cfg.totalTime, cfg.dt);
  const biomass = raw.states.map(s => s[0]), substrate = raw.states.map(s => s[1]), product = raw.states.map(s => s[2]);
  const growthRate = substrate.map(S => monod(S, muMax, Ks));
  return { time: raw.time, biomass, substrate, product, growthRate, summary: buildSummary(c.S0, biomass, substrate, product, raw.time, muMax, Ks) };
}

export function runContinuousSimulation(k: KineticParams, c: ReactorConditions, cfg: SimConfig, cst: ContinuousConfig): SimulationOutput {
  const { muMax, Ks, alpha, beta, Yxs } = k;
  const D = cst.dilutionRate, Sf = cst.feedSubstrate;
  const switchTime = cst.batchStartupTime;
  const deriv: DerivFn = (_t, s) => {
    const [X, S, P] = s;
    if (X <= 0) return [0, 0, 0];
    const mu = monod(S, muMax, Ks);
    // Batch phase until switchTime
    if (_t < switchTime) {
      return [(mu - kd) * X, -(1 / Yxs) * mu * X, alpha * mu * X + beta * X];
    }
    // Continuous phase — feed on, flow out
    return [(mu - kd - D) * X, D * (Sf - S) - (1 / Yxs) * mu * X, alpha * mu * X + beta * X - D * P];
  };
  const raw = integrate(deriv, [c.X0, c.S0, c.P0], cfg.totalTime, cfg.dt);
  const biomass = raw.states.map(s => s[0]), substrate = raw.states.map(s => s[1]), product = raw.states.map(s => s[2]);
  const growthRate = substrate.map(S => monod(S, muMax, Ks));
  return { time: raw.time, biomass, substrate, product, growthRate, summary: buildSummary(c.S0, biomass, substrate, product, raw.time, muMax, Ks) };
}
