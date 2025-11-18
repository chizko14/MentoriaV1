import React, { useState, useEffect, useRef } from 'react';
import { View } from '../types';
import { Icon } from './icons';
import { useTheme } from '../hooks/useTheme';
import { getLearningStyle, getConcentrationProfile } from '../services/progressService';
import { profileUpdateEmitter } from '../services/eventService';
import { ProfileDropdown } from './ProfileDropdown';
import { TimerPopover } from './TimerPopover';

type HeaderProps = {
  currentView: View;
  toggleSidebar: () => void;
  setCurrentView: (view: View) => void;
};

const viewDisplayNames: { [key in View]: string } = {
    [View.Dashboard]: 'Dashboard',
    [View.StudyPlan]: 'Plan de Estudio',
    [View.Simulator]: 'Simulador',
    [View.Manuals]: 'Manuales',
    [View.Profile]: 'Perfil',
    [View.Admin]: 'Administración',
    [View.AnnualPlan]: 'Plan Anual',
};

export const Header: React.FC<HeaderProps> = ({ currentView, toggleSidebar, setCurrentView }) => {
    const { theme, toggleTheme } = useTheme();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isTimerOpen, setIsTimerOpen] = useState(false);
    const [learningStyle, setLearningStyle] = useState(getLearningStyle());
    const [concentrationProfile, setConcentrationProfile] = useState(getConcentrationProfile());
    const profileRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateProfile = () => {
            setLearningStyle(getLearningStyle());
            setConcentrationProfile(getConcentrationProfile());
        };
        const unsubscribe = profileUpdateEmitter.subscribe(updateProfile);

        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (timerRef.current && !timerRef.current.contains(event.target as Node)) {
                setIsTimerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        
        return () => {
            unsubscribe();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

  return (
    <header className="flex items-center justify-between px-6 h-16 bg-card border-b border-border">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="text-muted-foreground focus:outline-none md:hidden">
          <Icon name="menu" className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-foreground ml-4 md:ml-0">{viewDisplayNames[currentView]}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center px-3 py-1 bg-secondary rounded-full text-sm font-medium text-muted-foreground">
            <span className="mr-2">🎓</span>
            {learningStyle}
        </div>
         <div className="hidden md:flex items-center px-3 py-1 bg-secondary rounded-full text-sm font-medium text-muted-foreground">
            <Icon name="brain" className="w-4 h-4 mr-2" />
            {concentrationProfile}
        </div>
        <button onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
            <Icon name={theme === 'light' ? 'moon' : 'sun'} className="w-5 h-5" />
        </button>
        <div className="relative" ref={timerRef}>
            <button onClick={() => setIsTimerOpen(o => !o)} className="text-muted-foreground hover:text-foreground">
                <Icon name="timer" className="w-5 h-5" />
            </button>
            <TimerPopover isOpen={isTimerOpen} />
        </div>
        <div className="relative">
            <button className="text-muted-foreground hover:text-foreground">
                <Icon name="notification" className="w-5 h-5" />
                 <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">2</span>
            </button>
        </div>
         <div className="relative" ref={profileRef}>
            <button onClick={() => setIsProfileOpen(o => !o)} className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center">
                <Icon name="profile" className="w-5 h-5 text-muted-foreground" />
            </button>
            <ProfileDropdown 
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                learningStyle={learningStyle}
                concentrationProfile={concentrationProfile}
                setCurrentView={setCurrentView}
            />
        </div>
      </div>
    </header>
  );
};