/**
 * App — Main Application Shell
 *
 * Layout:
 *   ┌──────────┬───────────────────────────────────┐
 *   │  Header  │   Fermentation Simulation v1.0    │
 *   ├──────────┼───────────────────────────────────┤
 *   │ Controls │  Chart: Biomass & Substrate       │
 *   │          │  Chart: Ethanol Production        │
 *   │  Mode    │  Chart: Specific Growth Rate      │
 *   │  Params  │  Summary Cards                    │
 *   │  Config  │                                   │
 *   │  [Run]   │                                   │
 *   └──────────┴───────────────────────────────────┘
 */

import { useState, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ConcentrationChart } from './components/ConcentrationChart';
import { SummaryPanel } from './components/SummaryPanel';
import { useSimulation } from './hooks/useSimulation';
import type { ReactorMode, KineticParams, ReactorConditions, SimConfig } from './types/simulation';

// ── Default state ─────────────────────────────────────

const DEFAULT_KINETICS: KineticParams = {
  muMax: 0.45, Ks: 1.5, alpha: 2.2, beta: 0.1, Yxs: 0.12, Yps: 0.46,
};

const DEFAULT_CONDITIONS: ReactorConditions = {
  temperature: 32.5, pH: 4.8, S0: 150, X0: 0.5, P0: 0,
};

const DEFAULT_CONFIG: SimConfig = {
  totalTime: 48, dt: 0.05,
};

// ── Chart curve definitions ───────────────────────────

const GROWTH_CURVES = [
  { key: 'biomass' as const, label: 'Biomass (X)', color: '#39ff7e', unit: 'g/L' },
  { key: 'substrate' as const, label: 'Substrate (S)', color: '#ff6b6b', unit: 'g/L' },
];

const PRODUCT_CURVES = [
  { key: 'product' as const, label: 'Ethanol (P)', color: '#ffbf47', unit: 'g/L' },
];

const RATE_CURVES = [
  { key: 'growthRate' as const, label: 'μ', color: '#47b4ff', unit: 'h⁻¹' },
];

// ── App Component ─────────────────────────────────────

function App() {
  const [mode, setMode] = useState<ReactorMode>('batch');
  const [kinetics, setKinetics] = useState<KineticParams>(DEFAULT_KINETICS);
  const [conditions, setConditions] = useState<ReactorConditions>(DEFAULT_CONDITIONS);
  const [config, setConfig] = useState<SimConfig>(DEFAULT_CONFIG);

  // Run simulation reactively
  const { data, isRunning, error, runTime, dataPoints } = useSimulation({
    mode, kinetics, conditions, config,
  });

  // Parameter change handlers
  const handleKineticsChange = useCallback((key: string, value: number) => {
    setKinetics(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleConditionsChange = useCallback((key: string, value: number) => {
    setConditions(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleConfigChange = useCallback((key: string, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setKinetics(DEFAULT_KINETICS);
    setConditions(DEFAULT_CONDITIONS);
    setConfig(DEFAULT_CONFIG);
  }, []);

  return (
    <div className="app-container">
      {/* ── Header ── */}
      <header className="app-header">
        <div>
          <h1 className="app-title">Fermentation Simulation Software</h1>
          <div className="app-subtitle">
            Virtual Bioreactor · Saccharomyces cerevisiae · v1.0
          </div>
        </div>
        <div className="status-indicator">
          <div className={`status-dot ${isRunning ? 'running' : data ? 'complete' : ''}`} />
          <span>
            {isRunning
              ? 'Simulating...'
              : data
                ? `Complete · ${dataPoints} pts · ${runTime}ms`
                : 'Ready'
            }
          </span>
        </div>
      </header>

      {/* ── Control Panel (Left) ── */}
      <ControlPanel
        mode={mode}
        kinetics={kinetics}
        conditions={conditions}
        config={config}
        onModeChange={setMode}
        onKineticsChange={handleKineticsChange}
        onConditionsChange={handleConditionsChange}
        onConfigChange={handleConfigChange}
        onReset={handleReset}
      />

      {/* ── Visualization Area (Main) ── */}
      <main className="viz-area">
        {error && (
          <div style={{
            background: '#2a1a1a',
            border: '1px solid #ff6b6b',
            borderRadius: '4px',
            padding: '12px',
            color: '#ff6b6b',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
          }}>
            ⚠ {error}
          </div>
        )}

        {data && (
          <>
            {/* Chart 1: Biomass & Substrate vs Time */}
            <ConcentrationChart
              data={data}
              title="Biomass concentration (X) & Substrate (S) vs Time"
              curves={GROWTH_CURVES}
            />

            {/* Chart 2: Ethanol Production vs Time */}
            <ConcentrationChart
              data={data}
              title="Ethanol concentration (P) vs Time"
              curves={PRODUCT_CURVES}
            />

            {/* Chart 3: Specific Growth Rate vs Time */}
            <ConcentrationChart
              data={data}
              title="Specific Growth Rate (μ) vs Time"
              curves={RATE_CURVES}
            />

            {/* Summary Cards */}
            <SummaryPanel summary={data.summary} />
          </>
        )}

        {!data && !error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
          }}>
            Adjust parameters and the simulation will run automatically.
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
