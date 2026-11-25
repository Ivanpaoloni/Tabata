import {
  PHASE_COLORS,
  type AppSettings,
  type Interval,
  type PersistedAppData,
  type QuickTabataConfig,
  type Round,
  type Workout,
  type WorkoutHistoryEntry,
} from '../types/workout';
import { generateId } from '../utils/timeline';

export const STORAGE_KEY = 'tabata_app_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  voiceEnabled: false,
  voiceLang: 'es-ES',
  vibrationEnabled: true,
  countdownBeeps: true,
};

export const DEFAULT_QUICK_TABATA: QuickTabataConfig = {
  prepareSeconds: 5,
  workSeconds: 20,
  restSeconds: 10,
  repeats: 8,
  cycles: 1,
  restBetweenCyclesSeconds: 30,
};

export function createPresetWorkouts(): Workout[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'preset-tabata-clasico',
      name: 'Tabata Clásico',
      color: PHASE_COLORS.work,
      prepareSeconds: 5,
      rounds: [
        {
          id: 'preset-r1',
          name: 'Ronda 1',
          repeats: 8,
          intervals: [
            {
              id: 'preset-r1-work',
              type: 'work',
              label: 'Trabajo',
              durationSeconds: 20,
              color: PHASE_COLORS.work,
            },
            {
              id: 'preset-r1-rest',
              type: 'rest',
              label: 'Descanso',
              durationSeconds: 10,
              color: PHASE_COLORS.rest,
            },
          ],
        },
      ],
      cycles: 1,
      restBetweenCyclesSeconds: 30,
      cooldownSeconds: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'preset-hiit-30-10',
      name: 'HIIT 30/10 Circuito',
      color: '#FBBF24',
      prepareSeconds: 5,
      rounds: [
        {
          id: 'preset-hiit-r1',
          name: 'Ronda 1',
          repeats: 4,
          intervals: [
            {
              id: 'preset-hiit-work',
              type: 'work',
              label: 'Trabajo',
              durationSeconds: 30,
              color: PHASE_COLORS.work,
            },
            {
              id: 'preset-hiit-rest',
              type: 'rest',
              label: 'Descanso',
              durationSeconds: 10,
              color: PHASE_COLORS.rest,
            },
          ],
        },
      ],
      cycles: 3,
      restBetweenCyclesSeconds: 30,
      cooldownSeconds: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'preset-emom-10',
      name: 'EMOM 10 min',
      color: PHASE_COLORS.custom,
      prepareSeconds: 10,
      rounds: [
        {
          id: 'preset-emom-r1',
          name: 'Ronda 1',
          repeats: 10,
          intervals: [
            {
              id: 'preset-emom-work',
              type: 'work',
              label: 'Trabajo',
              durationSeconds: 60,
              color: PHASE_COLORS.work,
            },
          ],
        },
      ],
      cycles: 1,
      restBetweenCyclesSeconds: 0,
      cooldownSeconds: 0,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function clampInt(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(val)));
}

function normalizeSoberColor(hex: unknown, fallback: string): string {
  if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) return fallback;
  const legacyMap: Record<string, string> = {
    '#9EFF00': '#34D399',
    '#84CC16': '#34D399',
    '#FF453A': '#F87171',
    '#EF4444': '#F87171',
    '#FACC15': '#FBBF24',
    '#F97316': '#FB923C',
    '#0EA5E9': '#60A5FA',
    '#3B82F6': '#60A5FA',
  };
  return legacyMap[hex.toUpperCase()] ?? hex;
}

function sanitizeInterval(raw: unknown): Interval | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const type =
    obj.type === 'work' || obj.type === 'rest' || obj.type === 'custom'
      ? obj.type
      : 'work';

  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : generateId(),
    type,
    label:
      typeof obj.label === 'string' && obj.label.trim()
        ? obj.label.trim()
        : type === 'work'
          ? 'Trabajo'
          : type === 'rest'
            ? 'Descanso'
            : 'Ejercicio',
    durationSeconds: clampInt(obj.durationSeconds, 1, 3600, 20),
    color: normalizeSoberColor(obj.color, PHASE_COLORS[type]),
  };
}

function sanitizeRound(raw: unknown, index: number): Round | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const intervalsRaw = Array.isArray(obj.intervals) ? obj.intervals : [];
  const intervals = intervalsRaw
    .map(sanitizeInterval)
    .filter((i): i is Interval => i !== null);

  if (intervals.length === 0) return null;

  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : generateId(),
    name:
      typeof obj.name === 'string' && obj.name.trim()
        ? obj.name.trim()
        : `Ronda ${index + 1}`,
    repeats: clampInt(obj.repeats, 1, 99, 1),
    intervals,
  };
}

export function sanitizeWorkout(raw: unknown): Workout | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const roundsRaw = Array.isArray(obj.rounds) ? obj.rounds : [];
  const rounds = roundsRaw
    .map((r, idx) => sanitizeRound(r, idx))
    .filter((r): r is Round => r !== null);

  if (rounds.length === 0) return null;
  const now = new Date().toISOString();

  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : generateId(),
    name:
      typeof obj.name === 'string' && obj.name.trim()
        ? obj.name.trim()
        : 'Mi Tabata',
    color: normalizeSoberColor(obj.color, PHASE_COLORS.work),
    prepareSeconds: clampInt(obj.prepareSeconds, 0, 300, 5),
    rounds,
    cycles: clampInt(obj.cycles, 1, 99, 1),
    restBetweenCyclesSeconds: clampInt(obj.restBetweenCyclesSeconds, 0, 1800, 30),
    cooldownSeconds: clampInt(obj.cooldownSeconds, 0, 1800, 0),
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : now,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : now,
  };
}

function sanitizeHistoryEntry(raw: unknown): WorkoutHistoryEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.workoutName !== 'string') return null;

  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : generateId(),
    workoutId: typeof obj.workoutId === 'string' ? obj.workoutId : 'unknown',
    workoutName: obj.workoutName,
    workoutColor: normalizeSoberColor(obj.workoutColor, PHASE_COLORS.work),
    completedAt:
      typeof obj.completedAt === 'string'
        ? obj.completedAt
        : new Date().toISOString(),
    durationSeconds: clampInt(obj.durationSeconds, 0, 86400, 0),
    plannedDurationSeconds: clampInt(obj.plannedDurationSeconds, 0, 86400, 0),
  };
}

function sanitizeSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
  const obj = raw as Record<string, unknown>;
  return {
    soundEnabled:
      typeof obj.soundEnabled === 'boolean'
        ? obj.soundEnabled
        : DEFAULT_SETTINGS.soundEnabled,
    voiceEnabled:
      typeof obj.voiceEnabled === 'boolean'
        ? obj.voiceEnabled
        : DEFAULT_SETTINGS.voiceEnabled,
    voiceLang: obj.voiceLang === 'en-US' ? 'en-US' : 'es-ES',
    vibrationEnabled:
      typeof obj.vibrationEnabled === 'boolean'
        ? obj.vibrationEnabled
        : DEFAULT_SETTINGS.vibrationEnabled,
    countdownBeeps:
      typeof obj.countdownBeeps === 'boolean'
        ? obj.countdownBeeps
        : DEFAULT_SETTINGS.countdownBeeps,
  };
}

function sanitizeQuickTabata(raw: unknown): QuickTabataConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_QUICK_TABATA };
  const obj = raw as Record<string, unknown>;
  return {
    prepareSeconds: clampInt(obj.prepareSeconds, 0, 120, DEFAULT_QUICK_TABATA.prepareSeconds),
    workSeconds: clampInt(obj.workSeconds, 1, 3600, DEFAULT_QUICK_TABATA.workSeconds),
    restSeconds: clampInt(obj.restSeconds, 0, 3600, DEFAULT_QUICK_TABATA.restSeconds),
    repeats: clampInt(obj.repeats, 1, 99, DEFAULT_QUICK_TABATA.repeats),
    cycles: clampInt(obj.cycles, 1, 99, DEFAULT_QUICK_TABATA.cycles),
    restBetweenCyclesSeconds: clampInt(
      obj.restBetweenCyclesSeconds,
      0,
      1800,
      DEFAULT_QUICK_TABATA.restBetweenCyclesSeconds
    ),
  };
}

export function loadAppData(): PersistedAppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: PersistedAppData = {
        version: 1,
        workouts: createPresetWorkouts(),
        history: [],
        settings: { ...DEFAULT_SETTINGS },
        quickTabata: { ...DEFAULT_QUICK_TABATA },
      };
      saveAppData(initial);
      return initial;
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const workoutsRaw = Array.isArray(parsed.workouts) ? parsed.workouts : [];
    const workouts = workoutsRaw
      .map(sanitizeWorkout)
      .filter((w): w is Workout => w !== null);

    const historyRaw = Array.isArray(parsed.history) ? parsed.history : [];
    const history = historyRaw
      .map(sanitizeHistoryEntry)
      .filter((h): h is WorkoutHistoryEntry => h !== null);

    return {
      version: 1,
      workouts: workouts.length > 0 ? workouts : createPresetWorkouts(),
      history,
      settings: sanitizeSettings(parsed.settings),
      quickTabata: sanitizeQuickTabata(parsed.quickTabata),
    };
  } catch {
    return {
      version: 1,
      workouts: createPresetWorkouts(),
      history: [],
      settings: { ...DEFAULT_SETTINGS },
      quickTabata: { ...DEFAULT_QUICK_TABATA },
    };
  }
}

export function saveAppData(data: PersistedAppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

export function exportAppDataToJson(data: PersistedAppData): string {
  return JSON.stringify(data, null, 2);
}

export function parseImportedBackup(jsonText: string): {
  workouts: Workout[];
  history?: WorkoutHistoryEntry[];
  settings?: AppSettings;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Formato de backup inválido.');
  }

  const obj = parsed as Record<string, unknown>;
  const rawWorkouts = Array.isArray(obj.workouts)
    ? obj.workouts
    : Array.isArray(parsed)
      ? parsed
      : [];

  const workouts = rawWorkouts
    .map(sanitizeWorkout)
    .filter((w): w is Workout => w !== null);

  if (workouts.length === 0) {
    throw new Error('No se encontraron rutinas válidas en el JSON.');
  }

  const history = Array.isArray(obj.history)
    ? obj.history
        .map(sanitizeHistoryEntry)
        .filter((h): h is WorkoutHistoryEntry => h !== null)
    : undefined;

  const settings = obj.settings ? sanitizeSettings(obj.settings) : undefined;

  return { workouts, history, settings };
}
