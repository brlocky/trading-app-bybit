import React from 'react';

const Table: React.FC<React.PropsWithChildren> = ({ children }) => (
  <table className={'w-full text-xs text-gray-400 overflow-x-scroll'}>{children}</table>
);

const HeaderRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, ...props }) => (
  <thead>
    <tr className="bg-gray-700 text-xs uppercase text-gray-400" {...props}>
      {children}
    </tr>
  </thead>
);
const HeaderCol: React.FC<React.HTMLAttributes<HTMLTableCellElement>> = ({ children, ...props }) => (
  <td className="px-2 py-2" {...props}>
    {children}
  </td>
);

const Row: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, ...props }) => (
  <tr className="border-b border-gray-700 bg-gray-800" {...props}>
    {children}
  </tr>
);

const Col: React.FC<React.HTMLProps<HTMLTableCellElement>> = ({ children, ...props }) => (
  <td className="px-2 py-2" {...props}>
    {children}
  </td>
);

export { Table, HeaderRow, HeaderCol, Row, Col };
