import React from 'react';
interface ISliderPickerProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange?: (value: number) => void;
  showValue?: boolean;
  className?: string;
}
const SlidePicker = ({ value, min, max, step, onValueChange, showValue, className }: ISliderPickerProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (onValueChange) onValueChange(parseFloat(value));
  };

  return (
    <div className={className || ''}>
      {showValue ? (
        <label htmlFor="minmax-range" className="mb-2 block text-sm font-medium text-gray-600">
          {value}
        </label>
      ) : null}

      <input
        id="minmax-range"
        type="range"
        min={min}
        max={max}
        value={value}
        step={step}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
        onChange={handleChange}
      />
    </div>
  );
};

export default SlidePicker;
