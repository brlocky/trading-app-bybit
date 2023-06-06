import { ChevronDownIcon } from '@heroicons/react/24/solid';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import tw from 'twin.macro';
import { selectInterval, updateInterval } from '../../slices/symbolSlice';

const IntervalCol = tw.div`
absolute 
left-0 
right-0 
mt-14
w-40 
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

const IntervalLine = tw.a`
block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100
`;

const IntervalAction = tw.button`
flex items-center rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 focus:bg-gray-300 focus:outline-none`;
const intervals = [
  { label: '1 min', value: '1' },
  { label: '3 min', value: '3' },
  { label: '5 min', value: '5' },
  { label: '15 min', value: '15' },
  // { label: '30 min', value: '30' },
  { label: '1h', value: '60' },
  // { label: '2h', value: '120' },
  { label: '4h', value: '240' },
  // { label: '6h', value: '360' },
  // { label: '12h', value: '720' },
  { label: '1 day', value: 'D' },
  { label: '1 week', value: 'W' },
  { label: '1 month', value: 'M' },
];

export const IntervalSelector: React.FunctionComponent = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectedInterval = useSelector(selectInterval);
  const dispatch = useDispatch();
  const setInterval = (s: string) => {
    if (s !== selectedInterval) {
      dispatch(updateInterval(s));
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
    <div className="flex p-3 relative z-20">
      <IntervalAction type="button" onClick={toggleDropdown}>
        {selectedInterval ? intervals.find((i) => i.value === selectedInterval)?.label || '' : 'Dropdown'}
        <ChevronDownIcon className="ml-1 h-5 w-5" />
      </IntervalAction>
      {isDropdownOpen && (
        <IntervalCol ref={dropdownRef}>
          {intervals.map((t, index) => (
            <IntervalLine onClick={() => setInterval(t.value)} href="#" key={index}>
              {t.label}
            </IntervalLine>
          ))}
        </IntervalCol>
      )}
    </div>
  );
};
