import React from 'react';
import { GroundingChunk } from '@google/genai';

interface VerifiedContentProps {
  sources: GroundingChunk[] | undefined;
}

export const VerifiedContent: React.FC<VerifiedContentProps> = ({ sources }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  const validSources = sources.filter(source => source.web && source.web.uri);

  if (validSources.length === 0) {
      return null;
  }

  return (
    <div className="mt-6 p-4 bg-green-50 dark:bg-gray-700 border-l-4 border-green-500 rounded-r-lg">
      <h4 className="font-semibold text-green-800 dark:text-green-300">Contenido verificado con Búsqueda de Google</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Fuentes consultadas:</p>
      <ul className="list-disc list-inside mt-2 space-y-1">
        {validSources.map((source, index) => (
          <li key={index} className="text-sm">
            <a
              href={source.web?.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {source.web?.title || source.web?.uri}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
