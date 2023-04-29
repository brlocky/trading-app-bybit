import React, { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

const Button = ({ onClick, children, className, ...restProps }: ButtonProps) => {
  const classes = clsx(
    'rounded bg-gray-300 px-4 py-2 text-xs font-bold text-gray-800 hover:bg-gray-400',
    className,
  );

  return (
    <button className={classes} onClick={onClick} {...restProps}>
      {children}
    </button>
  );
};

export default Button;
