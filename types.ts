export interface CharacterMeasurements {
  height: string;
  bust: string;
  waist: string;
  hip: string;
}

export interface Character {
  id: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  description: string;
  measurements: CharacterMeasurements;
  age?: string;
  hairStyle?: string;
  eyeColor?: string;
  skinTone?: string;
  clothingStyle?: string;
  accessories?: string;
  // New detailed fields
  faceShape?: string;
  personality?: string;
  imageBase64: string | null;
}

export interface GeneratedItem {
  id: string;
  imageBase64: string;
  prompt: string;
  timestamp: number;
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '9:16',
  LANDSCAPE = '16:9'
}

export enum AppRoute {
  HOME = 'home',
  CHARACTERS = 'characters',
  CHARACTER_EDIT = 'character_edit',
  SETTINGS = 'settings'
}

export interface AIModelConfig {
  id: string;
  name: string;
  description: string;
  isPro?: boolean;
}

export const AVAILABLE_MODELS: AIModelConfig[] = [
  {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash (Manhua Optimized)',
    description: 'Tốc độ nhanh, ổn định, tối ưu cho phong cách truyện tranh.',
  },
  {
    id: 'gemini-3-pro-image-preview',
    name: 'Gemini 3 Pro Image (High Quality)',
    description: 'Chất lượng cao hơn, chi tiết hơn nhưng tốn nhiều tài nguyên hơn.',
    isPro: true
  }
];

export interface UsageStats {
  requestsCount: number;
  errorsCount: number;
  lastRequestTime: number;
}