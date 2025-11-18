import React, { useState, useEffect } from 'react';
import { UploadProgress } from '../types';
import { uploadProgressEmitter } from '../services/eventService';
import { Icon } from './icons';
import { Spinner } from './ui/Spinner';

export const UploadProgressWidget: React.FC = () => {
    const [progress, setProgress] = useState<UploadProgress | null>(null);

    useEffect(() => {
        const unsubscribe = uploadProgressEmitter.subscribe(setProgress);
        return () => unsubscribe();
    }, []);

    if (!progress) {
        return null;
    }

    const { currentFile, totalFiles, fileName, status, message } = progress;
    const percentage = totalFiles > 0 ? (currentFile / totalFiles) * 100 : 0;

    const statusConfig = {
        uploading: { icon: <Spinner className="w-4 h-4" />, color: 'text-blue-500' },
        processing: { icon: <Spinner className="w-4 h-4" />, color: 'text-blue-500' },
        success: { icon: <Icon name="checkCircle" className="w-4 h-4" />, color: 'text-green-500' },
        error: { icon: <Icon name="close" className="w-4 h-4" />, color: 'text-red-500' },
    };

    const currentStatus = statusConfig[status];

    return (
        <div className="fixed bottom-4 left-4 w-80 bg-card border border-border rounded-lg shadow-lg z-50 p-3">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">Procesando Libros</h4>
                <span className="text-xs text-muted-foreground">{currentFile}/{totalFiles}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 mb-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
            <div className="flex items-center text-xs">
                <div className={`mr-2 ${currentStatus.color}`}>
                    {currentStatus.icon}
                </div>
                <div className="flex flex-col overflow-hidden">
                   <p className="truncate text-muted-foreground font-medium" title={fileName}>{fileName}</p>
                   <p className={`truncate ${currentStatus.color}`} title={message}>{message}</p>
                </div>
            </div>
        </div>
    );
};
