/**
 * Kinetic Parameters for Saccharomyces cerevisiae Bioethanol Fermentation
 *
 * These parameters are sourced from peer-reviewed literature and represent
 * typical operating conditions for S. cerevisiae glucose-to-ethanol fermentation.
 *
 * References:
 *   - Sonnleitner & Käppeli (1986), Biotechnology and Bioengineering
 *   - Wang et al. (2004), Journal of the Institute of Brewing
 *   - Garnier & Gaillet (2015), Biotechnology and Bioengineering
 */

// ────────────────────────────────────────────────────────
// Type definitions
// ────────────────────────────────────────────────────────

export interface KineticParameters {
  /** Maximum specific growth rate (h⁻¹) — Monod model */
  muMax: number;

  /** Monod saturation constant (g/L) — substrate affinity */
  Ks: number;

  /** Growth-associated product formation constant (g_P/g_X) — Luedeking-Piret */
  alpha: number;

  /** Non-growth-associated product formation constant (g_P/g_X·h) — Luedeking-Piret */
  beta: number;

  /** Biomass yield on substrate (g_X/g_S) */
  Yxs: number;

  /** Product yield on substrate (g_P/g_S) */
  Yps: number;
}

export interface BioreactorConditions {
  /** Temperature (°C) */
  temperature: number;

  /** pH level */
  pH: number;

  /** Initial substrate concentration (g/L) */
  S0: number;

  /** Initial biomass concentration (g/L) */
  X0: number;

  /** Initial product concentration (g/L) */
  P0: number;
}

export interface SimulationConfig {
  /** Total simulation time (hours) */
  totalTime: number;

  /** Time step for numerical integration (hours) */
  dt: number;
}

// ────────────────────────────────────────────────────────
// Default values from literature
// ────────────────────────────────────────────────────────

/**
 * Default kinetic parameters for S. cerevisiae
 * at 30-35°C, pH 4.5-5.0, glucose substrate
 */
export const DEFAULT_KINETIC_PARAMS: KineticParameters = {
  muMax: 0.45,   // h⁻¹  — typical range: 0.3–0.5 h⁻¹
  Ks: 1.5,       // g/L  — typical range: 0.5–5.0 g/L
  alpha: 2.2,    // g_P/g_X — growth-associated constant
  beta: 0.1,     // g_P/(g_X·h) — non-growth-associated (maintenance)
  Yxs: 0.12,     // g_X/g_S — biomass yield
  Yps: 0.46,     // g_P/g_S — close to theoretical max of 0.511
};

/**
 * Default bioreactor starting conditions
 * Typical lab-scale batch fermentation setup
 */
export const DEFAULT_CONDITIONS: BioreactorConditions = {
  temperature: 30,   // °C — middle of optimal range
  pH: 4.8,             // — middle of optimal range
  S0: 150.0,           // g/L — high-gravity fermentation
  X0: 0.5,             // g/L — standard inoculum
  P0: 0.0,             // g/L — no initial product
};

/**
 * Default simulation settings
 */
export const DEFAULT_SIM_CONFIG: SimulationConfig = {
  totalTime: 48,    // hours — typical batch fermentation duration
  dt: 0.05,         // hours — small step for accuracy
};
