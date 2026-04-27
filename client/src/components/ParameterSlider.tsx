/**
 * ParameterSlider — A single adjustable parameter control
 *
 * Styled to evoke vintage lab instrument knobs:
 *   - Brass-toned thumb
 *   - Monospace value readout
 *   - Unit label and tooltip
 *
 * Dorcas defined the parameter ranges; Elvis styled the controls.
 */

import React from 'react';

interface ParameterSliderProps {
  name: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  tooltip?: string;
  onChange: (name: string, value: number) => void;
}

export const ParameterSlider: React.FC<ParameterSliderProps> = ({
  name,
  label,
  value,
  min,
  max,
  step,
  unit,
  tooltip,
  onChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(name, parseFloat(e.target.value));
  };

  // Format the display value appropriately
  const displayValue = step < 1
    ? value.toFixed(step < 0.1 ? 2 : 1)
    : value.toString();

  return (
    <div className="param-row">
      <div className="param-label">
        <span className="param-name">
          {label}
          {tooltip && (
            <span className="tooltip-trigger" title={tooltip}>?</span>
          )}
        </span>
        <span className="param-value-display">
          {displayValue}
          <span className="param-unit">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        className="param-slider"
        name={name}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};
