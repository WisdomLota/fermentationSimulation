/**
 * PresetSelector — Quick-load predefined parameter sets
 *
 * Displays a dropdown of fermentation presets (standard lab,
 * high-gravity, low-sugar, etc.) that load all parameters at once.
 * Styled as a vintage toggle-switch panel.
 */

import { useState } from 'react';
import type { ReactorConditions, SimConfig, FedBatchConfig, ContinuousConfig } from '../types/simulation';

interface Preset {
  id: string;
  name: string;
  description: string;
  category: string;
  conditions: ReactorConditions;
  config: SimConfig;
  fedBatch?: FedBatchConfig;
  continuous?: ContinuousConfig;
}

// Presets embedded client-side (mirrors server/src/routes/presets.ts)
const PRESETS: Preset[] = [
  {
    id: 'high-sugar', name: 'High Sugar Concentration', category: 'industrial',
    description: '250 g/L glucose. Maximum ethanol output, longer process.',
    conditions: { temperature: 33.0, pH: 4.5, S0: 250, X0: 1.0, P0: 0 },
    config: { totalTime: 72, dt: 0.05 },
    fedBatch: { feedRate: 800, feedSubstrate: 250, initialVolume: 50000, maxVolume: 150000, feedStartTime: 8 },
    continuous: { dilutionRate: 0.10, feedSubstrate: 250, batchStartupTime: 18 },
  },
  {
    id: 'low-sugar', name: 'Low Sugar Concentration', category: 'standard',
    description: '50 g/L glucose. Fast completion, lower ethanol.',
    conditions: { temperature: 30.0, pH: 5.0, S0: 50, X0: 0.5, P0: 0 },
    config: { totalTime: 24, dt: 0.05 },
    fedBatch: { feedRate: 300, feedSubstrate: 150, initialVolume: 30000, maxVolume: 80000, feedStartTime: 4 },
    continuous: { dilutionRate: 0.20, feedSubstrate: 50, batchStartupTime: 8 },
  },
  {
    id: 'high-inoculum', name: 'High Inoculum Density', category: 'research',
    description: '10x more starting yeast (5 g/L). Minimal lag phase.',
    conditions: { temperature: 30.0, pH: 4.8, S0: 150, X0: 5.0, P0: 0 },
    config: { totalTime: 36, dt: 0.05 },
    fedBatch: { feedRate: 500, feedSubstrate: 200, initialVolume: 50000, maxVolume: 120000, feedStartTime: 3 },
    continuous: { dilutionRate: 0.15, feedSubstrate: 100, batchStartupTime: 6 },
  },
];

interface PresetSelectorProps {
  onSelect: (conditions: ReactorConditions, config: SimConfig, fedBatch?: FedBatchConfig, continuous?: ContinuousConfig) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ onSelect }) => {
  const [activeId, setActiveId] = useState<string>('default');

  const handleSelect = (preset: Preset) => {
    setActiveId(preset.id);
    onSelect(preset.conditions, preset.config, preset.fedBatch, preset.continuous);
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
