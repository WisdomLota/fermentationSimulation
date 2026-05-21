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
      min={100} max={5000} step={100} unit="L/h"
      tooltip="Volume of fresh substrate added per hour."
      onChange={(_, v) => onChange('feedRate', v)}
    />
    <ParameterSlider
      name="feedSubstrate" label="Feed concentration" value={config.feedSubstrate}
      min={100} max={250} step={10} unit="g/L"
      tooltip="Glucose concentration in feed. Max 250 g/L (inhibition limit)."
      onChange={(_, v) => onChange('feedSubstrate', v)}
    />
    <ParameterSlider
      name="initialVolume" label="Initial volume" value={config.initialVolume}
      min={10000} max={50000} step={5000} unit="L"
      tooltip="Starting reactor volume before feeding begins."
      onChange={(_, v) => onChange('initialVolume', v)}
    />
    <ParameterSlider
      name="maxVolume" label="Max volume" value={config.maxVolume}
      min={50000} max={100000} step={10000} unit="L"
      tooltip="Feed stops when reactor reaches this volume."
      onChange={(_, v) => onChange('maxVolume', v)}
    />
    <ParameterSlider
      name="feedStartTime" label="Feed start time" value={config.feedStartTime}
      min={0} max={72} step={1} unit="h"
      tooltip="Hour when feeding begins. Before this, reactor runs as batch."
      onChange={(_, v) => onChange('feedStartTime', v)}
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

  return (
    <div className="panel-section">
      <div className="section-header">Continuous (CSTR) parameters</div>
      <ParameterSlider
        name="dilutionRate" label="Dilution rate (D)" value={Math.min(config.dilutionRate, Dcrit * 0.95)}
        min={0.01} max={Number((Dcrit * 0.95).toFixed(2))} step={0.01} unit="h⁻¹"
        tooltip={`D = F/V. Capped at 95% of D_crit (${Dcrit.toFixed(3)}).`}
        onChange={(_, v) => onChange('dilutionRate', v)}
      />
      <ParameterSlider
        name="feedSubstrate" label="Feed concentration" value={config.feedSubstrate}
        min={20} max={250} step={5} unit="g/L"
        tooltip="Substrate concentration in feed. Max 250 g/L (inhibition limit)."
        onChange={(_, v) => onChange('feedSubstrate', v)}
      />
      <ParameterSlider
        name="batchStartupTime" label="Batch startup phase" value={config.batchStartupTime}
        min={1} max={48} step={1} unit="h"
        tooltip="Hours of batch operation before continuous flow begins. Lets cells grow first."
        onChange={(_, v) => onChange('batchStartupTime', v)}
      />

      {/* Washout warning */}
      <div style={{
        marginTop: '8px',
        padding: '6px 10px',
        background: 'rgba(71, 180, 255, 0.08)',
        border: '1px solid rgba(71, 180, 255, 0.2)',
        borderRadius: '4px',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        color: '#47b4ff',
      }}>
        D_crit = {Dcrit.toFixed(3)} h⁻¹ — slider capped at 95%
      </div>
    </div>
  );
};
