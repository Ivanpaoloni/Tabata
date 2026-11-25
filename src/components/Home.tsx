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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [quickPicker, setQuickPicker] = useState<QuickPickerField>(null);

  const quickWorkout = buildQuickTabataWorkout(quickTabata);
  const quickTotalSec = getTotalWorkoutDuration(quickWorkout);

  const handlePlay = (workout: Workout) => {
    unlockAudio(audioMode);
    onStartWorkout(workout);
  };

  return (
    <div
      className="flex min-h-dvh flex-col bg-[#09090B] text-[#FAFAFA]"
      onClick={() => openMenuId && setOpenMenuId(null)}
    >
      {/* Top Bar */}
      <header
        className="sticky top-0 z-20 border-b border-white/8 bg-[#09090B]/90 backdrop-blur-md"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between px-5 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/8 bg-[#18181B] text-[#34D399]">
              <Timer className="h-4 w-4 stroke-2" />
            </div>
            <h1 className="font-display text-lg font-semibold tracking-tight text-[#FAFAFA]">
              Tabata
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenHistory}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-[#121215] text-zinc-300 transition hover:text-white active:scale-95"
              aria-label="Historial"
            >
              <History className="h-4.5 w-4.5" />
              {historyCount > 0 && (
                <span className="tabular-nums absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FAFAFA] px-1 text-[10px] font-semibold text-[#09090B]">
                  {historyCount > 99 ? '99+' : historyCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-[#121215] text-zinc-300 transition hover:text-white active:scale-95"
              aria-label="Ajustes"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </header>

      <main
        className="flex-1 space-y-7 px-5 pt-6"
        style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Quick Tabata Card */}
        <section className="rounded-3xl border border-white/8 bg-[#121215] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#34D399]" />
              <h2 className="font-display text-sm font-semibold tracking-tight text-[#FAFAFA]">
                Inicio rápido
              </h2>
            </div>
            <span className="tabular-nums text-xs font-medium text-zinc-400">
              Total {formatTime(quickTotalSec)}
            </span>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setQuickPicker('workSeconds')}
              className="flex flex-col items-start rounded-2xl border border-white/6 bg-[#18181B] px-3.5 py-3 text-left transition hover:border-white/12 active:scale-98"
            >
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                Trabajo
              </span>
              <span className="font-display tabular-nums mt-1.5 text-2xl font-semibold tracking-tight text-[#FAFAFA]">
                {formatCompactTime(quickTabata.workSeconds)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQuickPicker('restSeconds')}
              className="flex flex-col items-start rounded-2xl border border-white/6 bg-[#18181B] px-3.5 py-3 text-left transition hover:border-white/12 active:scale-98"
            >
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F87171]" />
                Descanso
              </span>
              <span className="font-display tabular-nums mt-1.5 text-2xl font-semibold tracking-tight text-[#FAFAFA]">
                {quickTabata.restSeconds === 0
                  ? 'Off'
                  : formatCompactTime(quickTabata.restSeconds)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQuickPicker('repeats')}
              className="flex flex-col items-start rounded-2xl border border-white/6 bg-[#18181B] px-3.5 py-3 text-left transition hover:border-white/12 active:scale-98"
            >
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-[#60A5FA]" />
                Rondas
              </span>
              <span className="font-display tabular-nums mt-1.5 text-2xl font-semibold tracking-tight text-[#FAFAFA]">
                {quickTabata.repeats}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handlePlay(quickWorkout)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FAFAFA] text-sm font-semibold text-[#09090B] transition hover:bg-zinc-200 active:scale-98"
          >
            <Play className="h-4 w-4 fill-[#09090B]" />
            Iniciar sesión
          </button>
        </section>

        {/* Saved Workouts */}
        <section>
          <div className="mb-3.5 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold tracking-tight text-zinc-300">
              Mis rutinas
            </h2>
            <button
              type="button"
              onClick={onCreateWorkout}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-white/8 bg-[#18181B] px-3 text-xs font-medium text-[#FAFAFA] transition hover:bg-white/8 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva rutina
            </button>
          </div>

          <div className="space-y-2.5">
            {workouts.map((workout) => {
              const totalSec = getTotalWorkoutDuration(workout);
              const isMenuOpen = openMenuId === workout.id;

              return (
                <div
                  key={workout.id}
                  className="relative flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-[#121215] px-4 py-3.5 transition hover:border-white/12"
                >
                  <button
                    type="button"
                    onClick={() => onEditWorkout(workout)}
                    className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: workout.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-[15px] font-semibold tracking-tight text-[#FAFAFA]">
                        {workout.name}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
                        <span className="truncate">
                          {formatWorkoutSummary(workout)}
                        </span>
                        <span className="text-zinc-600">·</span>
                        <span className="tabular-nums shrink-0 text-zinc-300">
                          {formatTime(totalSec)}
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(isMenuOpen ? null : workout.id);
                      }}
                      className="flex h-10 w-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200 active:scale-95"
                      aria-label={`Opciones de ${workout.name}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlay(workout)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#18181B] text-[#FAFAFA] transition hover:bg-[#FAFAFA] hover:text-[#09090B] active:scale-95"
                      aria-label={`Iniciar ${workout.name}`}
                    >
                      <Play className="h-4 w-4 translate-x-px fill-current" />
                    </button>
                  </div>

                  {isMenuOpen && (
                    <div
                      className="absolute top-14 right-12 z-30 w-40 overflow-hidden rounded-2xl border border-white/10 bg-[#18181B] py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onEditWorkout(workout);
                        }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-zinc-200 hover:bg-white/6"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-zinc-400" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onDuplicateWorkout(workout);
                        }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-zinc-200 hover:bg-white/6"
                      >
                        <Copy className="h-3.5 w-3.5 text-zinc-400" />
                        Duplicar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onDeleteWorkout(workout.id);
                        }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

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
