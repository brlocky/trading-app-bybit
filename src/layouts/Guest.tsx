import React from "react";
import reactImage from "../assets/img/react.jpg";
import profileImage from "../assets/img/profile.jpg";
import { Outlet } from "react-router";

const GuestLayout: React.FC = () => {
  return (
    <>
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start">
              <img src={reactImage} className="h-8 mr-3" alt="Trade App" />
              <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white">
                Trade App
              </span>
            </div>
            <div className="flex items-center">
              <div className="flex items-center ml-3">
                <div>
                  <img
                    className="w-8 h-8 rounded-full"
                    src={profileImage}
                    alt="User"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <aside
        id="logo-sidebar"
        className="fixed top-0 left-0 z-40 w-64 h-screen pt-20 bg-white border-r border-gray-200 transition-transform -translate-x-full sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700"
        aria-label="Sidebar"
      >
        <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
          <ul className="font-medium space-y-2">
            <li>
              <a
                href="/positions"
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <i className="fa-solid fa-house"></i>
                <span className="ml-3">Positions</span>
              </a>
            </li>
            <li>
              <a
                href="/settings"
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <i className="fa-solid fa-gear"></i>
                <span className="flex-1 ml-3 whitespace-nowrap">Settings</span>
              </a>
            </li>
          </ul>
        </div>
      </aside>

      <div className="p-4 sm:ml-64">
        <div className="p-4 mt-14">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default GuestLayout;
