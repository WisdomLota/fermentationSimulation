/**
 * ModeControls — Mode-specific parameter panels
 *
 * Shows additional controls depending on the selected mode:
 *   - Batch: no extra controls
 *   - Fed-Batch: feed rate, feed substrate, volumes
 *   - Continuous: dilution rate, feed substrate, washout warning
 */

import { ParameterSlider } from './ParameterSlider';
import type { FedBatchConfig, ContinuousConfig } from '../types/simulation';

// ── Fed-Batch Controls ────────────────────────────────

interface FedBatchControlsProps {
  config: FedBatchConfig;
  onChange: (key: string, value: number) => void;
}

export const FedBatchControls: React.FC<FedBatchControlsProps> = ({ config, onChange }) => (
  <div className="panel-section">
    <div className="section-header">Fed-batch parameters</div>
    <ParameterSlider
      name="feedRate" label="Feed rate" value={config.feedRate}
      min={0.01} max={0.5} step={0.01} unit="L/h"
      tooltip="Volume of fresh substrate added per hour."
      onChange={(_, v) => onChange('feedRate', v)}
    />
    <ParameterSlider
      name="feedSubstrate" label="Feed concentration" value={config.feedSubstrate}
      min={100} max={800} step={10} unit="g/L"
      tooltip="Glucose concentration in the feed stream."
      onChange={(_, v) => onChange('feedSubstrate', v)}
    />
    <ParameterSlider
      name="initialVolume" label="Initial volume" value={config.initialVolume}
      min={0.5} max={5} step={0.1} unit="L"
      tooltip="Starting reactor volume before feeding begins."
      onChange={(_, v) => onChange('initialVolume', v)}
    />
    <ParameterSlider
      name="maxVolume" label="Max volume" value={config.maxVolume}
      min={1} max={10} step={0.5} unit="L"
      tooltip="Feed stops when reactor reaches this volume."
      onChange={(_, v) => onChange('maxVolume', v)}
    />
  </div>
);

// ── Continuous Controls ───────────────────────────────

interface ContinuousControlsProps {
  config: ContinuousConfig;
  muMax: number;
  onChange: (key: string, value: number) => void;
}

export const ContinuousControls: React.FC<ContinuousControlsProps> = ({ config, muMax, onChange }) => {
  // Calculate critical dilution rate
  const Dcrit = muMax * config.feedSubstrate / (1.5 + config.feedSubstrate);
  const isNearWashout = config.dilutionRate > Dcrit * 0.85;
  const isWashout = config.dilutionRate >= Dcrit;

  return (
    <div className="panel-section">
      <div className="section-header">Continuous (CSTR) parameters</div>
      <ParameterSlider
        name="dilutionRate" label="Dilution rate (D)" value={config.dilutionRate}
        min={0.01} max={0.6} step={0.01} unit="h⁻¹"
        tooltip={`D = F/V. Must be below μ_max (${muMax}) to avoid washout.`}
        onChange={(_, v) => onChange('dilutionRate', v)}
      />
      <ParameterSlider
        name="feedSubstrate" label="Feed concentration" value={config.feedSubstrate}
        min={20} max={300} step={5} unit="g/L"
        tooltip="Substrate concentration in the feed."
        onChange={(_, v) => onChange('feedSubstrate', v)}
      />

      {/* Washout warning */}
      {isNearWashout && (
        <div style={{
          marginTop: '8px',
          padding: '8px 10px',
          background: isWashout ? 'rgba(255, 107, 107, 0.12)' : 'rgba(255, 191, 71, 0.12)',
          border: `1px solid ${isWashout ? 'rgba(255, 107, 107, 0.3)' : 'rgba(255, 191, 71, 0.3)'}`,
          borderRadius: '4px',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: isWashout ? '#ff6b6b' : '#ffbf47',
        }}>
          {isWashout
            ? `⚠ WASHOUT: D (${config.dilutionRate.toFixed(2)}) ≥ D_crit (${Dcrit.toFixed(2)}). Cells will be washed out.`
            : `⚡ Near washout: D_crit = ${Dcrit.toFixed(2)} h⁻¹`
          }
        </div>
      )}
    </div>
  );
};
