import React from 'react';

type Tab = 'profile' | 'chat' | 'calendar' | 'split';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'calendar', label: 'Calendars', icon: '📅' },
    { id: 'split', label: 'Split', icon: '⚡' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as Tab)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              activeTab === tab.id 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span className="text-2xl">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
