import React, { useState } from 'react';
import { Modal } from './Modal';
import { ConcentrationProfile } from '../types';
import { saveConcentrationProfile } from '../services/progressService';

interface ConcentrationTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const questions = [
  {
    question: '¿Con qué frecuencia te encuentras soñando despierto durante una sesión de estudio?',
    options: [
      { text: 'Casi siempre', score: 1 },
      { text: 'A menudo', score: 2 },
      { text: 'A veces', score: 3 },
      { text: 'Rara vez o nunca', score: 4 },
    ],
  },
  {
    question: 'Cuando lees, ¿necesitas releer párrafos porque tu mente se ha desviado?',
    options: [
      { text: 'Sí, constantemente', score: 1 },
      { text: 'Con frecuencia', score: 2 },
      { text: 'Ocasionalmente', score: 3 },
      { text: 'Casi nunca', score: 4 },
    ],
  },
  {
    question: '¿Qué tan fácil te distraen los ruidos externos (notificaciones, conversaciones)?',
    options: [
      { text: 'Muy fácilmente, cualquier cosa me distrae', score: 1 },
      { text: 'Bastante fácil', score: 2 },
      { text: 'Moderadamente, puedo volver a concentrarme', score: 3 },
      { text: 'Difícilmente, puedo bloquear las distracciones', score: 4 },
    ],
  },
  {
    question: '¿Puedes mantenerte enfocado en una sola tarea durante más de 30 minutos sin interrupciones?',
    options: [
      { text: 'No, es casi imposible', score: 1 },
      { text: 'Con dificultad', score: 2 },
      { text: 'La mayoría de las veces sí', score: 3 },
      { text: 'Sí, sin problema', score: 4 },
    ],
  },
];

export const ConcentrationTestModal: React.FC<ConcentrationTestModalProps> = ({ isOpen, onClose }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [finalProfile, setFinalProfile] = useState<ConcentrationProfile>(ConcentrationProfile.None);

    const handleAnswer = (score: number) => {
        const newTotalScore = totalScore + score;
        setTotalScore(newTotalScore);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            calculateResult(newTotalScore);
            setShowResult(true);
        }
    };

    const calculateResult = (finalScore: number) => {
        let profile: ConcentrationProfile;
        if (finalScore <= 6) {
            profile = ConcentrationProfile.Low;
        } else if (finalScore <= 10) {
            profile = ConcentrationProfile.Moderate;
        } else if (finalScore <= 14) {
            profile = ConcentrationProfile.Good;
        } else {
            profile = ConcentrationProfile.High;
        }
        setFinalProfile(profile);
        saveConcentrationProfile(profile);
    };

    const resetTest = () => {
        setCurrentQuestionIndex(0);
        setTotalScore(0);
        setShowResult(false);
        onClose();
    };
    
    const getResultDescription = () => {
        switch(finalProfile) {
            case ConcentrationProfile.Low: return "Parece que te distraes con facilidad. Intenta estudiar en un ambiente sin distracciones y usa técnicas como el Pomodoro.";
            case ConcentrationProfile.Moderate: return "Tu concentración es moderada. Puedes mejorarla con ejercicios de mindfulness y planificando descansos regulares.";
            case ConcentrationProfile.Good: return "¡Tienes un buen nivel de concentración! Sigue así y asegúrate de mantener un entorno de estudio ordenado.";
            case ConcentrationProfile.High: return "¡Excelente! Tienes una gran capacidad para mantener el enfoque. Aprovecha esta habilidad para las tareas más complejas.";
            default: return "";
        }
    };

    const getAIRecommendation = () => {
        switch(finalProfile) {
            case ConcentrationProfile.Low: return "Tu plan de estudio se estructurará en sesiones más cortas (ej. 25-30 min) con descansos frecuentes para maximizar tu enfoque (Técnica Pomodoro).";
            case ConcentrationProfile.Moderate: return "La IA te sugerirá sesiones de estudio de duración moderada (40-50 min) con pausas planificadas para evitar el agotamiento.";
            case ConcentrationProfile.Good: return "Tu plan incluirá bloques de estudio estándar (50-60 min), ideales para cubrir temas en profundidad.";
            case ConcentrationProfile.High: return "Podrás aprovechar tu enfoque con sesiones de estudio más largas y profundas (más de 60 min) en temas complejos, con menos interrupciones.";
            default: return "";
        }
    }
    
    const renderContent = () => {
        if (showResult) {
            return (
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-primary mb-2">¡Prueba Completada!</h3>
                    <p className="text-lg">Tu perfil de concentración es:</p>
                    <p className="text-3xl font-semibold my-4 text-primary">{finalProfile}</p>
                    <p className="text-muted-foreground">{getResultDescription()}</p>
                    
                    <div className="mt-6 text-left p-4 bg-secondary rounded-lg">
                        <h4 className="font-semibold text-foreground">💡 ¿Cómo usará esto la IA?</h4>
                        <p className="text-sm text-muted-foreground mt-2">
                            {getAIRecommendation()}
                        </p>
                    </div>

                    <button onClick={resetTest} className="mt-8 bg-primary text-primary-foreground font-semibold py-2 px-6 rounded-md hover:bg-primary/90 w-full">
                        Entendido
                    </button>
                </div>
            )
        }
        
        const currentQuestion = questions[currentQuestionIndex];
        return (
            <div>
                 <div className="w-full bg-secondary rounded-full h-2.5 mb-4">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Pregunta {currentQuestionIndex + 1} de {questions.length}</p>
                <h4 className="text-lg font-semibold mb-6 text-foreground">{currentQuestion.question}</h4>
                <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                        <button key={index} onClick={() => handleAnswer(option.score)} className="w-full text-left p-4 border border-border rounded-lg transition-colors hover:bg-accent hover:border-primary text-card-foreground">
                            {option.text}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    
    return (
        <Modal isOpen={isOpen} onClose={resetTest} title="Prueba de Concentración">
            {renderContent()}
        </Modal>
    );
};