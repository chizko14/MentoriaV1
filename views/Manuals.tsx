

import React, { useState, useEffect } from 'react';
import { SPECIALTIES } from '../constants';
import { Specialty } from '../types';
import { getManualTopics, getManualContent, generateImageForTopic, getTextToSpeech } from '../services/aiService';
import { Card } from '../components/Card';
import { Icon } from '../components/icons';
import { GroundingChunk } from '@google/genai';
import { VerifiedContent } from '../components/VerifiedContent';
import ReactMarkdown from 'react-markdown';
import { decode, decodeAudioData } from '../utils/audio';
import { getNoteForTopic, saveNoteForTopic } from '../services/progressService';
import { cacheService } from '../services/cacheService';
import { showToast } from '../services/eventService';

let audioContext: AudioContext | null = null;
let audioSource: AudioBufferSourceNode | null = null;

const Manuals: React.FC = () => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  // FIX: The type for the 'topics' state was incorrect. `Record<Specialty, string[]>` requires all specialties to be present in the object, but the state is initialized as an empty object and populated on demand. Changed to `Partial<Record<Specialty, string[]>>` to correctly type it as an object with optional specialty keys.
  const [topics, setTopics] = useState<Partial<Record<Specialty, string[]>>>({});
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingChunk[] | undefined>(undefined);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isIllustrating, setIsIllustrating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [note, setNote] = useState('');

  const handleSpecialtySelect = async (specialty: Specialty) => {
    setSelectedSpecialty(specialty);
    setSelectedTopic(null);
    setContent(null);
    setSources(undefined);
    setNote('');

    if (!topics[specialty]) {
        setIsLoadingTopics(true);
        const fetchedTopics = await getManualTopics(specialty);
        if (fetchedTopics) {
            setTopics(prev => ({...prev, [specialty]: fetchedTopics}));
        }
        setIsLoadingTopics(false);
    }
  };
  
  const processAndSetContent = async (rawContent: string) => {
      const imagePlaceholders = [...rawContent.matchAll(/\[GENERATE_IMAGE: (.*?)\]/g)];
      if (imagePlaceholders.length === 0) {
          setContent(rawContent);
          return rawContent; // Return the final content for caching
      }
      
      setIsIllustrating(true);
      let illustratedContent = rawContent;

      for (const placeholder of imagePlaceholders) {
          const description = placeholder[1];
          const imageUrl = await generateImageForTopic(description);
          if (imageUrl) {
              const markdownImage = `\n![Ilustración de ${description}](${imageUrl})\n`;
              illustratedContent = illustratedContent.replace(placeholder[0], markdownImage);
          } else {
              illustratedContent = illustratedContent.replace(placeholder[0], '');
          }
      }
      
      setContent(illustratedContent);
      setIsIllustrating(false);
      return illustratedContent; // Return the final content
  };

  const handleTopicSelect = async (topic: string) => {
    if (!selectedSpecialty) {
        showToast('Por favor, selecciona una especialidad primero.', 'error');
        return;
    }

    setSelectedTopic(topic);
    setContent(null);
    setSources(undefined);
    setNote(getNoteForTopic(topic));
    setIsLoadingContent(true);
    setIsIllustrating(false);

    const cachedManual = cacheService.get<{ content: string, sources: GroundingChunk[] | undefined }>(`manual_${topic}`);
    if (cachedManual) {
        setContent(cachedManual.content);
        setSources(cachedManual.sources);
        setIsLoadingContent(false);
        showToast('Manual cargado desde caché.', 'info');
        return;
    }

    const result = await getManualContent(topic, selectedSpecialty);
    if (result) {
      setSources(result.sources);
      const finalContent = await processAndSetContent(result.content);
      // Save the final, illustrated content to cache
      cacheService.set(`manual_${topic}`, { content: finalContent, sources: result.sources });
    } else {
        showToast('No se pudo generar el contenido del manual.', 'error');
    }
    setIsLoadingContent(false);
  };

  const handlePlayAudio = async () => {
    if (isPlayingAudio || !content) return;
    setIsPlayingAudio(true);
    try {
        const audioData = await getTextToSpeech(content.replace(/!\[.*?\]\(.*?\)/g, '')); // Remove image markdown for cleaner audio
        if (audioData) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const decodedBytes = decode(audioData);
            const audioBuffer = await decodeAudioData(decodedBytes, audioContext, 24000, 1);
            audioSource = audioContext.createBufferSource();
            audioSource.buffer = audioBuffer;
            audioSource.connect(audioContext.destination);
            audioSource.start();
            audioSource.onended = () => {
                setIsPlayingAudio(false);
                audioSource?.disconnect();
                audioContext?.close();
            };
        } else {
            setIsPlayingAudio(false);
        }
    } catch (error) {
        console.error("Audio playback error:", error);
        setIsPlayingAudio(false);
    }
  };

  const handleSaveNote = () => {
      if (!selectedTopic) {
        showToast('Por favor, selecciona un tema primero.', 'error');
        return;
      }
      saveNoteForTopic(selectedTopic, note);
      showToast('¡Nota guardada!', 'success');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-full">
      {/* Specialties Column */}
      <Card className="md:col-span-1 lg:col-span-1">
        <h3 className="text-lg font-semibold p-4 -m-6 mb-4 border-b">Especialidades</h3>
        <div className="space-y-1 h-[calc(100vh-150px)] overflow-y-auto pr-2">
            {SPECIALTIES.map(s => (
                <button 
                    key={s} 
                    onClick={() => handleSpecialtySelect(s)} 
                    className={`w-full text-left font-semibold p-2 rounded-md transition-colors ${selectedSpecialty === s ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                >
                    {s}
                </button>
            ))}
        </div>
      </Card>
      
      {/* Topics Column */}
      <Card className="md:col-span-1 lg:col-span-1">
          <h3 className="text-lg font-semibold p-4 -m-6 mb-4 border-b">{selectedSpecialty || "Temas"}</h3>
          <div className="space-y-1 h-[calc(100vh-150px)] overflow-y-auto pr-2">
            {isLoadingTopics && (
                <div className="text-center text-muted-foreground p-4">Cargando temas...</div>
            )}
            {!isLoadingTopics && selectedSpecialty && topics[selectedSpecialty]?.map(t => (
                <button key={t} onClick={() => handleTopicSelect(t)} className={`w-full text-left text-sm p-2 rounded-md transition-colors ${selectedTopic === t ? 'bg-accent font-semibold' : 'hover:bg-accent'}`}>
                    {t}
                </button>
            ))}
            {!isLoadingTopics && !selectedSpecialty && (
                <div className="text-center text-muted-foreground p-4">Selecciona una especialidad.</div>
            )}
          </div>
      </Card>

      {/* Content Column */}
      <Card className="md:col-span-2 lg:col-span-2">
        <div className="flex justify-between items-center p-4 -m-6 mb-4 border-b">
            <h3 className="text-lg font-semibold tracking-tight">{selectedTopic || "Contenido del Manual"}</h3>
            {selectedTopic && (
                <div className="flex items-center gap-2">
                    <button onClick={handlePlayAudio} disabled={isPlayingAudio || isLoadingContent} title="Leer en voz alta" className="p-2 rounded-full hover:bg-accent disabled:opacity-50">
                        <Icon name="volume" className={`w-5 h-5 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                    </button>
                </div>
            )}
        </div>

        <div className="h-[calc(100vh-150px)] overflow-y-auto pr-2">
            {(isLoadingContent || isIllustrating) && (
                <div className="flex flex-col items-center justify-center h-full">
                    <Icon name="aiLogo" className="w-10 h-10 animate-spin text-primary mr-4" />
                    <p className="text-lg text-muted-foreground mt-4">
                        {isLoadingContent ? "Generando contenido..." : "Ilustrando contenido..."}
                    </p>
                </div>
            )}
            {!isLoadingContent && !isIllustrating && content && (
                <div>
                    <article className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{content}</ReactMarkdown>
                        <VerifiedContent sources={sources} />
                    </article>

                    <div className="mt-8 pt-6 border-t border-border">
                        <h4 className="text-lg font-semibold mb-4 flex items-center">
                            <Icon name="book" className="w-5 h-5 mr-2" />
                            Mis Notas
                        </h4>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Escribe tus notas personales sobre este tema aquí..."
                            className="w-full h-40 p-3 bg-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <div className="text-right mt-3">
                            <button onClick={handleSaveNote} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm font-semibold">
                            Guardar Nota
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {!isLoadingContent && !isIllustrating && !selectedTopic && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Icon name="book" className="w-16 h-16 mx-auto mb-4" />
                    <p>Selecciona un tema para ver el manual.</p>
                </div>
            )}
        </div>
      </Card>
    </div>
  );
};

export default Manuals;
