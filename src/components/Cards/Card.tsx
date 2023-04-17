import React, { ReactNode } from "react";
import tw from "twin.macro";
import { CardBody, CardContent, CardHeader, CardHeaderTitle } from "./styles";

// Card component prop types
type CardProps = {
  header: ReactNode;
  children: ReactNode;
};


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
