/**
 * PresetSelector — Quick-load predefined parameter sets
 *
 * Displays a dropdown of fermentation presets (standard lab,
 * high-gravity, low-sugar, etc.) that load all parameters at once.
 * Styled as a vintage toggle-switch panel.
 */

import { useState } from 'react';
import type { KineticParams, ReactorConditions, SimConfig } from '../types/simulation';

interface Preset {
  id: string;
  name: string;
  description: string;
  category: string;
  kinetics: KineticParams;
  conditions: ReactorConditions;
  config: SimConfig;
}

// Presets embedded client-side (mirrors server/src/routes/presets.ts)
const PRESETS: Preset[] = [
  {
    id: 'default', name: 'Standard Lab Batch', category: 'standard',
    description: 'Typical lab-scale fermentation at 150 g/L glucose.',
    kinetics: { muMax: 0.45, Ks: 1.5, alpha: 2.2, beta: 0.1, Yxs: 0.12, Yps: 0.46 },
    conditions: { temperature: 30, pH: 4.8, S0: 150, X0: 0.5, P0: 0 },
    config: { totalTime: 48, dt: 0.05 },
  },
  {
    id: 'high-gravity', name: 'High-Gravity Industrial', category: 'industrial',
    description: '250 g/L glucose. Higher ethanol, longer process.',
    kinetics: { muMax: 0.38, Ks: 2.0, alpha: 2.5, beta: 0.08, Yxs: 0.10, Yps: 0.44 },
    conditions: { temperature: 33.0, pH: 4.5, S0: 250, X0: 1.0, P0: 0 },
    config: { totalTime: 72, dt: 0.05 },
  },
  {
    id: 'low-sugar', name: 'Low-Sugar Fermentation', category: 'standard',
    description: '50 g/L glucose. Fast completion, less ethanol.',
    kinetics: { muMax: 0.48, Ks: 1.2, alpha: 2.0, beta: 0.12, Yxs: 0.14, Yps: 0.47 },
    conditions: { temperature: 30.0, pH: 5.0, S0: 50, X0: 0.5, P0: 0 },
    config: { totalTime: 24, dt: 0.05 },
  },
  {
    id: 'high-inoculum', name: 'High Inoculum (5 g/L)', category: 'research',
    description: '10x more starting yeast. Minimal lag phase.',
    kinetics: { muMax: 0.45, Ks: 1.5, alpha: 2.2, beta: 0.1, Yxs: 0.12, Yps: 0.46 },
    conditions: { temperature: 32.5, pH: 4.8, S0: 150, X0: 5.0, P0: 0 },
    config: { totalTime: 36, dt: 0.05 },
  },
  {
    id: 'slow-grower', name: 'Slow-Growing Strain', category: 'research',
    description: 'μ_max = 0.25 h⁻¹. Shows impact of growth rate.',
    kinetics: { muMax: 0.25, Ks: 3.0, alpha: 2.8, beta: 0.15, Yxs: 0.10, Yps: 0.44 },
    conditions: { temperature: 30.0, pH: 4.8, S0: 150, X0: 0.5, P0: 0 },
    config: { totalTime: 72, dt: 0.05 },
  },
  {
    id: 'optimized', name: 'Optimized Industrial', category: 'industrial',
    description: 'Best-case parameters for maximum yield.',
    kinetics: { muMax: 0.50, Ks: 1.0, alpha: 2.0, beta: 0.05, Yxs: 0.13, Yps: 0.48 },
    conditions: { temperature: 34.0, pH: 4.7, S0: 180, X0: 1.0, P0: 0 },
    config: { totalTime: 48, dt: 0.05 },
  },
];

interface PresetSelectorProps {
  onSelect: (kinetics: KineticParams, conditions: ReactorConditions, config: SimConfig) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ onSelect }) => {
  const [activeId, setActiveId] = useState<string>('default');

  const handleSelect = (preset: Preset) => {
    setActiveId(preset.id);
    onSelect(preset.kinetics, preset.conditions, preset.config);
  };

  return (
    <div className="panel-section">
      <div className="section-header">Parameter Presets</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {PRESETS.map(preset => (
          <button
            key={preset.id}
            onClick={() => handleSelect(preset)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '8px 10px',
              background: activeId === preset.id ? 'rgba(200, 168, 78, 0.12)' : 'transparent',
              border: activeId === preset.id
                ? '1px solid rgba(200, 168, 78, 0.3)'
                : '1px solid var(--panel-border)',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 500,
              color: activeId === preset.id ? 'var(--brass-light)' : 'var(--text-secondary)',
            }}>
              {preset.name}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              color: 'var(--text-muted)',
              marginTop: '2px',
            }}>
              {preset.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
