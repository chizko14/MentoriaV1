import React from 'react';
import { View } from '../types';
import { NAV_ITEMS } from '../constants';
import { Icon } from './icons';

type SidebarProps = {
  currentView: View;
  setCurrentView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, setIsOpen }) => {
  const handleNavClick = (view: View) => {
    setCurrentView(view);
    if (window.innerWidth < 768) { // md breakpoint
        setIsOpen(false);
    }
  };

  return (
    <>
      <aside className={`fixed z-30 inset-y-0 left-0 w-64 bg-secondary shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out`}>
        <div className="p-4 flex items-center space-x-2 justify-center border-b border-border h-16">
          <Icon name="aiLogo" className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Mentoria</h1>
        </div>
        <nav className="mt-5 p-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNavClick(item.view)}
              className={`w-full flex items-center mt-2 py-2 px-4 rounded-lg transition-colors duration-200 ${
                currentView === item.view
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon name={item.icon} className="w-6 h-6" />
              <span className="mx-3 font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      {isOpen && (
          <div 
              className="fixed inset-0 bg-black opacity-60 z-20 md:hidden"
              onClick={() => setIsOpen(false)}
          ></div>
      )}
    </>
  );
};