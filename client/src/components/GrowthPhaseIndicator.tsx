/**
 * GrowthPhaseIndicator — Shows the current fermentation phase
 *
 * Analyzes the simulation output to identify which growth phase
 * the fermentation is in at any given time:
 *
 *   1. Lag Phase:         Low growth rate, cells adapting
 *   2. Exponential Phase: Maximum growth rate, rapid biomass increase
 *   3. Deceleration:      Growth slowing as substrate depletes
 *   4. Stationary Phase:  Near-zero growth, substrate exhausted
 *
 * Displayed as a horizontal bar with color-coded segments.
 */

import React, { useMemo } from 'react';
import type { SimulationOutput } from '../types/simulation';

interface GrowthPhaseIndicatorProps {
  data: SimulationOutput;
  muMax: number;
}

interface Phase {
  name: string;
  startTime: number;
  endTime: number;
  color: string;
}

export const GrowthPhaseIndicator: React.FC<GrowthPhaseIndicatorProps> = ({ data, muMax }) => {
  const phases = useMemo((): Phase[] => {
    const totalTime = data.time[data.time.length - 1];
    const result: Phase[] = [];

    // Find phase transitions by analyzing growth rate
    let lagEnd = 0;
    let exponentialEnd = 0;
    let decelerationEnd = 0;

    for (let i = 1; i < data.growthRate.length; i++) {
      const mu = data.growthRate[i];
      const t = data.time[i];

      // Lag phase ends when growth rate exceeds 50% of muMax
      if (lagEnd === 0 && mu > muMax * 0.5) {
        lagEnd = t;
      }

      // Exponential phase ends when growth rate drops below 80% of muMax
      if (lagEnd > 0 && exponentialEnd === 0 && mu < muMax * 0.8 && t > lagEnd) {
        exponentialEnd = t;
      }

      // Deceleration ends when growth rate drops below 10% of muMax
      if (exponentialEnd > 0 && decelerationEnd === 0 && mu < muMax * 0.1) {
        decelerationEnd = t;
      }
    }

    // Detect death/decline phase: biomass actively decreasing
    let declineStart = 0;
    if (decelerationEnd > 0) {
      const startIdx = data.time.findIndex(t => t >= decelerationEnd);
      if (startIdx > 0) {
        for (let j = startIdx; j < data.biomass.length - 1; j++) {
          if (data.biomass[j + 1] < data.biomass[j] * 0.998) {
            declineStart = data.time[j];
            break;
          }
        }
      }
    }

    // Defaults if thresholds weren't crossed
    if (lagEnd === 0) lagEnd = totalTime * 0.05;
    if (exponentialEnd === 0) exponentialEnd = totalTime * 0.6;
    if (decelerationEnd === 0) decelerationEnd = totalTime * 0.85;

    result.push({ name: 'Lag', startTime: 0, endTime: lagEnd, color: '#605e56' });
    result.push({ name: 'Exponential', startTime: lagEnd, endTime: exponentialEnd, color: '#39ff7e' });
    result.push({ name: 'Deceleration', startTime: exponentialEnd, endTime: decelerationEnd, color: '#ffbf47' });

    if (declineStart > 0) {
      result.push({ name: 'Stationary', startTime: decelerationEnd, endTime: declineStart, color: '#47b4ff' });
      result.push({ name: 'Death', startTime: declineStart, endTime: totalTime, color: '#ff6b6b' });
    } else {
      result.push({ name: 'Stationary', startTime: decelerationEnd, endTime: totalTime, color: '#47b4ff' });
    }

    return result;
  }, [data, muMax]);

  const totalTime = data.time[data.time.length - 1];

  return (
    <div className="panel-section" style={{ padding: '12px' }}>
      <div className="section-header">Growth phases</div>
      <div style={{
        display: 'flex',
        height: '20px',
        borderRadius: '3px',
        overflow: 'hidden',
        gap: '1px',
      }}>
        {phases.map(phase => {
          const widthPct = ((phase.endTime - phase.startTime) / totalTime) * 100;
          return (
            <div
              key={phase.name}
              title={`${phase.name}: ${phase.startTime.toFixed(1)}h – ${phase.endTime.toFixed(1)}h`}
              style={{
                width: `${widthPct}%`,
                background: phase.color + '25',
                borderBottom: `3px solid ${phase.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                color: phase.color,
                letterSpacing: '0.5px',
                minWidth: widthPct > 10 ? 'auto' : '0',
                overflow: 'hidden',
              }}
            >
              {widthPct > 15 ? phase.name : ''}
            </div>
          );
        })}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '6px',
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        color: 'var(--text-muted)',
      }}>
        <span>0 h</span>
        <span>{totalTime.toFixed(0)} h</span>
      </div>
    </div>
  );
};
