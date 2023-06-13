import React, { ButtonHTMLAttributes, useEffect, useRef, useState, MouseEvent } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onLongPress?: () => void;
  children: React.ReactNode;
  className?: string;
}

const Button = ({ onLongPress, onClick, children, className, ...restProps }: ButtonProps) => {
  const timeoutRef = useRef<number | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseDown = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsLongPress(true);
      if (onLongPress) {
        onLongPress();
      }
    }, 500); // Adjust the duration to define your long press threshold
  };

  const handleMouseUp = () => {
    setTimeout(() => {
      setIsLongPress(false);
    }, 100);
    clearTimeout(timeoutRef.current!);
  };

  const handleOnClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (isLongPress) {
      return;
    }

    onClick && onClick(e);
  };

  const classes = clsx(
    'rounded bg-gray-300 px-4 py-2 text-xs font-bold text-gray-800 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed',
    className,
  );

  return (
    <button className={classes} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onClick={handleOnClick} {...restProps}>
      {children}
    </button>
  );
};

export default Button;
