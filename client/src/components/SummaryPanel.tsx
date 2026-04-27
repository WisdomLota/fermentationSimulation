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
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ summary }) => {
  return (
    <div className="panel-section">
      <div className="section-header">Simulation Summary</div>
      <div className="summary-grid">
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
            {summary.residualSubstrate.toFixed(1)}
          </div>
          <div className="summary-unit">g/L</div>
        </div>
      </div>
    </div>
  );
};
