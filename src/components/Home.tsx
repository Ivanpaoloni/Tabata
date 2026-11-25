import {
  Copy,
  Edit3,
  History,
  MoreVertical,
  Play,
  Plus,
  Settings,
  Trash2,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
  PHASE_COLORS,
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

type QuickPickerField = 'workSeconds' | 'restSeconds' | 'repeats' | 'prepareSeconds' | null;

export function Home({
  workouts,
  quickTabata,
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
    unlockAudio();
    onStartWorkout(workout);
  };

  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-[#0A0A0A] text-white"
      onClick={() => openMenuId && setOpenMenuId(null)}
    >
      {/* Top App Bar */}
      <header
        className="sticky top-0 z-20 border-b border-white/8 bg-[#0A0A0A]/90 backdrop-blur-md"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#9EFF00] text-black">
              <Zap className="h-5 w-5 fill-black stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold leading-none tracking-wider uppercase text-white">
                TABATA PRO
              </h1>
              <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">
                HIIT INTERVAL TIMER
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenHistory}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#141414] text-zinc-200 active:scale-95"
              aria-label="Historial"
            >
              <History className="h-5 w-5" />
              {historyCount > 0 && (
                <span className="tabular-nums absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#3B82F6] px-1 text-[10px] font-bold text-white">
                  {historyCount > 99 ? '99+' : historyCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#141414] text-zinc-200 active:scale-95"
              aria-label="Ajustes"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main
        className="flex-1 space-y-6 px-4 pt-5"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        {/* Quick Tabata Card */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#1C1C1E] to-[#141414] p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#9EFF00] shadow-[0_0_8px_#9EFF00]" />
              <h2 className="font-display text-lg font-extrabold tracking-wider uppercase text-white">
                QUICK TABATA
              </h2>
            </div>
            <span className="font-display tabular-nums text-lg font-bold text-zinc-300">
              {formatTime(quickTotalSec)}
            </span>
          </div>

          <div className="mb-3.5 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setQuickPicker('workSeconds')}
              className="flex flex-col items-center rounded-2xl border border-white/8 bg-[#0A0A0A] py-2.5 active:scale-95"
            >
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#9EFF00]">
                WORK
              </span>
              <span className="font-display tabular-nums mt-0.5 text-3xl font-extrabold text-white">
                {formatCompactTime(quickTabata.workSeconds)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQuickPicker('restSeconds')}
              className="flex flex-col items-center rounded-2xl border border-white/8 bg-[#0A0A0A] py-2.5 active:scale-95"
            >
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#FF453A]">
                REST
              </span>
              <span className="font-display tabular-nums mt-0.5 text-3xl font-extrabold text-white">
                {quickTabata.restSeconds === 0
                  ? 'OFF'
                  : formatCompactTime(quickTabata.restSeconds)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQuickPicker('repeats')}
              className="flex flex-col items-center rounded-2xl border border-white/8 bg-[#0A0A0A] py-2.5 active:scale-95"
            >
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#3B82F6]">
                ROUNDS
              </span>
              <span className="font-display tabular-nums mt-0.5 text-3xl font-extrabold text-white">
                {quickTabata.repeats}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handlePlay(quickWorkout)}
            className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#9EFF00] font-display text-2xl font-extrabold tracking-wider uppercase text-black shadow-[0_0_24px_rgba(158,255,0,0.25)] transition active:scale-[0.98]"
          >
            <Play className="h-6 w-6 fill-black" />
            ARRANCAR AHORA
          </button>
        </section>

        {/* Saved Workouts Header */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-extrabold tracking-wider uppercase text-zinc-200">
              MIS RUTINAS
            </h2>
            <button
              type="button"
              onClick={onCreateWorkout}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-white px-3.5 text-xs font-extrabold tracking-wide uppercase text-black transition active:scale-95"
            >
              <Plus className="h-4 w-4 stroke-[2.8]" />
              Nuevo Workout
            </button>
          </div>

          {/* Workouts List */}
          <div className="space-y-3">
            {workouts.map((workout) => {
              const totalSec = getTotalWorkoutDuration(workout);
              const isMenuOpen = openMenuId === workout.id;

              return (
                <div
                  key={workout.id}
                  className="relative flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-[#1C1C1E] p-3.5 transition"
                >
                  {/* Color Accent Bar */}
                  <div
                    className="h-12 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: workout.color }}
                  />

                  {/* Workout Info (click to edit) */}
                  <button
                    type="button"
                    onClick={() => onEditWorkout(workout)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate font-display text-2xl font-extrabold tracking-wide uppercase text-white">
                        {workout.name}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-400">
                      <span className="truncate">{formatWorkoutSummary(workout)}</span>
                      <span className="text-zinc-600">·</span>
                      <span className="tabular-nums shrink-0 font-semibold text-zinc-200">
                        {formatTime(totalSec)}
                      </span>
                    </div>
                  </button>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(isMenuOpen ? null : workout.id);
                      }}
                      className="flex h-11 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white active:scale-95"
                      aria-label={`Opciones de ${workout.name}`}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlay(workout)}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-black transition active:scale-90"
                      style={{ backgroundColor: workout.color || PHASE_COLORS.work }}
                      aria-label={`Iniciar ${workout.name}`}
                    >
                      <Play className="h-5 w-5 translate-x-0.5 fill-black" />
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div
                      className="absolute top-14 right-14 z-30 w-44 overflow-hidden rounded-2xl border border-white/12 bg-[#141414] py-1.5 shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onEditWorkout(workout);
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/8"
                      >
                        <Edit3 className="h-4 w-4 text-zinc-400" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onDuplicateWorkout(workout);
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/8"
                      >
                        <Copy className="h-4 w-4 text-zinc-400" />
                        Duplicar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onDeleteWorkout(workout.id);
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
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

      {/* Quick Tabata Time / Count Picker */}
      <TimePickerModal
        isOpen={quickPicker !== null}
        mode={quickPicker === 'repeats' ? 'count' : 'time'}
        title={
          quickPicker === 'workSeconds'
            ? 'WORK'
            : quickPicker === 'restSeconds'
              ? 'REST'
              : quickPicker === 'repeats'
                ? 'ROUNDS'
                : 'PREPARE'
        }
        accentColor={
          quickPicker === 'workSeconds'
            ? PHASE_COLORS.work
            : quickPicker === 'restSeconds'
              ? PHASE_COLORS.rest
              : quickPicker === 'repeats'
                ? '#3B82F6'
                : PHASE_COLORS.prepare
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
