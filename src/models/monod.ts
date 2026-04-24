/**
 * Monod Growth Kinetics Model
 *
 * The Monod equation describes substrate-limited microbial growth.
 * It is analogous to Michaelis-Menten enzyme kinetics but applied
 * to whole-cell growth rates.
 *
 * Equation:
 *   μ = μ_max × S / (K_s + S)
 *
 * Where:
 *   μ     = specific growth rate (h⁻¹)
 *   μ_max = maximum specific growth rate when substrate is not limiting
 *   S     = substrate (glucose) concentration (g/L)
 *   K_s   = half-saturation constant — the substrate concentration
 *           at which μ = μ_max / 2
 *
 * Physical meaning:
 *   - When S >> K_s: μ ≈ μ_max (substrate abundant, growth at maximum)
 *   - When S  = K_s: μ = μ_max / 2 (half-maximum growth rate)
 *   - When S << K_s: μ ≈ μ_max × S / K_s (linear, substrate-limited)
 *   - When S  = 0:   μ = 0 (no substrate, no growth)
 *
 * This function is called at every time step of the simulation
 * to determine how fast the yeast is currently growing.
 */

import { KineticParameters } from './parameters';

/**
 * Calculate the specific growth rate using the Monod equation
 *
 * @param S   - Current substrate concentration (g/L)
 * @param params - Kinetic parameters containing muMax and Ks
 * @returns Specific growth rate μ (h⁻¹)
 */
export function monodGrowthRate(S: number, params: KineticParameters): number {
  // Guard against negative substrate (numerical artifact)
  if (S <= 0) return 0;

  const { muMax, Ks } = params;

  // Monod equation: μ = μ_max * S / (K_s + S)
  const mu = muMax * S / (Ks + S);

  return mu;
}

/**
 * Calculate biomass growth rate: dX/dt = μ * X
 *
 * This is the fundamental mass balance for biomass:
 * the rate of biomass increase equals the specific growth
 * rate times the current biomass concentration.
 *
 * @param X   - Current biomass concentration (g/L)
 * @param S   - Current substrate concentration (g/L)
 * @param params - Kinetic parameters
 * @returns Rate of biomass change dX/dt (g/L·h)
 */
export function biomassRate(
  X: number,
  S: number,
  params: KineticParameters
): number {
  const mu = monodGrowthRate(S, params);
  return mu * X;
}

/**
 * Calculate substrate consumption rate: dS/dt = -(1/Y_xs) * μ * X
 *
 * Substrate is consumed to produce both biomass and product.
 * The yield coefficient Y_xs tells us how many grams of substrate
 * are needed per gram of biomass produced.
 *
 * The negative sign indicates substrate is being consumed (decreasing).
 *
 * @param X   - Current biomass concentration (g/L)
 * @param S   - Current substrate concentration (g/L)
 * @param params - Kinetic parameters
 * @returns Rate of substrate change dS/dt (g/L·h)
 */
export function substrateRate(
  X: number,
  S: number,
  params: KineticParameters
): number {
  const mu = monodGrowthRate(S, params);
  const { Yxs } = params;

  // dS/dt = -(1/Yxs) * μ * X
  return -(1 / Yxs) * mu * X;
}
