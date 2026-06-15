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
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ summary, workingVolume }) => {
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
            {summary.residualSubstrate.toFixed(1)}
          </div>
          <div className="summary-unit">g/L</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Batch Value</div>
          <div className="summary-value highlight">
            ${((summary.finalEthanol * workingVolume / 1000) / 0.789 * 1.00).toFixed(0)}
          </div>
          <div className="summary-unit">per batch ({(workingVolume / 1000).toFixed(0)} m³)</div>
        </div>
      </div>

      <div style={{
        marginTop: '8px',
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        color: 'var(--text-muted)',
      }}>
        Based on {workingVolume.toLocaleString()} L working volume · $1.00/L pure ethanol · density 0.789 kg/L
      </div>
    </div>
  );
};
