
// Fix: Implemented the Simulator view.
import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Icon } from '../components/icons';
import { Specialty, Quiz, Question, StudyTask, View, Flashcard, ClinicalCase, FillInTheBlanks } from '../types';
import { SPECIALTIES } from '../constants';
import { getQuizContents, generateFlashcardsForTopic, generateQuizForTopic, generateClinicalCaseForTopic, generateFillInTheBlanksForTopic, getManualContent } from '../services/aiService';
// FIX: Added updateStudyStreak and getAllProgress imports.
import { saveQuizResult, getSavedStudyPlan, saveStudyPlan, unlockAchievement, getStrongTopics, getWeeklyStreak, updateSrsQueue, getAllProgress, updateStudyStreak } from '../services/progressService';
import { showToast } from '../services/eventService';
import { FlashcardPlayer } from '../components/FlashcardPlayer';
import { ClinicalCasePlayer } from '../components/ClinicalCasePlayer';
import { FillInTheBlanksPlayer } from '../components/FillInTheBlanksPlayer';
import { ManualPlayer } from '../components/ManualPlayer';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

type QuizState = 'config' | 'loading' | 'active' | 'results';

interface SimulatorProps {
    initialTask?: StudyTask | null;
    setActiveStudyTask: (task: StudyTask | null) => void;
    setCurrentView: (view: View) => void;
}

const Simulator: React.FC<SimulatorProps> = ({ initialTask, setActiveStudyTask, setCurrentView }) => {
    const [quizState, setQuizState] = useState<QuizState>('config');
    const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty>(SPECIALTIES[0]);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [score, setScore] = useState(0);

    const [activityContent, setActivityContent] = useState<any>(null);
    const [isActivityLoading, setIsActivityLoading] = useState(false);

    // FIX: Define the missing handleActivityComplete function to process completed study tasks.
    const handleActivityComplete = (score: number, task: StudyTask) => {
        const plan = getSavedStudyPlan();
        if (plan) {
            const updatedPlan = plan.map(p =>
                p.id === task.id ? { ...p, completed: true } : p
            );
            saveStudyPlan(updatedPlan);
        }

        updateStudyStreak(task.date);

        // Unlock achievements for the completed task
        const allCompletedQuizzes = (getSavedStudyPlan() || []).filter(t => t.type === 'quiz' && t.completed);
        if (allCompletedQuizzes.length === 1 && task.type === 'quiz') {
             unlockAchievement('first_quiz');
             showToast('¡Logro desbloqueado: Rompiendo el Hielo!', 'success');
        }
        if (score === 100) {
            unlockAchievement('perfect_score');
            showToast('¡Logro desbloqueado: Perfeccionista!', 'success');
        }

        showToast(`¡Actividad '${task.title}' completada!`, 'success');
        setActiveStudyTask(null);
        setCurrentView(View.StudyPlan);
    };

    useEffect(() => {
        const loadActivityContent = async () => {
            if (!initialTask) {
                setQuizState('config');
                setActivityContent(null);
                setQuiz(null);
                return;
            }

            setIsActivityLoading(true);
            let generatedContent: any = null;

            // Check if content is a placeholder that needs to be generated
            const isPlaceholder = (
                !initialTask.content ||
                (Array.isArray(initialTask.content) && initialTask.content.length === 0) ||
                (typeof initialTask.content === 'object' && Object.keys(initialTask.content).length === 0) ||
                (typeof initialTask.content === 'string' && initialTask.content.length === 0)
            );

            if (!isPlaceholder) {
                 generatedContent = initialTask.content;
            } else {
                showToast('Generando contenido de la actividad...', 'info');
                switch (initialTask.type) {
                    case 'flashcards':
                        generatedContent = await generateFlashcardsForTopic(initialTask.topic, initialTask.specialty);
                        break;
                    case 'quiz':
                        generatedContent = await generateQuizForTopic(initialTask.topic, initialTask.specialty, initialTask.difficulty);
                        break;
                    case 'clinical_case':
                        generatedContent = await generateClinicalCaseForTopic(initialTask.topic, initialTask.specialty);
                        break;
                    case 'fill_in_the_blanks':
                        generatedContent = await generateFillInTheBlanksForTopic(initialTask.topic, initialTask.specialty);
                        break;
                    case 'manual':
                        const manualResult = await getManualContent(initialTask.topic, initialTask.specialty);
                        generatedContent = manualResult ? manualResult.content : 'Error al cargar el manual.';
                        break;
                    default:
                        console.error("Unknown task type:", initialTask.type);
                }
            }

            if (generatedContent) {
                if (initialTask.type === 'quiz') {
                    const fullQuizData = { ...(generatedContent as Quiz), specialty: initialTask.specialty, topic: initialTask.topic, difficulty: initialTask.difficulty };
                    setQuiz(fullQuizData);
                    setAnswers(new Array(fullQuizData.questions.length).fill(null));
                    setCurrentQuestionIndex(0);
                    setQuizState('active');
                }
                setActivityContent(generatedContent);
            } else {
                showToast(`No se pudo generar el contenido para '${initialTask.title}'.`, 'error');
                setActivityContent(null);
                setActiveStudyTask(null);
            }

            setIsActivityLoading(false);
        };
        
        loadActivityContent();
    }, [initialTask, setActiveStudyTask]);

    const startQuiz = async () => {
        setQuizState('loading');
        try {
            const generatedQuiz = await getQuizContents(selectedSpecialty, 10);
            if (generatedQuiz) {
                setQuiz(generatedQuiz);
                setAnswers(new Array(generatedQuiz.questions.length).fill(null));
                setCurrentQuestionIndex(0);
                setQuizState('active');
            } else {
                showToast('No se pudo generar el quiz.', 'error');
                setQuizState('config');
            }
        } catch (error) {
            console.error(error);
            showToast('Ocurrió un error al generar el quiz.', 'error');
            setQuizState('config');
        }
    };

    const handleAnswer = (answer: string) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = answer;
        setAnswers(newAnswers);
    };

    const nextQuestion = () => {
        if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };
    
    // FIX: Refactored finishQuiz to correctly handle study plan tasks vs. free-play quizzes.
    const finishQuiz = () => {
        if (!quiz) return;
        let correctAnswers = 0;
        quiz.questions.forEach((q, index) => {
            if (answers[index] === q.correctAnswer) {
                correctAnswers++;
            }
        });
        const finalScore = Math.round((correctAnswers / quiz.questions.length) * 100);
        
        const topicToSave = initialTask?.topic ?? quiz.topic;
        const specialtyToSave = initialTask?.specialty ?? quiz.specialty;
        const difficultyToSave = initialTask?.difficulty ?? quiz.difficulty;
        
        saveQuizResult(specialtyToSave, topicToSave, difficultyToSave, finalScore);
        updateSrsQueue(topicToSave, specialtyToSave, finalScore);
        
        if (initialTask) {
            // Task from study plan. handleActivityComplete will navigate away.
            handleActivityComplete(finalScore, initialTask);
        } else {
            // Free play quiz. Update state and show results.
            setScore(finalScore);
    
            const allProgress = getAllProgress();
            if (allProgress.length === 1) {
                unlockAchievement('first_quiz');
                showToast('¡Logro desbloqueado: Rompiendo el Hielo!', 'success');
            }
            if (finalScore === 100) {
                unlockAchievement('perfect_score');
                showToast('¡Logro desbloqueado: Perfeccionista!', 'success');
            }
            
            setQuizState('results');
        }
    };

    const resetQuiz = () => {
        setQuiz(null);
        setAnswers([]);
        setCurrentQuestionIndex(0);
        setScore(0);
        setQuizState('config');
    }

    const renderQuizContent = () => {
        switch (quizState) {
            case 'loading':
                return (
                    <div className="text-center p-8">
                        <Spinner className="w-10 h-10 mx-auto" />
                        <p className="mt-4 text-muted-foreground">Generando simulación...</p>
                    </div>
                );
            case 'active':
                if (!quiz) return null;
                const currentQuestion = quiz.questions[currentQuestionIndex];
                return (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm text-muted-foreground">Pregunta {currentQuestionIndex + 1} de {quiz.questions.length}</p>
                            <div className="w-1/2 bg-secondary rounded-full h-2.5">
                                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}></div>
                            </div>
                        </div>
                        <h4 className="text-lg font-semibold mb-4">{currentQuestion.question}</h4>
                        <div className="space-y-3">
                            {currentQuestion.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswer(option)}
                                    className={`w-full text-left p-3 border rounded-md transition-colors ${answers[currentQuestionIndex] === option ? 'bg-primary/10 border-primary' : 'border-border hover:bg-accent'}`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between mt-6">
                            <Button variant="secondary" onClick={prevQuestion} disabled={currentQuestionIndex === 0}>Anterior</Button>
                            {currentQuestionIndex === quiz.questions.length - 1 ? (
                                <Button onClick={finishQuiz}>Finalizar</Button>
                            ) : (
                                <Button onClick={nextQuestion}>Siguiente</Button>
                            )}
                        </div>
                    </div>
                );
            case 'results':
                if (!quiz) return null;
                return (
                    <div className="text-center">
                        <h3 className="text-2xl font-bold mb-2">¡Simulación Completada!</h3>
                        <p className="text-lg text-muted-foreground mb-4">Tu puntaje:</p>
                        <p className={`text-6xl font-bold mb-6 ${score >= 70 ? 'text-green-500' : 'text-red-500'}`}>{score}%</p>
                        <Button onClick={resetQuiz} className="w-full">Volver a Empezar</Button>
                    </div>
                );
            case 'config':
            default:
                return (
                    <div className="text-center">
                        <h3 className="text-xl font-semibold mb-4">Configurar Simulación</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Especialidad</label>
                            <select
                                value={selectedSpecialty}
                                onChange={(e) => setSelectedSpecialty(e.target.value as Specialty)}
                                className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                            >
                                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <Button onClick={startQuiz} className="w-full">Comenzar Simulación</Button>
                    </div>
                );
        }
    };
    
    if (initialTask) {
        if (isActivityLoading) {
            return <div className="flex items-center justify-center h-full"><Spinner className="w-12 h-12" /></div>;
        }

        return (
            <Card title={initialTask.title}>
                {initialTask.type === 'flashcards' && activityContent && <FlashcardPlayer flashcards={activityContent} onComplete={() => handleActivityComplete(100, initialTask)} />}
                {initialTask.type === 'quiz' && quiz && renderQuizContent()}
                {initialTask.type === 'clinical_case' && activityContent && <ClinicalCasePlayer caseData={activityContent} onComplete={(score) => handleActivityComplete(score, initialTask)} />}
                {initialTask.type === 'fill_in_the_blanks' && activityContent && <FillInTheBlanksPlayer activityData={activityContent} onComplete={(isCorrect) => handleActivityComplete(isCorrect ? 100 : 0, initialTask)} />}
                {initialTask.type === 'manual' && activityContent && <ManualPlayer content={activityContent} onComplete={() => handleActivityComplete(100, initialTask)} />}
            </Card>
        );
    }
    
    return <Card>{renderQuizContent()}</Card>;
};

export default Simulator;