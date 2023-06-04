import React, { useEffect, useState } from 'react';
interface ISliderPickerProps {
  value?: number;
  min: number;
  max: number;
  step: number;
  onValueChanged?: (n: number) => void;
  showValue?: boolean;
  className?: string;
}
const SlidePicker = ({ value, min, max, step, onValueChanged, showValue, className }: ISliderPickerProps) => {
  const [currentValue, setCurrentValue] = useState<number>(value || min);

  useEffect(() => {
    if (value !== undefined) {
      setCurrentValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setCurrentValue(value);
    onValueChanged && onValueChanged(value);
  };

  return (
    <div className={className || ''}>
      {showValue ? <label className="mb-2 block text-sm font-medium text-gray-600">{value}</label> : null}

      <input
        type="range"
        min={min}
        max={max}
        value={currentValue}
        step={step}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-50"
        onChange={handleChange}
      />
    </div>
  );
};

export default SlidePicker;
