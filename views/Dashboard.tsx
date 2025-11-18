// Fix: Implemented the Dashboard view.
import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Icon } from '../components/icons';
import { PerformanceCharts } from '../components/ProgressChart';
import { getWeeklyStreak, getTodaysProgress, getAllProgress, getStrongTopics, getTopicsForReview, getDailyTip, saveDailyTip, getSrsQueue, getSavedStudyPlan } from '../services/progressService';
import { Progress, DailyTip, SrsItem, StudyTask, View } from '../types';
import { generateDailyTip } from '../services/aiService';
import { Button } from '../components/ui/Button';

interface DashboardProps {
    setCurrentView: (view: View) => void;
    setActiveStudyTask: (task: StudyTask) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setCurrentView, setActiveStudyTask }) => {
    const [streak, setStreak] = useState(0);
    const [todaysProgress, setTodaysProgress] = useState({ questions: 0, correct: 0 });
    const [allProgress, setAllProgress] = useState<Progress[]>([]);
    const [strongTopics, setStrongTopics] = useState<string[]>([]);
    const [reviewTopics, setReviewTopics] = useState<string[]>([]);
    const [dailyTip, setDailyTip] = useState<DailyTip | null>(null);
    const [isLoadingTip, setIsLoadingTip] = useState(false);
    const [srsQueue, setSrsQueue] = useState<SrsItem[]>([]);
    const [todaysTasks, setTodaysTasks] = useState<StudyTask[]>([]);

    useEffect(() => {
        // This would typically be a single call to a data fetching hook
        setStreak(getWeeklyStreak());
        setTodaysProgress(getTodaysProgress());
        setAllProgress(getAllProgress());
        setStrongTopics(getStrongTopics());
        setReviewTopics(getTopicsForReview());
        setSrsQueue(getSrsQueue());

        const plan = getSavedStudyPlan();
        if (plan) {
            const today = new Date().toISOString().split('T')[0];
            setTodaysTasks(plan.filter(task => task.date === today));
        }

        const fetchOrLoadTip = async () => {
            setIsLoadingTip(true);
            const cachedTip = getDailyTip();
            if (cachedTip) {
                setDailyTip(cachedTip);
            } else {
                const topicsForReview = getTopicsForReview();
                const newTip = await generateDailyTip(topicsForReview);
                if (newTip) {
                    setDailyTip(newTip);
                    saveDailyTip(newTip);
                }
            }
            setIsLoadingTip(false);
        };

        fetchOrLoadTip();
    }, []);

    const handleNavigateToTask = (task: StudyTask) => {
        setActiveStudyTask(task);
        setCurrentView(View.Simulator);
    };

    const totalQuestionsAnswered = allProgress.length * 10; // Assuming 10 questions per quiz
    const overallCorrectPercentage = allProgress.length > 0
        ? Math.round(allProgress.reduce((sum, p) => sum + p.score, 0) / allProgress.length)
        : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title="Racha Semanal" titleIcon={<Icon name="flame" className="w-6 h-6 text-orange-500" />}>
                        <p className="text-3xl font-bold">{streak} días</p>
                        <p className="text-sm text-muted-foreground">¡Sigue así!</p>
                    </Card>
                    <Card title="Progreso Hoy" titleIcon={<Icon name="achievement" className="w-6 h-6 text-green-500" />}>
                        <p className="text-3xl font-bold">{todaysProgress.correct}/{todaysProgress.questions}</p>
                        <p className="text-sm text-muted-foreground">Preguntas correctas</p>
                    </Card>
                    <Card title="Precisión General" titleIcon={<Icon name="chart" className="w-6 h-6 text-indigo-500" />}>
                        <p className="text-3xl font-bold">{overallCorrectPercentage}%</p>
                        <p className="text-sm text-muted-foreground">En {totalQuestionsAnswered} preguntas</p>
                    </Card>
                </div>
                
                {/* Progress Chart */}
                <PerformanceCharts progressData={allProgress} />

                 {/* Today's Plan */}
                <Card title="Plan de Hoy" titleIcon={<Icon name="calendar" className="w-6 h-6" />}>
                    {todaysTasks.length > 0 ? (
                        <div className="space-y-3">
                            {todaysTasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between p-3 bg-secondary rounded-md">
                                    <div>
                                        <p className="font-semibold">{task.title}</p>
                                        <p className="text-sm text-muted-foreground">{task.specialty} - {task.duration} min</p>
                                    </div>
                                    <Button onClick={() => handleNavigateToTask(task)} disabled={task.completed} size="sm">
                                        {task.completed ? 'Completado' : 'Comenzar'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No hay actividades para hoy. ¡Tómate un descanso o genera un plan de estudio!</p>
                    )}
                </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
                <Card title="Recomendación del Día" titleIcon={<Icon name="aiLogo" className="w-6 h-6 text-primary" />}>
                    {isLoadingTip ? (
                        <div className="text-center text-muted-foreground py-4">Generando recomendación...</div>
                    ) : dailyTip ? (
                        <div className="space-y-3">
                            <div>
                                <h4 className="font-semibold text-sm">Consejo:</h4>
                                <p className="text-sm text-muted-foreground">{dailyTip.tip}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold text-sm">Mini-reto:</h4>
                                <p className="text-sm text-muted-foreground">{dailyTip.challenge}</p>
                            </div>
                        </div>
                    ) : (
                         <div className="text-center text-muted-foreground py-4">No se pudo generar la recomendación de hoy.</div>
                    )}
                </Card>

                <Card title="Repasos Pendientes (SRS)">
                    {srsQueue.length > 0 ? (
                        <ul className="space-y-2">
                            {srsQueue.slice(0, 5).map(item => (
                                <li key={item.topic} className="text-sm flex items-center p-2 bg-secondary rounded-md">
                                    <Icon name="brain" className="w-4 h-4 mr-2 text-primary" />
                                    <div>
                                        <span className="font-semibold">{item.topic}</span>
                                        <span className="text-xs text-muted-foreground ml-2">({item.specialty})</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">¡No tienes repasos pendientes! Buen trabajo.</p>
                    )}
                </Card>

                <Card title="Resumen de Temas">
                     <div>
                        <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Temas Dominados</h4>
                        {strongTopics.length > 0 ? (
                            <ul className="space-y-1">
                                {strongTopics.slice(0, 3).map(t => <li key={t} className="text-sm flex items-center"><Icon name="checkCircle" className="w-4 h-4 mr-2 text-green-500" />{t}</li>)}
                            </ul>
                        ) : <p className="text-sm text-gray-500">Sigue practicando para dominar temas.</p>}
                    </div>
                    <div className="mt-4">
                        <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-2">Temas para Repasar</h4>
                        {reviewTopics.length > 0 ? (
                             <ul className="space-y-1">
                                {reviewTopics.slice(0, 3).map(t => <li key={t} className="text-sm flex items-center"><Icon name="timer" className="w-4 h-4 mr-2 text-yellow-500" />{t}</li>)}
                            </ul>
                        ) : <p className="text-sm text-gray-500">¡Excelente! No hay temas con bajo rendimiento.</p>}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;