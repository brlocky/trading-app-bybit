import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import tw from 'twin.macro';
interface ISliderPickerProps {
  value?: number;
  min: number;
  max: number;
  step: number;
  onValueChanged?: (n: number) => void;
  showValue?: boolean;
  className?: string;
  locked?: boolean;
}

interface LineProps {
  position: number;
}

const Line = styled.div<LineProps>`
  position: absolute;
  height: 100%;
  width: 1px;
  background-color: #000; /* Adjust the color as needed */
  z-index: 1;
  left: ${(props) => props.position}%;
  cursor: pointer;
`;

const MajorLine = styled(Line)<LineProps>`
  width: 1px;
`;

const MinorLine = styled(Line)<LineProps>`
  height: 75%; /* Make minor lines shorter */
`;

const StyledSliderContainer = tw.div`
  relative
  flex
  items-center
  h-10
  m-1  
`;

const StyledSlider = tw.input`
  z-10
  h-2
  w-full
  cursor-pointer
  bg-gray-50
`;

export const SlidePicker = ({ value, min, max, step, onValueChanged, showValue, className, locked = false }: ISliderPickerProps) => {
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

  const handleClickLine = (value: number) => {
    console.log('sliderValue', value);

    setCurrentValue(value);
    onValueChanged && onValueChanged(value);
  };

  const generateLines = (min: number, max: number, step: number) => {
    const lines = [];
    const range = max - min;
    const increment = max / step > 50 ? Math.ceil(range / (step * 30)) : step; // Adjust the denominator to get desired number of results

    for (let i = min; i <= max; i += step * increment) {
      let LineComponent;

      if (i === min || i === max || i % 5 === 0) {
        // Change the condition here to match your requirement
        LineComponent = MajorLine;
      } else {
        LineComponent = MinorLine;
      }

      const normalizedPosition = ((i - min) / range) * 100;
      lines.push(<LineComponent key={i} position={normalizedPosition} onClick={() => handleClickLine(i)} />);
    }

    return lines;
  };

  return (
    <div className={className || ''}>
      {showValue ? <label className="mb-2 block text-sm font-medium text-gray-600">{value}</label> : null}

      <StyledSliderContainer>
        {/* {generateLines(min, max, step)} */}

        {/* Slider input */}
        <StyledSlider disabled={locked} type="range" min={min} max={max} value={currentValue} step={step} onChange={handleChange} />
      </StyledSliderContainer>
    </div>
  );
};
