// Fix: Implemented the missing ClinicalCasePlayer component.
import React, { useState } from 'react';
import { ClinicalCase, ClinicalCaseQuestion } from '../types';
import { Spinner } from './ui/Spinner';

interface ClinicalCasePlayerProps {
    caseData: ClinicalCase | null;
    onComplete: (score: number) => void;
}

export const ClinicalCasePlayer: React.FC<ClinicalCasePlayerProps> = ({ caseData, onComplete }) => {
    // Fix: Add a guard clause to handle cases where caseData is null during loading.
    if (!caseData) {
        return (
            <div className="flex justify-center items-center h-48">
                <Spinner />
            </div>
        );
    }
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<(string | null)[]>(new Array(caseData.questions.length).fill(null));
    const [isFinished, setIsFinished] = useState(false);

    const handleAnswerSelect = (answer: string) => {
        if (isFinished) return;
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = answer;
        setAnswers(newAnswers);
    };

    const handleSubmit = () => {
        let score = 0;
        caseData.questions.forEach((q, i) => {
            if (answers[i] === q.correctAnswer) {
                score++;
            }
        });
        const finalScore = Math.round((score / caseData.questions.length) * 100);
        setIsFinished(true);
        onComplete(finalScore);
    };

    const isLastQuestion = currentQuestionIndex === caseData.questions.length - 1;
    const currentQuestion: ClinicalCaseQuestion = caseData.questions[currentQuestionIndex];

    return (
        <div className="p-4 bg-secondary rounded-lg">
            <h3 className="text-xl font-bold mb-4">Caso Clínico</h3>
            <p className="text-muted-foreground mb-6 whitespace-pre-wrap">{caseData.scenario}</p>

            <div className="mt-4">
                <h4 className="font-semibold mb-2">Pregunta {currentQuestionIndex + 1}:</h4>
                <p className="mb-4">{currentQuestion.question}</p>
                <div className="space-y-2">
                    {currentQuestion.options.map((option, index) => {
                         const isSelected = answers[currentQuestionIndex] === option;
                         const isCorrect = isFinished && option === currentQuestion.correctAnswer;
                         const isIncorrect = isFinished && isSelected && option !== currentQuestion.correctAnswer;

                         let buttonClass = 'w-full text-left p-3 border rounded-md transition-colors ';
                         if (isCorrect) {
                             buttonClass += 'bg-green-100 border-green-500 dark:bg-green-900/20 dark:border-green-700';
                         } else if (isIncorrect) {
                            buttonClass += 'bg-red-100 border-red-500 dark:bg-red-900/20 dark:border-red-700';
                         } else if (isSelected) {
                            buttonClass += 'bg-primary/10 border-primary';
                         } else {
                            buttonClass += 'border-border hover:bg-accent';
                         }

                        return (
                             <button key={index} onClick={() => handleAnswerSelect(option)} className={buttonClass} disabled={isFinished}>
                                {option}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-between items-center mt-6">
                <button
                    onClick={() => setCurrentQuestionIndex(i => i - 1)}
                    disabled={currentQuestionIndex === 0}
                    className="btn-secondary"
                >
                    Anterior
                </button>
                {!isLastQuestion ? (
                    <button
                        onClick={() => setCurrentQuestionIndex(i => i + 1)}
                        className="btn-primary"
                    >
                        Siguiente
                    </button>
                ) : (
                    <button onClick={handleSubmit} disabled={isFinished} className="btn-primary">
                        {isFinished ? 'Completado' : 'Finalizar Caso'}
                    </button>
                )}
            </div>
        </div>
    );
};