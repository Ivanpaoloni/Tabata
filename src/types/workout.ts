export type IntervalType = 'work' | 'rest' | 'custom';

export type PhaseType =
  | 'prepare'
  | 'work'
  | 'rest'
  | 'custom'
  | 'rest_between_cycles'
  | 'cooldown';

export interface Interval {
  id: string;
  type: IntervalType;
  label: string;
  durationSeconds: number;
  color: string;
}

export interface Round {
  id: string;
  name?: string;
  repeats: number;
  intervals: Interval[];
}

export interface Workout {
  id: string;
  name: string;
  color: string;
  prepareSeconds: number;
  rounds: Round[];
  cycles: number;
  restBetweenCyclesSeconds: number;
  cooldownSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpNextInfo {
  label: string;
  durationSeconds: number;
  color: string;
  phase: PhaseType;
}

export interface TimelineStep {
  index: number;
  phase: PhaseType;
  label: string;
  color: string;
  durationSeconds: number;
  cycleIndex: number;
  totalCycles: number;
  cyclesLeft: number;
  roundIndex: number;
  totalRounds: number;
  roundName: string;
  repeatIndex: number;
  totalRepeats: number;
  repeatsLeft: number;
  startOffsetSeconds: number;
  upNext: UpNextInfo | null;
}

export interface WorkoutHistoryEntry {
  id: string;
  workoutId: string;
  workoutName: string;
  workoutColor: string;
  completedAt: string;
  durationSeconds: number;
  plannedDurationSeconds: number;
}

export type AudioMode = 'playback' | 'ambient';

export interface AppSettings {
  soundEnabled: boolean;
  voiceEnabled: boolean;
  voiceLang: 'es-ES' | 'en-US';
  vibrationEnabled: boolean;
  countdownBeeps: boolean;
  audioMode: AudioMode;
}

export interface QuickTabataConfig {
  prepareSeconds: number;
  workSeconds: number;
  restSeconds: number;
  repeats: number;
  cycles: number;
  restBetweenCyclesSeconds: number;
}

export interface PersistedAppData {
  version: 1;
  workouts: Workout[];
  history: WorkoutHistoryEntry[];
  settings: AppSettings;
  quickTabata: QuickTabataConfig;
}

export interface PhaseTheme {
  bg: string;
  accent: string;
  surface: string;
  border: string;
}

export const PHASE_THEMES: Record<PhaseType, PhaseTheme> = {
  prepare: {
    bg: '#16130B',
    accent: '#FBBF24',
    surface: 'rgba(251, 191, 36, 0.08)',
    border: 'rgba(251, 191, 36, 0.2)',
  },
  work: {
    bg: '#0B1612',
    accent: '#34D399',
    surface: 'rgba(52, 211, 153, 0.08)',
    border: 'rgba(52, 211, 153, 0.2)',
  },
  rest: {
    bg: '#180E10',
    accent: '#F87171',
    surface: 'rgba(248, 113, 113, 0.08)',
    border: 'rgba(248, 113, 113, 0.2)',
  },
  custom: {
    bg: '#0C131C',
    accent: '#60A5FA',
    surface: 'rgba(96, 165, 250, 0.08)',
    border: 'rgba(96, 165, 250, 0.2)',
  },
  rest_between_cycles: {
    bg: '#0C131C',
    accent: '#60A5FA',
    surface: 'rgba(96, 165, 250, 0.08)',
    border: 'rgba(96, 165, 250, 0.2)',
  },
  cooldown: {
    bg: '#0C131C',
    accent: '#60A5FA',
    surface: 'rgba(96, 165, 250, 0.08)',
    border: 'rgba(96, 165, 250, 0.2)',
  },
};

export const PHASE_COLORS: Record<PhaseType, string> = {
  prepare: PHASE_THEMES.prepare.accent,
  work: PHASE_THEMES.work.accent,
  rest: PHASE_THEMES.rest.accent,
  custom: PHASE_THEMES.custom.accent,
  rest_between_cycles: PHASE_THEMES.rest_between_cycles.accent,
  cooldown: PHASE_THEMES.cooldown.accent,
};

export const WORKOUT_PALETTE: string[] = [
  '#34D399', // Esmeralda suave
  '#60A5FA', // Celeste pizarra
  '#FBBF24', // Ámbar apagado
  '#F87171', // Terracota / coral suave
  '#A78BFA', // Lavanda sobria
  '#38BDF8', // Azul hielo
  '#FB923C', // Cobre suave
  '#94A3B8', // Gris acero
];
