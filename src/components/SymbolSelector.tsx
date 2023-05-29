import React, { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { useApi } from '../providers';
import { TickerLinearInverseV5 } from 'bybit-api';
import { selectSymbol, updateSymbol } from '../slices/symbolSlice';
import { useDispatch, useSelector } from 'react-redux';
import tw from 'twin.macro';

const SymbolCol = tw.div`
absolute left-0 right-0 mt-2 w-40 divide-y divide-gray-200 rounded-md border border-gray-200 bg-white shadow-lg h-80 overflow-scroll z-10
`;

const SymbolLine = tw.a`
flex flex-col px-4 py-2 text-sm text-gray-700 hover:bg-gray-100
`;

const SymbolAction = tw.button`
flex items-center rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 focus:bg-gray-300 focus:outline-none`;

export const SymbolSelector: React.FunctionComponent = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tickers, setTickers] = useState<TickerLinearInverseV5[]>([]);
  const [filterValue, setFilterValue] = useState('');

  const apiClient = useApi();

  useEffect(() => {
    apiClient.getTickers({ category: 'linear' }).then((t) => {
      // const sorted = t.result.list.sort((a, b) => a.symbol.localeCompare(b.symbol));
      // const sorted = t.result.list.sort((a, b) => Number(Number(b.volume24h)/Number(b.lastPrice)) - Number(Number(a.volume24h)/Number(a.lastPrice)));
      const sorted = t.result.list.sort((a, b) => Number((b as TickerLinearInverseV5).price24hPcnt) - Number((a as TickerLinearInverseV5).price24hPcnt));
      setTickers(sorted as TickerLinearInverseV5[]);
    });
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setFilterValue('');
  };

  const selectedSymbol = useSelector(selectSymbol);
  const dispatch = useDispatch();
  const setSymbol = (s: string) => {
    dispatch(updateSymbol(s));
    setIsDropdownOpen(false);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilterValue(value);
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block">
      <SymbolAction type="button" onClick={toggleDropdown}>
        {selectedSymbol ? selectedSymbol : 'Dropdown'}
        <ChevronDownIcon className="ml-1 h-5 w-5" />
      </SymbolAction>
      {isDropdownOpen && (
        <>
          <input
            type="text"
            placeholder="Filter symbols..."
            value={filterValue}
            onChange={handleFilterChange}
            className="border-b-2 border-gray-300 px-4 py-2 focus:outline-none"
            autoFocus={true}
          />
          <SymbolCol ref={dropdownRef}>
            {tickers
              .filter((ticker) => ticker.symbol.toUpperCase().includes(filterValue.toUpperCase()))
              .map((t, index) => (
                <SymbolLine
                  onClick={() => setSymbol(t.symbol)}
                  href="#"
                  key={index}
                  className={selectedSymbol === t.symbol ? 'bg-red-300' : ''}
                >
                  <span>{t.symbol}</span>
                  <span>{(Number(t.price24hPcnt)*100).toFixed(2)}%</span>
                  <span>{(Number(t.volume24h) / 1000000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M</span>
                </SymbolLine>
              ))}
          </SymbolCol>
        </>
      )}
    </div>
  );
};
