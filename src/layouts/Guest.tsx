import React from 'react';
import { Outlet } from 'react-router';
import NavBar from '../components/Navbars/NavBar';

const GuestLayout: React.FC = () => {
  return (
    <>
      <NavBar />

      <div className="p-4 sm:ml-64">
        <div className="mt-14 p-4">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default GuestLayout;
