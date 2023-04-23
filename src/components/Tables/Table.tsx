import React from 'react';
import tw from 'twin.macro';

export interface TableProps {
  headers: string[];
  data: string[][];
}

const TableWrapper = tw.table`
  min-w-full
  divide-y
  divide-gray-200
  bg-white
  shadow
  sm:rounded-lg
`;

const TableHead = tw.thead`
  bg-gray-50
`;

const TableRow = tw.tr`
  hover:bg-gray-100
`;

const TableHeader = tw.th`
  px-6
  py-3
  text-xs
  font-medium
  tracking-wider
  text-left
  text-gray-500
  uppercase
`;

const TableBody = tw.tbody`
  divide-y
  divide-gray-200
`;

const TableCell = tw.td`
  px-6
  py-4
  text-sm
  text-gray-900
  whitespace-nowrap
`;


export const Table: React.FC<TableProps> = ({ headers, data }) => {
  return (
    <TableWrapper>
      <TableHead>
        <TableRow>
          {headers.map((header) => (
            <TableHeader key={header}>{header}</TableHeader>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {data.length
          ? data.map((row, index) => (
              <TableRow key={index}>
                {row.map((cell, index) => (
                  <TableCell key={index}>{cell}</TableCell>
                ))}
              </TableRow>
            ))
          :
          (<TableRow>
              <TableCell colSpan={headers.length}> - </TableCell>
          </TableRow>)}
      </TableBody>
    </TableWrapper>
  );
};
