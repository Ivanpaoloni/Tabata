import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Copy,
  Flame,
  MoreHorizontal,
  Plus,
  Repeat,
  RotateCw,
  Snowflake,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  PHASE_COLORS,
  WORKOUT_PALETTE,
  type Interval,
  type IntervalType,
  type Round,
  type Workout,
} from '../types/workout';
import {
  formatCompactTime,
  formatTime,
  generateId,
  getTotalWorkoutDuration,
} from '../utils/timeline';
import { TimePickerModal } from './TimePickerModal';

interface WorkoutEditorProps {
  initialWorkout: Workout | null;
  onSave: (workout: Workout) => void;
  onCancel: () => void;
}

type PickerTarget =
  | { kind: 'prepare' }
  | { kind: 'cycles' }
  | { kind: 'restBetweenCycles' }
  | { kind: 'cooldown' }
  | { kind: 'roundRepeats'; roundId: string }
  | { kind: 'intervalDuration'; roundId: string; intervalId: string; label: string; color: string }
  | null;

function createDefaultWorkout(): Workout {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name: 'MY TABATA',
    color: PHASE_COLORS.work,
    prepareSeconds: 5,
    rounds: [
      {
        id: generateId(),
        name: 'ROUND 1',
        repeats: 4,
        intervals: [
          {
            id: generateId(),
            type: 'work',
            label: 'WORK',
            durationSeconds: 30,
            color: PHASE_COLORS.work,
          },
          {
            id: generateId(),
            type: 'rest',
            label: 'REST',
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
  };
}

function cloneWorkout(w: Workout): Workout {
  return {
    ...w,
    rounds: w.rounds.map((r) => ({
      ...r,
      intervals: r.intervals.map((i) => ({ ...i })),
    })),
  };
}

export function WorkoutEditor({
  initialWorkout,
  onSave,
  onCancel,
}: WorkoutEditorProps) {
  const isEditing = initialWorkout !== null;
  const [draft, setDraft] = useState<Workout>(() =>
    initialWorkout ? cloneWorkout(initialWorkout) : createDefaultWorkout()
  );
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [openRoundMenuId, setOpenRoundMenuId] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerTarget>(null);

  const totalDuration = useMemo(() => getTotalWorkoutDuration(draft), [draft]);

  const updateRound = (roundId: string, updater: (r: Round) => Round) => {
    setDraft((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r) => (r.id === roundId ? updater(r) : r)),
    }));
  };

  const addIntervalToRound = (roundId: string, type: IntervalType) => {
    const newInterval: Interval = {
      id: generateId(),
      type,
      label: type === 'work' ? 'WORK' : type === 'rest' ? 'REST' : 'EJERCICIO',
      durationSeconds: type === 'rest' ? 10 : 30,
      color: PHASE_COLORS[type],
    };
    updateRound(roundId, (r) => ({
      ...r,
      intervals: [...r.intervals, newInterval],
    }));
  };

  const cycleIntervalType = (roundId: string, intervalId: string) => {
    const order: IntervalType[] = ['work', 'rest', 'custom'];
    updateRound(roundId, (r) => ({
      ...r,
      intervals: r.intervals.map((inv) => {
        if (inv.id !== intervalId) return inv;
        const nextType = order[(order.indexOf(inv.type) + 1) % order.length];
        const isDefaultLabel =
          inv.label === 'WORK' || inv.label === 'REST' || inv.label === 'EJERCICIO';
        return {
          ...inv,
          type: nextType,
          color: PHASE_COLORS[nextType],
          label: isDefaultLabel
            ? nextType === 'work'
              ? 'WORK'
              : nextType === 'rest'
                ? 'REST'
                : 'EJERCICIO'
            : inv.label,
        };
      }),
    }));
  };

  const moveInterval = (roundId: string, index: number, direction: -1 | 1) => {
    updateRound(roundId, (r) => {
      const target = index + direction;
      if (target < 0 || target >= r.intervals.length) return r;
      const copy = [...r.intervals];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return { ...r, intervals: copy };
    });
  };

  const deleteInterval = (roundId: string, intervalId: string) => {
    updateRound(roundId, (r) => {
      if (r.intervals.length <= 1) return r;
      return {
        ...r,
        intervals: r.intervals.filter((i) => i.id !== intervalId),
      };
    });
  };

  const addRound = () => {
    const nextNum = draft.rounds.length + 1;
    const newRound: Round = {
      id: generateId(),
      name: `ROUND ${nextNum}`,
      repeats: 4,
      intervals: [
        {
          id: generateId(),
          type: 'work',
          label: 'WORK',
          durationSeconds: 20,
          color: PHASE_COLORS.work,
        },
        {
          id: generateId(),
          type: 'rest',
          label: 'REST',
          durationSeconds: 10,
          color: PHASE_COLORS.rest,
        },
      ],
    };
    setDraft((prev) => ({
      ...prev,
      rounds: [...prev.rounds, newRound],
    }));
  };

  const duplicateRound = (round: Round) => {
    const copy: Round = {
      ...round,
      id: generateId(),
      name: `ROUND ${draft.rounds.length + 1}`,
      intervals: round.intervals.map((i) => ({ ...i, id: generateId() })),
    };
    setDraft((prev) => ({
      ...prev,
      rounds: [...prev.rounds, copy],
    }));
  };

  const deleteRound = (roundId: string) => {
    setDraft((prev) => {
      if (prev.rounds.length <= 1) return prev;
      return {
        ...prev,
        rounds: prev.rounds.filter((r) => r.id !== roundId),
      };
    });
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    onSave({
      ...draft,
      name: draft.name.trim() || 'MY TABATA',
      updatedAt: now,
    });
  };

  // Resolve current picker modal props
  const pickerProps = (() => {
    if (!picker) return null;
    switch (picker.kind) {
      case 'prepare':
        return {
          mode: 'time' as const,
          title: 'PREPARE',
          subtitle: 'Countdown before you start',
          accentColor: PHASE_COLORS.prepare,
          value: draft.prepareSeconds,
          min: 0,
          max: 300,
          onConfirm: (v: number) => setDraft((p) => ({ ...p, prepareSeconds: v })),
        };
      case 'cycles':
        return {
          mode: 'count' as const,
          title: 'CYCLES',
          subtitle: 'Number of repetitions of all rounds',
          accentColor: '#F97316',
          value: draft.cycles,
          min: 1,
          max: 99,
          onConfirm: (v: number) => setDraft((p) => ({ ...p, cycles: v })),
        };
      case 'restBetweenCycles':
        return {
          mode: 'time' as const,
          title: 'REST BETWEEN CYCLES',
          subtitle: 'Recovery time between each full cycle',
          accentColor: PHASE_COLORS.rest_between_cycles,
          value: draft.restBetweenCyclesSeconds,
          min: 0,
          max: 1800,
          onConfirm: (v: number) =>
            setDraft((p) => ({ ...p, restBetweenCyclesSeconds: v })),
        };
      case 'cooldown':
        return {
          mode: 'time' as const,
          title: 'COOLDOWN',
          subtitle: 'Optional cooldown after the last cycle',
          accentColor: PHASE_COLORS.cooldown,
          value: draft.cooldownSeconds,
          min: 0,
          max: 1800,
          onConfirm: (v: number) => setDraft((p) => ({ ...p, cooldownSeconds: v })),
        };
      case 'roundRepeats': {
        const r = draft.rounds.find((x) => x.id === picker.roundId);
        return {
          mode: 'count' as const,
          title: 'REPEATS',
          subtitle: 'Repetitions of all intervals in this round',
          accentColor: '#3B82F6',
          value: r?.repeats ?? 1,
          min: 1,
          max: 99,
          onConfirm: (v: number) =>
            updateRound(picker.roundId, (round) => ({ ...round, repeats: v })),
        };
      }
      case 'intervalDuration': {
        const r = draft.rounds.find((x) => x.id === picker.roundId);
        const inv = r?.intervals.find((i) => i.id === picker.intervalId);
        return {
          mode: 'time' as const,
          title: picker.label || 'INTERVALO',
          subtitle: 'Duración del intervalo',
          accentColor: picker.color,
          value: inv?.durationSeconds ?? 20,
          min: 1,
          max: 3600,
          onConfirm: (v: number) =>
            updateRound(picker.roundId, (round) => ({
              ...round,
              intervals: round.intervals.map((i) =>
                i.id === picker.intervalId ? { ...i, durationSeconds: v } : i
              ),
            })),
        };
      }
    }
  })();

  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-[#0A0A0A] text-white"
      onClick={() => openRoundMenuId && setOpenRoundMenuId(null)}
    >
      {/* Fixed Top Bar */}
      <header
        className="sticky top-0 z-30 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-md"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between px-4 pb-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-zinc-200 active:scale-95"
            aria-label="Cancelar"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h1 className="font-display text-xl font-extrabold tracking-wider uppercase text-white">
              {isEditing ? 'EDIT WORKOUT' : 'NEW WORKOUT'}
            </h1>
            <div className="font-display tabular-nums text-sm font-bold text-[#9EFF00]">
              TOTAL · {formatTime(totalDuration)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#9EFF00] text-black shadow-[0_0_16px_rgba(158,255,0,0.3)] active:scale-90"
            aria-label="Guardar workout"
          >
            <Check className="h-6 w-6 stroke-[2.8]" />
          </button>
        </div>
      </header>

      <main
        className="flex-1 space-y-4 px-4 pt-4"
        style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Name + Color Picker */}
        <section className="rounded-2xl border border-white/8 bg-[#1C1C1E] p-3.5">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              placeholder="MY TABATA"
              maxLength={40}
              className="font-display min-w-0 flex-1 bg-transparent text-2xl font-extrabold tracking-wide uppercase text-white placeholder:text-zinc-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowColorPicker((v) => !v)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white/25 transition active:scale-90"
              style={{ backgroundColor: draft.color }}
              aria-label="Elegir color del workout"
            />
          </div>

          {showColorPicker && (
            <div className="mt-3 flex flex-wrap gap-2.5 border-t border-white/8 pt-3">
              {WORKOUT_PALETTE.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => {
                    setDraft((p) => ({ ...p, color: hex }));
                    setShowColorPicker(false);
                  }}
                  className={`h-8 w-8 rounded-full transition active:scale-90 ${
                    draft.color === hex ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1C1C1E]' : ''
                  }`}
                  style={{ backgroundColor: hex }}
                  aria-label={`Color ${hex}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* PREPARE Block */}
        <button
          type="button"
          onClick={() => setPicker({ kind: 'prepare' })}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/8 bg-[#1C1C1E] px-4 py-3.5 text-left active:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FACC15]/15 text-[#FACC15]">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-lg font-extrabold tracking-wide uppercase text-white">
                PREPARE
              </div>
              <div className="text-xs text-zinc-400">
                Countdown before you start
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[#FACC15]">
            <span className="font-display tabular-nums text-2xl font-extrabold">
              {draft.prepareSeconds === 0
                ? 'OFF'
                : formatCompactTime(draft.prepareSeconds)}
            </span>
            <ChevronRight className="h-5 w-5 text-zinc-500" />
          </div>
        </button>

        {/* ROUNDS List */}
        <div className="space-y-4">
          {draft.rounds.map((round, roundIdx) => {
            const isMenuOpen = openRoundMenuId === round.id;

            return (
              <section
                key={round.id}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#141414]"
              >
                {/* Round Header */}
                <div className="flex items-center justify-between border-b border-white/8 bg-[#1C1C1E] px-4 py-3">
                  <input
                    type="text"
                    value={round.name ?? `ROUND ${roundIdx + 1}`}
                    onChange={(e) =>
                      updateRound(round.id, (r) => ({ ...r, name: e.target.value }))
                    }
                    className="font-display min-w-0 flex-1 bg-transparent text-lg font-extrabold tracking-wider uppercase text-zinc-200 focus:outline-none"
                    aria-label={`Nombre del round ${roundIdx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenRoundMenuId(isMenuOpen ? null : round.id);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-white/8 hover:text-white"
                    aria-label="Opciones del round"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>

                  {isMenuOpen && (
                    <div
                      className="absolute top-12 right-4 z-20 w-44 overflow-hidden rounded-2xl border border-white/12 bg-[#1C1C1E] py-1 shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setOpenRoundMenuId(null);
                          duplicateRound(round);
                        }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-white hover:bg-white/8"
                      >
                        <Copy className="h-4 w-4 text-zinc-400" />
                        Duplicar round
                      </button>
                      {draft.rounds.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenRoundMenuId(null);
                            deleteRound(round.id);
                          }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar round
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Intervals */}
                <div className="divide-y divide-white/8">
                  {round.intervals.map((interval, idx) => (
                    <div
                      key={interval.id}
                      className="flex items-center gap-2.5 px-3.5 py-3"
                    >
                      {/* Phase color dot (tap to cycle type: work -> rest -> custom) */}
                      <button
                        type="button"
                        onClick={() => cycleIntervalType(round.id, interval.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 active:scale-90"
                        title="Tocar para cambiar tipo (Work / Rest / Custom)"
                        aria-label="Cambiar tipo de intervalo"
                      >
                        <span
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: interval.color }}
                        />
                      </button>

                      {/* Editable Label & Type Subtitle */}
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={interval.label}
                          onChange={(e) =>
                            updateRound(round.id, (r) => ({
                              ...r,
                              intervals: r.intervals.map((i) =>
                                i.id === interval.id
                                  ? { ...i, label: e.target.value }
                                  : i
                              ),
                            }))
                          }
                          placeholder="WORK"
                          maxLength={28}
                          className="font-display w-full bg-transparent text-lg font-extrabold tracking-wide uppercase text-white placeholder:text-zinc-600 focus:outline-none"
                        />
                        <div className="text-[11px] font-medium uppercase text-zinc-500">
                          {interval.type === 'work'
                            ? 'High intensity'
                            : interval.type === 'rest'
                              ? 'Recovery'
                              : 'Custom exercise'}
                        </div>
                      </div>

                      {/* Reorder & Delete Controls */}
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveInterval(round.id, idx, -1)}
                          className="flex h-8 w-7 items-center justify-center rounded-lg text-zinc-500 enabled:hover:bg-white/8 enabled:hover:text-white disabled:opacity-25"
                          aria-label="Subir intervalo"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === round.intervals.length - 1}
                          onClick={() => moveInterval(round.id, idx, 1)}
                          className="flex h-8 w-7 items-center justify-center rounded-lg text-zinc-500 enabled:hover:bg-white/8 enabled:hover:text-white disabled:opacity-25"
                          aria-label="Bajar intervalo"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        {round.intervals.length > 1 && (
                          <button
                            type="button"
                            onClick={() => deleteInterval(round.id, interval.id)}
                            className="flex h-8 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-red-500/15 hover:text-red-400"
                            aria-label="Eliminar intervalo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Duration Button */}
                      <button
                        type="button"
                        onClick={() =>
                          setPicker({
                            kind: 'intervalDuration',
                            roundId: round.id,
                            intervalId: interval.id,
                            label: interval.label,
                            color: interval.color,
                          })
                        }
                        className="flex shrink-0 items-center gap-0.5 rounded-xl bg-white/5 px-2.5 py-1.5 active:scale-95"
                      >
                        <span
                          className="font-display tabular-nums text-2xl font-extrabold"
                          style={{ color: interval.color }}
                        >
                          {formatCompactTime(interval.durationSeconds)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-zinc-500" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Interval to Round Row */}
                <div className="flex items-center gap-2 border-t border-white/8 bg-[#18181A] px-3.5 py-2.5">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-500">
                    + ADD INTERVAL:
                  </span>
                  <button
                    type="button"
                    onClick={() => addIntervalToRound(round.id, 'work')}
                    className="rounded-lg bg-[#9EFF00]/15 px-2.5 py-1 text-xs font-bold text-[#9EFF00] active:scale-95"
                  >
                    + WORK
                  </button>
                  <button
                    type="button"
                    onClick={() => addIntervalToRound(round.id, 'rest')}
                    className="rounded-lg bg-[#FF453A]/15 px-2.5 py-1 text-xs font-bold text-[#FF453A] active:scale-95"
                  >
                    + REST
                  </button>
                  <button
                    type="button"
                    onClick={() => addIntervalToRound(round.id, 'custom')}
                    className="rounded-lg bg-[#0EA5E9]/15 px-2.5 py-1 text-xs font-bold text-[#0EA5E9] active:scale-95"
                  >
                    + CUSTOM
                  </button>
                </div>

                {/* REPEATS Row */}
                <button
                  type="button"
                  onClick={() =>
                    setPicker({ kind: 'roundRepeats', roundId: round.id })
                  }
                  className="flex w-full items-center justify-between gap-3 border-t border-white/8 bg-[#1C1C1E] px-4 py-3.5 text-left active:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/15 text-[#3B82F6]">
                      <Repeat className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-display text-lg font-extrabold tracking-wide uppercase text-white">
                        REPEATS
                      </div>
                      <div className="text-xs text-zinc-400">
                        Repetitions of all intervals in this round
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[#3B82F6]">
                    <span className="font-display tabular-nums text-2xl font-extrabold">
                      {round.repeats}
                    </span>
                    <ChevronRight className="h-5 w-5 text-zinc-500" />
                  </div>
                </button>
              </section>
            );
          })}
        </div>

        {/* Parallel Add Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              const lastRound = draft.rounds[draft.rounds.length - 1];
              if (lastRound) addIntervalToRound(lastRound.id, 'work');
            }}
            className="flex h-12 items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-[#1C1C1E] font-display text-base font-extrabold tracking-wider uppercase text-white active:scale-95"
          >
            <Plus className="h-4 w-4 text-[#9EFF00]" />
            ADD INTERVAL
          </button>
          <button
            type="button"
            onClick={addRound}
            className="flex h-12 items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-[#1C1C1E] font-display text-base font-extrabold tracking-wider uppercase text-white active:scale-95"
          >
            <Plus className="h-4 w-4 text-[#3B82F6]" />
            ADD ROUND
          </button>
        </div>

        {/* Global Bottom Section: CYCLES, REST BETWEEN CYCLES, COOLDOWN */}
        <section className="divide-y divide-white/8 overflow-hidden rounded-3xl border border-white/8 bg-[#1C1C1E]">
          <button
            type="button"
            onClick={() => setPicker({ kind: 'cycles' })}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left active:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F97316]/15 text-[#F97316]">
                <RotateCw className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-lg font-extrabold tracking-wide uppercase text-white">
                  CYCLES
                </div>
                <div className="text-xs text-zinc-400">
                  Number of repetitions of all rounds
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[#F97316]">
              <span className="font-display tabular-nums text-2xl font-extrabold">
                {draft.cycles}
              </span>
              <ChevronRight className="h-5 w-5 text-zinc-500" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPicker({ kind: 'restBetweenCycles' })}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left active:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F97316]/15 text-[#F97316]">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-lg font-extrabold tracking-wide uppercase text-white">
                  REST BETWEEN CYCLES
                </div>
                <div className="text-xs text-zinc-400">
                  Recovery between full cycles
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[#F97316]">
              <span className="font-display tabular-nums text-2xl font-extrabold">
                {draft.restBetweenCyclesSeconds === 0
                  ? 'OFF'
                  : formatCompactTime(draft.restBetweenCyclesSeconds)}
              </span>
              <ChevronRight className="h-5 w-5 text-zinc-500" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPicker({ kind: 'cooldown' })}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left active:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/15 text-[#3B82F6]">
                <Snowflake className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-lg font-extrabold tracking-wide uppercase text-white">
                  COOLDOWN
                </div>
                <div className="text-xs text-zinc-400">
                  Optional stretch after workout
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[#3B82F6]">
              <span className="font-display tabular-nums text-2xl font-extrabold">
                {draft.cooldownSeconds === 0
                  ? 'OFF'
                  : formatCompactTime(draft.cooldownSeconds)}
              </span>
              <ChevronRight className="h-5 w-5 text-zinc-500" />
            </div>
          </button>
        </section>
      </main>

      {pickerProps && (
        <TimePickerModal
          isOpen={true}
          mode={pickerProps.mode}
          title={pickerProps.title}
          subtitle={pickerProps.subtitle}
          accentColor={pickerProps.accentColor}
          value={pickerProps.value}
          min={pickerProps.min}
          max={pickerProps.max}
          onConfirm={pickerProps.onConfirm}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
