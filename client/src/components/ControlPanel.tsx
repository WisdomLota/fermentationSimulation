/**
 * ControlPanel — Left sidebar with all simulation controls
 *
 * Organized into sections mimicking a lab instrument's control panels:
 *   1. Operation Mode selector (Batch / Fed-Batch / Continuous)
 *   2. Bioreactor Conditions (T, pH, concentrations)
 *   3. Kinetic Parameters (Monod + Luedeking-Piret constants)
 *   4. Simulation Settings (time, step size)
 *   5. Run / Reset buttons
 */

import React from 'react';
import { ParameterSlider } from './ParameterSlider';
import { PARAM_RANGES } from '../types/simulation';
import type { ReactorMode, KineticParams, ReactorConditions, SimConfig } from '../types/simulation';

interface ControlPanelProps {
  mode: ReactorMode;
  kinetics: KineticParams;
  conditions: ReactorConditions;
  config: SimConfig;
  onModeChange: (mode: ReactorMode) => void;
  onKineticsChange: (key: string, value: number) => void;
  onConditionsChange: (key: string, value: number) => void;
  onConfigChange: (key: string, value: number) => void;
  onReset: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  mode,
  kinetics,
  conditions,
  config,
  onModeChange,
  onKineticsChange,
  onConditionsChange,
  onConfigChange,
  onReset,
}) => {
  return (
    <aside className="control-panel">
      {/* ── Operation Mode ── */}
      <div className="panel-section">
        <div className="section-header">Operation Mode</div>
        <div className="mode-selector">
          <button
            className={`mode-btn ${mode === 'batch' ? 'active' : ''}`}
            onClick={() => onModeChange('batch')}
          >
            Batch
          </button>
          <button
            className={`mode-btn ${mode === 'fed-batch' ? 'active' : 'disabled'}`}
            onClick={() => {}} // Week 5
            title="Coming in Week 5"
          >
            Fed-Batch
          </button>
          <button
            className={`mode-btn ${mode === 'continuous' ? 'active' : 'disabled'}`}
            onClick={() => {}} // Week 5
            title="Coming in Week 5"
          >
            Continuous
          </button>
        </div>
      </div>

      {/* ── Bioreactor Conditions ── */}
      <div className="panel-section">
        <div className="section-header">Bioreactor Conditions</div>

        <ParameterSlider
          name="temperature"
          value={conditions.temperature}
          {...PARAM_RANGES.temperature}
          onChange={(_, v) => onConditionsChange('temperature', v)}
        />

        <ParameterSlider
          name="pH"
          value={conditions.pH}
          {...PARAM_RANGES.pH}
          onChange={(_, v) => onConditionsChange('pH', v)}
        />

        <ParameterSlider
          name="S0"
          value={conditions.S0}
          {...PARAM_RANGES.S0}
          onChange={(_, v) => onConditionsChange('S0', v)}
        />

        <ParameterSlider
          name="X0"
          value={conditions.X0}
          {...PARAM_RANGES.X0}
          onChange={(_, v) => onConditionsChange('X0', v)}
        />
      </div>

      {/* ── Kinetic Parameters ── */}
      <div className="panel-section">
        <div className="section-header">Kinetic Parameters</div>

        <ParameterSlider
          name="muMax"
          value={kinetics.muMax}
          {...PARAM_RANGES.muMax}
          onChange={(_, v) => onKineticsChange('muMax', v)}
        />

        <ParameterSlider
          name="Ks"
          value={kinetics.Ks}
          {...PARAM_RANGES.Ks}
          onChange={(_, v) => onKineticsChange('Ks', v)}
        />

        <ParameterSlider
          name="alpha"
          value={kinetics.alpha}
          {...PARAM_RANGES.alpha}
          onChange={(_, v) => onKineticsChange('alpha', v)}
        />

        <ParameterSlider
          name="beta"
          value={kinetics.beta}
          {...PARAM_RANGES.beta}
          onChange={(_, v) => onKineticsChange('beta', v)}
        />

        <ParameterSlider
          name="Yxs"
          value={kinetics.Yxs}
          {...PARAM_RANGES.Yxs}
          onChange={(_, v) => onKineticsChange('Yxs', v)}
        />
      </div>

      {/* ── Simulation Settings ── */}
      <div className="panel-section">
        <div className="section-header">Simulation</div>

        <ParameterSlider
          name="totalTime"
          value={config.totalTime}
          {...PARAM_RANGES.totalTime}
          onChange={(_, v) => onConfigChange('totalTime', v)}
        />

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button className="run-button">▶ Run Simulation</button>
        </div>
        <button className="reset-button" onClick={onReset} style={{ marginTop: '8px' }}>
          ↻ Reset Parameters
        </button>
      </div>
    </aside>
  );
};
