import { GoogleGenAI, Type, Modality, HarmCategory, HarmBlockThreshold, GroundingChunk } from '@google/genai';
import { AIMessage, Quiz, Specialty, StudyTask, DailyTip, Flashcard, ClinicalCase, FillInTheBlanks, Difficulty, AnnualMasterPlan } from '../types';
import { getLearningStyle } from './progressService';
import { showToast } from './eventService';


// ---------------------------------------------------------------------------
// 1. CONFIGURACIÓN GENERAL
// ---------------------------------------------------------------------------

const BACKEND_URL = "https://mentoria-api-845642375889.us-west1.run.app";

const MEDICAL_AI_CONFIG = {
    temperature: 0.1,
    topK: 1,
    topP: 0.95,
    maxOutputTokens: 8192,
};

const MEDICAL_SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

// ---------------------------------------------------------------------------
// 2. INICIALIZACIÓN CENTRALIZADA DEL CLIENTE DE IA
// ---------------------------------------------------------------------------
// Se crea una única instancia del cliente que será utilizada por todas las funciones del servicio.
// La API Key se obtiene directamente del entorno, como indican las directrices.
const getApiKey = (): string => {
    // 1. Intenta obtenerla de localStorage (si el usuario la guardó manualmente)
    let key = localStorage.getItem('gemini_api_key');
    
    // 2. Si no está, intenta obtenerla de las variables de entorno de Vite
    if (!key) {
        key = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
    }
    
    // 3. Si aún no hay clave, lanza error
    if (!key) {
        const msg = "Falta la API Key. Ve a 'Admin Libros' o 'Perfil' para configurarla.";
        console.error(msg);
        // Opcional: No lanzar error aquí para permitir que la app cargue y muestre un aviso visual
        // throw new Error(msg); 
        return ""; // Retorna vacío para manejarlo en la UI
    }
    return key;
};

const getGenAIClient = () => {
    const key = getApiKey();
    if (!key) throw new Error("API Key no configurada");
    return new GoogleGenAI({ apiKey: key });
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// ---------------------------------------------------------------------------
// 3. SCHEMAS (Para validación de respuestas JSON)
// ---------------------------------------------------------------------------
const quizSchema = { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, difficulty: { type: Type.STRING }, questions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.STRING }, explanation: { type: Type.STRING } } } } } };
const clinicalCaseSchema = { type: Type.OBJECT, properties: { scenario: { type: Type.STRING }, questions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.STRING } } } } } };
const fillInTheBlanksSchema = { type: Type.OBJECT, properties: { sentence: { type: Type.STRING }, blanks: { type: Type.ARRAY, items: { type: Type.STRING } } } };
const flashcardSchema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { front: { type: Type.STRING }, back: { type: Type.STRING } } } };
const dailyTipSchema = { type: Type.OBJECT, properties: { tip: { type: Type.STRING }, challenge: { type: Type.STRING } } };
const topicsSchema = { type: Type.ARRAY, items: { type: Type.STRING } };
const masterPlanSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        createdAt: { type: Type.STRING },
        targetExamDate: { type: Type.STRING },
        weeks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    weekNumber: { type: Type.INTEGER },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    primarySpecialty: { type: Type.STRING },
                    focusArea: { type: Type.STRING },
                    description: { type: Type.STRING },
                    status: { type: Type.STRING },
                },
                required: ['weekNumber', 'startDate', 'endDate', 'primarySpecialty', 'focusArea', 'description', 'status'],
            }
        }
    },
    required: ['id', 'createdAt', 'targetExamDate', 'weeks'],
};

// ---------------------------------------------------------------------------
// 4. FUNCIONES DE BACKEND (SUBIDA Y RAG)
// ---------------------------------------------------------------------------

export const uploadStudyMaterial = async (file: File): Promise<string> => {
    const urlRes = await fetch(`${BACKEND_URL}/obtener-url-subida?filename=${encodeURIComponent(file.name)}&content_type=${encodeURIComponent(file.type)}`);
    if (!urlRes.ok) throw new Error("Error obteniendo permiso de subida");
    const { upload_url } = await urlRes.json();
    const uploadRes = await fetch(upload_url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
    if (!uploadRes.ok) throw new Error("Error al subir el archivo a Google Storage.");
    const processRes = await fetch(`${BACKEND_URL}/procesar-archivo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, api_key: process.env.API_KEY }) });
    if (!processRes.ok) throw new Error("Error iniciando el procesamiento en el servidor.");
    return "✅ Archivo subido. La IA lo está leyendo en segundo plano.";
};

export const getMedicalAdviceWithRAG = async (question: string): Promise<string> => {
    try {
        const response = await fetch(`${BACKEND_URL}/consultar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pregunta: question, api_key: process.env.API_KEY })
        });
        if (!response.ok) throw new Error(`Error del servidor (${response.status})`);
        const data = await response.json();
        return data.respuesta;
    } catch (error) {
        console.error("Fallo en RAG, usando fallback local...", error);
        return await generateStandardGeminiResponse(question);
    }
};

// ---------------------------------------------------------------------------
// 5. FUNCIONES DE GENERACIÓN (CLIENT-SIDE)
// ---------------------------------------------------------------------------

const generateStandardGeminiResponse = async (question: string): Promise<string> => {
    // FIX: Moved `safetySettings` into the `config` object.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: `Responde como tutor médico experto ENARM: ${question}` }] }],
        config: { ...MEDICAL_AI_CONFIG, safetySettings: MEDICAL_SAFETY_SETTINGS }
    });
    return response.text;
};

const jsonCall = async <T>(prompt: string, schema: any): Promise<T | null> => {
    try {
        // FIX: Moved `safetySettings` into the `config` object.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: { ...MEDICAL_AI_CONFIG, responseMimeType: 'application/json', responseSchema: schema, safetySettings: MEDICAL_SAFETY_SETTINGS },
        });
        return JSON.parse(response.text) as T;
    } catch (error) {
        console.error(`Error en jsonCall para prompt "${prompt.substring(0, 50)}..."`, error);
        return null;
    }
};

export const generateDailyTip = async (topics: string[]): Promise<DailyTip | null> => {
    const prompt = `Genera un JSON con "tip" y "challenge" sobre ${topics.length > 0 ? topics[0] : 'medicina general'}.`;
    return jsonCall<DailyTip>(prompt, dailyTipSchema);
};

export const getManualTopics = async (specialty: Specialty): Promise<string[] | null> => {
    const prompt = `Lista los 10 temas más importantes de la especialidad "${specialty}" para el ENARM. Devuelve un array JSON de strings.`;
    return jsonCall<string[]>(prompt, topicsSchema);
};

export const getQuizContents = async (specialty: Specialty, numQuestions: number): Promise<Quiz | null> => {
    const prompt = `Genera un quiz JSON de ${numQuestions} preguntas sobre un tema aleatorio de "${specialty}" para el ENARM.`;
    const res = await jsonCall<Omit<Quiz, 'specialty'>>(prompt, quizSchema);
    return res ? { ...res, specialty } : null;
};

export const generateQuizForTopic = async (topic: string, specialty: Specialty, difficulty: Difficulty): Promise<Quiz | null> => {
    const prompt = `Genera un quiz JSON de 10 preguntas de dificultad "${difficulty}" sobre "${topic}" (${specialty}).`;
    const res = await jsonCall<Omit<Quiz, 'specialty' | 'topic' | 'difficulty'>>(prompt, quizSchema);
    return res ? { ...res, specialty, topic, difficulty } : null;
};

export const generateFlashcardsForTopic = async (topic: string, specialty: Specialty): Promise<Flashcard[] | null> => {
    const prompt = `Genera 7 flashcards (front, back) en JSON sobre "${topic}" (${specialty}).`;
    return jsonCall<Flashcard[]>(prompt, flashcardSchema);
};

export const generateClinicalCaseForTopic = async (topic: string, specialty: Specialty): Promise<ClinicalCase | null> => {
    const prompt = `Genera un caso clínico en JSON sobre "${topic}" (${specialty}) con 3 preguntas.`;
    return jsonCall<ClinicalCase>(prompt, clinicalCaseSchema);
};

export const generateFillInTheBlanksForTopic = async (topic: string, specialty: Specialty): Promise<FillInTheBlanks | null> => {
    const prompt = `Genera un ejercicio JSON de completar espacios ("sentence", "blanks") sobre "${topic}" (${specialty}).`;
    return jsonCall<FillInTheBlanks>(prompt, fillInTheBlanksSchema);
};

export const getManualContent = async (topic: string, specialty: Specialty): Promise<{ content: string, sources: GroundingChunk[] | undefined } | null> => {
    try {
        const learningStyle = getLearningStyle();
        const prompt = `Actúa como un experto creando un manual ENARM sobre "${topic}" (${specialty}). Tu respuesta debe ser solo el contenido en formato Markdown. Adapta la explicación para un estudiante con un estilo de aprendizaje '${learningStyle}'. Estructura el contenido con encabezados, listas y negritas para mayor claridad. Incluye placeholders de imagen donde sea visualmente útil, usando el formato [GENERATE_IMAGE: descripción detallada de la imagen médica].`;
        
        // FIX: Moved `safetySettings` into the `config` object.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: [{ parts: [{ text: prompt }] }],
            config: { ...MEDICAL_AI_CONFIG, tools: [{googleSearch: {}}], safetySettings: MEDICAL_SAFETY_SETTINGS },
        });
        
        return {
            content: response.text,
            sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
        };
    } catch (error) {
        console.error("Error al generar manual:", error);
        showToast("Error al generar el manual.", 'error');
        return null;
    }
};

export const generateImageForTopic = async (topic: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `Ilustración médica de ${topic}, diagrama anatómico, alto detalle, estilo libro de texto, fondo blanco.`,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '4:3' },
        });
        if (response.generatedImages?.length) {
            return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
        }
        return null;
    } catch (error) {
        console.error("Error al generar imagen:", error);
        showToast("Error al generar la imagen.", 'error');
        return null;
    }
};

export const getTextToSpeech = async (text: string): Promise<string | null> => {
    try {
        const clippedText = text.length > 800 ? text.substring(0, 800) + "..." : text; 
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: clippedText }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (error) {
        console.error("Error en TTS:", error);
        showToast("Error al generar el audio.", 'error');
        return null;
    }
};

export const generateStudyPlan = async (dailyHours: number, studyDays: string[], startDate: string, endDate: string): Promise<StudyTask[] | null> => {
    try {
        const dayMap: { [key: string]: string } = { 'Do': 'Domingo', 'Lu': 'Lunes', 'Ma': 'Martes', 'Mi': 'Miércoles', 'Ju': 'Jueves', 'Vi': 'Viernes', 'Sá': 'Sábado' };
        const fullDayNames = studyDays.map(d => dayMap[d]).join(', ');
        const learningStyle = getLearningStyle();

        const prompt = `Genera un plan de estudio detallado para el ENARM en formato JSON.
        
        DATOS:
        - Fechas del plan: desde ${startDate} hasta ${endDate}.
        - Días de estudio por semana: ${fullDayNames}.
        - Horas de estudio por día: ${dailyHours}.
        - Perfil del estudiante (estilo de aprendizaje): ${learningStyle}.

        INSTRUCCIONES TÉCNICAS:
        1. Tu respuesta DEBE ser un único array JSON de objetos. NO incluyas texto explicativo, solo el JSON.
        2. NO uses bloques de código markdown (\`\`\`json). La respuesta debe ser JSON crudo.
        3. Cada objeto en el array representa una tarea de estudio para un día específico y debe tener la siguiente estructura:
           {
             "id": "un-uuid-v4-aleatorio",
             "date": "YYYY-MM-DD",
             "title": "Un título claro y descriptivo para la actividad del día",
             "topic": "El tema médico específico a estudiar (ej. 'Insuficiencia Cardíaca')",
             "specialty": "La especialidad médica correspondiente (ej. 'Cardiología')",
             "type": "un tipo de actividad variado ('quiz', 'flashcards', 'clinical_case', 'fill_in_the_blanks', o 'manual')",
             "duration": ${dailyHours * 60},
             "difficulty": "un nivel de dificultad ('Fácil', 'Intermedio', 'Difícil')",
             "completed": false,
             "content": {}
           }
        4. Asegúrate de que las fechas ("date") estén dentro del rango especificado y solo en los días de estudio activos.
        5. Distribuye las especialidades y temas de forma lógica a lo largo del periodo.
        6. El campo "content" SIEMPRE debe ser un objeto vacío: {}.
        `;

        // FIX: Moved `safetySettings` into the `config` object.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                ...MEDICAL_AI_CONFIG,
                responseMimeType: 'application/json',
                safetySettings: MEDICAL_SAFETY_SETTINGS,
            },
        });

        let responseText = response.text.trim();
        
        if (responseText.startsWith('```json')) {
            responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }

        const plan = JSON.parse(responseText);
        
        if (Array.isArray(plan)) {
            return plan as StudyTask[];
        }
        
        if (plan && typeof plan === 'object') {
            const key = Object.keys(plan).find(k => Array.isArray((plan as any)[k]));
            if (key) return (plan as any)[key] as StudyTask[];
        }

        showToast("La IA no generó un plan válido.", 'error');
        return null;

    } catch (error) {
        console.error("Error generando plan de estudio:", error);
        showToast("Ocurrió un error al generar el plan de estudio.", 'error');
        return null;
    }
};

export const generateMonthlyPlan = async (startDate: string, endDate: string): Promise<StudyTask[] | null> => {
    return generateStudyPlan(2, ['Lu', 'Ma', 'Mi', 'Ju', 'Vi'], startDate, endDate);
};

// ---------------------------------------------------------------------------
// 6. CHAT Y STREAMING
// ---------------------------------------------------------------------------
export const getAIChatResponseStream = async (history: AIMessage[]) => {
    const learningStyle = getLearningStyle();
    const systemInstruction = `Eres Mentoria, un tutor experto para el examen ENARM en México. Tu estilo de enseñanza debe adaptarse al perfil del estudiante: ${learningStyle}. Sé conciso, preciso y alentador.`;

    const contents = history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // FIX: Moved `safetySettings` into the `config` object.
    return ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents,
      config: { ...MEDICAL_AI_CONFIG, systemInstruction, safetySettings: MEDICAL_SAFETY_SETTINGS },
    });
};
