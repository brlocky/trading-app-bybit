import React from 'react';

interface IInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  defaultValue?: string;
  name?: string;
  type: 'text' | 'password' | 'number' | 'email';
}

export const Input: React.FC<IInputProps> = ({
  label,
  name,
  ...rest
}) => {
  return (
    <div className="relative w-full mb-3">
      <label
        className="block mb-2 text-xs font-bold uppercase text-blueGray-600"
        htmlFor={name}
      >
        {label}
      </label>
      <input
        className="w-full px-3 py-3 text-sm transition-all duration-150 ease-linear bg-white border-0 rounded shadow placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
        name={name}
        {...rest}
      />
    </div>
  );
};
