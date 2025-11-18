import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AIMessage } from '../types';
import { Icon } from './icons';
import { getAIChatResponseStream } from '../services/aiService';
import { VoiceAssistantModal } from './VoiceAssistantModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CHAT_HISTORY_KEY = 'mentoria_ai_chat_history';

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>(() => {
    try {
      const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        // Basic validation
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          return parsedHistory;
        }
      }
    } catch (error) {
      console.error("Could not load chat history from localStorage", error);
      localStorage.removeItem(CHAT_HISTORY_KEY); // Clear corrupted data
    }
    return [{ sender: 'ai', text: 'Hola! Soy tu asistente de estudio. ¿En qué puedo ayudarte hoy?' }];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [size, setSize] = useState({ width: 384, height: 500 });
  const [isResizing, setIsResizing] = useState(false);
  const assistantRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch (error) {
        console.error("Could not save chat history to localStorage", error);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: AIMessage = { sender: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, { sender: 'ai', text: '' }]);

    try {
        const stream = await getAIChatResponseStream(newMessages);
        let fullResponse = "";
        for await (const chunk of stream) {
            fullResponse += chunk.text;
            setMessages(prev => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage && lastMessage.sender === 'ai') {
                    const updatedMessages = [...prev.slice(0, -1), { ...lastMessage, text: fullResponse }];
                    return updatedMessages;
                }
                return prev;
            });
        }
    } catch (error) {
        console.error(error);
        setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.sender === 'ai') {
                return [...prev.slice(0, -1), { ...lastMessage, text: "Lo siento, ha ocurrido un error al procesar tu solicitud." }];
            }
            return prev;
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      setIsResizing(true);
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = size.width;
      const startHeight = size.height;

      const handleMouseMove = (moveEvent: MouseEvent) => {
          const newWidth = startWidth - (moveEvent.clientX - startX);
          const newHeight = startHeight - (moveEvent.clientY - startY);
          setSize({
              width: Math.max(320, newWidth),
              height: Math.max(400, newHeight)
          });
      };

      const handleMouseUp = () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
          setIsResizing(false);
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
  }, [size.width, size.height]);

  if (!isOpen) {
      return (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-transform transform hover:scale-110 z-40"
            aria-label="Abrir Asistente de IA"
          >
              <Icon name="chat" className="w-7 h-7" />
          </button>
      )
  }

  return (
    <>
    <div 
        ref={assistantRef}
        className="fixed bottom-6 right-6 bg-card border border-border rounded-lg shadow-2xl flex flex-col z-50"
        style={{ width: `${size.width}px`, height: `${size.height}px` }}
    >
      <div className="flex items-center justify-between p-3 border-b border-border cursor-grab">
          <h3 className="font-semibold text-foreground">Asistente IA</h3>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <Icon name="close" className="w-5 h-5" />
          </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-3 py-2 rounded-lg prose dark:prose-invert prose-sm ${
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
              {msg.sender === 'ai' && isLoading && index === messages.length - 1 && <span className="animate-pulse">...</span>}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t border-border flex items-center gap-2">
        <button
          onClick={() => setShowVoiceModal(true)}
          className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-full"
          aria-label="Abrir Tutor por Voz"
        >
          <Icon name="microphone" className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Escribe tu pregunta..."
          className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          disabled={isLoading}
        >
          Enviar
        </button>
      </div>
       <div 
        onMouseDown={handleMouseDown}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
        />
    </div>
    {showVoiceModal && <VoiceAssistantModal isOpen={showVoiceModal} onClose={() => setShowVoiceModal(false)} />}
    </>
  );
};