/**
 * useSimulation Hook — Supports all three reactor modes
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { runBatchSimulation, runFedBatchSimulation, runContinuousSimulation } from '../lib/simulation-engine';
import type {
  KineticParams, ReactorConditions, SimConfig,
  SimulationOutput, ReactorMode, FedBatchConfig, ContinuousConfig,
} from '../types/simulation';

interface UseSimulationProps {
  mode: ReactorMode;
  kinetics: KineticParams;
  conditions: ReactorConditions;
  config: SimConfig;
  fedBatchConfig: FedBatchConfig;
  continuousConfig: ContinuousConfig;
}

interface UseSimulationReturn {
  data: SimulationOutput | null;
  isRunning: boolean;
  error: string | null;
  runTime: number | null;
  dataPoints: number | null;
}

export function useSimulation({
  mode, kinetics, conditions, config, fedBatchConfig, continuousConfig,
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

      switch (mode) {
        case 'batch':
          result = runBatchSimulation(kinetics, conditions, config);
          break;
        case 'fed-batch':
          result = runFedBatchSimulation(kinetics, conditions, config, fedBatchConfig);
          break;
        case 'continuous':
          result = runContinuousSimulation(kinetics, conditions, config, continuousConfig);
          break;
        default:
          throw new Error(`Unknown mode: ${mode}`);
      }

      setData(result);
      setRunTime(Math.round(performance.now() - start));
      setDataPoints(result.time.length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
      setData(null);
    } finally {
      setIsRunning(false);
    }
  }, [mode, kinetics, conditions, config, fedBatchConfig, continuousConfig]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(runSimulation, 150);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [runSimulation]);

  return { data, isRunning, error, runTime, dataPoints };
}
