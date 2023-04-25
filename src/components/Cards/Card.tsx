import React, { ReactNode } from 'react';
import tw from 'twin.macro';

// Card component prop types
type CardProps = {
  header: ReactNode;
  children: ReactNode;
};

// Updated styles using tw macro
const CardContent = tw.div`flex min-w-0 break-words relative w-full mb-6 flex-col shadow-lg rounded-lg border-0 bg-white`;
const CardBody = tw.div`flex-auto px-4 lg:px-10 py-10 pt-0`;
const CardHeaderTitle = tw.div`text-center flex justify-between`;
const CardHeader = tw.div`rounded-t mb-0 px-6 py-6 bg-gray-100`;

// Card component
export const Card = ({ header, children }: CardProps) => {
  return (
    <CardContent>
      <CardHeader>
        <CardHeaderTitle>{header}</CardHeaderTitle>
      </CardHeader>
      <CardBody>{children}</CardBody>
    </CardContent>
  );
};
