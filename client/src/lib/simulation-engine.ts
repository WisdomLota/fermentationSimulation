/**
 * Client-Side Simulation Engine — All Three Reactor Modes
 */

import type { KineticParams, ReactorConditions, SimConfig, SimulationOutput, FedBatchConfig, ContinuousConfig } from '../types/simulation';

function monod(S: number, muMax: number, Ks: number, P: number = 0, Pmax: number = 100): number {
  if (S <= 0) return 0;
  const inhibition = Math.max(0, 1 - P / Pmax);
  return (muMax * S / (Ks + S)) * inhibition;
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

function buildSummary(S0: number, biomass: number[], substrate: number[], product: number[], time: number[], muMax: number, Ks: number, Pmax: number) {
  const n = biomass.length - 1;
  const finalBiomass = biomass[n], finalEthanol = product[n], residualSubstrate = substrate[n];
  const substrateConsumed = S0 - residualSubstrate;
  const actualYield = substrateConsumed > 0 ? finalEthanol / substrateConsumed : 0;
  const yieldEfficiency = Math.min((actualYield / 0.511) * 100, 100);
  const t90Idx = substrate.findIndex(S => S <= S0 * 0.10);
  const time90 = t90Idx >= 0 ? time[t90Idx] : null;
  const peakGrowthRate = Math.max(...substrate.map((S, i) => monod(S, muMax, Ks, product[i], Pmax)));
  return { finalBiomass, finalEthanol, residualSubstrate, substrateConsumed, yieldEfficiency, time90, peakGrowthRate };
}

export function runBatchSimulation(k: KineticParams, c: ReactorConditions, cfg: SimConfig): SimulationOutput {
  const { muMax, Ks, alpha, beta, Yxs, Pmax } = k;
  const deriv: DerivFn = (_t, s) => {
    const [X, S, P] = s;
    if (S <= 0 || X <= 0) return [0, 0, 0];
    const mu = monod(S, muMax, Ks, P, Pmax);
    const inhib = Math.max(0, 1 - P / Pmax);
    return [(mu - kd) * X, -(1 / Yxs) * mu * X, alpha * mu * X + beta * X * inhib];
  };
  const raw = integrate(deriv, [c.X0, c.S0, c.P0], cfg.totalTime, cfg.dt);
  const biomass = raw.states.map(s => s[0]), substrate = raw.states.map(s => s[1]), product = raw.states.map(s => s[2]);
  const growthRate = substrate.map((S, i) => monod(S, muMax, Ks, product[i], Pmax));
  return { time: raw.time, biomass, substrate, product, growthRate, summary: buildSummary(c.S0, biomass, substrate, product, raw.time, muMax, Ks, Pmax) };
}

export function runFedBatchSimulation(k: KineticParams, c: ReactorConditions, cfg: SimConfig, fb: FedBatchConfig): SimulationOutput {
  const { muMax, Ks, alpha, beta, Yxs, Pmax } = k;
  const deriv: DerivFn = (_t, s) => {
    const [X, S, P, V] = s;
    if (X <= 0 || V <= 0) return [0, 0, 0, 0];
    const mu = monod(S, muMax, Ks, P, Pmax);
    const inhib = Math.max(0, 1 - P / Pmax);
    let F = (_t >= fb.feedStartTime && V < fb.maxVolume) ? fb.feedRate : 0;
    if (V + F * cfg.dt > fb.maxVolume) F = Math.max(0, (fb.maxVolume - V) / cfg.dt);
    const D = F / V;
    return [(mu - kd) * X - D * X, -(1 / Yxs) * mu * X + D * (fb.feedSubstrate - S), alpha * mu * X + beta * X * inhib - D * P, F];
  };
  const raw = integrate(deriv, [c.X0, c.S0, c.P0, fb.initialVolume], cfg.totalTime, cfg.dt);
  const biomass = raw.states.map(s => s[0]), substrate = raw.states.map(s => s[1]), product = raw.states.map(s => s[2]);
  const growthRate = substrate.map((S, i) => monod(S, muMax, Ks, product[i], Pmax));
  return { time: raw.time, biomass, substrate, product, growthRate, summary: buildSummary(c.S0, biomass, substrate, product, raw.time, muMax, Ks, Pmax) };
}

export function runContinuousSimulation(k: KineticParams, c: ReactorConditions, cfg: SimConfig, cst: ContinuousConfig): SimulationOutput {
  const { muMax, Ks, alpha, beta, Yxs, Pmax } = k;
  const D = cst.dilutionRate, Sf = cst.feedSubstrate;
  const switchTime = cst.batchStartupTime;
  const deriv: DerivFn = (_t, s) => {
    const [X, S, P] = s;
    if (X <= 0) return [0, 0, 0];
    const mu = monod(S, muMax, Ks, P, Pmax);
    const inhib = Math.max(0, 1 - P / Pmax);
    // Batch phase until switchTime
    if (_t < switchTime) {
      return [(mu - kd) * X, -(1 / Yxs) * mu * X, alpha * mu * X + beta * X * inhib];
    }
    // Continuous phase — feed on, flow out
    return [(mu - kd - D) * X, D * (Sf - S) - (1 / Yxs) * mu * X, alpha * mu * X + beta * X * inhib - D * P];
  };
  const raw = integrate(deriv, [c.X0, c.S0, c.P0], cfg.totalTime, cfg.dt);
  const biomass = raw.states.map(s => s[0]), substrate = raw.states.map(s => s[1]), product = raw.states.map(s => s[2]);
  const growthRate = substrate.map((S, i) => monod(S, muMax, Ks, product[i], Pmax));
  return { time: raw.time, biomass, substrate, product, growthRate, summary: buildSummary(c.S0, biomass, substrate, product, raw.time, muMax, Ks, Pmax) };
}