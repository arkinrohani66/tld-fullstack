import { GoogleGenAI } from '@google/genai';

/**
 * Gemini AI Service for TLD Logistics
 *
 * Model names are read from the environment so a Google deprecation never needs
 * a code change:
 *   VITE_GEMINI_MODEL_CHAT     general assistant           (default: gemini-3.5-flash)
 *   VITE_GEMINI_MODEL_COMPLEX  heavy reasoning / tariffs    (default: gemini-3.8-flash)
 *   VITE_GEMINI_MODEL_FAST     instant Q&A                  (default: gemini-3.5-flash-lite)
 *   VITE_GEMINI_MODEL_AUDIO    audio transcription         (default: gemini-3.5-flash)
 *
 * Note: the previous values (`gemini-3.1-flash-lite`, `gemini-3.5-transcribe`)
 * either did not exist or were preview-only, so every call failed at runtime.
 */

const env = ((import.meta as any).env || {}) as Record<string, string | undefined>;

export const GEMINI_MODELS = {
  chat: env.VITE_GEMINI_MODEL_CHAT || 'gemini-3.5-flash',
  complex: env.VITE_GEMINI_MODEL_COMPLEX || 'gemini-3.8-flash',
  fast: env.VITE_GEMINI_MODEL_FAST || 'gemini-3.5-flash-lite',
  audio: env.VITE_GEMINI_MODEL_AUDIO || 'gemini-3.5-flash',
} as const;

/** Thrown when the assistant is used without an API key, so the UI can explain it. */
export class GeminiNotConfiguredError extends Error {
  code = 'GEMINI_NOT_CONFIGURED' as const;

  constructor() {
    super(
      'کلید Gemini تنظیم نشده است. برای فعال‌سازی دستیار هوشمند مقدار VITE_GEMINI_API_KEY را در فایل .env قرار دهید.',
    );
    this.name = 'GeminiNotConfiguredError';
  }
}

const getApiKey = (): string => {
  // Vite only exposes import.meta.env.* to the browser bundle; `process.env` is not
  // available in the client at runtime and used to throw a ReferenceError here.
  const envKey = env.VITE_GEMINI_API_KEY || '';
  const windowKey = typeof window !== 'undefined' ? (window as any).__GEMINI_API_KEY__ : '';
  return (envKey || windowKey || '').trim();
};

export const isGeminiConfigured = (): boolean => getApiKey().length > 0;

export const getGeminiClient = (): GoogleGenAI => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new GeminiNotConfiguredError();
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Transcribe Audio using the multimodal chat model.
 * Gemini has no dedicated `*-transcribe` endpoint; audio goes in as inline data.
 * @param base64Audio Audio data encoded in base64
 * @param mimeType MIME type of the audio (e.g. 'audio/webm', 'audio/mp3', 'audio/wav')
 */
export const transcribeAudio = async (
  base64Audio: string,
  mimeType: string = 'audio/webm'
): Promise<string> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODELS.audio,
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Audio } },
        {
          text: 'لطفاً این پیام صوتی راننده یا صاحب بار را دقیقاً به زبان فارسی یا زبان گوینده رونویسی (Transcribe) کن. فقط متن گفتار را خروجی بده.',
        },
      ],
    },
  });

  return response.text || '';
};

export interface MapsGroundingResult {
  text: string;
  groundingUrls: { title?: string; uri?: string }[];
}

/**
 * Route & Logistics analysis with Google Maps Grounding.
 */
export const queryLogisticsWithGoogleMaps = async (
  query: string,
  coords?: { latitude: number; longitude: number }
): Promise<MapsGroundingResult> => {
  const ai = getGeminiClient();
  const config: any = {
    tools: [{ googleMaps: {} }],
  };

  if (coords) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      },
    };
  }

  const response = await ai.models.generateContent({
    model: GEMINI_MODELS.chat,
    contents: `شما مشاور ناوبری و ترانزیت جاده‌ای هوشمند سامانه TLD Logistics هستید. سوال و اطلاعات لجستیکی مورد نیاز: "${query}". از ابزار Google Maps استفاده کرده و پاسخ جامع جاده‌ای، پمپ بنزین‌ها، مجتمع‌های رفاهی بین‌راهی یا وضعیت شهرها و پایانه‌ها را بدهید.`,
    config,
  });

  const text = response.text || '';
  const groundingChunks = (response.candidates?.[0]?.groundingMetadata as any)?.groundingChunks || [];
  const groundingUrls: { title?: string; uri?: string }[] = [];

  for (const chunk of groundingChunks) {
    if (chunk.maps) {
      groundingUrls.push({
        title: chunk.maps.title || 'مشاهده در نقشه گوگل',
        uri: chunk.maps.uri || '',
      });
    } else if (chunk.web) {
      groundingUrls.push({
        title: chunk.web.title || 'منبع',
        uri: chunk.web.uri || '',
      });
    }
  }

  return { text, groundingUrls };
};

export interface ChatMessageItem {
  role: 'user' | 'model';
  text: string;
}

/**
 * Multi-turn Gemini Logistics Assistant Chat
 * - complex: heavy reasoning (disputes, load distribution, tax & tariff formulas)
 * - general: everyday cargo/route/app questions
 * - fast:    instant short answers
 */
export const sendGeminiChatMessage = async (
  history: ChatMessageItem[],
  newMessage: string,
  mode: 'general' | 'complex' | 'fast' = 'general'
): Promise<string> => {
  const ai = getGeminiClient();
  const model =
    mode === 'complex' ? GEMINI_MODELS.complex : mode === 'fast' ? GEMINI_MODELS.fast : GEMINI_MODELS.chat;

  const systemInstruction = `شما دستیار هوشمند و رسمی لجستیک TLD (TLD Transport Logistics Digital) هستید. 
وظیفه شما راهنمایی تخصصی رانندگان پایه یک، صاحبان کالا، قوانین تن-کیلومتر، تعرفه کمیسیون، بارنامه الکترونیکی تمبردار، پایانه‌های باربری و ایمنی حمل و نقل جاده‌ای در ایران و منطقه ترانزیت است.
پاسخ‌ها باید محترمانه، فنی، دقیق و به زبان فارسی همراه با اصطلاحات رایج ترانزیت جاده‌ای باشند.`;

  const contents = [
    ...history.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    {
      role: 'user',
      parts: [{ text: newMessage }],
    },
  ];

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction,
    },
  });

  return response.text || '';
};
