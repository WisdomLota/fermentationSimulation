/**
 * Batch Fermentation Simulation
 *
 * A batch reactor is the simplest mode: all reactants (glucose, yeast)
 * are loaded at the start, the reactor is sealed, and fermentation
 * proceeds until substrate is depleted or product inhibits further growth.
 *
 * ═══════════════════════════════════════════════════════════════
 * MASS BALANCE EQUATIONS (what Ahmed should explain at defense)
 * ═══════════════════════════════════════════════════════════════
 *
 * In a batch reactor, there is NO flow in or out. The mass balance
 * for each component is simply:
 *
 *   accumulation = generation - consumption
 *
 * Biomass (X):
 *   dX/dt = μ · X
 *   → Cells grow at a rate proportional to how many cells there are
 *   → μ comes from Monod (depends on substrate available)
 *
 * Substrate (S):
 *   dS/dt = -(1/Y_xs) · μ · X
 *   → Glucose is consumed to build new cells
 *   → Y_xs tells us: for every gram of cells, how many grams of glucose needed
 *   → The negative sign means substrate DECREASES over time
 *
 * Product (P):
 *   dP/dt = α · μ · X + β · X
 *   → Ethanol produced from two mechanisms (Luedeking-Piret)
 *   → Growth-associated (α term): more growth = more ethanol
 *   → Maintenance (β term): even resting cells produce some ethanol
 *
 * These three coupled ODEs are solved simultaneously by the RK4 solver.
 * They're "coupled" because each equation depends on the others:
 *   - X depends on S (through μ from Monod)
 *   - S depends on X (more cells consume more substrate)
 *   - P depends on both X and S (through μ and directly through X)
 * ═══════════════════════════════════════════════════════════════
 */

import { KineticParameters, BioreactorConditions, SimulationConfig } from '../models/parameters';
import { monodGrowthRate } from '../models/monod';
import { integrate, SimulationResult, DerivativeFunction } from '../utils/ode-solver';

/**
 * Processed simulation output with named fields and derived quantities
 */
export interface BatchResult {
  /** Time points in hours */
  time: number[];
  /** Biomass concentration X(t) in g/L */
  biomass: number[];
  /** Substrate concentration S(t) in g/L */
  substrate: number[];
  /** Product (ethanol) concentration P(t) in g/L */
  product: number[];
  /** Specific growth rate μ(t) in h⁻¹ */
  growthRate: number[];
  /** Summary statistics */
  summary: BatchSummary;
}

export interface BatchSummary {
  /** Final biomass concentration (g/L) */
  finalBiomass: number;
  /** Final ethanol concentration (g/L) */
  finalEthanol: number;
  /** Residual (unconsumed) substrate (g/L) */
  residualSubstrate: number;
  /** Substrate consumed (g/L) */
  substrateConsumed: number;
  /** Yield efficiency as % of theoretical maximum */
  yieldEfficiency: number;
  /** Time to reach 90% substrate consumption (hours) */
  time90: number | null;
  /** Peak specific growth rate (h⁻¹) */
  peakGrowthRate: number;
}

/**
 * Create the derivative function for batch fermentation
 *
 * This returns a function that, given the current state [X, S, P],
 * computes the rates of change [dX/dt, dS/dt, dP/dt].
 *
 * The ODE solver calls this function hundreds of times during
 * integration — once per sub-step of each RK4 step.
 */
export function createBatchDerivatives(params: KineticParameters): DerivativeFunction {
  return (_t: number, state: number[]): number[] => {
    const [X, S, _P] = state;

    // If substrate or biomass is depleted, no further change
    if (S <= 0 || X <= 0) {
      return [0, 0, 0];
    }

    // Current specific growth rate from Monod equation
    const mu = monodGrowthRate(S, params);

    // dX/dt: biomass growth
    const dXdt = mu * X;

    // dS/dt: substrate consumption (negative because it's consumed)
    const dSdt = -(1 / params.Yxs) * mu * X;

    // dP/dt: product formation (Luedeking-Piret)
    const dPdt = params.alpha * mu * X + params.beta * X;

    return [dXdt, dSdt, dPdt];
  };
}

/**
 * Run a complete batch fermentation simulation
 *
 * @param params     - Kinetic parameters (μ_max, K_s, α, β, Y_xs, Y_ps)
 * @param conditions - Bioreactor starting conditions (S0, X0, P0, T, pH)
 * @param config     - Simulation settings (totalTime, dt)
 * @returns BatchResult with full time-series data and summary statistics
 */
export function runBatchSimulation(
  params: KineticParameters,
  conditions: BioreactorConditions,
  config: SimulationConfig
): BatchResult {
  // Initial state vector: [Biomass, Substrate, Product]
  const initialState = [conditions.X0, conditions.S0, conditions.P0];

  // Create the ODE system for batch mode
  const derivatives = createBatchDerivatives(params);

  // Run the RK4 integration
  const raw: SimulationResult = integrate(
    derivatives,
    initialState,
    config.totalTime,
    config.dt
  );

  // Unpack the state arrays into named fields
  const biomass = raw.states.map(s => s[0]);
  const substrate = raw.states.map(s => s[1]);
  const product = raw.states.map(s => s[2]);

  // Calculate growth rate at each time point (for the μ vs time plot)
  const growthRate = substrate.map(S => monodGrowthRate(S, params));

  // Compute summary statistics
  const finalBiomass = biomass[biomass.length - 1];
  const finalEthanol = product[product.length - 1];
  const residualSubstrate = substrate[substrate.length - 1];
  const substrateConsumed = conditions.S0 - residualSubstrate;

  // Yield efficiency relative to theoretical maximum (0.511 g/g)
  const THEORETICAL_MAX = 0.511;
  const actualYield = substrateConsumed > 0 ? finalEthanol / substrateConsumed : 0;
  const yieldEfficiency = Math.min((actualYield / THEORETICAL_MAX) * 100, 100);

  // Time to 90% substrate consumption
  const threshold90 = conditions.S0 * 0.10; // 10% remaining = 90% consumed
  const time90Index = substrate.findIndex(S => S <= threshold90);
  const time90 = time90Index >= 0 ? raw.time[time90Index] : null;

  // Peak growth rate
  const peakGrowthRate = Math.max(...growthRate);

  return {
    time: raw.time,
    biomass,
    substrate,
    product,
    growthRate,
    summary: {
      finalBiomass,
      finalEthanol,
      residualSubstrate,
      substrateConsumed,
      yieldEfficiency,
      time90,
      peakGrowthRate,
    },
  };
}
