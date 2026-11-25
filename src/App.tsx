import { useCallback, useEffect, useState } from 'react';
import { ActivePlayer } from './components/ActivePlayer';
import { HistoryModal } from './components/HistoryModal';
import { Home } from './components/Home';
import { SettingsModal } from './components/SettingsModal';
import { WorkoutEditor } from './components/WorkoutEditor';
import {
  createPresetWorkouts,
  loadAppData,
  saveAppData,
  type parseImportedBackup,
} from './storage/workoutStorage';
import type {
  AppSettings,
  PersistedAppData,
  QuickTabataConfig,
  Workout,
  WorkoutHistoryEntry,
} from './types/workout';
import { generateId } from './utils/timeline';

type Screen =
  | { view: 'home' }
  | { view: 'editor'; workout: Workout | null }
  | { view: 'player'; workout: Workout };

export default function App() {
  const [data, setData] = useState<PersistedAppData>(() => loadAppData());
  const [screen, setScreen] = useState<Screen>({ view: 'home' });
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  const handleSaveWorkout = useCallback((saved: Workout) => {
    setData((prev) => {
      const exists = prev.workouts.some((w) => w.id === saved.id);
      const workouts = exists
        ? prev.workouts.map((w) => (w.id === saved.id ? saved : w))
        : [saved, ...prev.workouts];
      return { ...prev, workouts };
    });
    setScreen({ view: 'home' });
  }, []);

  const handleDuplicateWorkout = useCallback((workout: Workout) => {
    const now = new Date().toISOString();
    const copy: Workout = {
      ...workout,
      id: generateId(),
      name: `${workout.name} (COPIA)`,
      rounds: workout.rounds.map((r) => ({
        ...r,
        id: generateId(),
        intervals: r.intervals.map((i) => ({ ...i, id: generateId() })),
      })),
      createdAt: now,
      updatedAt: now,
    };
    setData((prev) => ({
      ...prev,
      workouts: [copy, ...prev.workouts],
    }));
  }, []);

  const handleDeleteWorkout = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      workouts: prev.workouts.filter((w) => w.id !== id),
    }));
  }, []);

  const handleUpdateQuickTabata = useCallback((quickTabata: QuickTabataConfig) => {
    setData((prev) => ({ ...prev, quickTabata }));
  }, []);

  const handleUpdateSettings = useCallback((settings: AppSettings) => {
    setData((prev) => ({ ...prev, settings }));
  }, []);

  const handleToggleMute = useCallback(() => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        soundEnabled: !prev.settings.soundEnabled,
      },
    }));
  }, []);

  const handleWorkoutComplete = useCallback(
    (workout: Workout, actualElapsedSeconds: number, plannedDurationSeconds: number) => {
      const entry: WorkoutHistoryEntry = {
        id: generateId(),
        workoutId: workout.id,
        workoutName: workout.name,
        workoutColor: workout.color,
        completedAt: new Date().toISOString(),
        durationSeconds: actualElapsedSeconds || plannedDurationSeconds,
        plannedDurationSeconds,
      };
      setData((prev) => ({
        ...prev,
        history: [entry, ...prev.history].slice(0, 200),
      }));
    },
    []
  );

  const handleDeleteHistoryEntry = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      history: prev.history.filter((h) => h.id !== id),
    }));
  }, []);

  const handleClearHistory = useCallback(() => {
    setData((prev) => ({ ...prev, history: [] }));
  }, []);

  const handleImportBackup = useCallback(
    (imported: ReturnType<typeof parseImportedBackup>) => {
      setData((prev) => ({
        ...prev,
        workouts: imported.workouts,
        history: imported.history ?? prev.history,
        settings: imported.settings ?? prev.settings,
      }));
    },
    []
  );

  const handleRestorePresets = useCallback(() => {
    const presets = createPresetWorkouts();
    setData((prev) => {
      const existingIds = new Set(prev.workouts.map((w) => w.id));
      const missing = presets.filter((p) => !existingIds.has(p.id));
      return {
        ...prev,
        workouts: [...missing, ...prev.workouts],
      };
    });
  }, []);

  return (
    <div className="min-h-dvh w-full bg-[#050507] sm:flex sm:justify-center">
      {/* App Shell Container: Full screen on mobile, centered mobile-app frame on desktop */}
      <div className="relative min-h-dvh w-full bg-[#09090B] sm:max-w-115 sm:border-x sm:border-white/8">
        {screen.view === 'home' && (
          <Home
            workouts={data.workouts}
            quickTabata={data.quickTabata}
            audioMode={data.settings.audioMode}
            historyCount={data.history.length}
            onUpdateQuickTabata={handleUpdateQuickTabata}
            onStartWorkout={(workout) => setScreen({ view: 'player', workout })}
            onCreateWorkout={() => setScreen({ view: 'editor', workout: null })}
            onEditWorkout={(workout) => setScreen({ view: 'editor', workout })}
            onDuplicateWorkout={handleDuplicateWorkout}
            onDeleteWorkout={handleDeleteWorkout}
            onOpenHistory={() => setShowHistory(true)}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}

        {screen.view === 'editor' && (
          <WorkoutEditor
            initialWorkout={screen.workout}
            onSave={handleSaveWorkout}
            onCancel={() => setScreen({ view: 'home' })}
          />
        )}

        {screen.view === 'player' && (
          <ActivePlayer
            workout={screen.workout}
            settings={data.settings}
            onToggleMute={handleToggleMute}
            onComplete={(actualSec, plannedSec) =>
              handleWorkoutComplete(screen.workout, actualSec, plannedSec)
            }
            onExit={() => setScreen({ view: 'home' })}
          />
        )}

        <HistoryModal
          isOpen={showHistory}
          history={data.history}
          onDeleteEntry={handleDeleteHistoryEntry}
          onClearAll={handleClearHistory}
          onClose={() => setShowHistory(false)}
        />

        <SettingsModal
          isOpen={showSettings}
          appData={data}
          onUpdateSettings={handleUpdateSettings}
          onImportBackup={handleImportBackup}
          onRestorePresets={handleRestorePresets}
          onClose={() => setShowSettings(false)}
        />
      </div>
    </div>
  );
}
