import React from 'react';

interface LockerProps {
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
}

export const LockerInput: React.FC<LockerProps> = ({ isChecked, onChange }) => {
  const iconClass = isChecked ? 'fa-lock' : 'fa-unlock';

  const onIconClick = () => {
    if (onChange) {
      onChange(!isChecked);
    }
  };
  return (
    <div>
      <i className={`fas ${iconClass}`} onClick={onIconClick} />
    </div>
  );
};
