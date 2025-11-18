import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { AIAssistant } from './components/AI_Assistant.tsx';
import { ThemeProvider } from './hooks/useTheme.ts'; 
import { StudyTask, View, LearningStyle } from './types.ts';
import { ToastContainer } from './components/Toast.tsx';
import { useToastManager } from './hooks/useToastManager.ts';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { LearningStyleModal } from './components/LearningStyleModal.tsx';
import { getLearningStyle } from './services/progressService.ts';
import { Spinner } from './components/ui/Spinner.tsx';
import { UploadProgressWidget } from './components/UploadProgressWidget.tsx';

const Dashboard = lazy(() => import('./views/Dashboard.tsx'));
const StudyPlan = lazy(() => import('./views/StudyPlan.tsx'));
const Simulator = lazy(() => import('./views/Simulator.tsx'));
const Manuals = lazy(() => import('./views/Manuals.tsx'));
const Profile = lazy(() => import('./views/Profile.tsx'));
const Admin = lazy(() => import('./views/Admin.tsx'));
const AnnualPlanView = lazy(() => import('./views/AnnualPlanView.tsx'));

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>(View.Dashboard);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeStudyTask, setActiveStudyTask] = useState<StudyTask | null>(null);
    const { toasts, removeToast } = useToastManager();
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showLearningStyleTest, setShowLearningStyleTest] = useState(false);

    useEffect(() => {
        // Check if onboarding is needed on initial load.
        if (getLearningStyle() === LearningStyle.None) {
            setShowOnboarding(true);
        }
    }, []);

    const handleStartPersonalization = () => {
        setShowOnboarding(false);
        setShowLearningStyleTest(true);
    };

    const handleCloseLearningStyleTest = () => {
        setShowLearningStyleTest(false);
    };

    const onNavigateToDay = () => {
        setCurrentView(View.StudyPlan);
    }

    const renderView = () => {
        switch (currentView) {
            case View.Dashboard:
                return <Dashboard setCurrentView={setCurrentView} setActiveStudyTask={setActiveStudyTask} />;
            case View.StudyPlan:
                return <StudyPlan setCurrentView={setCurrentView} setActiveStudyTask={setActiveStudyTask} />;
            case View.Simulator:
                return <Simulator initialTask={activeStudyTask} setActiveStudyTask={setActiveStudyTask} setCurrentView={setCurrentView} />;
            case View.Manuals:
                return <Manuals />;
            case View.Profile:
                return <Profile />;
            case View.Admin:
                return <Admin />;
            case View.AnnualPlan:
                return <AnnualPlanView onNavigateToDay={onNavigateToDay} />;
            default:
                return <Dashboard setCurrentView={setCurrentView} setActiveStudyTask={setActiveStudyTask} />;
        }
    };

    return (
        <ThemeProvider>
            <div className="flex h-screen bg-background text-foreground">
                <Sidebar
                    currentView={currentView}
                    setCurrentView={setCurrentView}
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                />
                <div className="flex flex-col flex-1">
                    <Header currentView={currentView} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} setCurrentView={setCurrentView} />
                    <main className="flex-1 p-6 overflow-y-auto">
                        <Suspense fallback={
                            <div className="flex items-center justify-center h-full">
                                <Spinner className="w-12 h-12" />
                            </div>
                        }>
                            {renderView()}
                        </Suspense>
                    </main>
                </div>
                <AIAssistant />
                <ToastContainer toasts={toasts} onDismiss={removeToast} />
                <UploadProgressWidget />
            </div>
            {/* Onboarding modals will overlay the main app */}
            <OnboardingModal isOpen={showOnboarding} onStart={handleStartPersonalization} />
            <LearningStyleModal isOpen={showLearningStyleTest} onClose={handleCloseLearningStyleTest} />
        </ThemeProvider>
    );
};

export default App;