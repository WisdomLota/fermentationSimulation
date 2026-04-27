/**
 * useSimulation Hook
 *
 * Manages the simulation lifecycle:
 *  1. Takes kinetic parameters + conditions as input
 *  2. Runs the simulation engine when inputs change
 *  3. Provides reactive output data for chart components
 *
 * Uses a small debounce so the simulation doesn't re-run on every
 * keystroke while the user is adjusting a slider.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { runBatchSimulation } from '../lib/simulation-engine';
import type {
  KineticParams,
  ReactorConditions,
  SimConfig,
  SimulationOutput,
  ReactorMode,
} from '../types/simulation';

interface UseSimulationProps {
  mode: ReactorMode;
  kinetics: KineticParams;
  conditions: ReactorConditions;
  config: SimConfig;
}

interface UseSimulationReturn {
  data: SimulationOutput | null;
  isRunning: boolean;
  error: string | null;
  runTime: number | null;    // ms
  dataPoints: number | null;
}

export function useSimulation({
  mode,
  kinetics,
  conditions,
  config,
}: UseSimulationProps): UseSimulationReturn {
  const [data, setData] = useState<SimulationOutput | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runTime, setRunTime] = useState<number | null>(null);
  const [dataPoints, setDataPoints] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const runSimulation = useCallback(() => {
    setIsRunning(true);
    setError(null);

    try {
      const start = performance.now();

      let result: SimulationOutput;

      if (mode === 'batch') {
        result = runBatchSimulation(kinetics, conditions, config);
      } else {
        // Fed-batch and continuous modes will be added in Week 5
        throw new Error(`${mode} mode not yet implemented`);
      }

      const elapsed = performance.now() - start;

      setData(result);
      setRunTime(Math.round(elapsed));
      setDataPoints(result.time.length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
      setData(null);
    } finally {
      setIsRunning(false);
    }
  }, [mode, kinetics, conditions, config]);

  // Debounced auto-run when inputs change
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(runSimulation, 150);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [runSimulation]);

  return { data, isRunning, error, runTime, dataPoints };
}
