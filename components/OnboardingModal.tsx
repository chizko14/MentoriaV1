import React from 'react';
import { Modal } from './Modal';
import { Icon } from './icons';

interface OnboardingModalProps {
  isOpen: boolean;
  onStart: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onStart }) => {
  return (
    <Modal isOpen={isOpen} onClose={onStart} title="¡Bienvenido a Mentoria!">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-secondary mb-4">
            <Icon name="aiLogo" className="w-12 h-12 text-primary" />
        </div>
        <p className="text-lg text-foreground mb-4">
            Tu mentor de estudio personalizado para el ENARM.
        </p>
        <p className="text-muted-foreground mb-6">
            Para empezar, vamos a descubrir tu estilo de aprendizaje. Esto nos ayudará a adaptar el contenido y los planes de estudio especialmente para ti.
        </p>
        <button 
          onClick={onStart} 
          className="w-full bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-md hover:bg-primary/90 transition-transform transform hover:scale-105"
        >
          Comenzar Personalización
        </button>
      </div>
    </Modal>
  );
};