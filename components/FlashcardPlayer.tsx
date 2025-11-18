
// Fix: Implemented the missing FlashcardPlayer component.
import React, { useState } from 'react';
import { Flashcard } from '../types';
import { Icon } from './icons';
import { getTextToSpeech } from '../services/aiService';
import { decode, decodeAudioData } from '../utils/audio';

let audioContext: AudioContext | null = null;
let audioSource: AudioBufferSourceNode | null = null;

interface FlashcardPlayerProps {
    flashcards: Flashcard[];
    onComplete: () => void;
}

export const FlashcardPlayer: React.FC<FlashcardPlayerProps> = ({ flashcards, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
        return <p>No hay flashcards para mostrar o el formato es incorrecto.</p>;
    }

    const handleNext = () => {
        if (currentIndex < flashcards.length - 1) {
            setIsFlipped(false);
            setCurrentIndex(currentIndex + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handlePlayAudio = async (text: string) => {
        if (isPlayingAudio) return;
        setIsPlayingAudio(true);
        try {
            const audioData = await getTextToSpeech(text);
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


    const currentCard = flashcards[currentIndex];

    return (
        <div className="flex flex-col items-center">
            <p className="text-muted-foreground mb-2">
                Flashcard {currentIndex + 1} de {flashcards.length}
            </p>
            <div
                className="w-full max-w-lg h-64 [perspective:1000px] cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div
                    className={`relative w-full h-full [transform-style:preserve-3d] transition-transform duration-500 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                >
                    {/* Front */}
                    <div className="absolute w-full h-full [backface-visibility:hidden] flex items-center justify-center p-6 bg-card border border-border rounded-lg shadow-md">
                        <p className="text-xl text-center">{currentCard.front}</p>
                         <button onClick={(e) => { e.stopPropagation(); handlePlayAudio(currentCard.front); }} disabled={isPlayingAudio} className="absolute bottom-4 right-4 p-2 rounded-full hover:bg-accent disabled:opacity-50">
                            <Icon name="volume" className="w-5 h-5 text-muted-foreground"/>
                        </button>
                    </div>
                    {/* Back */}
                    <div className="absolute w-full h-full [backface-visibility:hidden] flex items-center justify-center p-6 bg-secondary border border-border rounded-lg shadow-md [transform:rotateY(180deg)]">
                         <p className="text-lg text-center">{currentCard.back}</p>
                          <button onClick={(e) => { e.stopPropagation(); handlePlayAudio(currentCard.back); }} disabled={isPlayingAudio} className="absolute bottom-4 right-4 p-2 rounded-full hover:bg-accent disabled:opacity-50">
                            <Icon name="volume" className="w-5 h-5 text-muted-foreground"/>
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center justify-center space-x-8 mt-6">
                <button onClick={handlePrev} disabled={currentIndex === 0} className="p-2 rounded-full bg-secondary disabled:opacity-50">
                    <Icon name="chevronLeft" className="w-6 h-6" />
                </button>
                 <button onClick={() => setIsFlipped(!isFlipped)} className="btn-secondary px-6">
                    Voltear
                </button>
                <button onClick={handleNext} className="p-2 rounded-full bg-secondary">
                    <Icon name="chevronRight" className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};
