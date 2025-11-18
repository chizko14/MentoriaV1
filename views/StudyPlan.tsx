import React, { useState, useEffect, useMemo } from 'react';
import { StudyTask, View } from '../types';
import { getSavedStudyPlan, saveStudyPlan, updateStudyStreak, generateIcsFile } from '../services/progressService';
import { generateStudyPlan, generateMonthlyPlan } from '../services/aiService';
import { studyPlanUpdateEmitter, showToast } from '../services/eventService';
import { Card } from '../components/Card';
import { Icon } from '../components/icons';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

interface StudyPlanProps {
    setCurrentView: (view: View) => void;
    setActiveStudyTask: (task: StudyTask) => void;
}

const StudyPlan: React.FC<StudyPlanProps> = ({ setCurrentView, setActiveStudyTask }) => {
    const [plan, setPlan] = useState<StudyTask[] | null>(getSavedStudyPlan());
    const [isGenerating, setIsGenerating] = useState(false);
    const [showConfig, setShowConfig] = useState(!plan);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    const today = new Date();
    const oneYearFromNow = new Date(today);
    oneYearFromNow.setFullYear(today.getFullYear() + 1);
    
    const [startDate, setStartDate] = useState(today.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(oneYearFromNow.toISOString().split('T')[0]);
    const [dailyHours, setDailyHours] = useState(2);
    const [studyDays, setStudyDays] = useState(['Lu', 'Ma', 'Mi', 'Ju', 'Vi']);

    useEffect(() => {
        const updatePlan = () => {
            const newPlan = getSavedStudyPlan();
            setPlan(newPlan);
            if (!newPlan) setShowConfig(true);
        };
        const unsubscribe = studyPlanUpdateEmitter.subscribe(updatePlan);
        return () => unsubscribe();
    }, []);

    const handleGeneratePlan = async () => {
        setIsGenerating(true);
        setShowConfig(false);
        try {
            const newPlan = await generateStudyPlan(dailyHours, studyDays, startDate, endDate);
            if (newPlan && newPlan.length > 0) {
                saveStudyPlan(newPlan);
                setPlan(newPlan);
                showToast('¡Nuevo plan de estudio generado!', 'success');
            } else {
                showToast('No se pudo generar el plan de estudio.', 'error');
                setShowConfig(true);
            }
        } catch (error) {
            console.error(error);
            showToast('Ocurrió un error al generar el plan.', 'error');
            setShowConfig(true);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAdaptPlan = async () => {
        const currentPlan = getSavedStudyPlan();
        if (!currentPlan) {
            showToast('Primero debes generar un plan de estudio.', 'info');
            return;
        }

        setIsGenerating(true);
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            
            // Separate past/completed tasks from future tasks
            const completedOrPastTasks = currentPlan.filter(task => task.completed || task.date < todayStr);
            const futureTasks = currentPlan.filter(task => !task.completed && task.date >= todayStr);

            if (futureTasks.length === 0) {
                showToast('No hay actividades futuras que adaptar.', 'info');
                setIsGenerating(false);
                return;
            }

            const newStartDate = futureTasks[0].date;
            const originalEndDate = currentPlan[currentPlan.length - 1].date;

            showToast('Adaptando tu plan a tu progreso actual...', 'info');

            const adaptedFuturePlan = await generateStudyPlan(dailyHours, studyDays, newStartDate, originalEndDate);
            
            if (adaptedFuturePlan && adaptedFuturePlan.length > 0) {
                const newFullPlan = [...completedOrPastTasks, ...adaptedFuturePlan];
                saveStudyPlan(newFullPlan);
                setPlan(newFullPlan);
                showToast('¡Tu plan ha sido adaptado a tu progreso!', 'success');
            } else {
                showToast('No se pudo adaptar el plan.', 'error');
            }

        } catch (error) {
            console.error("Error adapting plan:", error);
            showToast('Ocurrió un error al adaptar el plan.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const extendPlanForMonth = async (date: Date) => {
        if (!plan) return;
        setIsGenerating(true);
        try {
            const year = date.getFullYear();
            const month = date.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            
            const monthPlan = await generateMonthlyPlan(firstDay.toISOString().split('T')[0], lastDay.toISOString().split('T')[0]);
            
            if (monthPlan) {
                const updatedPlan = [...plan, ...monthPlan];
                setPlan(updatedPlan);
                saveStudyPlan(updatedPlan);
                showToast(`Plan extendido para ${date.toLocaleString('es-ES', { month: 'long' })}`, 'info');
            }
        } catch (error) {
            showToast('Error al extender el plan.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleMonthChange = (direction: 'next' | 'prev') => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
        setCurrentMonth(newMonth);

        const hasTasksInNewMonth = plan?.some(task => {
            const taskDate = new Date(task.date);
            return taskDate.getFullYear() === newMonth.getFullYear() && taskDate.getMonth() === newMonth.getMonth();
        });

        if (plan && !hasTasksInNewMonth && newMonth > new Date()) {
            extendPlanForMonth(newMonth);
        }
    };

    const toggleActivityComplete = (taskId: string) => {
        if (!plan) return;
        const updatedPlan = plan.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        setPlan(updatedPlan);
        saveStudyPlan(updatedPlan);
    };
    
    const handleDayComplete = () => {
        if (!plan || !selectedDay) return;
        const updatedPlan = plan.map(task =>
            task.date === selectedDay ? { ...task, completed: true } : task
        );
        setPlan(updatedPlan);
        saveStudyPlan(updatedPlan);
        updateStudyStreak(selectedDay);
        showToast('¡Día completado! Tu racha ha sido actualizada.', 'success');
    };

    const handleExportDay = () => {
        if (!plan || !selectedDay) return;
        const dayTasks = plan.filter(task => task.date === selectedDay);
        if (dayTasks.length === 0) {
            showToast('No hay actividades para exportar en este día.', 'info');
            return;
        }
        const icsContent = generateIcsFile(dayTasks);
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mentoria_plan_${selectedDay}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const toggleStudyDay = (day: string) => {
        setStudyDays(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const tasksByDate = useMemo(() => {
        if (!plan) return {};
        return plan.reduce((acc, task) => {
            (acc[task.date] = acc[task.date] || []).push(task);
            return acc;
        }, {} as Record<string, StudyTask[]>);
    }, [plan]);

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDayOfMonth = (new Date(year, month, 1).getDay() + 6) % 7; // Monday - 0
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const blanks = Array(firstDayOfMonth).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <Button variant="ghost" size="icon" onClick={() => handleMonthChange('prev')}>
                        <Icon name="chevronLeft" className="w-6 h-6" />
                    </Button>
                    <h3 className="text-xl font-semibold capitalize">
                        {currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => handleMonthChange('next')}>
                        <Icon name="chevronRight" className="w-6 h-6" />
                    </Button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center font-semibold text-muted-foreground text-sm">
                    {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 mt-2">
                    {blanks.map((_, i) => <div key={`blank-${i}`} className="border border-transparent"></div>)}
                    {days.map(day => {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayTasks = tasksByDate[dateStr] || [];
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;
                        const areAllTasksComplete = dayTasks.length > 0 && dayTasks.every(t => t.completed);

                        return (
                            <div key={day} onClick={() => setSelectedDay(dateStr)} className={`border rounded-md min-h-[7rem] p-1 text-left cursor-pointer transition-colors ${selectedDay === dateStr ? 'bg-primary/10 border-primary' : 'border-border hover:bg-accent'} ${isToday ? 'border-blue-500' : ''}`}>
                                <div className="flex justify-between items-center">
                                    <span className={`text-sm ${isToday ? 'font-bold text-primary' : ''}`}>{day}</span>
                                    {areAllTasksComplete && <Icon name="checkCircle" className="w-4 h-4 text-green-500"/>}
                                </div>
                                {dayTasks.length > 0 && !areAllTasksComplete && (
                                     <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderSelectedDayPanel = () => {
        if (!selectedDay) {
            return (
                <Card title="Actividades del Día">
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                        <Icon name="calendar" className="w-12 h-12 mb-4" />
                        <p>Selecciona un día en el calendario para ver las actividades.</p>
                    </div>
                </Card>
            );
        }
        const dayTasks = tasksByDate[selectedDay] || [];
        
        return (
             <Card title={`Actividades para ${new Date(selectedDay + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}`}>
                <div className="h-[calc(100vh-250px)] overflow-y-auto pr-2 space-y-3">
                    {dayTasks.length > 0 ? dayTasks.map(task => (
                        <div key={task.id} className="p-3 bg-secondary rounded-md">
                             <div className="flex items-start justify-between">
                                <div>
                                    <p className={`font-semibold ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
                                    <p className="text-xs text-muted-foreground">{task.specialty} - {task.duration} min</p>
                                </div>
                                <input type="checkbox" checked={task.completed} onChange={() => toggleActivityComplete(task.id)} className="w-5 h-5 accent-primary mt-1" />
                             </div>
                             <Button onClick={() => { setActiveStudyTask(task); setCurrentView(View.Simulator); }} size="sm" variant="ghost" className="mt-2 w-full justify-start text-primary">
                                Ir a la Actividad
                            </Button>
                        </div>
                    )) : <p className="text-muted-foreground text-center p-8">No hay actividades programadas.</p>}
                </div>
                {dayTasks.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border space-y-2">
                         <Button onClick={handleDayComplete} className="w-full">Marcar Día como Completo</Button>
                         <Button onClick={handleExportDay} variant="secondary" className="w-full">Exportar a .ics</Button>
                    </div>
                )}
             </Card>
        );
    };

    const renderPlanGenerator = () => (
        <Card title="Generar Plan de Estudio" className="max-w-2xl mx-auto">
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium mb-1">Fecha de Inicio</label>
                        <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground" />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium mb-1">Fecha de Fin</label>
                        <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground" />
                    </div>
                </div>
                <div>
                    <label htmlFor="daily-hours" className="block text-sm font-medium mb-1">Horas de estudio por día ({dailyHours})</label>
                    <input type="range" id="daily-hours" value={dailyHours} min={1} max={8} onChange={e => setDailyHours(parseInt(e.target.value))} className="w-full" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Días de estudio</label>
                    <div className="flex flex-wrap gap-2">
                        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(day => (
                            <button key={day} onClick={() => toggleStudyDay(day)} className={`w-10 h-10 rounded-full text-sm font-semibold transition-colors ${studyDays.includes(day) ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                                {day}
                            </button>
                        ))}
                    </div>
                </div>
                <Button onClick={handleGeneratePlan} className="w-full" disabled={isGenerating}>
                    {isGenerating ? <Spinner /> : 'Generar Plan'}
                </Button>
                {plan && <Button onClick={() => setShowConfig(false)} variant="secondary" className="w-full mt-2">Cancelar</Button>}
            </div>
        </Card>
    );

    if (isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Spinner className="w-12 h-12" />
                <p className="mt-4 text-muted-foreground">Generando tu plan de estudio personalizado...</p>
                <p className="text-sm text-muted-foreground">(Esto puede tardar un momento)</p>
            </div>
        );
    }
    
    if (!plan || showConfig) {
        return renderPlanGenerator();
    }
    
    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-semibold">Mi Plan de Estudio</h2>
                 <div className="flex items-center gap-2">
                    <Button onClick={handleAdaptPlan} variant="primary" size="sm" disabled={isGenerating}>
                        <Icon name="aiLogo" className="w-4 h-4 mr-2" />
                        Adaptar Plan con IA
                    </Button>
                    <Button onClick={() => setShowConfig(true)} variant="secondary" size="sm">
                        <Icon name="calendar" className="w-4 h-4 mr-2" />
                        Ajustar Plan
                    </Button>
                 </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <Card>{renderCalendar()}</Card>
                </div>
                 <div className="xl:col-span-1">
                    {renderSelectedDayPanel()}
                </div>
            </div>
        </div>
    );
};

export default StudyPlan;