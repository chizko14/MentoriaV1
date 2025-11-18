import React from 'react';
import { Progress, Specialty } from '../types';
import { Card } from './Card';
import { Icon } from './icons';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { getPerformanceBySpecialty, getPerformanceOverTime } from '../services/progressService';

type PerformanceChartsProps = {
  progressData: Progress[];
};

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ progressData }) => {
  const performanceBySpecialty = getPerformanceBySpecialty();
  const performanceOverTime = getPerformanceOverTime();

  if (progressData.length === 0) {
    return (
      <Card title="Progreso General" titleIcon={<Icon name="chart" className="w-6 h-6" />}>
        <div className="text-center text-muted-foreground py-8 h-96 flex flex-col justify-center items-center">
            <p>Aún no hay datos de progreso.</p>
            <p>¡Completa un quiz para empezar a ver tus analíticas!</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title="Rendimiento por Especialidad" titleIcon={<Icon name="chart" className="w-6 h-6" />}>
            <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceBySpecialty}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="specialty" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Radar name="Puntaje" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                </RadarChart>
            </ResponsiveContainer>
        </Card>
         <Card title="Progreso Longitudinal" titleIcon={<Icon name="chart" className="w-6 h-6" />}>
             <ResponsiveContainer width="100%" height={300}>
                 <LineChart data={performanceOverTime} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))'
                    }} />
                    <Legend />
                    <Line type="monotone" dataKey="score" name="Puntaje Promedio" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    </div>
  );
};