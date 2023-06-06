import React, { useState } from 'react';

interface TabProps {
  title: string;
  isSelected: boolean;
  onClick: () => void;
}

const Tab: React.FC<TabProps> = ({ title, isSelected, onClick }) => (
  <li className={`w-full ${isSelected ? 'bg-gray-100' : 'bg-white'}`}>
    <p
      className={`block rounded-l-lg rounded-r-lg p-2 focus:outline-none focus:ring-1 focus:ring-black ${
        isSelected ? 'bg-gray-700 text-white' : 'text-gray-700 hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      {title}
    </p>
  </li>
);

interface TabsProps {
  tabs: { title: string; content: React.ReactNode }[];
}

export const Tabs: React.FC<TabsProps> = ({ tabs }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabClick = (index: number) => {
    setSelectedTab(index);
  };

  return (
    <div className='flex flex-col'>
      <ul className="mb-2 flex w-full gap-x-1 divide-gray-700 text-center text-sm font-medium text-gray-400 shadow">
        {tabs.map((tab, index) => (
          <Tab key={index} title={tab.title} isSelected={selectedTab === index} onClick={() => handleTabClick(index)} />
        ))}
      </ul>
      <div className="flex w-full h-200 overflow-scroll">{tabs[selectedTab]?.content}</div>
    </div>
  );
};
