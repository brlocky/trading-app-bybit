import React, { useState } from 'react';
import tw from 'twin.macro';

interface IToggle {
  name: string;
  value: string;
  disabled?: boolean;
}

interface Props {
  toggles: IToggle[];
  defaultToggle?: string;
  onChange?: (selectedToggle: string) => void;
}

const ToggleWrapper = tw.div`flex gap-x-2 bg-gray-200 p-2 rounded-md`;
const ToggleLabel = tw.label` px-4 py-2 rounded-md w-full text-center`;

export const ToggleInput: React.FC<Props> = ({ toggles, defaultToggle, onChange }) => {
  const [selectedToggle, setSelectedToggle] = useState(defaultToggle);

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const toggleName = event.target.value;
    setSelectedToggle(toggleName);
    onChange && onChange(toggleName);
  };

  return (
    <ToggleWrapper>
      {toggles.map((toggle) => (
        <ToggleLabel
          key={toggle.name}
          className={`${selectedToggle === toggle.value ? 'bg-blue-500 text-white' : ''} ${toggle.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {toggle.name}
          <input
            type="checkbox"
            name={toggle.name}
            value={toggle.value}
            disabled={toggle.disabled}
            checked={selectedToggle === toggle.value}
            onChange={handleToggleChange}
            aria-label={toggle.name}
            aria-checked={selectedToggle === toggle.value}
            className="hidden"
          />
        </ToggleLabel>
      ))}
    </ToggleWrapper>
  );
};
