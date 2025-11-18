import React from 'react';
import ReactMarkdown from 'react-markdown';

interface ManualPlayerProps {
    content: string;
    onComplete: () => void;
}

export const ManualPlayer: React.FC<ManualPlayerProps> = ({ content, onComplete }) => {
    return (
        <div>
            <article className="prose dark:prose-invert max-w-none mb-6">
                <ReactMarkdown>{content}</ReactMarkdown>
            </article>
            <div className="text-right">
                <button onClick={onComplete} className="btn-primary">
                    Lectura Completada
                </button>
            </div>
        </div>
    );
};