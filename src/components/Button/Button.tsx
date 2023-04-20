import React from "react";

type ButtonProps = {
  onClick?: () => void;
  children: React.ReactNode;
};

const Button = ({ onClick, children }: ButtonProps) => {
  return (
    <button
      className="px-4 py-2 font-bold text-gray-800 bg-gray-300 rounded-l hover:bg-gray-400"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
