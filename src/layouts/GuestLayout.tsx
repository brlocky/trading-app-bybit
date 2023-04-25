import React from 'react';
import { Outlet } from 'react-router';
import NavBar from '../components/Navbars/NavBar';
import tw from 'twin.macro';

const PageComponent = tw.div`
flex
flex-col
mx-auto
max-w-screen-2xl
min-h-screen
m-0
p-0
`;

const PageContentComponent = tw.div`
flex 
grow
pt-0
m-0
`;

const GuestLayout: React.FC = () => {
  return (
    <>
      <PageComponent>
        <NavBar />
        <PageContentComponent>
          <Outlet />
        </PageContentComponent>
      </PageComponent>
    </>
  );
};

export default GuestLayout;
