// Fix: Implemented the missing FillInTheBlanksPlayer component.
import React, { useState } from 'react';
import { FillInTheBlanks } from '../types';
import { Spinner } from './ui/Spinner';

interface FillInTheBlanksPlayerProps {
    activityData: FillInTheBlanks | null;
    onComplete: (isCorrect: boolean) => void;
}

export const FillInTheBlanksPlayer: React.FC<FillInTheBlanksPlayerProps> = ({ activityData, onComplete }) => {
    // Fix: Add a guard clause to handle cases where activityData is null during loading.
    if (!activityData) {
        return (
            <div className="flex justify-center items-center h-48">
                <Spinner />
            </div>
        );
    }
    
    const [userAnswers, setUserAnswers] = useState<string[]>(new Array(activityData.blanks.length).fill(''));
    const [isSubmitted, setIsSubmitted] = useState(false);

    const sentenceParts = activityData.sentence.split('[BLANK]');

    const handleInputChange = (index: number, value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[index] = value;
        setUserAnswers(newAnswers);
    };

    const handleSubmit = () => {
        setIsSubmitted(true);
        const isCorrect = userAnswers.every((answer, index) =>
            answer.trim().toLowerCase() === activityData.blanks[index].trim().toLowerCase()
        );
        onComplete(isCorrect);
    };

    return (
        <div className="p-4 bg-secondary rounded-lg">
            <h3 className="text-xl font-bold mb-4">Completa los espacios</h3>
            <div className="text-lg flex flex-wrap items-center gap-2">
                {sentenceParts.map((part, index) => (
                    <React.Fragment key={index}>
                        <span>{part}</span>
                        {index < sentenceParts.length - 1 && (
                            <input
                                type="text"
                                value={userAnswers[index]}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                                disabled={isSubmitted}
                                className={`inline-block w-32 p-1 border-b-2 bg-transparent focus:outline-none transition-colors ${
                                    isSubmitted
                                        ? userAnswers[index].trim().toLowerCase() === activityData.blanks[index].trim().toLowerCase()
                                            ? 'border-green-500'
                                            : 'border-red-500'
                                        : 'border-primary/50 focus:border-primary'
                                }`}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {isSubmitted && (
                 <div className="mt-4 p-2 bg-card rounded-md">
                     <p className="text-sm">Respuesta correcta: {activityData.blanks.join(', ')}</p>
                 </div>
            )}
            
            <div className="mt-6 text-right">
                <button onClick={handleSubmit} disabled={isSubmitted} className="btn-primary">
                    {isSubmitted ? 'Completado' : 'Verificar'}
                </button>
            </div>
        </div>
    );
};