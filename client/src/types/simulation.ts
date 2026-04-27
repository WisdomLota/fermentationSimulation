/**
 * Shared Types — Frontend ↔ Backend API Contract
 *
 * These types are shared between the React frontend and the Node.js
 * simulation engine. They define the shape of data flowing between
 * the parameter input panel and the visualization charts.
 */

// ── Simulation Modes ──────────────────────────────────

export type ReactorMode = 'batch' | 'fed-batch' | 'continuous';

// ── Input Parameters ──────────────────────────────────

export interface SimulationInput {
  mode: ReactorMode;
  kinetics: KineticParams;
  conditions: ReactorConditions;
  config: SimConfig;
}

export interface KineticParams {
  muMax: number;    // h⁻¹
  Ks: number;       // g/L
  alpha: number;    // g_P/g_X
  beta: number;     // g_P/(g_X·h)
  Yxs: number;      // g_X/g_S
  Yps: number;      // g_P/g_S
}

export interface ReactorConditions {
  temperature: number;  // °C
  pH: number;
  S0: number;           // g/L
  X0: number;           // g/L
  P0: number;           // g/L
}

export interface SimConfig {
  totalTime: number;    // hours
  dt: number;           // hours
}

// ── Output Data ───────────────────────────────────────

export interface SimulationOutput {
  time: number[];
  biomass: number[];
  substrate: number[];
  product: number[];
  growthRate: number[];
  summary: SimulationSummary;
}

export interface SimulationSummary {
  finalBiomass: number;
  finalEthanol: number;
  residualSubstrate: number;
  substrateConsumed: number;
  yieldEfficiency: number;
  time90: number | null;
  peakGrowthRate: number;
}

// ── Parameter Ranges (for input validation & sliders) ─

export interface ParameterRange {
  min: number;
  max: number;
  step: number;
  default: number;
  unit: string;
  label: string;
  tooltip: string;
}

export const PARAM_RANGES: Record<string, ParameterRange> = {
  temperature: {
    min: 25, max: 40, step: 0.5, default: 32.5,
    unit: '°C', label: 'Temperature',
    tooltip: 'Optimal range for S. cerevisiae: 30–35°C',
  },
  pH: {
    min: 3.0, max: 7.0, step: 0.1, default: 4.8,
    unit: '', label: 'pH Level',
    tooltip: 'Optimal range: 4.5–5.0. Below 3.5 inhibits growth.',
  },
  S0: {
    min: 10, max: 300, step: 5, default: 150,
    unit: 'g/L', label: 'Initial Substrate',
    tooltip: 'Glucose concentration. High-gravity: 150–300 g/L.',
  },
  X0: {
    min: 0.1, max: 10, step: 0.1, default: 0.5,
    unit: 'g/L', label: 'Initial Biomass',
    tooltip: 'Yeast inoculum concentration.',
  },
  muMax: {
    min: 0.1, max: 0.8, step: 0.01, default: 0.45,
    unit: 'h⁻¹', label: 'μ_max',
    tooltip: 'Maximum specific growth rate.',
  },
  Ks: {
    min: 0.1, max: 10, step: 0.1, default: 1.5,
    unit: 'g/L', label: 'K_s',
    tooltip: 'Half-saturation constant (Monod).',
  },
  alpha: {
    min: 0.5, max: 5.0, step: 0.1, default: 2.2,
    unit: 'g/g', label: 'α (growth-assoc.)',
    tooltip: 'Growth-associated product formation constant.',
  },
  beta: {
    min: 0.0, max: 0.5, step: 0.01, default: 0.1,
    unit: 'g/(g·h)', label: 'β (maintenance)',
    tooltip: 'Non-growth-associated product formation constant.',
  },
  Yxs: {
    min: 0.05, max: 0.25, step: 0.01, default: 0.12,
    unit: 'g/g', label: 'Y_xs',
    tooltip: 'Biomass yield on substrate.',
  },
  totalTime: {
    min: 12, max: 96, step: 6, default: 48,
    unit: 'hours', label: 'Simulation Time',
    tooltip: 'Total fermentation duration.',
  },
};
