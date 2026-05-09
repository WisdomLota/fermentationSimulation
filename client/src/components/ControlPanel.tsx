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
  children?: React.ReactNode;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  mode,
  kinetics,
  conditions,
  config,
  onModeChange,
  onConditionsChange,
  onConfigChange,
  onReset,
  children,
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
            className={`mode-btn ${mode === 'fed-batch' ? 'active' : ''}`}
            onClick={() => onModeChange('fed-batch')}
          >
            Fed-Batch
          </button>
          <button
            className={`mode-btn ${mode === 'continuous' ? 'active' : ''}`}
            onClick={() => onModeChange('continuous')}
          >
            Continuous
          </button>
        </div>
      </div>

      {/* ── Bioreactor Conditions ── */}
      <div className="panel-section">
        <div className="section-header">Bioreactor Conditions</div>

        <div className="param-row">
          <div className="param-label">
            <span className="param-name">Temperature</span>
            <span className="param-value-display">32.5<span className="param-unit">°C</span></span>
          </div>
        </div>

        <div className="param-row">
          <div className="param-label">
            <span className="param-name">pH Level</span>
            <span className="param-value-display">4.8</span>
          </div>
        </div>

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

        <div className="param-row">
          <div className="param-label">
            <span className="param-name">μ_max</span>
            <span className="param-value-display">{kinetics.muMax}<span className="param-unit">h⁻¹</span></span>
          </div>
        </div>

        <div className="param-row">
          <div className="param-label">
            <span className="param-name">K_s</span>
            <span className="param-value-display">{kinetics.Ks}<span className="param-unit">g/L</span></span>
          </div>
        </div>

        <div className="param-row">
          <div className="param-label">
            <span className="param-name">α (growth-assoc.)</span>
            <span className="param-value-display">{kinetics.alpha}<span className="param-unit">g/g</span></span>
          </div>
        </div>

        <div className="param-row">
          <div className="param-label">
            <span className="param-name">β (maintenance)</span>
            <span className="param-value-display">{kinetics.beta}<span className="param-unit">g/(g·h)</span></span>
          </div>
        </div>

        <div className="param-row">
          <div className="param-label">
            <span className="param-name">Y_xs</span>
            <span className="param-value-display">{kinetics.Yxs}<span className="param-unit">g/g</span></span>
          </div>
        </div>
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

      {/* Injected children (e.g. PresetSelector) */}
      {children}
    </aside>
  );
};
