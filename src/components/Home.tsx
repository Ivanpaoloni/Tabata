import {
  Copy,
  Edit3,
  History,
  MoreHorizontal,
  Play,
  Plus,
  Settings,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import {
  PHASE_COLORS,
  type AudioMode,
  type QuickTabataConfig,
  type Workout,
} from '../types/workout';
import { unlockAudio } from '../utils/soundEngine';
import {
  buildQuickTabataWorkout,
  formatCompactTime,
  formatTime,
  formatWorkoutSummary,
  getTotalWorkoutDuration,
} from '../utils/timeline';
import { TimePickerModal } from './TimePickerModal';

interface HomeProps {
  workouts: Workout[];
  quickTabata: QuickTabataConfig;
  audioMode: AudioMode;
  historyCount: number;
  onUpdateQuickTabata: (next: QuickTabataConfig) => void;
  onStartWorkout: (workout: Workout) => void;
  onCreateWorkout: () => void;
  onEditWorkout: (workout: Workout) => void;
  onDuplicateWorkout: (workout: Workout) => void;
  onDeleteWorkout: (id: string) => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

type QuickPickerField = 'workSeconds' | 'restSeconds' | 'repeats' | null;

export function Home({
  workouts,
  quickTabata,
  audioMode,
  historyCount,
  onUpdateQuickTabata,
  onStartWorkout,
  onCreateWorkout,
  onEditWorkout,
  onDuplicateWorkout,
  onDeleteWorkout,
  onOpenHistory,
  onOpenSettings,
}: HomeProps) {
  const [menuWorkout, setMenuWorkout] = useState<Workout | null>(null);
  const [quickPicker, setQuickPicker] = useState<QuickPickerField>(null);

  const quickWorkout = buildQuickTabataWorkout(quickTabata);
  const quickTotalSec = getTotalWorkoutDuration(quickWorkout);

  const handlePlay = (workout: Workout) => {
    unlockAudio(audioMode);
    onStartWorkout(workout);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#09090B] text-[#FAFAFA] select-none touch-manipulation">
      {/* Compact Header with 48px Secondary Controls */}
      <header
        className="sticky top-0 z-20 border-b border-white/8 bg-[#09090B]/92 backdrop-blur-md"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-[#18181B] text-[#34D399]">
              <Timer className="h-5 w-5 stroke-2" />
            </div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-[#FAFAFA]">
              Tabata
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenHistory}
              className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-[#121215] text-zinc-300 transition-all duration-100 active:scale-97 active:bg-white/10"
              aria-label="Historial"
            >
              <History className="h-5 w-5" />
              {historyCount > 0 && (
                <span className="tabular-nums absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FAFAFA] px-1 text-[10px] font-semibold text-[#09090B]">
                  {historyCount > 99 ? '99+' : historyCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-[#121215] text-zinc-300 transition-all duration-100 active:scale-97 active:bg-white/10"
              aria-label="Ajustes"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-6 px-4 pt-5 pb-6">
        {/* Quick Tabata Card */}
        <section className="rounded-3xl border border-white/8 bg-[#121215] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#34D399]" />
              <h2 className="font-display text-base font-semibold tracking-tight text-[#FAFAFA]">
                Inicio rápido
              </h2>
            </div>
            <span className="tabular-nums text-xs font-medium text-zinc-400">
              Total {formatTime(quickTotalSec)}
            </span>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setQuickPicker('workSeconds')}
              className="flex min-h-18 flex-col items-start justify-center rounded-2xl border border-white/8 bg-[#18181B] px-3.5 py-3 text-left transition-all duration-100 active:scale-97 active:bg-white/10"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                Trabajo
              </span>
              <span className="font-display tabular-nums mt-1 text-2xl font-semibold tracking-tight text-[#FAFAFA]">
                {formatCompactTime(quickTabata.workSeconds)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQuickPicker('restSeconds')}
              className="flex min-h-18 flex-col items-start justify-center rounded-2xl border border-white/8 bg-[#18181B] px-3.5 py-3 text-left transition-all duration-100 active:scale-97 active:bg-white/10"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F87171]" />
                Descanso
              </span>
              <span className="font-display tabular-nums mt-1 text-2xl font-semibold tracking-tight text-[#FAFAFA]">
                {quickTabata.restSeconds === 0
                  ? 'Off'
                  : formatCompactTime(quickTabata.restSeconds)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQuickPicker('repeats')}
              className="flex min-h-18 flex-col items-start justify-center rounded-2xl border border-white/8 bg-[#18181B] px-3.5 py-3 text-left transition-all duration-100 active:scale-97 active:bg-white/10"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-[#60A5FA]" />
                Rondas
              </span>
              <span className="font-display tabular-nums mt-1 text-2xl font-semibold tracking-tight text-[#FAFAFA]">
                {quickTabata.repeats}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handlePlay(quickWorkout)}
            className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#FAFAFA] text-base font-semibold text-[#09090B] transition-all duration-100 active:scale-97 active:bg-zinc-200"
          >
            <Play className="h-5 w-5 fill-[#09090B]" />
            Iniciar sesión
          </button>
        </section>

        {/* Saved Workouts List */}
        <section>
          <div className="mb-3.5 flex items-center justify-between px-1">
            <h2 className="font-display text-sm font-semibold tracking-tight text-zinc-400">
              Mis rutinas
            </h2>
            <span className="tabular-nums text-xs text-zinc-500">
              {workouts.length} {workouts.length === 1 ? 'rutina' : 'rutinas'}
            </span>
          </div>

          <div className="space-y-3.5">
            {workouts.map((workout) => {
              const totalSec = getTotalWorkoutDuration(workout);

              return (
                <div
                  key={workout.id}
                  className="flex min-h-20 items-center justify-between gap-4 rounded-3xl border border-white/8 bg-[#121215] p-4"
                >
                  {/* Full-row clickable info area -> edit */}
                  <button
                    type="button"
                    onClick={() => onEditWorkout(workout)}
                    className="flex min-h-14 min-w-0 flex-1 items-center gap-3.5 rounded-2xl px-1 text-left transition-all duration-100 active:scale-97 active:bg-white/10"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: workout.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-base font-semibold tracking-tight text-[#FAFAFA]">
                        {workout.name}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
                        <span className="tabular-nums shrink-0 font-medium text-zinc-200">
                          {formatTime(totalSec)}
                        </span>
                        <span className="text-zinc-600">·</span>
                        <span className="truncate">
                          {formatWorkoutSummary(workout)}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Well-separated 48px Menu + 56px Play */}
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setMenuWorkout(workout)}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-[#18181B] text-zinc-300 transition-all duration-100 active:scale-97 active:bg-white/10"
                      aria-label={`Opciones de ${workout.name}`}
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlay(workout)}
                      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAFAFA] text-[#09090B] transition-all duration-100 active:scale-97 active:bg-zinc-200"
                      aria-label={`Iniciar ${workout.name}`}
                    >
                      <Play className="h-5 w-5 translate-x-px fill-[#09090B]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Sticky Bottom CTA (Thumb Zone) */}
      <div
        className="sticky bottom-0 z-20 border-t border-white/8 bg-[#09090B]/92 px-4 pt-3 backdrop-blur-md"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={onCreateWorkout}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-[#18181B] text-base font-semibold text-[#FAFAFA] transition-all duration-100 active:scale-97 active:bg-white/10"
        >
          <Plus className="h-5 w-5" />
          Nuevo Workout
        </button>
      </div>

      {/* Workout Actions Bottom Sheet */}
      {menuWorkout && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setMenuWorkout(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Opciones de ${menuWorkout.name}`}
        >
          <div
            className="w-full max-w-md rounded-t-3xl border-t border-white/10 bg-[#121215] px-5 pt-3"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: menuWorkout.color }}
                />
                <h3 className="truncate font-display text-lg font-semibold text-[#FAFAFA]">
                  {menuWorkout.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMenuWorkout(null)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-[#18181B] text-zinc-300 transition-all duration-100 active:scale-97 active:bg-white/10"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  const target = menuWorkout;
                  setMenuWorkout(null);
                  onEditWorkout(target);
                }}
                className="flex h-14 w-full items-center gap-3.5 rounded-2xl border border-white/8 bg-[#18181B] px-4 text-base font-medium text-[#FAFAFA] transition-all duration-100 active:scale-97 active:bg-white/10"
              >
                <Edit3 className="h-5 w-5 text-zinc-400" />
                Editar rutina
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = menuWorkout;
                  setMenuWorkout(null);
                  onDuplicateWorkout(target);
                }}
                className="flex h-14 w-full items-center gap-3.5 rounded-2xl border border-white/8 bg-[#18181B] px-4 text-base font-medium text-[#FAFAFA] transition-all duration-100 active:scale-97 active:bg-white/10"
              >
                <Copy className="h-5 w-5 text-zinc-400" />
                Duplicar rutina
              </button>

              <button
                type="button"
                onClick={() => {
                  const id = menuWorkout.id;
                  setMenuWorkout(null);
                  onDeleteWorkout(id);
                }}
                className="flex h-14 w-full items-center gap-3.5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 text-base font-medium text-[#F87171] transition-all duration-100 active:scale-97 active:bg-red-500/20"
              >
                <Trash2 className="h-5 w-5" />
                Eliminar rutina
              </button>
            </div>
          </div>
        </div>
      )}

      <TimePickerModal
        isOpen={quickPicker !== null}
        mode={quickPicker === 'repeats' ? 'count' : 'time'}
        title={
          quickPicker === 'workSeconds'
            ? 'Tiempo de trabajo'
            : quickPicker === 'restSeconds'
              ? 'Tiempo de descanso'
              : 'Cantidad de rondas'
        }
        accentColor={
          quickPicker === 'workSeconds'
            ? PHASE_COLORS.work
            : quickPicker === 'restSeconds'
              ? PHASE_COLORS.rest
              : '#60A5FA'
        }
        value={quickPicker ? quickTabata[quickPicker] : 0}
        min={quickPicker === 'workSeconds' || quickPicker === 'repeats' ? 1 : 0}
        onConfirm={(val) => {
          if (!quickPicker) return;
          onUpdateQuickTabata({
            ...quickTabata,
            [quickPicker]: val,
          });
        }}
        onClose={() => setQuickPicker(null)}
      />
    </div>
  );
}
