import {
  Progress,
  Specialty,
  Difficulty,
  LearningStyle,
  ConcentrationProfile,
  DailyTip,
  StudyTask,
  SrsItem,
} from '../types';
import { triggerProfileUpdate, triggerStudyPlanUpdate } from './eventService';
import { SPECIALTIES } from '../constants';

// Constants for localStorage keys
const LEARNING_STYLE_KEY = 'mentoria_learning_style';
const CONCENTRATION_PROFILE_KEY = 'mentoria_concentration_profile';
const PROGRESS_KEY = 'mentoria_progress';
const DAILY_TIP_KEY = 'mentoria_daily_tip';
const ACHIEVEMENTS_KEY = 'mentoria_achievements';
const STUDY_PLAN_KEY = 'mentoria_study_plan';
const SRS_QUEUE_KEY = 'mentoria_srs_queue';
const NOTES_KEY = 'mentoria_notes';
const STREAK_KEY = 'mentoria_streak_data';

interface StreakData {
    lastStudyDay: string; // YYYY-MM-DD
    currentStreak: number;
}


// Helper to get and parse data from localStorage
const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

// Helper to set data in localStorage
const setLocalStorageItem = <T>(key: string, value: T): void => {
  try {
    const item = JSON.stringify(value);
    localStorage.setItem(key, item);
  } catch (error) {
    console.error(`Error writing to localStorage key “${key}”:`, error);
  }
};

// Learning Style
export const saveLearningStyle = (style: LearningStyle): void => {
  setLocalStorageItem(LEARNING_STYLE_KEY, style);
  triggerProfileUpdate();
};
export const getLearningStyle = (): LearningStyle => {
  return getLocalStorageItem(LEARNING_STYLE_KEY, LearningStyle.None);
};

// Concentration Profile
export const saveConcentrationProfile = (profile: ConcentrationProfile): void => {
  setLocalStorageItem(CONCENTRATION_PROFILE_KEY, profile);
  triggerProfileUpdate();
};
export const getConcentrationProfile = (): ConcentrationProfile => {
  return getLocalStorageItem(CONCENTRATION_PROFILE_KEY, ConcentrationProfile.None);
};

// Progress Tracking
export const saveQuizResult = (specialty: Specialty, topic: string, difficulty: Difficulty, score: number): void => {
  const allProgress = getAllProgress();
  const newProgress: Progress = {
    date: new Date().toISOString().split('T')[0],
    specialty,
    topic,
    difficulty,
    score,
  };
  setLocalStorageItem(PROGRESS_KEY, [...allProgress, newProgress]);
};

export const getAllProgress = (): Progress[] => {
  return getLocalStorageItem(PROGRESS_KEY, []);
};

export const getTodaysProgress = (): { questions: number, correct: number } => {
  const today = new Date().toISOString().split('T')[0];
  const todaysQuizzes = getAllProgress().filter(p => p.date === today);
  const questions = todaysQuizzes.length * 10; // Assuming 10 questions per quiz
  const correct = Math.round(todaysQuizzes.reduce((sum, p) => sum + (p.score / 10), 0));
  return { questions, correct };
};

// Weekly Streak
export const updateStudyStreak = (completedDateStr: string): void => {
    const streakData = getLocalStorageItem<StreakData>(STREAK_KEY, { lastStudyDay: '', currentStreak: 0 });

    if (streakData.lastStudyDay === completedDateStr) {
        return; 
    }
    
    const today = new Date(completedDateStr);
    today.setHours(0,0,0,0);
    if (today > new Date()) return;

    const lastDay = new Date(streakData.lastStudyDay || '1970-01-01');
    lastDay.setHours(0,0,0,0);

    const diffTime = today.getTime() - lastDay.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 1) {
        streakData.currentStreak += 1;
    } else if (diffDays > 1) {
        streakData.currentStreak = 1;
    } else if (streakData.currentStreak === 0) {
        streakData.currentStreak = 1;
    }
    
    streakData.lastStudyDay = completedDateStr;
    setLocalStorageItem(STREAK_KEY, streakData);
};

export const getWeeklyStreak = (): number => {
    const streakData = getLocalStorageItem<StreakData>(STREAK_KEY, { lastStudyDay: '', currentStreak: 0 });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!streakData.lastStudyDay) return 0;
    
    const lastDay = new Date(streakData.lastStudyDay);
    lastDay.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastDay.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays > 1) {
        return 0; // Streak is broken
    }
    return streakData.currentStreak;
};


// Performance Analysis
export const getStrongTopics = (): string[] => {
  const progress = getAllProgress();
  const topicScores: { [topic: string]: { total: number, count: number } } = {};
  progress.forEach(p => {
    if (!topicScores[p.topic]) {
      topicScores[p.topic] = { total: 0, count: 0 };
    }
    topicScores[p.topic].total += p.score;
    topicScores[p.topic].count++;
  });

  return Object.entries(topicScores)
    .filter(([, data]) => data.total / data.count >= 85 && data.count >= 2)
    .map(([topic]) => topic);
};

export const getTopicsForReview = (): string[] => {
  const progress = getAllProgress();
  const topicScores: { [topic: string]: { total: number, count: number } } = {};
  progress.forEach(p => {
    if (!topicScores[p.topic]) {
      topicScores[p.topic] = { total: 0, count: 0 };
    }
    topicScores[p.topic].total += p.score;
    topicScores[p.topic].count++;
  });

  return Object.entries(topicScores)
    .filter(([, data]) => data.total / data.count < 60 && data.count >= 1)
    .map(([topic]) => topic);
};


export const getPerformanceBySpecialty = (): { specialty: Specialty, score: number }[] => {
  const progress = getAllProgress();
  const specialtyScores: { [key in Specialty]?: { total: number, count: number } } = {};

  progress.forEach(p => {
    if (!specialtyScores[p.specialty]) {
      specialtyScores[p.specialty] = { total: 0, count: 0 };
    }
    specialtyScores[p.specialty]!.total += p.score;
    specialtyScores[p.specialty]!.count++;
  });

  return SPECIALTIES.map(s => ({
    specialty: s,
    score: specialtyScores[s] ? Math.round(specialtyScores[s]!.total / specialtyScores[s]!.count) : 0,
  }));
};

export const getPerformanceOverTime = (): { date: string, score: number }[] => {
    const progress = getAllProgress();
    const dateScores: { [date: string]: { total: number, count: number } } = {};

    progress.forEach(p => {
        if (!dateScores[p.date]) {
            dateScores[p.date] = { total: 0, count: 0 };
        }
        dateScores[p.date].total += p.score;
        dateScores[p.date].count++;
    });

    return Object.entries(dateScores)
        .map(([date, data]) => ({
            date,
            score: Math.round(data.total / data.count),
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Daily Tip
export const saveDailyTip = (tip: DailyTip): void => {
  const today = new Date().toISOString().split('T')[0];
  setLocalStorageItem(DAILY_TIP_KEY, { date: today, tip });
};

export const getDailyTip = (): DailyTip | null => {
  const today = new Date().toISOString().split('T')[0];
  const cached = getLocalStorageItem<{ date: string, tip: DailyTip } | null>(DAILY_TIP_KEY, null);
  if (cached && cached.date === today) {
    return cached.tip;
  }
  return null;
};

// Achievements
export const getUnlockedAchievements = (): Set<string> => {
    return new Set(getLocalStorageItem<string[]>(ACHIEVEMENTS_KEY, []));
};

export const unlockAchievement = (id: string): void => {
    const unlocked = getUnlockedAchievements();
    if (!unlocked.has(id)) {
        unlocked.add(id);
        setLocalStorageItem(ACHIEVEMENTS_KEY, Array.from(unlocked));
    }
};

// Study Plan
export const getSavedStudyPlan = (): StudyTask[] | null => {
    return getLocalStorageItem<StudyTask[] | null>(STUDY_PLAN_KEY, null);
};

export const saveStudyPlan = (plan: StudyTask[]): void => {
    setLocalStorageItem(STUDY_PLAN_KEY, plan);
    triggerStudyPlanUpdate();
};

// SRS (Spaced Repetition System)
const SRS_LEVEL_INTERVALS = [1, 3, 7, 14, 30, 60, 120]; // days

export const getSrsQueue = (): SrsItem[] => {
    const today = new Date().toISOString().split('T')[0];
    const allItems = getLocalStorageItem<SrsItem[]>(SRS_QUEUE_KEY, []);
    return allItems.filter(item => item.nextReviewDate <= today);
};

export const updateSrsQueue = (topic: string, specialty: Specialty, score: number): void => {
    const allItems = getLocalStorageItem<SrsItem[]>(SRS_QUEUE_KEY, []);
    const itemIndex = allItems.findIndex(item => item.topic === topic && item.specialty === specialty);

    const getNextReviewDate = (level: number): string => {
        const date = new Date();
        date.setDate(date.getDate() + SRS_LEVEL_INTERVALS[level]);
        return date.toISOString().split('T')[0];
    };

    if (itemIndex > -1) {
        // Update existing item
        const item = allItems[itemIndex];
        if (score >= 80) { // Success
            item.level = Math.min(item.level + 1, SRS_LEVEL_INTERVALS.length - 1);
        } else if (score < 50) { // Fail
            item.level = Math.max(item.level - 1, 0);
        }
        item.nextReviewDate = getNextReviewDate(item.level);
        allItems[itemIndex] = item;
    } else {
        // Add new item
        const level = score >= 80 ? 1 : 0;
        const newItem: SrsItem = {
            topic,
            specialty,
            level,
            nextReviewDate: getNextReviewDate(level)
        };
        allItems.push(newItem);
    }
    
    setLocalStorageItem(SRS_QUEUE_KEY, allItems);
};

// Notes
export const getNoteForTopic = (topic: string): string => {
    const allNotes = getLocalStorageItem<Record<string, string>>(NOTES_KEY, {});
    return allNotes[topic] || '';
};

export const saveNoteForTopic = (topic: string, note: string): void => {
    const allNotes = getLocalStorageItem<Record<string, string>>(NOTES_KEY, {});
    allNotes[topic] = note;
    setLocalStorageItem(NOTES_KEY, allNotes);
};

// ICS File Generation
export const generateIcsFile = (tasks: StudyTask[]): string => {
    const icsEvents = tasks.map(task => {
        const startDate = new Date(`${task.date}T09:00:00`); // Assuming 9 AM start
        const endDate = new Date(startDate.getTime() + task.duration * 60000);

        const toIcsDate = (date: Date) => date.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';

        return [
            'BEGIN:VEVENT',
            `UID:${task.id}@mentoria.app`,
            `DTSTAMP:${toIcsDate(new Date())}`,
            `DTSTART:${toIcsDate(startDate)}`,
            `DTEND:${toIcsDate(endDate)}`,
            `SUMMARY:Mentoria: ${task.title}`,
            `DESCRIPTION:Estudiar ${task.topic} (${task.specialty}). Tipo: ${task.type}.`,
            'END:VEVENT'
        ].join('\r\n');
    }).join('\r\n');

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Mentoria//Estudio ENARM//ES',
        icsEvents,
        'END:VCALENDAR'
    ].join('\r\n');
};