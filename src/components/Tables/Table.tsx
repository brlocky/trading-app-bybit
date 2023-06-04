import React from 'react';

const Table: React.FC<React.PropsWithChildren> = ({ children }) => (
  <table className={'w-full text-left text-sm text-gray-500 dark:text-gray-400'}>{children}</table>
);

const HeaderRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, ...props }) => (
  <thead>
    <tr className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400" {...props}>
      {children}
    </tr>
  </thead>
);
const HeaderCol: React.FC<React.HTMLAttributes<HTMLTableCellElement>> = ({ children, ...props }) => (
  <td className="px-6 py-3" {...props}>
    {children}
  </td>
);

const Row: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, ...props }) => (
  <tr className="border-b bg-white dark:border-gray-700 dark:bg-gray-800" {...props}>
    {children}
  </tr>
);

const Col: React.FC<React.HTMLProps<HTMLTableCellElement>> = ({ children, ...props }) => (
  <td className="px-6 py-3" {...props}>
    {children}
  </td>
);

export { Table, HeaderRow, HeaderCol, Row, Col };
