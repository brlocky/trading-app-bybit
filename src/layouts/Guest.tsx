import React from 'react';
import { Outlet } from 'react-router';
import NavBar from '../components/Navbars/NavBar';
import tw from 'twin.macro';

const BodyComponent = tw.div`
mx-auto
max-w-screen-2xl
pt-5
pb-5
pl-10
pr-10
flex
flex-col
gap-1
`;

const GuestLayout: React.FC = () => {
  return (
    <>
      <NavBar />

      <BodyComponent>
        <Outlet />
      </BodyComponent>
    </>
  );
};

export default GuestLayout;
