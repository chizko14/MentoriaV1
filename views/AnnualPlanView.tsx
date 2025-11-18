import React, { useState, useEffect } from 'react';
import { AnnualMasterPlan, MasterPlanWeek } from '../types'; // Asegúrate de tener los tipos definidos
import { Icon } from '../components/icons';
import { Button } from '../components/ui/Button';
import { generateStudyPlan } from '../services/aiService'; // La función que ya arreglamos
import { saveStudyPlan } from '../services/progressService';

interface AnnualPlanViewProps {
  onNavigateToDay: () => void; // Para cambiar a la vista "Dashboard" o "Día"
}

const AnnualPlanView: React.FC<AnnualPlanViewProps> = ({ onNavigateToDay }) => {
  const [masterPlan, setMasterPlan] = useState<AnnualMasterPlan | null>(null);
  const [loadingWeekId, setLoadingWeekId] = useState<number | null>(null);

  useEffect(() => {
    // Cargar el plan maestro del almacenamiento local
    const saved = localStorage.getItem('mentoria_master_plan');
    if (saved) {
      setMasterPlan(JSON.parse(saved));
    }
  }, []);

  // Función para "Entrar" a una semana y generar sus detalles
  const handleOpenWeek = async (week: MasterPlanWeek) => {
    if (week.status === 'locked') return;

    setLoadingWeekId(week.weekNumber);
    try {
      // 1. Aquí conectamos el Macro con el Micro
      // Usamos los datos de la semana maestra para generar el detalle diario
      const detailedTasks = await generateStudyPlan(
        2, // Horas por defecto (o sacar del perfil)
        ['Lu', 'Ma', 'Mi', 'Ju', 'Vi'], // Días por defecto
        week.startDate,
        week.endDate
      );

      if (detailedTasks) {
        // 2. Guardamos el plan detallado actual
        saveStudyPlan(detailedTasks);
        // 3. Navegamos a la vista de estudio
        onNavigateToDay();
      }
    } catch (e) {
      console.error(e);
      alert("Error generando el detalle de la semana");
    } finally {
      setLoadingWeekId(null);
    }
  };

  if (!masterPlan) {
    return (
      <div className="text-center p-10">
        <h2 className="text-xl font-bold text-gray-700">No hay un Plan Anual activo</h2>
        <p className="text-gray-500 mb-4">Necesitas configurar tu fecha de examen primero.</p>
        {/* Aquí pondrías un botón para ir al Onboarding */}
      </div>
    );
  }

  // Agrupar semanas por mes para visualización limpia
  const weeksByMonth = masterPlan.weeks.reduce((acc: any, week) => {
    const month = new Date(week.startDate).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(week);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">Tu Camino al ENARM</h1>
        <p className="text-gray-600">
          Objetivo: {new Date(masterPlan.targetExamDate).toLocaleDateString()}
        </p>
      </header>

      <div className="space-y-8">
        {Object.entries(weeksByMonth).map(([month, weeks]: [string, any]) => (
          <div key={month} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-700 capitalize">{month}</h3>
            </div>
            
            <div className="divide-y divide-gray-100">
              {weeks.map((week: MasterPlanWeek) => (
                <div 
                  key={week.weekNumber} 
                  className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors
                    ${week.status === 'current' ? 'bg-blue-50 border-l-4 border-primary' : ''}
                  `}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Semana {week.weekNumber}
                      </span>
                      {week.status === 'current' && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          Actual
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-800">{week.primarySpecialty}</h4>
                    <p className="text-sm text-gray-500">{week.focusArea}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {week.startDate} - {week.endDate}
                    </p>
                  </div>

                  <div>
                    {week.status === 'completed' ? (
                      <div className="flex flex-col items-center text-green-600">
                        <Icon name="checkCircle" className="w-8 h-8" />
                        <span className="text-xs font-medium">Listo</span>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant={week.status === 'current' ? 'primary' : 'secondary'}
                        disabled={loadingWeekId === week.weekNumber}
                        onClick={() => handleOpenWeek(week)}
                      >
                        {loadingWeekId === week.weekNumber ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                          week.status === 'current' ? 'Estudiar' : 'Ver'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnualPlanView;