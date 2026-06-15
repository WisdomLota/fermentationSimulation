/**
 * SummaryPanel — Simulation result summary cards
 *
 * Displays the key output metrics in a grid of cards
 * styled like analog instrument readouts — large serif
 * numbers with monospace labels above.
 */

import React from 'react';
import type { SimulationSummary } from '../types/simulation';

interface SummaryPanelProps {
  summary: SimulationSummary;
  workingVolume: number;
  S0: number;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ summary, workingVolume, S0 }) => {
  // ── Revenue ──
  const batchValue = ((summary.finalEthanol * workingVolume / 1000) / 0.789) * 1.00;

  // ── Cost estimate (assumed reasonable figures) ──
  // Feedstock: carob pods at $0.15/kg, assuming 45% fermentable sugar content by dry weight
  const carobPricePerKg = 0.15;
  const sugarFraction = 0.45;
  const sugarMassKg = (S0 * workingVolume) / 1000;
  const carobMassKg = sugarMassKg / sugarFraction;
  const feedstockCost = carobMassKg * carobPricePerKg;

  // Fixed overhead per batch: energy + labor + water + misc (enzymes, cleaning, maintenance)
  const energyCost = 500;
  const laborCost = 300;
  const waterCost = 50;
  const miscCost = 150;
  const overheadCost = energyCost + laborCost + waterCost + miscCost;

  const totalCost = feedstockCost + overheadCost;
  const netProfit = batchValue - totalCost;

  return (
    <div className="panel-section">
      <div className="section-header">Simulation Summary</div>
      <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="summary-card">
          <div className="summary-label">Final Biomass</div>
          <div className="summary-value">
            {summary.finalBiomass.toFixed(1)}
          </div>
          <div className="summary-unit">g/L</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Final Ethanol</div>
          <div className="summary-value highlight">
            {summary.finalEthanol.toFixed(1)}
          </div>
          <div className="summary-unit">g/L</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Yield Efficiency</div>
          <div className="summary-value highlight">
            {summary.yieldEfficiency.toFixed(1)}%
          </div>
          <div className="summary-unit">of theoretical max</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Residual Substrate</div>
          <div className="summary-value">
            {summary.residualSubstrate.toFixed(4)}
          </div>
          <div className="summary-unit">g/L</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Batch Value</div>
          <div className="summary-value highlight">
            ${batchValue.toFixed(0)}
          </div>
          <div className="summary-unit">per batch ({(workingVolume / 1000).toFixed(0)} m³)</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Production Cost</div>
          <div className="summary-value">
            ${totalCost.toFixed(0)}
          </div>
          <div className="summary-unit">feedstock + overhead</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Net Profit / Loss</div>
          <div className="summary-value" style={{ color: netProfit >= 0 ? '#39ff7e' : '#ff6b6b' }}>
            {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(0)}
          </div>
          <div className="summary-unit">revenue − cost</div>
        </div>
      </div>

      <div style={{
        marginTop: '8px',
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        color: 'var(--text-muted)',
      }}>
        Based on {workingVolume.toLocaleString()} L working volume · $1.00/L pure ethanol · density 0.789 kg/L
        <br />
        Cost assumptions: carob pods $0.15/kg (45% fermentable sugar) · $1000 fixed overhead (energy, labor, water, misc.) per batch
      </div>
    </div>
  );
};