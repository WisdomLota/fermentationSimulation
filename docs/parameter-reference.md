# Kinetic Parameters Reference

## Saccharomyces cerevisiae — Glucose-to-Ethanol Fermentation

### Why These Parameters Matter

Every simulation is only as good as its parameters. This document records
where each value comes from and what it physically represents, so any
team member can justify the choices during the project defense.

---

## Monod Model Parameters

### μ_max — Maximum Specific Growth Rate

| Value Used | 0.45 h⁻¹ |
|---|---|
| Typical Range | 0.3 – 0.5 h⁻¹ |
| Physical Meaning | The fastest the yeast can possibly grow when substrate is unlimited |
| Analogy | The "speed limit" of cell division under perfect conditions |
| Source | Sonnleitner & Käppeli (1986) — reported 0.35–0.48 h⁻¹ for S. cerevisiae |

**How to explain at defense:** "μ_max is the theoretical maximum doubling speed. At 0.45 h⁻¹,
the population doubles roughly every 1.5 hours when glucose is abundant. In practice, the
actual growth rate μ is always lower because the Monod equation reduces it based on how
much substrate remains."

### K_s — Half-Saturation (Monod) Constant

| Value Used | 1.5 g/L |
|---|---|
| Typical Range | 0.5 – 5.0 g/L |
| Physical Meaning | The substrate concentration where growth rate is exactly half of μ_max |
| Analogy | Like Km in enzyme kinetics — measures "substrate affinity" |
| Source | Wang et al. (2004) — reported 0.8–3.0 g/L across yeast strains |

**How to explain at defense:** "K_s tells us how 'hungry' the organism is. A low K_s (like 1.5 g/L)
means the yeast is very efficient — it can grow near maximum speed even at low glucose.
A high K_s would mean it needs much more glucose to reach the same growth rate."

---

## Luedeking-Piret Parameters

### α — Growth-Associated Constant

| Value Used | 2.2 g_P/g_X |
|---|---|
| Typical Range | 1.5 – 4.0 g_P/g_X |
| Physical Meaning | Grams of ethanol produced per gram of new biomass during growth |
| Source | Garnier & Gaillet (2015) |

**How to explain at defense:** "α connects growth to ethanol production. The higher α is,
the more ethanol is produced per unit of yeast growth. For S. cerevisiae, ethanol is primarily
a growth-associated product — it's a byproduct of the anaerobic glycolysis pathway."

### β — Non-Growth-Associated Constant

| Value Used | 0.1 g_P/(g_X·h) |
|---|---|
| Typical Range | 0.05 – 0.2 g_P/(g_X·h) |
| Physical Meaning | Ethanol produced per gram of biomass per hour, even when not growing |
| Source | Garnier & Gaillet (2015) |

**How to explain at defense:** "β represents maintenance metabolism. Even when yeast cells
stop dividing (stationary phase), they still need energy to survive, and that energy comes
from fermenting glucose. The β term is why we see a slow continued rise in ethanol
concentration even after growth stops."

---

## Yield Coefficients

### Y_xs — Biomass Yield on Substrate

| Value Used | 0.12 g_X/g_S |
|---|---|
| Typical Range | 0.08 – 0.15 g_X/g_S |
| Physical Meaning | Grams of yeast produced per gram of glucose consumed |

**Defense note:** "Only about 12% of the glucose goes to building cells. The rest goes to
ethanol and CO₂. This is actually desirable — we WANT the yeast to make ethanol,
not more yeast."

### Y_ps — Product Yield on Substrate

| Value Used | 0.46 g_P/g_S |
|---|---|
| Theoretical Maximum | 0.511 g_P/g_S (from stoichiometry: C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂) |
| Efficiency | ~90% of theoretical maximum |

**Defense note:** "The theoretical limit from chemistry is 0.511 g ethanol per g glucose.
Our yield of 0.46 means we achieve about 90% efficiency, which is typical for well-optimized
S. cerevisiae fermentation. The remaining 10% goes to byproducts (glycerol, organic acids)
and cell maintenance."

---

## Bioreactor Operating Conditions

| Parameter | Value | Justification |
|---|---|---|
| Temperature | 32.5°C | Center of optimal 30-35°C range |
| pH | 4.8 | Center of optimal 4.5-5.0 range |
| Initial glucose (S₀) | 150 g/L | High-gravity fermentation |
| Initial biomass (X₀) | 0.5 g/L | Standard lab inoculum (~10⁶ cells/mL) |
| Simulation time | 48 hours | Typical batch duration to completion |

---

## References

1. Sonnleitner, B. & Käppeli, O. (1986). Growth kinetics of *Saccharomyces cerevisiae*.
   *Biotechnology and Bioengineering*, 28(1), 102-110.

2. Wang, D. et al. (2004). Fermentation Kinetics of Different Sugars by Apple Wine Yeasts.
   *Journal of the Institute of Brewing*, 110(4), 340-346.

3. Garnier, A. & Gaillet, B. (2015). Analytical solution of Luedeking-Piret equation.
   *Biotechnology and Bioengineering*, 112(12), 2468-2474.

4. Peleg, M. & Corradini, M. G. (2011). Microbial growth curves.
   *Critical Reviews in Food Science and Nutrition*, 51(10), 917-945.
