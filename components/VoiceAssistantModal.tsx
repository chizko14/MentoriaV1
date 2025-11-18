import React, { useState, useEffect, useRef } from 'react';
// FIX: Removed non-exported 'LiveSession' type.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Modal } from './Modal';
import { Icon } from './icons';
import { encode, decode, decodeAudioData } from '../utils/audio';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Status = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'LISTENING' | 'SPEAKING' | 'ERROR';

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<Status>('IDLE');
  const [transcription, setTranscription] = useState<string[]>([]);
  // FIX: Changed type from Promise<LiveSession> to any to handle non-exported type.
  const sessionPromiseRef = useRef<any | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const cleanUp = () => {
    console.log("Cleaning up resources...");
    sessionPromiseRef.current?.then((session: any) => session.close());
    scriptProcessorRef.current?.disconnect();
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    sessionPromiseRef.current = null;
    setStatus('IDLE');
    setTranscription([]);
  };
  
  const startConversation = async () => {
    setStatus('CONNECTING');
    try {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        nextStartTimeRef.current = 0;

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                systemInstruction: 'You are a friendly and helpful medical study tutor named Mentoria. Keep your answers concise and focused on medical topics for the ENARM exam.',
            },
            callbacks: {
                onopen: () => {
                    setStatus('CONNECTED');
                    const source = inputAudioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!);
                    scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob: Blob = {
                            data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        sessionPromiseRef.current?.then((session: any) => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    source.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription?.text) {
                        setStatus('LISTENING');
                        setTranscription(prev => [...prev, `**Tú:** ${message.serverContent.inputTranscription.text}`]);
                    }
                    if (message.serverContent?.outputTranscription?.text) {
                         setStatus('SPEAKING');
                        setTranscription(prev => [...prev, `**Mentoria:** ${message.serverContent.outputTranscription.text}`]);
                    }

                    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                    if (audioData && outputAudioContextRef.current) {
                        const outputCtx = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                        const source = outputCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputCtx.destination);
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error("Session error:", e);
                    setTranscription(prev => [...prev, "Se ha producido un error. Por favor, inténtalo de nuevo."]);
                    setStatus('ERROR');
                },
                onclose: (e: CloseEvent) => {
                    console.log("Session closed.");
                },
            },
        });
    } catch (err) {
        console.error("Failed to start conversation:", err);
        setStatus('ERROR');
        setTranscription(["No se pudo acceder al micrófono. Por favor, comprueba los permisos."]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startConversation();
    } else {
      cleanUp();
    }
    return () => {
        if (isOpen) cleanUp();
    }
  }, [isOpen]);

  const getStatusIndicator = () => {
      switch(status) {
          case 'IDLE': return { text: "Inactivo", color: "bg-gray-500" };
          case 'CONNECTING': return { text: "Conectando...", color: "bg-yellow-500 animate-pulse" };
          case 'CONNECTED': return { text: "Conectado. ¡Habla ahora!", color: "bg-green-500" };
          case 'LISTENING': return { text: "Escuchando...", color: "bg-blue-500 animate-pulse" };
          case 'SPEAKING': return { text: "Hablando...", color: "bg-purple-500" };
          case 'ERROR': return { text: "Error", color: "bg-red-500" };
      }
  }
  const { text, color } = getStatusIndicator();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tutor por Voz">
        <div className="flex flex-col h-[60vh]">
            <div className="flex items-center justify-center mb-4">
                <span className={`w-3 h-3 rounded-full mr-2 ${color}`}></span>
                <span className="text-sm font-medium text-muted-foreground">{text}</span>
            </div>
            <div className="flex-1 p-4 bg-secondary rounded-lg overflow-y-auto">
                {transcription.map((line, index) => (
                    <p key={index} className="mb-2">{line.startsWith('**Tú:**') ? 
                        <span className="font-semibold text-primary">{line}</span> :
                        <span className="text-foreground">{line}</span>
                    }</p>
                ))}
            </div>
            <div className="mt-4 text-center">
                <Icon name="microphone" className="w-12 h-12 text-primary mx-auto" />
                <p className="text-xs text-muted-foreground mt-2">Cierra esta ventana para finalizar la sesión.</p>
            </div>
        </div>
    </Modal>
  );
};
