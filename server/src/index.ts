/**
 * Express Server — Fermentation Simulation API
 *
 * Endpoints:
 *   POST /api/simulate/batch      — Run batch simulation
 *   POST /api/simulate/fed-batch  — Run fed-batch simulation (Week 5)
 *   POST /api/simulate/continuous — Run continuous simulation (Week 5)
 *   GET  /api/presets             — List available parameter presets
 *   GET  /api/health              — Server health check
 *
 * In production, also serves the Vite-built frontend from client/dist/.
 *
 * Why have a backend when the client already runs simulations?
 *   1. Heavier simulations (long time, small dt) can offload to the server
 *   2. Future: save/load simulation runs, export CSV data
 *   3. Future: run parameter sweeps (batch many simulations)
 *   4. The architecture demonstrates full-stack capability for the capstone
 */

import express from 'express';
import cors from 'cors';
import { simulationRouter } from './routes/simulation';
import { presetsRouter } from './routes/presets';
import { requestLogger } from './middleware/logger';

const app = express();
const PORT = process.env.PORT || 3005;

// ── Middleware ─────────────────────────────────────────

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST'],
}));
app.use(express.json());
app.use(requestLogger);

// ── API Routes ────────────────────────────────────────

app.use('/api/simulate', simulationRouter);
app.use('/api/presets', presetsRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'fermentation-sim-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Start Server ──────────────────────────────────────

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Fermentation Simulation API                 ║');
  console.log(`║  Running on http://localhost:${PORT}             ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('Endpoints:');
  console.log('  POST /api/simulate/batch');
  console.log('  GET  /api/presets');
  console.log('  GET  /api/health');
  console.log('');
});

export default app;
