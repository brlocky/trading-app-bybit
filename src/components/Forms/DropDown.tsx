import React, { useState } from 'react';
import tw from 'twin.macro';

export interface IDropdownOption {
  label: string;
  value: string;
}

interface IDropdownProps {
  options: IDropdownOption[];
  selectedOption?: IDropdownOption | null;
  onChange?: (option: IDropdownOption) => void;
  label?: string;
}

const DropdownContainer = tw.div`relative`;

const DropdownButton = tw.button`bg-gray-300 py-2 px-4 rounded-md text-gray-800 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2`;

const DropdownMenu = tw.div`absolute top-full left-0 right-0 z-10 bg-white rounded-md shadow-lg`;

const DropdownOptionItem = tw.li`px-4 py-2 hover:bg-gray-100`;

const SelectedOptionLabel = tw.span`truncate`;

const Dropdown: React.FC<IDropdownProps> = ({ options, selectedOption, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionClick = (option: IDropdownOption) => {
    setIsOpen(false);
    if (onChange) {
      onChange(option);
    }
  };

  return (
    <DropdownContainer>
      <DropdownButton onClick={() => setIsOpen(!isOpen)}>
        {selectedOption ? (
          <SelectedOptionLabel>{selectedOption.label}</SelectedOptionLabel>
        ) : (
            label ? label : 'Select an option'
        )}
      </DropdownButton>
      {isOpen && (
        <DropdownMenu>
          <ul>
            {options.map((option) => (
              <DropdownOptionItem key={option.value} onClick={() => handleOptionClick(option)}>
                {option.label}
              </DropdownOptionItem>
            ))}
          </ul>
        </DropdownMenu>
      )}
    </DropdownContainer>
  );
};

export default Dropdown;
