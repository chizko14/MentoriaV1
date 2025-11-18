// Fix: Added all necessary type definitions for the application.
export type Specialty =
  | 'Cardiología'
  | 'Dermatología'
  | 'Endocrinología'
  | 'Gastroenterología'
  | 'Ginecología y Obstetricia'
  | 'Medicina Interna'
  | 'Pediatría'
  | 'Psiquiatría'
  | 'Cirugía General'
  | 'Neurología'
  | 'Nefrología'
  | 'Oftalmología';

export enum View {
  Dashboard = 'dashboard',
  StudyPlan = 'study_plan',
  Simulator = 'simulator',
  Manuals = 'manuals',
  Profile = 'profile',
  Admin = 'admin',
  AnnualPlan = 'annual_plan',
}

export type Difficulty = 'Fácil' | 'Intermedio' | 'Difícil';

export interface Progress {
  date: string;
  specialty: Specialty;
  topic: string;
  difficulty: Difficulty;
  score: number;
}

export interface AIMessage {
  sender: 'user' | 'ai';
  text: string;
}

export enum LearningStyle {
    Visual = 'Visual',
    Auditory = 'Auditivo',
    ReadingWriting = 'Lectura/Escritura',
    Kinesthetic = 'Kinestésico',
    Multimodal = 'Multimodal',
    None = 'No Determinado'
}

export enum ConcentrationProfile {
    Low = 'Bajo',
    Moderate = 'Moderado',
    Good = 'Bueno',
    High = 'Alto',
    None = 'No Determinado'
}

export interface Question {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

export interface Quiz {
    specialty: Specialty;
    topic: string;
    difficulty: Difficulty;
    questions: Question[];
}

export interface Flashcard {
    front: string;
    back: string;
}

export interface ClinicalCaseQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
}

export interface ClinicalCase {
    scenario: string;
    questions: ClinicalCaseQuestion[];
}

export interface FillInTheBlanks {
    sentence: string; // e.g., "La [BLANK] es la principal causa de [BLANK]."
    blanks: string[]; // Correct answers for the blanks in order
}

export type StudyTaskType = 'flashcards' | 'clinical_case' | 'fill_in_the_blanks' | 'quiz' | 'manual';

export interface StudyTask {
    id: string;
    date: string; // YYYY-MM-DD
    title: string;
    topic: string;
    specialty: Specialty;
    type: StudyTaskType;
    duration: number;
    difficulty: Difficulty;
    completed: boolean;
    content: Flashcard[] | ClinicalCase | FillInTheBlanks | Quiz | string;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: 'flame' | 'achievement' | 'quiz' | 'book' | 'chart';
}

export interface DailyTip {
    tip: string;
    challenge: string;
}

export interface SrsItem {
    topic: string;
    specialty: Specialty;
    level: number;
    nextReviewDate: string; // YYYY-MM-DD
}

export interface UploadProgress {
    currentFile: number;
    totalFiles: number;
    fileName: string;
    status: 'uploading' | 'processing' | 'success' | 'error';
    message: string;
}

export interface MasterPlanWeek {
    weekNumber: number;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    primarySpecialty: string; // Ej: "Cardiología"
    focusArea: string; // Ej: "Insuficiencia Cardíaca y Arritmias"
    description: string; // Breve descripción del objetivo de la semana
    status: 'locked' | 'current' | 'completed' | 'pending';
}

export interface AnnualMasterPlan {
    id: string;
    createdAt: string;
    targetExamDate: string;
    weeks: MasterPlanWeek[];
}