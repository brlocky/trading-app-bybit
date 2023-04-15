import React, { ReactNode } from "react";

// Card component prop types
type CardProps = {
  header: ReactNode;
  children: ReactNode;
};

// Card component
export const Card = ({ header, children }: CardProps) => {
  return (
    <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-100 border-0">
      <div className="rounded-t bg-white mb-0 px-6 py-6">
        <div className="text-center flex justify-between">{header}</div>
      </div>
      <div className="flex-auto px-4 lg:px-10 py-10 pt-0">{children}</div>
    </div>
  );
};
