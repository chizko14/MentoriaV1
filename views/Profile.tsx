import React, { useState, useEffect } from 'react';
import { getLearningStyle, getConcentrationProfile, getStrongTopics, getTopicsForReview, getUnlockedAchievements } from '../services/progressService';
import { LearningStyle, ConcentrationProfile, Achievement } from '../types';
import { Card } from '../components/Card';
import { LearningStyleModal } from '../components/LearningStyleModal';
import { ConcentrationTestModal } from '../components/ConcentrationTestModal';
import { ACHIEVEMENTS } from '../constants';
import { Icon } from '../components/icons';
import { Button } from '../components/ui/Button';

const Profile: React.FC = () => {
    const [learningStyle, setLearningStyle] = useState<LearningStyle>(LearningStyle.None);
    const [concentration, setConcentration] = useState<ConcentrationProfile>(ConcentrationProfile.None);
    const [strongTopics, setStrongTopics] = useState<string[]>([]);
    const [reviewTopics, setReviewTopics] = useState<string[]>([]);
    const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
    
    const [isLearningModalOpen, setLearningModalOpen] = useState(false);
    const [isConcentrationModalOpen, setConcentrationModalOpen] = useState(false);

    const loadProfile = () => {
        setLearningStyle(getLearningStyle());
        setConcentration(getConcentrationProfile());
        setStrongTopics(getStrongTopics());
        setReviewTopics(getTopicsForReview());
        setUnlockedAchievements(getUnlockedAchievements());
    };

    useEffect(() => {
        loadProfile();
    }, []);
    
    const handleCloseModals = () => {
        setLearningModalOpen(false);
        setConcentrationModalOpen(false);
        loadProfile(); // Reload profile after modals close
    }

    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-6">Mi Perfil de Estudiante</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Perfil de Aprendizaje">
                   <div className="space-y-4">
                        <div>
                           <h4 className="font-semibold">Estilo de Aprendizaje:</h4>
                           <p className="text-primary text-lg">{learningStyle}</p>
                           {learningStyle === LearningStyle.None && <p className="text-sm text-muted-foreground">Completa el test para personalizar tu experiencia.</p>}
                        </div>
                         <div>
                           <h4 className="font-semibold">Perfil de Concentración:</h4>
                           <p className="text-primary text-lg">{concentration}</p>
                           {concentration === ConcentrationProfile.None && <p className="text-sm text-muted-foreground">Realiza la prueba para entender mejor tu enfoque.</p>}
                        </div>
                        <div className="flex space-x-4 pt-4">
                             <Button onClick={() => setLearningModalOpen(true)} size="sm">
                                Test de Aprendizaje
                            </Button>
                             <Button onClick={() => setConcentrationModalOpen(true)} variant="secondary" size="sm">
                                Prueba de Concentración
                            </Button>
                        </div>
                   </div>
                </Card>
                <Card title="Resumen de Rendimiento">
                    <div>
                        <h4 className="font-semibold text-green-600 dark:text-green-400">Temas Dominados</h4>
                        {strongTopics.length > 0 ? (
                            <ul className="list-disc list-inside text-sm mt-2">
                                {strongTopics.slice(0, 5).map(t => <li key={t}>{t}</li>)}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground mt-2">Sigue practicando para dominar temas.</p>}
                    </div>
                    <div className="mt-4">
                        <h4 className="font-semibold text-yellow-600 dark:text-yellow-400">Temas para Repasar</h4>
                        {reviewTopics.length > 0 ? (
                            <ul className="list-disc list-inside text-sm mt-2">
                                {reviewTopics.slice(0, 5).map(t => <li key={t}>{t}</li>)}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground mt-2">¡Excelente! No hay temas con bajo rendimiento.</p>}
                    </div>
                </Card>
            </div>
            
            <div className="mt-6">
                <Card title="Logros Desbloqueados">
                    {ACHIEVEMENTS.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {ACHIEVEMENTS.map(ach => (
                                <div key={ach.id} className={`flex flex-col items-center text-center p-3 rounded-lg ${unlockedAchievements.has(ach.id) ? 'bg-amber-100 dark:bg-amber-800/50' : 'bg-secondary opacity-50'}`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${unlockedAchievements.has(ach.id) ? 'bg-amber-400' : 'bg-muted'}`}>
                                        <Icon name={ach.icon} className="w-7 h-7 text-white" />
                                    </div>
                                    <h5 className="font-semibold text-sm mt-2">{ach.name}</h5>
                                    <p className="text-xs text-muted-foreground">{ach.description}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-muted-foreground">Sigue estudiando para desbloquear logros.</p>}
                </Card>
            </div>

            <LearningStyleModal isOpen={isLearningModalOpen} onClose={handleCloseModals} />
            <ConcentrationTestModal isOpen={isConcentrationModalOpen} onClose={handleCloseModals} />
        </div>
    );
};

export default Profile;