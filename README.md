# Fermentation Simulation Software

> Virtual Bioreactor for Bioethanol Production

A web-based simulation tool for modeling bioethanol fermentation using *Saccharomyces cerevisiae*. This software allows researchers and engineers to simulate fermentation processes in **Batch**, **Fed-Batch**, and **Continuous** bioreactor modes — without the cost of physical experimentation.

## Overview

The simulator implements established kinetic models:

- **Monod Equation** for substrate-limited microbial growth
- **Luedeking–Piret Model** for product (ethanol) formation
- **Mass Balance Equations** for substrate consumption, biomass growth, and product accumulation

## Tech Stack

| Layer         | Technology             |
|---------------|------------------------|
| Frontend      | React.js + TypeScript  |
| Styling       | Tailwind CSS           |
| Visualization | Recharts               |
| Math Engine   | Custom ODE Solver (RK4)|
| Backend       | Node.js + Express      |

## Project Structure

```
fermentation-sim/
├── src/
│   ├── models/         # Kinetic models (Monod, Luedeking-Piret)
│   ├── simulation/     # Reactor simulations (Batch, Fed-batch, Continuous)
│   ├── utils/          # Math utilities, ODE solver (RK4)
│   ├── __tests__/      # Unit & integration tests
│   └── demo.ts         # CLI demo runner
├── docs/               # Research notes, parameter references
└── README.md
```

## Getting Started

```bash
npm install
npm test          # Run all tests
npm run demo      # Run batch simulation demo in terminal
```

## Team

| Member                    | Program               | Focus Area                    |
|---------------------------|-----------------------|-------------------------------|
| Alice Mpanga Ilunga       | Bioengineering        | Growth kinetics, Lit. review  |
| Ahmed Hemed               | Bioengineering        | Reactor equations, Mass balance|
| Dorcas Bin Ali Selemani   | Bioengineering        | I/O specs, Testing            |
| Elvis Joseph Mtandika     | Software Engineering  | Frontend, UI/UX               |
| Wisdom L. Ngaloru         | Computer Engineering  | Sim engine, Backend, Graphs   |

**Supervisor:** Asst. Prof. Dr. Nihal Bayır — Cyprus International University

## License

Academic project — ENGI 401/402 Capstone, Fall 2025–26
