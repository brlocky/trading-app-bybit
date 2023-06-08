import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { TickerLinearInverseV5 } from 'bybit-api';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import tw from 'twin.macro';
import { useApi } from '../../providers';
import { selectSymbol, updateSymbol } from '../../slices/symbolSlice';
import { SmallText } from '../Text';

const SymbolCol = tw.div`
absolute 
left-0 
right-0 
mt-14
w-full 
divide-y 
divide-gray-200 
rounded-md 
border 
border-gray-200 
bg-white 
shadow-lg 
h-80 
overflow-scroll
z-10
`;

const SymbolLine = tw.a`
flex justify-between px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 items-center
`;

const SymbolAction = tw.button`
flex items-center rounded-md bg-gray-200 px-2 py-2 text-gray-700 hover:bg-gray-300 focus:bg-gray-300 focus:outline-none`;

const SymbolText = tw.div`
text-left
w-14
sm:w-20
truncate
`;
export const SymbolSelector: React.FunctionComponent = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tickers, setTickers] = useState<TickerLinearInverseV5[]>([]);
  const [filterValue, setFilterValue] = useState('');

  const apiClient = useApi();

  useEffect(() => {
    loadTicker();
    const intervalId = setInterval(() => {
      loadTicker();
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const loadTicker = () => {
    apiClient.getTickers({ category: 'linear' }).then((t) => {
      const tickers = t.result.list as TickerLinearInverseV5[];
      const sorted = tickers.filter((item) => item.symbol.endsWith('USDT')).sort((a, b) => Number(b.price24hPcnt) - Number(a.price24hPcnt));

      setTickers(sorted);
    });
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setFilterValue('');
  };

  const selectedSymbol = useSelector(selectSymbol);
  const dispatch = useDispatch();
  const setSymbol = (s: string) => {
    if (s !== selectedSymbol) {
      dispatch(updateSymbol(s));
    }

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
    <div className="z-20 flex flex-row justify-center gap-x-2 self-center">
      <div className=" hidden flex-row gap-x-2 lg:flex">
        {tickers.slice(0, 3).map((t, index) => (
          <SymbolLine onClick={() => setSymbol(t.symbol)} href="#" key={index} className="bg-green-50">
            <SmallText>{t.symbol}</SmallText>
          </SymbolLine>
        ))}
      </div>
      <div className="relative flex justify-center">
        <SymbolAction type="button" onClick={toggleDropdown}>
          <SymbolText>{selectedSymbol ? selectedSymbol : 'Dropdown'}</SymbolText>
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
                  <SymbolLine onClick={() => setSymbol(t.symbol)} href="#" key={index}>
                    <SmallText>{t.symbol}</SmallText>
                    <SmallText>{(Number(t.price24hPcnt) * 100).toFixed(2)}%</SmallText>
                    <SmallText>{(Number(t.volume24h) / 1000000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M</SmallText>
                  </SymbolLine>
                ))}
            </SymbolCol>
          </>
        )}
      </div>
    </div>
  );
};
