import React from 'react';
import { Link } from 'react-router-dom';

export default function NavBar() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <>
      <div className="flex flex-wrap py-2">
        <div className="w-full">
          <nav className="relative flex flex-wrap items-center justify-between rounded bg-blue-400 py-3">
            <div className="w-full mx-auto flex flex-wrap items-center justify-between px-4">
              <div className="relative flex w-full justify-between lg:static lg:block lg:w-auto lg:justify-start">
                <Link
                  to="/"
                  className="flex items-center px-3 py-2 text-xs font-bold uppercase leading-snug text-white hover:opacity-75"
                >
                  <i className="fas fa-globe leading-lg"></i> Trading
                </Link>
                <button
                  className="block cursor-pointer rounded border border-solid border-transparent bg-transparent px-3 py-1 text-xl leading-none text-white outline-none focus:outline-none lg:hidden"
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <i className="fas fa-bars"></i>
                </button>
              </div>
              <div
                className={'flex-grow items-center lg:flex' + (menuOpen ? ' flex' : ' hidden')}
                id="example-navbar-info"
              >
                <ul className="flex list-none flex-col lg:ml-auto lg:flex-row">
                  <li className="nav-item">
                    <Link
                      to="/settings"
                      className="flex items-center px-3 py-2 text-xs font-bold uppercase leading-snug text-white hover:opacity-75"
                    >
                      <i className="fa-solid fa-gear"></i>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
