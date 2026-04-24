/**
 * Luedeking-Piret Product Formation Model
 *
 * This model describes how product (ethanol) is formed during fermentation.
 * It distinguishes between two mechanisms of product formation:
 *
 * Equation:
 *   r_p = α·μ·X + β·X
 *       = (α·μ + β) · X
 *
 * Where:
 *   r_p  = volumetric product formation rate (g/L·h)
 *   α    = growth-associated constant (g_P/g_X)
 *   β    = non-growth-associated constant (g_P/g_X·h)
 *   μ    = specific growth rate from Monod (h⁻¹)
 *   X    = biomass concentration (g/L)
 *
 * Physical meaning of the two terms:
 *
 *   α·μ·X  — "Growth-associated" production
 *            Ethanol produced directly as a metabolic byproduct of growth.
 *            When cells are actively growing (high μ), this term dominates.
 *            Think of it as: "the faster they grow, the more ethanol they make."
 *
 *   β·X    — "Non-growth-associated" (maintenance) production
 *            Ethanol produced even when cells aren't actively dividing.
 *            This represents baseline metabolic activity / maintenance energy.
 *            Think of it as: "even resting cells still ferment a little."
 *
 * For S. cerevisiae ethanol fermentation:
 *   - Ethanol production is primarily growth-associated (α >> β)
 *   - But the β term matters during stationary phase when μ → 0
 *     and cells are still producing some ethanol from maintenance metabolism
 *
 * Classification:
 *   - α > 0, β = 0  → purely growth-associated (e.g., ethanol in some strains)
 *   - α = 0, β > 0  → purely non-growth-associated (e.g., some antibiotics)
 *   - α > 0, β > 0  → mixed (most common for ethanol fermentation)
 */

import { KineticParameters } from './parameters';
import { monodGrowthRate } from './monod';

/**
 * Calculate product (ethanol) formation rate using Luedeking-Piret
 *
 * dP/dt = α·μ·X + β·X
 *
 * @param X   - Current biomass concentration (g/L)
 * @param S   - Current substrate concentration (g/L)
 * @param params - Kinetic parameters (α, β, muMax, Ks)
 * @returns Product formation rate dP/dt (g/L·h)
 */
export function productRate(
  X: number,
  S: number,
  params: KineticParameters
): number {
  const mu = monodGrowthRate(S, params);
  const { alpha, beta } = params;

  // Growth-associated term: α * μ * X
  const growthAssociated = alpha * mu * X;

  // Non-growth-associated term: β * X
  const maintenanceTerm = beta * X;

  // Total product formation rate
  return growthAssociated + maintenanceTerm;
}

/**
 * Calculate theoretical maximum ethanol yield
 *
 * The stoichiometric maximum for glucose → ethanol:
 *   C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂
 *   180.16 g/mol → 2 × 46.07 g/mol
 *   Theoretical yield = 92.14 / 180.16 = 0.511 g_ethanol/g_glucose
 *
 * Actual yields are always lower due to:
 *   - Biomass formation (cells use some glucose for growth)
 *   - Maintenance energy requirements
 *   - Byproduct formation (glycerol, organic acids)
 *
 * @param substrateConsumed - Total glucose consumed (g/L)
 * @param productFormed     - Total ethanol produced (g/L)
 * @returns Yield efficiency as percentage of theoretical maximum
 */
export function yieldEfficiency(
  substrateConsumed: number,
  productFormed: number
): number {
  const THEORETICAL_MAX_YIELD = 0.511; // g_ethanol / g_glucose

  if (substrateConsumed <= 0) return 0;

  const actualYield = productFormed / substrateConsumed;
  const efficiency = (actualYield / THEORETICAL_MAX_YIELD) * 100;

  return Math.min(efficiency, 100); // Cap at 100%
}
