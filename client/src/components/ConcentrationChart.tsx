/**
 * ConcentrationChart — Plots simulation data as glowing curves
 *
 * Styled like an oscilloscope/phosphor display:
 *   - Dark background with faint grid lines
 *   - Glowing neon-colored curves
 *   - Monospace axis labels
 *
 * Uses Recharts for the actual charting, with heavy custom styling
 * to achieve the vintage instrument look.
 */

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { SimulationOutput } from '../types/simulation';

interface ConcentrationChartProps {
  data: SimulationOutput;
  title: string;
  /** Which curves to show */
  curves: Array<{
    key: 'biomass' | 'substrate' | 'product' | 'growthRate';
    label: string;
    color: string;
    unit: string;
  }>;
}

export const ConcentrationChart: React.FC<ConcentrationChartProps> = ({
  data,
  title,
  curves,
}) => {
  // Transform data into Recharts format: [{time, biomass, substrate, ...}, ...]
  const chartData = useMemo(() => {
    return data.time.map((t, i) => ({
      time: Number(t.toFixed(2)),
      biomass: Number(data.biomass[i].toFixed(3)),
      substrate: Number(data.substrate[i].toFixed(3)),
      product: Number(data.product[i].toFixed(3)),
      growthRate: Number(data.growthRate[i].toFixed(4)),
    }));
  }, [data]);

  // Custom tooltip styled for the instrument theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div style={{
        background: '#1a1a1e',
        border: '1px solid #3a3a42',
        borderRadius: '4px',
        padding: '8px 12px',
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: '11px',
      }}>
        <div style={{ color: '#9a9688', marginBottom: '4px' }}>
          t = {label} h
        </div>
        {payload.map((entry: any) => (
          <div key={entry.name} style={{ color: entry.color, padding: '1px 0' }}>
            {entry.name}: {entry.value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="chart-panel">
      <div className="chart-title">{title}</div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1a2e1a"
            strokeOpacity={0.6}
          />
          <XAxis
            dataKey="time"
            stroke="#605e56"
            type="number"
            domain={[0, data.time[data.time.length - 1]]}
            tickCount={9}
            allowDecimals={false}
            tickFormatter={(val: number) => {
              const maxT = data.time[data.time.length - 1];
              if (maxT > 168) return `${Math.round(val / 24)}d`;
              return Math.round(val).toString();
            }}
            tick={{ fill: '#7a7668', fontSize: 10, fontFamily: '"IBM Plex Mono", monospace' }}
            label={{
              value: data.time[data.time.length - 1] > 168 ? 'Time (days)' : 'Time (hours)',
              position: 'insideBottom',
              offset: -2,
              style: { fill: '#605e56', fontSize: 10, fontFamily: '"IBM Plex Mono", monospace' },
            }}
          />
          <YAxis
            stroke="#605e56"
            tick={{ fill: '#7a7668', fontSize: 10, fontFamily: '"IBM Plex Mono", monospace' }}
            domain={curves.some(c => c.key === 'substrate') ? ['auto', 'auto'] : ['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '10px',
              color: '#9a9688',
            }}
          />
          {curves.map(curve => (
            <Line
              key={curve.key}
              type="monotone"
              dataKey={curve.key}
              name={`${curve.label} (${curve.unit})`}
              stroke={curve.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              style={{
                filter: `drop-shadow(0 0 4px ${curve.color}40)`,
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
