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

export interface AppSettings {
  soundEnabled: boolean;
  voiceEnabled: boolean;
  voiceLang: 'es-ES' | 'en-US';
  vibrationEnabled: boolean;
  countdownBeeps: boolean;
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

export const PHASE_COLORS: Record<PhaseType, string> = {
  prepare: '#FACC15',
  work: '#9EFF00',
  rest: '#FF453A',
  custom: '#0EA5E9',
  rest_between_cycles: '#F97316',
  cooldown: '#3B82F6',
};

export const WORKOUT_PALETTE: string[] = [
  '#9EFF00',
  '#FACC15',
  '#FF453A',
  '#F97316',
  '#0EA5E9',
  '#3B82F6',
  '#A855F7',
  '#EC4899',
  '#14B8A6',
];
