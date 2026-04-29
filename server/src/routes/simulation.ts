/**
 * Simulation API Routes
 *
 * POST /api/simulate/batch
 *   Body: { kinetics, conditions, config }
 *   Returns: { time[], biomass[], substrate[], product[], growthRate[], summary }
 *
 * POST /api/simulate/fed-batch   — Stub for Week 5
 * POST /api/simulate/continuous  — Stub for Week 5
 *
 * Input validation ensures parameters are within physically
 * realistic ranges before running the simulation.
 */

import { Router, Request, Response } from 'express';

const router = Router();

// ── Inline simulation engine (same math as client) ────

function monodGrowthRate(S: number, muMax: number, Ks: number): number {
  if (S <= 0) return 0;
  return muMax * S / (Ks + S);
}

type DerivFn = (t: number, y: number[]) => number[];

function rk4Step(f: DerivFn, t: number, y: number[], dt: number): number[] {
  const k1 = f(t, y);
  const k2 = f(t + dt / 2, y.map((v, i) => v + dt / 2 * k1[i]));
  const k3 = f(t + dt / 2, y.map((v, i) => v + dt / 2 * k2[i]));
  const k4 = f(t + dt, y.map((v, i) => v + dt * k3[i]));
  return y.map((v, i) =>
    Math.max(0, v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]))
  );
}

// ── Validation helpers ────────────────────────────────

interface ValidationError {
  field: string;
  message: string;
}

function validateRange(value: unknown, field: string, min: number, max: number): ValidationError | null {
  if (typeof value !== 'number' || isNaN(value)) {
    return { field, message: `${field} must be a number` };
  }
  if (value < min || value > max) {
    return { field, message: `${field} must be between ${min} and ${max}` };
  }
  return null;
}

function validateBatchInput(body: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];
  const k = body.kinetics as Record<string, unknown> | undefined;
  const c = body.conditions as Record<string, unknown> | undefined;
  const cfg = body.config as Record<string, unknown> | undefined;

  if (!k) { errors.push({ field: 'kinetics', message: 'kinetics object is required' }); return errors; }
  if (!c) { errors.push({ field: 'conditions', message: 'conditions object is required' }); return errors; }
  if (!cfg) { errors.push({ field: 'config', message: 'config object is required' }); return errors; }

  // Kinetic parameters
  const kErr = [
    validateRange(k.muMax, 'muMax', 0.01, 2.0),
    validateRange(k.Ks, 'Ks', 0.01, 50),
    validateRange(k.alpha, 'alpha', 0, 10),
    validateRange(k.beta, 'beta', 0, 2),
    validateRange(k.Yxs, 'Yxs', 0.01, 0.5),
  ];

  // Conditions
  const cErr = [
    validateRange(c.S0, 'S0', 1, 500),
    validateRange(c.X0, 'X0', 0.01, 50),
    validateRange(c.temperature, 'temperature', 15, 50),
    validateRange(c.pH, 'pH', 2, 9),
  ];

  // Config
  const cfgErr = [
    validateRange(cfg.totalTime, 'totalTime', 1, 200),
    validateRange(cfg.dt, 'dt', 0.001, 1),
  ];

  [...kErr, ...cErr, ...cfgErr].forEach(e => { if (e) errors.push(e); });
  return errors;
}

// ── Batch simulation endpoint ─────────────────────────

router.post('/batch', (req: Request, res: Response) => {
  const errors = validateBatchInput(req.body);
  if (errors.length > 0) {
    res.status(400).json({ error: 'Validation failed', details: errors });
    return;
  }

  const { kinetics: k, conditions: c, config: cfg } = req.body;
  const { muMax, Ks, alpha, beta, Yxs } = k;
  const { S0, X0 } = c;
  const P0 = c.P0 ?? 0;
  const { totalTime, dt } = cfg;

  const start = performance.now();

  // ODE system for batch
  const derivatives: DerivFn = (_t, state) => {
    const [X, S] = state;
    if (S <= 0 || X <= 0) return [0, 0, 0];
    const mu = monodGrowthRate(S, muMax, Ks);
    return [
      mu * X,
      -(1 / Yxs) * mu * X,
      alpha * mu * X + beta * X,
    ];
  };

  // Integrate
  const time: number[] = [0];
  const states: number[][] = [[X0, S0, P0]];
  let state = [X0, S0, P0];
  let t = 0;
  const steps = Math.ceil(totalTime / dt);
  const recordEvery = Math.max(1, Math.floor(0.25 / dt));

  for (let i = 0; i < steps; i++) {
    state = rk4Step(derivatives, t, state, dt);
    t += dt;
    if (i % recordEvery === 0 || i === steps - 1) {
      time.push(Number(t.toFixed(4)));
      states.push([...state]);
    }
  }

  const biomass = states.map(s => s[0]);
  const substrate = states.map(s => s[1]);
  const product = states.map(s => s[2]);
  const growthRate = substrate.map(S => monodGrowthRate(S, muMax, Ks));

  const finalBiomass = biomass[biomass.length - 1];
  const finalEthanol = product[product.length - 1];
  const residualSubstrate = substrate[substrate.length - 1];
  const substrateConsumed = S0 - residualSubstrate;
  const actualYield = substrateConsumed > 0 ? finalEthanol / substrateConsumed : 0;
  const yieldEfficiency = Math.min((actualYield / 0.511) * 100, 100);
  const threshold90 = S0 * 0.10;
  const time90Idx = substrate.findIndex(S => S <= threshold90);
  const time90 = time90Idx >= 0 ? time[time90Idx] : null;
  const peakGrowthRate = Math.max(...growthRate);

  const elapsed = Math.round(performance.now() - start);

  res.json({
    mode: 'batch',
    computeTimeMs: elapsed,
    dataPoints: time.length,
    time, biomass, substrate, product, growthRate,
    summary: {
      finalBiomass, finalEthanol, residualSubstrate,
      substrateConsumed, yieldEfficiency, time90, peakGrowthRate,
    },
  });
});

// ── Fed-batch stub (Week 5) ───────────────────────────

router.post('/fed-batch', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not yet implemented',
    message: 'Fed-batch simulation will be available in Week 5.',
  });
});

// ── Continuous stub (Week 5) ──────────────────────────

router.post('/continuous', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not yet implemented',
    message: 'Continuous simulation will be available in Week 5.',
  });
});

export { router as simulationRouter };
