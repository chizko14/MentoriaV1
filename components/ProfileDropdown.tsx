import React from 'react';
import { View, LearningStyle, ConcentrationProfile } from '../types';
import { Icon } from './icons';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  learningStyle: LearningStyle;
  concentrationProfile: ConcentrationProfile;
  setCurrentView: (view: View) => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose, learningStyle, concentrationProfile, setCurrentView }) => {
  if (!isOpen) return null;
  
  const handleProfileClick = () => {
    setCurrentView(View.Profile);
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-72 bg-card rounded-lg shadow-lg border border-border z-50">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-lg">Estudiante</h3>
        <p className="text-sm text-muted-foreground">Médico en preparación</p>
      </div>
      <div className="p-4 space-y-4">
        <div>
            <div className="flex items-center text-sm text-muted-foreground mb-1">
                <span className="mr-2">🎓</span>
                <span>Estilo de Aprendizaje</span>
            </div>
            <p className="font-semibold text-primary">{learningStyle}</p>
        </div>
        <div>
            <div className="flex items-center text-sm text-muted-foreground mb-1">
                <Icon name="brain" className="w-4 h-4 mr-2" />
                <span>Perfil de Concentración</span>
            </div>
            <p className="font-semibold text-primary">{concentrationProfile}</p>
        </div>
      </div>
       <div className="border-t border-border p-2">
         <button onClick={handleProfileClick} className="w-full text-left flex items-center p-2 rounded-md hover:bg-accent text-sm">
           <Icon name="profile" className="w-4 h-4 mr-2" />
           Ver Perfil Completo
         </button>
      </div>
    </div>
  );
};