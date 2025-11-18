import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from './icons';

interface TimerPopoverProps {
  isOpen: boolean;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export const TimerPopover: React.FC<TimerPopoverProps> = ({ isOpen }) => {
  const [activeTab, setActiveTab] = useState<'pomodoro' | 'stopwatch'>('pomodoro');

  // Pomodoro State
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');

  // Stopwatch State
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  
  const resetPomodoro = useCallback((mode: 'work' | 'shortBreak' | 'longBreak' = 'work') => {
      setIsPomodoroRunning(false);
      setPomodoroMode(mode);
      switch(mode) {
          case 'work': setPomodoroTime(25 * 60); break;
          case 'shortBreak': setPomodoroTime(5 * 60); break;
          case 'longBreak': setPomodoroTime(15 * 60); break;
      }
  }, []);

  useEffect(() => {
    // Fix: Replace NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility.
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPomodoroRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(t => t - 1);
      }, 1000);
    } else if (isPomodoroRunning && pomodoroTime === 0) {
      // Handle session end
      new Audio('https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3').play();
      resetPomodoro(pomodoroMode === 'work' ? 'shortBreak' : 'work');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPomodoroRunning, pomodoroTime, pomodoroMode, resetPomodoro]);

  useEffect(() => {
    // Fix: Replace NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility.
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchTime(t => t + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStopwatchRunning]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-72 bg-card rounded-lg shadow-lg border border-border z-50">
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('pomodoro')}
          className={`flex-1 p-3 text-sm font-semibold text-center ${activeTab === 'pomodoro' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          Pomodoro
        </button>
        <button
          onClick={() => setActiveTab('stopwatch')}
          className={`flex-1 p-3 text-sm font-semibold text-center ${activeTab === 'stopwatch' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          Cronómetro
        </button>
      </div>
      <div className="p-4">
        {activeTab === 'pomodoro' ? (
          <div className="text-center">
             <div className="flex justify-center gap-2 mb-4">
                <button onClick={() => resetPomodoro('work')} className={`px-2 py-1 text-xs rounded-full ${pomodoroMode === 'work' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>Estudio</button>
                <button onClick={() => resetPomodoro('shortBreak')} className={`px-2 py-1 text-xs rounded-full ${pomodoroMode === 'shortBreak' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>Pausa</button>
                <button onClick={() => resetPomodoro('longBreak')} className={`px-2 py-1 text-xs rounded-full ${pomodoroMode === 'longBreak' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>Descanso</button>
            </div>
            <p className="text-5xl font-mono font-bold tracking-tighter mb-4">{formatTime(pomodoroTime)}</p>
            <button
              onClick={() => setIsPomodoroRunning(p => !p)}
              className="w-full bg-primary text-primary-foreground font-semibold py-2 rounded-md hover:bg-primary/90"
            >
              {isPomodoroRunning ? 'Pausar' : 'Iniciar'}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-5xl font-mono font-bold tracking-tighter mb-4">{formatTime(stopwatchTime)}</p>
            <div className="flex gap-4">
                <button
                    onClick={() => setIsStopwatchRunning(p => !p)}
                    className="flex-1 bg-primary text-primary-foreground font-semibold py-2 rounded-md hover:bg-primary/90"
                >
                    {isStopwatchRunning ? 'Pausar' : 'Iniciar'}
                </button>
                 <button
                    onClick={() => { setIsStopwatchRunning(false); setStopwatchTime(0); }}
                    className="flex-1 bg-secondary text-secondary-foreground font-semibold py-2 rounded-md hover:bg-accent"
                >
                    Reiniciar
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
