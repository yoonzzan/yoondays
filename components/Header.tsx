
import React, { useState, useEffect } from 'react';

const Header: React.FC = () => {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const today = new Date();
    const formattedDate = `Today, ${today.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })}`;
    setCurrentDate(formattedDate);
  }, []);

  return (
    <header className="bg-white shadow-md w-full">
      <div className="container mx-auto px-4 py-4 md:px-8 flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-sky-700">My English Day</h1>
        <div className="text-sm md:text-base text-gray-500 font-medium">{currentDate}</div>
      </div>
    </header>
  );
};

export default Header;
