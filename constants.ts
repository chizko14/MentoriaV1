import { View, Specialty, Achievement } from './types';

export const SPECIALTIES: Specialty[] = [
  'Cardiología',
  'Dermatología',
  'Endocrinología',
  'Gastroenterología',
  'Ginecología y Obstetricia',
  'Medicina Interna',
  'Pediatría',
  'Psiquiatría',
  'Cirugía General',
  'Neurología',
  'Nefrología',
  'Oftalmología',
];

// Fix: Use 'as const' to infer the icon properties as specific string literals instead of the general 'string' type.
// This resolves the type mismatch with the 'IconName' prop in the Sidebar component.
export const NAV_ITEMS = [
  { view: View.Dashboard, icon: 'home', label: 'Dashboard' },
  { view: View.StudyPlan, icon: 'calendar', label: 'Plan de Estudio' },
  { view: View.AnnualPlan, icon: 'calendar', label: 'Plan Anual' },
  { view: View.Simulator, icon: 'quiz', label: 'Simulador' },
  { view: View.Manuals, icon: 'book', label: 'Manuales' },
  { view: View.Profile, icon: 'profile', label: 'Perfil' },
  { view: View.Admin, icon: 'achievement', label: 'Admin Libros' },
] as const;

export const ACHIEVEMENTS: Achievement[] = [
    { id: 'first_quiz', name: 'Rompiendo el Hielo', description: 'Completa tu primera simulación.', icon: 'quiz' },
    { id: 'streak_3', name: 'En Racha', description: 'Mantén una racha de estudio de 3 días.', icon: 'flame' },
    { id: 'streak_7', name: 'Imparable', description: 'Mantén una racha de estudio de 7 días.', icon: 'flame' },
    { id: 'perfect_score', name: 'Perfeccionista', description: 'Obtén un 100% en una simulación.', icon: 'achievement' },
    { id: 'cardiologist', name: 'Corazón de León', description: 'Domina un tema de Cardiología.', icon: 'chart' },
    { id: 'first_manual', name: 'Sabelotodo', description: 'Lee tu primer manual completo.', icon: 'book' },
];