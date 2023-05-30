import React, { HtmlHTMLAttributes, useEffect, useState } from 'react';
import tw from 'twin.macro';

const StyledInputWrapper = tw.div`flex h-10 bg-white text-black`;
const StyledButton = tw.button`w-8 h-full cursor-pointer bg-gray-200`;
const StyledNumericInputValue = tw.input`text-center w-10`;

interface Props extends Omit<HtmlHTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: number;
  name?: string;
  onChange?: (value: number) => void;
}

export const NumericInput: React.FC<Props> = ({
  value = 0,
  onChange,
  ...restProps
}: Props) => {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleDecrement = () => {
    if (inputValue - 1 >= 0) {
      const newValue = inputValue - 1;
      setInputValue(newValue);
      onChange && onChange(newValue);
    }
  };

  const handleIncrement = () => {
    const newValue = inputValue + 1;
    setInputValue(newValue);
    onChange && onChange(newValue);
  };

  return (
    <StyledInputWrapper {...restProps}>
      <StyledButton onClick={handleDecrement}>
        <span>−</span>
      </StyledButton>
      <StyledNumericInputValue value={inputValue}/>
      <StyledButton onClick={handleIncrement}>
        <span>+</span>
      </StyledButton>
    </StyledInputWrapper>
  );
};
