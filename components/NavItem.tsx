
import React from 'react';

interface NavItemProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium focus:outline-none transition-colors duration-150
        ${isActive 
          ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
          : 'text-blue-100 hover:bg-blue-500 hover:text-white'
        }`}
    >
      {label}
    </button>
  );
};

export default NavItem;
