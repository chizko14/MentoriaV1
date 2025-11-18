import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Icon } from '../components/icons';
import { Button } from '../components/ui/Button';
import { showToast } from '../services/eventService';
import { uploadQueue } from '../services/uploadService';

const Admin: React.FC = () => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const files = Array.from(event.target.files);
            const pdfFiles = files.filter(file => file.type === 'application/pdf');

            if (pdfFiles.length !== files.length) {
                showToast('Se han omitido archivos que no son PDF.', 'info');
            }

            if (pdfFiles.length > 0) {
                setSelectedFiles(pdfFiles);
            }
        }
    };

    const handleUpload = () => {
        if (selectedFiles.length === 0) {
            showToast('Primero selecciona los archivos a subir.', 'info');
            return;
        }

        uploadQueue.addFiles(selectedFiles);
        showToast(`Se añadieron ${selectedFiles.length} libro(s) a la cola de carga.`, 'success');

        setSelectedFiles([]);
        
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Card title="Administrar Conocimiento">
                {/* File Upload Section */}
                <div className="text-center">
                     <h3 className="font-bold text-foreground mb-2">Subir Libros (PDF)</h3>
                    <p className="text-muted-foreground mb-4">
                        Sube aquí tus materiales de estudio. La carga se procesará en segundo plano.
                        La API Key de Google se obtiene automáticamente del entorno de la aplicación.
                    </p>
                    
                    <div className="mt-4 p-6 border-2 border-dashed border-border rounded-lg">
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".pdf"
                            multiple
                            onChange={handleFileChange}
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer flex flex-col items-center"
                        >
                            <Icon name="book" className="w-12 h-12 text-muted-foreground mb-2" />
                            <span className="font-semibold text-primary">
                                {selectedFiles.length > 0 ? `${selectedFiles.length} archivo(s) seleccionados` : 'Seleccionar archivos PDF'}
                            </span>
                             {selectedFiles.length > 0 && (
                                <span className="text-sm text-muted-foreground mt-1">
                                    Haz clic para cambiar la selección
                                </span>
                            )}
                        </label>
                    </div>

                    <Button
                        onClick={handleUpload}
                        disabled={selectedFiles.length === 0}
                        className="mt-6 w-full"
                    >
                       Añadir a la Cola de Carga
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default Admin;
