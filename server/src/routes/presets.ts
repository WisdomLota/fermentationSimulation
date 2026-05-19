/**
 * Parameter Presets API
 *
 * GET /api/presets — Returns a list of predefined parameter sets
 *
 * Each preset represents a well-characterized fermentation scenario
 * from literature. Users can load these instead of manually setting
 * every parameter — useful for beginners and for quick comparisons.
 *
 * Dorcas compiled these from published data; Alice verified the
 * kinetic parameters against the original papers.
 */

import { Router, Request, Response } from 'express';

const router = Router();

interface Preset {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'industrial' | 'research';
  kinetics: {
    muMax: number;
    Ks: number;
    alpha: number;
    beta: number;
    Yxs: number;
    Yps: number;
  };
  conditions: {
    temperature: number;
    pH: number;
    S0: number;
    X0: number;
    P0: number;
  };
  config: {
    totalTime: number;
    dt: number;
  };
}

const PRESETS: Preset[] = [
  {
    id: 'default',
    name: 'Standard Lab Batch',
    description: 'Typical lab-scale S. cerevisiae fermentation with glucose at 150 g/L. Good starting point for exploration.',
    category: 'standard',
    kinetics: { muMax: 0.45, Ks: 1.5, alpha: 2.2, beta: 0.1, Yxs: 0.12, Yps: 0.46 },
    conditions: { temperature: 30, pH: 4.8, S0: 150, X0: 0.5, P0: 0 },
    config: { totalTime: 48, dt: 0.05 },
  },
  {
    id: 'high-gravity',
    name: 'High-Gravity Fermentation',
    description: 'Industrial high-gravity process with 250 g/L glucose. Produces higher ethanol but takes longer and risks substrate inhibition.',
    category: 'industrial',
    kinetics: { muMax: 0.38, Ks: 2.0, alpha: 2.5, beta: 0.08, Yxs: 0.10, Yps: 0.44 },
    conditions: { temperature: 33.0, pH: 4.5, S0: 250, X0: 1.0, P0: 0 },
    config: { totalTime: 72, dt: 0.05 },
  },
  {
    id: 'low-sugar',
    name: 'Low-Sugar Fermentation',
    description: 'Dilute substrate (50 g/L). Fast completion but lower total ethanol. Typical of some wine/beer processes.',
    category: 'standard',
    kinetics: { muMax: 0.48, Ks: 1.2, alpha: 2.0, beta: 0.12, Yxs: 0.14, Yps: 0.47 },
    conditions: { temperature: 30.0, pH: 5.0, S0: 50, X0: 0.5, P0: 0 },
    config: { totalTime: 24, dt: 0.05 },
  },
  {
    id: 'high-inoculum',
    name: 'High Inoculum Density',
    description: 'Starting with 5 g/L biomass instead of 0.5 g/L. Reduces lag phase — fermentation reaches peak faster.',
    category: 'research',
    kinetics: { muMax: 0.45, Ks: 1.5, alpha: 2.2, beta: 0.1, Yxs: 0.12, Yps: 0.46 },
    conditions: { temperature: 32.5, pH: 4.8, S0: 150, X0: 5.0, P0: 0 },
    config: { totalTime: 36, dt: 0.05 },
  },
  {
    id: 'slow-grower',
    name: 'Slow-Growing Strain',
    description: 'A strain with lower μ_max (0.25 h⁻¹). Takes much longer to consume substrate. Demonstrates how growth kinetics affect process time.',
    category: 'research',
    kinetics: { muMax: 0.25, Ks: 3.0, alpha: 2.8, beta: 0.15, Yxs: 0.10, Yps: 0.44 },
    conditions: { temperature: 30.0, pH: 4.8, S0: 150, X0: 0.5, P0: 0 },
    config: { totalTime: 72, dt: 0.05 },
  },
  {
    id: 'optimized',
    name: 'Optimized Industrial',
    description: 'Best-case industrial parameters: high μ_max, good yields, optimal conditions. Represents the target for process optimization.',
    category: 'industrial',
    kinetics: { muMax: 0.50, Ks: 1.0, alpha: 2.0, beta: 0.05, Yxs: 0.13, Yps: 0.48 },
    conditions: { temperature: 34.0, pH: 4.7, S0: 180, X0: 1.0, P0: 0 },
    config: { totalTime: 48, dt: 0.05 },
  },
];

router.get('/', (_req: Request, res: Response) => {
  res.json({
    count: PRESETS.length,
    presets: PRESETS,
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const preset = PRESETS.find(p => p.id === req.params.id);
  if (!preset) {
    res.status(404).json({ error: `Preset '${req.params.id}' not found` });
    return;
  }
  res.json(preset);
});

export { router as presetsRouter };
