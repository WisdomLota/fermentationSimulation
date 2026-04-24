/**
 * CLI Demo — Run a batch simulation and print results
 *
 * Usage: npx ts-node src/demo.ts
 *
 * This is a quick way to verify the simulation is working
 * without a frontend. It runs a batch simulation with default
 * parameters and prints the key curves and summary.
 */

import { runBatchSimulation } from './simulation/batch';
import {
  DEFAULT_KINETIC_PARAMS,
  DEFAULT_CONDITIONS,
  DEFAULT_SIM_CONFIG,
} from './models/parameters';

console.log('╔══════════════════════════════════════════════════╗');
console.log('║  FERMENTATION SIMULATION — BATCH MODE DEMO      ║');
console.log('║  Saccharomyces cerevisiae · Glucose → Ethanol   ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log();

// Print initial conditions
console.log('─── Initial Conditions ───');
console.log(`  Temperature:    ${DEFAULT_CONDITIONS.temperature}°C`);
console.log(`  pH:             ${DEFAULT_CONDITIONS.pH}`);
console.log(`  Glucose (S₀):   ${DEFAULT_CONDITIONS.S0} g/L`);
console.log(`  Biomass (X₀):   ${DEFAULT_CONDITIONS.X0} g/L`);
console.log(`  Ethanol (P₀):   ${DEFAULT_CONDITIONS.P0} g/L`);
console.log();

console.log('─── Kinetic Parameters ───');
console.log(`  μ_max:  ${DEFAULT_KINETIC_PARAMS.muMax} h⁻¹`);
console.log(`  K_s:    ${DEFAULT_KINETIC_PARAMS.Ks} g/L`);
console.log(`  α:      ${DEFAULT_KINETIC_PARAMS.alpha} g_P/g_X`);
console.log(`  β:      ${DEFAULT_KINETIC_PARAMS.beta} g_P/(g_X·h)`);
console.log(`  Y_xs:   ${DEFAULT_KINETIC_PARAMS.Yxs} g_X/g_S`);
console.log(`  Y_ps:   ${DEFAULT_KINETIC_PARAMS.Yps} g_P/g_S`);
console.log();

// Run simulation
console.log('Running simulation...');
const startTime = Date.now();
const result = runBatchSimulation(
  DEFAULT_KINETIC_PARAMS,
  DEFAULT_CONDITIONS,
  DEFAULT_SIM_CONFIG
);
const elapsed = Date.now() - startTime;
console.log(`Done in ${elapsed}ms (${result.time.length} data points)\n`);

// Print time series (sampled every ~6 hours)
console.log('─── Time Series (sampled) ───');
console.log('  Time(h)  Biomass(g/L)  Glucose(g/L)  Ethanol(g/L)  μ(h⁻¹)');
console.log('  ───────  ────────────  ────────────  ────────────  ──────');

for (let i = 0; i < result.time.length; i++) {
  const t = result.time[i];
  // Print every ~6 hours plus the first and last point
  if (i === 0 || i === result.time.length - 1 || Math.abs(t % 6) < 0.3) {
    const X = result.biomass[i].toFixed(2).padStart(8);
    const S = result.substrate[i].toFixed(2).padStart(8);
    const P = result.product[i].toFixed(2).padStart(8);
    const mu = result.growthRate[i].toFixed(4).padStart(8);
    const tStr = t.toFixed(1).padStart(7);
    console.log(`  ${tStr}    ${X}      ${S}      ${P}    ${mu}`);
  }
}

// Print summary
console.log();
console.log('─── Simulation Summary ───');
console.log(`  Final Biomass:        ${result.summary.finalBiomass.toFixed(2)} g/L`);
console.log(`  Final Ethanol:        ${result.summary.finalEthanol.toFixed(2)} g/L`);
console.log(`  Residual Substrate:   ${result.summary.residualSubstrate.toFixed(2)} g/L`);
console.log(`  Substrate Consumed:   ${result.summary.substrateConsumed.toFixed(2)} g/L`);
console.log(`  Yield Efficiency:     ${result.summary.yieldEfficiency.toFixed(1)}%`);
console.log(`  Peak Growth Rate:     ${result.summary.peakGrowthRate.toFixed(4)} h⁻¹`);
if (result.summary.time90 !== null) {
  console.log(`  Time to 90% usage:    ${result.summary.time90.toFixed(1)} h`);
}
console.log();
