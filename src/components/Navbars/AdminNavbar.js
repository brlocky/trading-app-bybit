import React from "react";

import UserDropdown from "components/Dropdowns/UserDropdown.js";

export default function Navbar() {
  return (
    <>
      {/* Navbar */}
      <nav className="absolute top-0 left-0 z-10 flex items-center w-full p-4 bg-transparent md:flex-row md:flex-nowrap md:justify-start">
        <div className="flex flex-wrap items-center justify-between w-full px-4 mx-autp md:flex-nowrap md:px-10">
          {/* Brand */}
          <a
            className="hidden text-sm font-semibold text-white uppercase lg:inline-block"
            href="#pablo"
            onClick={(e) => e.preventDefault()}
          >
            Dashboard
          </a>
          {/* Form */}
          <form className="flex-row flex-wrap items-center hidden mr-3 md:flex lg:ml-auto">
            <div className="relative flex flex-wrap items-stretch w-full">
              <span className="absolute z-10 items-center justify-center w-8 h-full py-3 pl-3 text-base font-normal leading-snug text-center bg-transparent rounded text-blueGray-300">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                placeholder="Search here..."
                className="relative w-full px-3 py-3 pl-10 text-sm bg-white border-0 rounded shadow outline-none placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
              />
            </div>
          </form>
          {/* User */}
          <ul className="flex-col items-center hidden list-none md:flex-row md:flex">
            <UserDropdown />
          </ul>
        </div>
      </nav>
      {/* End Navbar */}
    </>
  );
}
