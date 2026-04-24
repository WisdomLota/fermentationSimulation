/**
 * Tests for the RK4 ODE Solver
 *
 * We test the solver against problems with KNOWN analytical solutions.
 * This way we can verify our numerical method is working correctly
 * before trusting it with the fermentation equations (which have
 * no closed-form solution).
 *
 * Key concept for defense: "We validated the solver by comparing
 * its output to exact mathematical solutions where they exist."
 */

import { rk4Step, integrate } from '../utils/ode-solver';
import { describe, test, expect } from '@jest/globals';

describe('RK4 Single Step — rk4Step()', () => {

  test('should solve dy/dt = 1 exactly (constant rate)', () => {
    // dy/dt = 1 → y(t) = t + y0
    // Starting at y=0, after dt=0.1: y should be 0.1
    const f = (_t: number, _state: number[]) => [1];
    const result = rk4Step(f, 0, [0], 0.1);
    expect(result[0]).toBeCloseTo(0.1, 10);
  });

  test('should solve dy/dt = y accurately (exponential growth)', () => {
    // dy/dt = y → y(t) = y0 * e^t
    // Starting at y=1, after dt=0.1: y = e^0.1 ≈ 1.10517
    const f = (_t: number, state: number[]) => [state[0]];
    const result = rk4Step(f, 0, [1], 0.1);
    expect(result[0]).toBeCloseTo(Math.exp(0.1), 8);
  });

  test('should handle systems of 2 equations', () => {
    // dx/dt = -y, dy/dt = x → circular motion
    // x(t) = cos(t), y(t) = sin(t) starting from (1, 0)
    const f = (_t: number, state: number[]) => [-state[1], state[0]];
    const dt = 0.01;
    const result = rk4Step(f, 0, [1, 0], dt);
    expect(result[0]).toBeCloseTo(Math.cos(dt), 6);
    expect(result[1]).toBeCloseTo(Math.sin(dt), 6);
  });
});

describe('RK4 Full Integration — integrate()', () => {

  test('should solve exponential growth over extended time', () => {
    // dy/dt = 0.5 * y → y(t) = y0 * e^(0.5t)
    // After t=2: y = 1 * e^1 ≈ 2.71828
    const f = (_t: number, state: number[]) => [0.5 * state[0]];
    const result = integrate(f, [1], 2, 0.01);

    const finalState = result.states[result.states.length - 1];
    const finalTime = result.time[result.time.length - 1];

    expect(finalTime).toBeCloseTo(2, 1);
    expect(finalState[0]).toBeCloseTo(Math.exp(1), 2);
  });

  test('should solve exponential decay accurately', () => {
    // dy/dt = -0.3 * y → y(t) = y0 * e^(-0.3t)
    // After t=5: y = 10 * e^(-1.5) ≈ 2.2313
    const f = (_t: number, state: number[]) => [-0.3 * state[0]];
    const result = integrate(f, [10], 5, 0.05);

    const finalState = result.states[result.states.length - 1];
    expect(finalState[0]).toBeCloseTo(10 * Math.exp(-1.5), 1);
  });

  test('should enforce non-negative constraint', () => {
    // Rapidly decaying function that would go negative without the guard
    const f = (_t: number, state: number[]) => [-100 * state[0]];
    const result = integrate(f, [1], 1, 0.05);

    // All values should remain >= 0
    for (const state of result.states) {
      expect(state[0]).toBeGreaterThanOrEqual(0);
    }
  });

  test('should handle coupled system (predator-prey style)', () => {
    // Simple coupled system: dx/dt = x, dy/dt = -y
    // x(t) = x0*e^t, y(t) = y0*e^(-t)
    const f = (_t: number, state: number[]) => [state[0], -state[1]];
    const result = integrate(f, [1, 1], 1, 0.01);

    const finalState = result.states[result.states.length - 1];
    expect(finalState[0]).toBeCloseTo(Math.exp(1), 1);  // x grows
    expect(finalState[1]).toBeCloseTo(Math.exp(-1), 1);  // y decays
  });

  test('should return correct time array length matching states', () => {
    const f = (_t: number, state: number[]) => [state[0]];
    const result = integrate(f, [1], 10, 0.05);

    expect(result.time.length).toBe(result.states.length);
    expect(result.time[0]).toBe(0);
    expect(result.time[result.time.length - 1]).toBeCloseTo(10, 0);
  });

  test('RK4 should be more accurate than Euler for same step size', () => {
    // Compare to what Euler would give for dy/dt = y, y0=1, t=1
    // Euler with dt=0.1 over 10 steps: (1.1)^10 ≈ 2.5937
    // Exact: e^1 ≈ 2.71828
    // RK4 should be much closer to exact
    const f = (_t: number, state: number[]) => [state[0]];
    const result = integrate(f, [1], 1, 0.1);

    const rk4Final = result.states[result.states.length - 1][0];
    const eulerFinal = Math.pow(1.1, 10); // 2.5937...
    const exact = Math.exp(1); // 2.71828...

    const rk4Error = Math.abs(rk4Final - exact);
    const eulerError = Math.abs(eulerFinal - exact);

    // RK4 error should be MUCH smaller than Euler error
    expect(rk4Error).toBeLessThan(eulerError / 100);
  });
});
