import React from "react";
interface SliderPickerProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange?: (value: number) => void;
}
const SlidePicker = ({ value, min, max, step, onValueChange }: SliderPickerProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (onValueChange) onValueChange(parseFloat(value));
  };

  return (
    <div>
      <label
        htmlFor="minmax-range"
        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
      >
        Min-max range
      </label>
      <input
        id="minmax-range"
        type="range"
        min={min}
        max={max}
        value={value}
        step={step}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        onChange={handleChange}
      />
    </div>
  );
};

export default SlidePicker;
