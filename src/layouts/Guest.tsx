import React from 'react';
import { Outlet } from 'react-router';
import NavBar from '../components/Navbars/NavBar';

const GuestLayout: React.FC = () => {
  return (
    <>
      <NavBar />

      <div className="p-4">
        <Outlet />
      </div>
    </>
  );
};

export default GuestLayout;
