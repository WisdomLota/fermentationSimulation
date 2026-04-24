# Numerical Methods: ODE Solver Selection

## Why We Need a Numerical Solver

Our fermentation model consists of three coupled ordinary differential equations:

```
dX/dt = μ(S) · X              — biomass growth
dS/dt = -(1/Yxs) · μ(S) · X  — substrate consumption  
dP/dt = α · μ(S) · X + β · X  — product formation
```

where μ(S) = μ_max · S / (Ks + S) is the Monod equation.

These equations are **nonlinear** (because μ depends on S, which depends on X)
and **coupled** (each equation depends on variables from the others). This means
there is no closed-form analytical solution — we must solve them numerically.

## Method Comparison

### Euler's Method (Forward Euler)

The simplest approach: take the derivative at the current point and use it
to step forward.

```
y(t + dt) = y(t) + dt · f(t, y(t))
```

**Pros:** Simple to implement, fast per step  
**Cons:** Only 1st-order accurate — error per step is O(dt²)  
**Problem for fermentation:** During exponential growth phase, Euler overshoots
significantly because it uses the slope at the beginning of the interval,
which is too small (the curve is accelerating upward).

### Runge-Kutta 4th Order (RK4) — Our Choice

Computes four slope estimates within each interval and combines them:

```
k1 = f(t, y)                          — slope at start
k2 = f(t + dt/2, y + dt/2 · k1)      — slope at midpoint (using k1)
k3 = f(t + dt/2, y + dt/2 · k2)      — slope at midpoint (using k2)
k4 = f(t + dt, y + dt · k3)           — slope at end (using k3)

y(t + dt) = y(t) + (dt/6) · (k1 + 2·k2 + 2·k3 + k4)
```

**Pros:** 4th-order accurate — error per step is O(dt⁵)  
**Cons:** 4 function evaluations per step (vs 1 for Euler)  
**Why it's worth it:** The accuracy improvement is so dramatic that we can use
a larger time step and still get better results than Euler with a tiny step.

### Quantitative Comparison

For dy/dt = y (exponential growth), y(0) = 1, solving to t = 1:

| Method  | Step Size | Result  | Exact (e¹) | Error   |
|---------|-----------|---------|------------|---------|
| Euler   | dt = 0.1  | 2.5937  | 2.71828    | 0.1246  |
| RK4     | dt = 0.1  | 2.71828 | 2.71828    | < 0.0001|

RK4 is roughly **1000× more accurate** at the same step size.

## Implementation Notes

- **Time step (dt = 0.05h):** Chosen to balance accuracy and performance.
  At 0.05h over 48h, that's 960 integration steps — fast enough for
  real-time interaction but small enough for sub-0.1% error.

- **Non-negativity constraint:** After each RK4 step, we clamp all
  concentrations to ≥ 0. This prevents numerical artifacts where very
  small substrate concentrations go slightly negative.

- **Output decimation:** We record every ~5th computed point (every 0.25h)
  to keep the output arrays manageable for plotting. The full resolution
  is used internally for accuracy.

## References

- Press, W.H. et al. (2007). *Numerical Recipes*, 3rd Edition. Ch. 17.
- Butcher, J.C. (2008). *Numerical Methods for ODEs*. Wiley.
