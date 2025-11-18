import { uploadStudyMaterial } from './aiService';
import { updateUploadProgress, showToast } from './eventService';

class UploadQueue {
    private queue: File[] = [];
    private isProcessing = false;

    addFiles(files: File[]) {
        this.queue.push(...files);
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    private async processQueue() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            // Briefly show success then hide
            setTimeout(() => updateUploadProgress(null), 5000);
            return;
        }
        
        this.isProcessing = true;
        const totalFiles = this.queue.length;
        let initialTotal = totalFiles;
        
        while(this.queue.length > 0) {
            const fileToUpload = this.queue.shift()!;
            const currentFileNum = initialTotal - this.queue.length;
            
            try {
                updateUploadProgress({
                    currentFile: currentFileNum,
                    totalFiles: initialTotal,
                    fileName: fileToUpload.name,
                    status: 'uploading',
                    message: 'Subiendo...',
                });
                
                const responseMessage = await uploadStudyMaterial(fileToUpload);
                
                updateUploadProgress({
                    currentFile: currentFileNum,
                    totalFiles: initialTotal,
                    fileName: fileToUpload.name,
                    status: 'success',
                    message: 'Procesado con éxito',
                });
                showToast(responseMessage, 'success');

            } catch (error) {
                 let errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
                
                updateUploadProgress({
                    currentFile: currentFileNum,
                    totalFiles: initialTotal,
                    fileName: fileToUpload.name,
                    status: 'error',
                    message: errorMessage,
                });
                showToast(`Error con ${fileToUpload.name}: ${errorMessage}`, 'error');
            }
            // Wait a bit before the next file to let UI update
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        this.isProcessing = false;
        // Keep the final status message for a while
        setTimeout(() => updateUploadProgress(null), 10000);
    }
}

export const uploadQueue = new UploadQueue();
