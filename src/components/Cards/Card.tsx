import React, { ReactNode } from "react";
import tw from "twin.macro";

// Card component prop types
type CardProps = {
  header: ReactNode;
  children: ReactNode;
};

export const CardContent = tw.div`flex  flex min-w-0 break-words relative w-full mb-6 flex-col shadow-lg rounded-lg bg-blueGray-100 border-0`;
export const CardBody = tw.div`flex-auto px-4 lg:px-10 py-10 pt-0`;
export const CardHeaderTitle = tw.div`text-center flex justify-between`;
export const CardHeader = tw.div`rounded-t bg-white mb-0 px-6 py-6`;

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
