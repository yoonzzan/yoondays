
import React from 'react';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { CalendarIcon } from './icons/CalendarIcon';

interface BottomNavProps {
  activeTab: 'today' | 'myDiaries';
  setActiveTab: (tab: 'today' | 'myDiaries') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const activeClass = 'text-sky-600';
  const inactiveClass = 'text-gray-400 hover:text-sky-500';

  return (
    <footer className="sticky bottom-0 bg-white shadow-[0_-2px_5px_-1px_rgba(0,0,0,0.1)] w-full">
      <nav className="container mx-auto px-8 h-16 flex justify-around items-center">
        <button
          onClick={() => setActiveTab('myDiaries')}
          className={`flex flex-col items-center justify-center transition-colors ${activeTab === 'myDiaries' ? activeClass : inactiveClass}`}
        >
          <BookOpenIcon />
          <span className="text-xs font-medium mt-1">My Diaries</span>
        </button>
        <button
          onClick={() => setActiveTab('today')}
          className={`flex flex-col items-center justify-center transition-colors ${activeTab === 'today' ? activeClass : inactiveClass}`}
        >
          <CalendarIcon />
          <span className="text-xs font-medium mt-1">Today's Diary</span>
        </button>
      </nav>
    </footer>
  );
};

export default BottomNav;
