import { ChevronDownIcon } from '@heroicons/react/24/solid';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import tw from 'twin.macro';
import { useApi } from '../../providers';
import { AppDispatch } from '../../store';
import { loadSymbol } from '../../store/actions';
import { selectInterval, selectSymbol } from '../../store/slices/uiSlice';

const intervals = [
  { label: '1m', value: '1' },
  { label: '3m', value: '3' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  // { label: '30 min', value: '30' },
  { label: '1h', value: '60' },
  // { label: '2h', value: '120' },
  { label: '4h', value: '240' },
  // { label: '6h', value: '360' },
  // { label: '12h', value: '720' },
  { label: '1D', value: 'D' },
  { label: '1W', value: 'W' },
  { label: '1M', value: 'M' },
];

export const IntervalSelector: React.FunctionComponent = () => {
  const apiClient = useApi();
  const symbol = useSelector(selectSymbol);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectedInterval = useSelector(selectInterval);
  const dispatch = useDispatch<AppDispatch>();
  const setInterval = (interval: string) => {
    if (symbol && interval !== selectedInterval) {
      dispatch(loadSymbol(apiClient, symbol, interval));
    }

    setIsDropdownOpen(false);
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
    <div className="relative z-20 flex flex-row justify-center gap-x-2 self-center">
      <IntervalAction type="button" onClick={toggleDropdown}>
        <IntervalText> {selectedInterval ? intervals.find((i) => i.value === selectedInterval)?.label || '' : '-'}</IntervalText>

        <ChevronDownIcon className="ml-1 h-5 w-5" />
      </IntervalAction>
      {isDropdownOpen && (
        <IntervalCol ref={dropdownRef}>
          {intervals.map((t, index) => (
            <IntervalLine onClick={() => setInterval(t.value)} to={`/${symbol}/${t.value}`} key={index}>
              {t.label}
            </IntervalLine>
          ))}
        </IntervalCol>
      )}
    </div>
  );
};

const IntervalCol = tw.div`
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

const IntervalLine = tw(Link)`
block px-2 py-2 text-sm text-gray-700 hover:bg-gray-100
`;

const IntervalAction = tw.button`
flex items-center rounded-md bg-gray-200 px-2 py-2 text-gray-700 hover:bg-gray-300 focus:bg-gray-300 focus:outline-none`;

const IntervalText = tw.div`
truncate
w-8
text-left
sm:w-10
`;
