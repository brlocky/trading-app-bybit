import React from 'react';
import reactImage from '../assets/img/react.jpg';
import profileImage from '../assets/img/profile.jpg';
import { Outlet, useNavigate } from 'react-router';
import Button from '../components/Button/Button';
import NavBar from '../components/Navbars/NavBar';

const GuestLayout: React.FC = () => {

  const navigate = useNavigate();

  return (
    <>
    <NavBar />
     


      <div className="p-4 sm:ml-64">
        <div className="p-4 mt-14">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default GuestLayout;
