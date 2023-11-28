import React from 'react';

interface CheckboxProps {
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
}

export const CheckboxInput: React.FC<CheckboxProps> = ({ isChecked, onChange }) => {
  const handleCheckboxChange = () => {
    // Call the provided onChange callback with the opposite of the current state
    if (onChange) {
      onChange(!isChecked);
    }
  };

  return <input type="checkbox" checked={isChecked} onChange={handleCheckboxChange} />;
};
