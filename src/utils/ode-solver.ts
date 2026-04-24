/**
 * Runge-Kutta 4th Order (RK4) ODE Solver
 *
 * This is the numerical engine that drives our simulation. Instead of
 * solving the differential equations analytically (which is impossible
 * for our coupled nonlinear system), we approximate the solution by
 * taking small time steps and computing the rates at each step.
 *
 * ═══════════════════════════════════════════════════════════════
 * WHY RK4 INSTEAD OF EULER'S METHOD?
 * ═══════════════════════════════════════════════════════════════
 *
 * Euler's method (simplest):
 *   y(t + dt) = y(t) + dt * f(t, y)
 *   → Uses slope at ONE point (beginning of interval)
 *   → Error per step: O(dt²) — doubles when you halve the step
 *   → Tends to overshoot, especially with exponential growth
 *
 * RK4 method (what we use):
 *   Computes slope at FOUR strategic points within each interval:
 *     k1 = f(t,          y)                    — slope at start
 *     k2 = f(t + dt/2,   y + dt/2 * k1)       — slope at midpoint (using k1)
 *     k3 = f(t + dt/2,   y + dt/2 * k2)       — slope at midpoint (using k2)
 *     k4 = f(t + dt,     y + dt * k3)          — slope at end (using k3)
 *
 *   y(t + dt) = y(t) + (dt/6) * (k1 + 2*k2 + 2*k3 + k4)
 *
 *   → Error per step: O(dt⁵) — much more accurate!
 *   → The weighted average (1:2:2:1) gives excellent accuracy
 *   → Can use LARGER time steps while staying accurate
 *
 * For fermentation where biomass grows exponentially, RK4 tracks
 * the curves much more faithfully than Euler at the same step size.
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Type for a system of ODEs
 *
 * The derivative function takes:
 *   t      — current time
 *   state  — array of current variable values [X, S, P, ...]
 * And returns:
 *   array of derivatives [dX/dt, dS/dt, dP/dt, ...]
 */
export type DerivativeFunction = (t: number, state: number[]) => number[];

/**
 * Result of a single integration step
 */
export interface StepResult {
  t: number;
  state: number[];
}

/**
 * Full simulation result — time series of all variables
 */
export interface SimulationResult {
  /** Time points (hours) */
  time: number[];
  /** State variables at each time point — each inner array is [X, S, P] */
  states: number[][];
}

/**
 * Perform a single RK4 integration step
 *
 * This advances the state from time t to time t + dt using the
 * classical 4th-order Runge-Kutta method.
 *
 * @param f     - Derivative function: (t, state) => derivatives
 * @param t     - Current time
 * @param state - Current state vector [X, S, P]
 * @param dt    - Time step size
 * @returns New state at time t + dt
 */
export function rk4Step(
  f: DerivativeFunction,
  t: number,
  state: number[],
  dt: number
): number[] {
  // k1: slope at the beginning of the interval
  const k1 = f(t, state);

  // k2: slope at the midpoint, using k1 to estimate state there
  const mid1 = state.map((y, i) => y + (dt / 2) * k1[i]);
  const k2 = f(t + dt / 2, mid1);

  // k3: slope at the midpoint again, but using k2's better estimate
  const mid2 = state.map((y, i) => y + (dt / 2) * k2[i]);
  const k3 = f(t + dt / 2, mid2);

  // k4: slope at the end of the interval, using k3 to project forward
  const end = state.map((y, i) => y + dt * k3[i]);
  const k4 = f(t + dt, end);

  // Weighted average: (k1 + 2*k2 + 2*k3 + k4) / 6
  const newState = state.map((y, i) =>
    y + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])
  );

  return newState;
}

/**
 * Run a complete simulation from t=0 to t=totalTime
 *
 * Integrates the system of ODEs using RK4, recording the state
 * at each time step. This produces the full time-series data
 * that gets plotted as concentration curves.
 *
 * @param f          - Derivative function defining the ODE system
 * @param initial    - Initial state vector [X0, S0, P0]
 * @param totalTime  - Total simulation duration (hours)
 * @param dt         - Time step for integration (hours)
 * @returns SimulationResult with time array and state history
 */
export function integrate(
  f: DerivativeFunction,
  initial: number[],
  totalTime: number,
  dt: number
): SimulationResult {
  const time: number[] = [0];
  const states: number[][] = [initial.slice()]; // slice() to copy

  let currentState = initial.slice();
  let t = 0;
  const numSteps = Math.ceil(totalTime / dt);

  for (let step = 0; step < numSteps; step++) {
    // Advance one RK4 step
    currentState = rk4Step(f, t, currentState, dt);
    t += dt;

    // Enforce physical constraints:
    // Concentrations cannot go negative (numerical artifact prevention)
    currentState = currentState.map(val => Math.max(val, 0));

    // Record every Nth step to keep output manageable
    // (at dt=0.05h over 48h, that's 960 raw steps — we keep ~200 points)
    const recordInterval = Math.max(1, Math.floor(0.25 / dt));
    if (step % recordInterval === 0 || step === numSteps - 1) {
      time.push(Number(t.toFixed(4)));
      states.push(currentState.slice());
    }
  }

  return { time, states };
}
