/**
 * App — Main Application Shell (Week 5: All Three Modes)
 */

import { useState, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ConcentrationChart } from './components/ConcentrationChart';
import { SummaryPanel } from './components/SummaryPanel';
import { PresetSelector } from './components/PresetSelector';
import { GrowthPhaseIndicator } from './components/GrowthPhaseIndicator';
import { FedBatchControls, ContinuousControls } from './components/ModeControls';
import { useSimulation } from './hooks/useSimulation';
import type {
  ReactorMode, KineticParams, ReactorConditions, SimConfig,
  FedBatchConfig, ContinuousConfig,
} from './types/simulation';
import { DEFAULT_FEDBATCH_CONFIG, DEFAULT_CONTINUOUS_CONFIG } from './types/simulation';
import { DataExport } from './components/DataExport';

const DEFAULT_KINETICS: KineticParams = {
  muMax: 0.35, Ks: 2.0, alpha: 2.2, beta: 0.05, Yxs: 0.12, Yps: 0.46, Pmax: 90,
};
const DEFAULT_CONDITIONS: ReactorConditions = {
  temperature: 30, pH: 4.8, S0: 120, X0: 0.5, P0: 0,
};
const DEFAULT_CONFIG: SimConfig = { totalTime: 48, dt: 0.05 };

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

function App() {
  const [mode, setMode] = useState<ReactorMode>('batch');
  const [kinetics, setKinetics] = useState<KineticParams>(DEFAULT_KINETICS);
  const [conditions, setConditions] = useState<ReactorConditions>(DEFAULT_CONDITIONS);
  const [config, setConfig] = useState<SimConfig>(DEFAULT_CONFIG);
  const [fbConfig, setFbConfig] = useState<FedBatchConfig>(DEFAULT_FEDBATCH_CONFIG);
  const [cstConfig, setCstConfig] = useState<ContinuousConfig>(DEFAULT_CONTINUOUS_CONFIG);
  const [resetCount, setResetCount] = useState(0);
  const [runTrigger, setRunTrigger] = useState(0);
  const [isDark, setIsDark] = useState(false);
  

  const { data, isRunning, error, runTime, dataPoints, run } = useSimulation({
    mode, kinetics, conditions, config,
    fedBatchConfig: fbConfig,
    continuousConfig: cstConfig,
    runTrigger,
  });

  const handleRun = useCallback(() => {
    run();
    setRunTrigger(count => count + 1);
  }, [run]);

  const handleKineticsChange = useCallback((key: string, value: number) => {
    setKinetics(prev => ({ ...prev, [key]: value }));
  }, []);
  const handleConditionsChange = useCallback((key: string, value: number) => {
    setConditions(prev => ({ ...prev, [key]: value }));
  }, []);
  const maxTimeForMode = mode === 'batch' ? 168 : mode === 'fed-batch' ? 720 : 2160;
  const handleConfigChange = useCallback((key: string, value: number) => {
    setConfig(prev => ({ ...prev, [key]: key === 'totalTime' ? Math.min(value, maxTimeForMode) : value }));
  }, [maxTimeForMode]);
  const handleFbChange = useCallback((key: string, value: number) => {
    setFbConfig(prev => ({ ...prev, [key]: value }));
  }, []);
  const handleCstChange = useCallback((key: string, value: number) => {
    setCstConfig(prev => ({ ...prev, [key]: value }));
  }, []);
  const handleReset = useCallback(() => {
    setMode('batch');
    setKinetics(DEFAULT_KINETICS);
    setConditions(DEFAULT_CONDITIONS);
    setConfig(DEFAULT_CONFIG);
    setFbConfig(DEFAULT_FEDBATCH_CONFIG);
    setCstConfig(DEFAULT_CONTINUOUS_CONFIG);
    setResetCount(c => c + 1);
  }, []);
  const handlePresetSelect = useCallback((c: ReactorConditions, cfg: SimConfig, fb?: FedBatchConfig, cst?: ContinuousConfig) => {
    setConditions(c); setConfig(cfg);
    if (fb) setFbConfig(fb);
    if (cst) setCstConfig(cst);
  }, []);

  // Mode label for header
  const modeLabel = mode === 'batch' ? 'Batch' : mode === 'fed-batch' ? 'Fed-Batch' : 'Continuous (CSTR)';

  return (
    <div className={`app-container${isDark ? ' dark' : ''}`}>
      <header className="app-header">
        <div>
          <h1 className="app-title">Fermentation Simulation Software</h1>
          <div className="app-subtitle">
            Virtual Bioreactor · {modeLabel} Mode · v1.0
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setIsDark(d => !d)}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid var(--panel-border)',
              borderRadius: '4px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              cursor: 'pointer',
              letterSpacing: '1px',
            }}
          >
            {isDark ? '☀ Light' : '☾ Dark'}
          </button>
          {data && <DataExport data={data} mode={mode} />}
          <div className="status-indicator">
            <div className={`status-dot ${isRunning ? 'running' : data ? 'complete' : ''}`} />
          <span>
            {isRunning ? 'Simulating...'
              : data ? `Complete · ${dataPoints} pts · ${runTime}ms`
              : 'Ready'}
          </span>
          </div>
        </div>
      </header>

      <ControlPanel
        mode={mode} kinetics={kinetics} conditions={conditions}
        config={{ ...config, totalTime: Math.min(config.totalTime, maxTimeForMode) }}
        onModeChange={setMode}
        onKineticsChange={handleKineticsChange}
        onConditionsChange={handleConditionsChange}
        onConfigChange={handleConfigChange}
        onRun={handleRun}
        onReset={handleReset}
      >
        {/* Mode-specific controls */}
        {mode === 'fed-batch' && (
          <FedBatchControls config={fbConfig} onChange={handleFbChange} />
        )}
        {mode === 'continuous' && (
          <ContinuousControls config={cstConfig} muMax={kinetics.muMax} onChange={handleCstChange} />
        )}
        <PresetSelector key={resetCount} onSelect={handlePresetSelect} />
      </ControlPanel>

      <main className="viz-area">
        {error && (
          <div style={{
            background: '#2a1a1a', border: '1px solid #ff6b6b',
            borderRadius: '4px', padding: '12px',
            color: '#ff6b6b', fontFamily: 'var(--font-mono)', fontSize: '12px',
          }}>
            ⚠ {error}
          </div>
        )}

        {data && (
          <>
            <ConcentrationChart
              key={`growth-${runTrigger}`}
              data={data}
              title={`Biomass (X) & Substrate (S) vs time — ${modeLabel}`}
              curves={GROWTH_CURVES}
            />
            <ConcentrationChart
              key={`product-${runTrigger}`}
              data={data}
              title={`Ethanol concentration (P) vs time — ${modeLabel}`}
              curves={PRODUCT_CURVES}
            />
            <ConcentrationChart
              key={`rate-${runTrigger}`}
              data={data}
              title="Specific growth rate (μ) vs time"
              curves={RATE_CURVES}
            />
            <GrowthPhaseIndicator data={data} muMax={kinetics.muMax} />
            <SummaryPanel
              summary={data.summary}
              workingVolume={mode === 'fed-batch' ? fbConfig.maxVolume : 100000}
              S0={conditions.S0}
              mode={mode}
              fbConfig={fbConfig}
            />
          </>
        )}

        {!data && !error && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '300px', color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)', fontSize: '13px',
          }}>
            Adjust parameters and the simulation will run automatically.
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
