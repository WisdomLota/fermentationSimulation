/**
 * DataExport — Download simulation results as CSV
 *
 * Creates a downloadable CSV file with all time-series data
 * and summary statistics. Researchers can then import this
 * into Excel, MATLAB, or Python for further analysis.
 */

import React, { useCallback } from 'react';
import type { SimulationOutput } from '../types/simulation';

interface DataExportProps {
  data: SimulationOutput;
  mode: string;
}

export const DataExport: React.FC<DataExportProps> = ({ data, mode }) => {
  const handleExportCSV = useCallback(() => {
    // Build CSV header
    const headers = ['Time (h)', 'Biomass X (g/L)', 'Substrate S (g/L)', 'Product P (g/L)', 'Growth Rate μ (1/h)'];
    const rows = data.time.map((t, i) =>
      [t.toFixed(4), data.biomass[i].toFixed(4), data.substrate[i].toFixed(4),
       data.product[i].toFixed(4), data.growthRate[i].toFixed(6)].join(',')
    );

    // Add summary section
    const summary = [
      '', '',
      'SUMMARY',
      `Mode,${mode}`,
      `Final Biomass (g/L),${data.summary.finalBiomass.toFixed(4)}`,
      `Final Ethanol (g/L),${data.summary.finalEthanol.toFixed(4)}`,
      `Residual Substrate (g/L),${data.summary.residualSubstrate.toFixed(4)}`,
      `Yield Efficiency (%),${data.summary.yieldEfficiency.toFixed(2)}`,
      `Peak Growth Rate (1/h),${data.summary.peakGrowthRate.toFixed(6)}`,
      data.summary.time90 !== null ? `Time to 90% Consumption (h),${data.summary.time90.toFixed(2)}` : '',
    ];

    const csv = [headers.join(','), ...rows, ...summary].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fermentation_${mode}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [data, mode]);

  return (
    <button
      onClick={handleExportCSV}
      style={{
        padding: '8px 16px',
        background: 'transparent',
        color: 'var(--text-secondary)',
        border: '1px solid var(--panel-border)',
        borderRadius: '4px',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseOver={e => {
        (e.target as HTMLElement).style.borderColor = 'var(--brass-muted)';
        (e.target as HTMLElement).style.color = 'var(--brass-light)';
      }}
      onMouseOut={e => {
        (e.target as HTMLElement).style.borderColor = 'var(--panel-border)';
        (e.target as HTMLElement).style.color = 'var(--text-secondary)';
      }}
    >
      ↓ Export CSV
    </button>
  );
};
