import React, { useState } from 'react';

interface TabProps {
  title: string;
  isSelected: boolean;
  onClick: () => void;
}

const Tab: React.FC<TabProps> = ({ title, isSelected, onClick }) => (
  <li className={`w-full ${isSelected ? 'bg-gray-100' : 'bg-white'}`}>
    <a
      href="#"
      className={`block rounded-l-lg rounded-r-lg p-2 focus:outline-none focus:ring-1 focus:ring-black ${
        isSelected ? 'text-white dark:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      {title}
    </a>
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
    <div>
      <ul className="divide-gray-200 w-full text-center text-sm font-medium text-gray-500 shadow dark:divide-gray-700 dark:text-gray-400 flex mb-2 gap-x-1">
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            title={tab.title}
            isSelected={selectedTab === index}
            onClick={() => handleTabClick(index)}
          />
        ))}
      </ul>
      <div className='flex w-full'>
        {tabs[selectedTab]?.content}
      </div>
    </div>
  );
};
