import React, { useState } from 'react';
import { Modal } from './Modal';
import { LearningStyle } from '../types';
import { saveLearningStyle } from '../services/progressService';

interface LearningStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const questions = [
  {
    question: 'Cuando aprendes algo nuevo, ¿qué prefieres?',
    options: [
      { text: 'Ver diagramas, imágenes o videos.', style: LearningStyle.Visual },
      { text: 'Escuchar una explicación o discutirlo.', style: LearningStyle.Auditory },
      { text: 'Leer sobre ello o tomar notas.', style: LearningStyle.ReadingWriting },
      { text: 'Hacerlo tú mismo, experimentar.', style: LearningStyle.Kinesthetic },
    ],
  },
  {
    question: 'En una clase, ¿qué te ayuda más a concentrarte?',
    options: [
      { text: 'Las diapositivas y el lenguaje corporal del profesor.', style: LearningStyle.Visual },
      { text: 'El tono de voz del profesor y los debates.', style: LearningStyle.Auditory },
      { text: 'Los apuntes que tomas y los libros de texto.', style: LearningStyle.ReadingWriting },
      { text: 'Las actividades prácticas o los experimentos.', style: LearningStyle.Kinesthetic },
    ],
  },
  {
    question: '¿Cómo recuerdas mejor las cosas?',
    options: [
      { text: 'Visualizando la información en mi mente.', style: LearningStyle.Visual },
      { text: 'Repitiéndolo en voz alta o asociándolo con un sonido.', style: LearningStyle.Auditory },
      { text: 'Escribiéndolo varias veces.', style: LearningStyle.ReadingWriting },
      { text: 'Recordando la acción de hacerlo.', style: LearningStyle.Kinesthetic },
    ],
  },
    {
    question: 'Cuando montas un mueble, ¿qué haces primero?',
    options: [
      { text: 'Miro los diagramas del manual.', style: LearningStyle.Visual },
      { text: 'Le pido a alguien que me lea las instrucciones.', style: LearningStyle.Auditory },
      { text: 'Leo detenidamente todo el manual de instrucciones.', style: LearningStyle.ReadingWriting },
      { text: 'Empiezo a ensamblar las piezas y aprendo sobre la marcha.', style: LearningStyle.Kinesthetic },
    ],
  },
];

export const LearningStyleModal: React.FC<LearningStyleModalProps> = ({ isOpen, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<LearningStyle[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [finalStyle, setFinalStyle] = useState<LearningStyle>(LearningStyle.None);

  const handleAnswer = (style: LearningStyle) => {
    const newAnswers = [...answers, style];
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateResult(newAnswers);
      setShowResult(true);
    }
  };
  
  const calculateResult = (finalAnswers: LearningStyle[]) => {
    const counts: { [key in LearningStyle]?: number } = {};
    for (const style of finalAnswers) {
      counts[style] = (counts[style] || 0) + 1;
    }

    delete counts[LearningStyle.None];
    delete counts[LearningStyle.Multimodal];

    if (Object.keys(counts).length === 0) {
        setFinalStyle(LearningStyle.None);
        saveLearningStyle(LearningStyle.None);
        return;
    }

    const sortedStyles = Object.entries(counts).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
    
    if(sortedStyles.length === 0) {
        setFinalStyle(LearningStyle.None);
        saveLearningStyle(LearningStyle.None);
        return;
    }

    const maxCount = sortedStyles[0][1];
    const isMultimodal = sortedStyles.filter(s => s[1] === maxCount).length > 1;

    let result: LearningStyle;
    if (isMultimodal) {
        result = LearningStyle.Multimodal;
    } else {
        result = sortedStyles[0][0] as LearningStyle;
    }
    
    setFinalStyle(result);
    saveLearningStyle(result);
  };

  const resetTest = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setShowResult(false);
    onClose();
  }

  const getResultDescription = () => {
      switch(finalStyle) {
          case LearningStyle.Visual: return "Aprendes mejor con ayudas visuales como gráficos, diagramas y videos.";
          case LearningStyle.Auditory: return "Retienes información escuchando y hablando. Graba las clases y discute temas con compañeros.";
          case LearningStyle.ReadingWriting: return "Prefieres la información presentada como texto. Haz resúmenes y reescribe tus notas.";
          case LearningStyle.Kinesthetic: return "Aprendes 'haciendo'. Involúcrate en actividades prácticas y utiliza simuladores.";
          case LearningStyle.Multimodal: return "Combinas varios estilos, lo que te da flexibilidad para adaptarte a diferentes tipos de material.";
          default: return "Completa el test para descubrir tu estilo."
      }
  }

  const getAIRecommendation = () => {
      switch(finalStyle) {
          case LearningStyle.Visual: return "Tus manuales generados priorizarán diagramas y mapas mentales. El plan de estudio sugerirá actividades visuales.";
          case LearningStyle.Auditory: return "El contenido se adaptará para ser fácil de leer en voz alta. Se te sugerirán discusiones sobre temas complejos.";
          case LearningStyle.ReadingWriting: return "Recibirás resúmenes y listas bien estructuradas. La IA se enfocará en generar texto claro y conciso.";
          case LearningStyle.Kinesthetic: return "Tu plan de estudio incluirá sugerencias de actividades prácticas y simulaciones para reforzar el aprendizaje.";
          case LearningStyle.Multimodal: return "La IA te ofrecerá una mezcla de recursos (visuales, textuales, prácticos) para que puedas elegir el que mejor se adapte a cada tema.";
          default: return "";
      }
  }

  const renderContent = () => {
    if (showResult) {
      return (
        <div className="text-center">
            <h3 className="text-2xl font-bold text-primary mb-2">¡Test Completado!</h3>
            <p className="text-lg">Tu estilo de aprendizaje es:</p>
            <p className="text-3xl font-semibold my-4 text-primary">{finalStyle}</p>
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
                     <button key={index} onClick={() => handleAnswer(option.style)} className="w-full text-left p-4 border border-border rounded-lg transition-colors hover:bg-accent hover:border-primary text-card-foreground">
                        {option.text}
                    </button>
                ))}
            </div>
        </div>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={resetTest} title="Descubre tu Estilo de Aprendizaje">
      {renderContent()}
    </Modal>
  );
};