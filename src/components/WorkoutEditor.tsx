import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Copy,
  MoreHorizontal,
  PauseCircle,
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
  | {
      kind: 'intervalDuration';
      roundId: string;
      intervalId: string;
      label: string;
      color: string;
    }
  | null;

function createDefaultWorkout(): Workout {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name: 'Mi rutina',
    color: PHASE_COLORS.work,
    prepareSeconds: 5,
    rounds: [
      {
        id: generateId(),
        name: 'Ronda 1',
        repeats: 4,
        intervals: [
          {
            id: generateId(),
            type: 'work',
            label: 'Trabajo',
            durationSeconds: 30,
            color: PHASE_COLORS.work,
          },
          {
            id: generateId(),
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
      label: type === 'work' ? 'Trabajo' : type === 'rest' ? 'Descanso' : 'Ejercicio',
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
        const lower = inv.label.trim().toLowerCase();
        const isDefaultLabel =
          lower === 'trabajo' ||
          lower === 'descanso' ||
          lower === 'ejercicio' ||
          lower === 'work' ||
          lower === 'rest';
        return {
          ...inv,
          type: nextType,
          color: PHASE_COLORS[nextType],
          label: isDefaultLabel
            ? nextType === 'work'
              ? 'Trabajo'
              : nextType === 'rest'
                ? 'Descanso'
                : 'Ejercicio'
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
      name: `Ronda ${nextNum}`,
      repeats: 4,
      intervals: [
        {
          id: generateId(),
          type: 'work',
          label: 'Trabajo',
          durationSeconds: 20,
          color: PHASE_COLORS.work,
        },
        {
          id: generateId(),
          type: 'rest',
          label: 'Descanso',
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
      name: `Ronda ${draft.rounds.length + 1}`,
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
      name: draft.name.trim() || 'Mi rutina',
      updatedAt: now,
    });
  };

  const pickerProps = (() => {
    if (!picker) return null;
    switch (picker.kind) {
      case 'prepare':
        return {
          mode: 'time' as const,
          title: 'Preparación',
          subtitle: 'Cuenta regresiva antes de comenzar',
          accentColor: PHASE_COLORS.prepare,
          value: draft.prepareSeconds,
          min: 0,
          max: 300,
          onConfirm: (v: number) => setDraft((p) => ({ ...p, prepareSeconds: v })),
        };
      case 'cycles':
        return {
          mode: 'count' as const,
          title: 'Ciclos',
          subtitle: 'Repeticiones de todas las rondas',
          accentColor: '#60A5FA',
          value: draft.cycles,
          min: 1,
          max: 99,
          onConfirm: (v: number) => setDraft((p) => ({ ...p, cycles: v })),
        };
      case 'restBetweenCycles':
        return {
          mode: 'time' as const,
          title: 'Descanso entre ciclos',
          subtitle: 'Pausa al completar cada ciclo',
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
          title: 'Enfriamiento',
          subtitle: 'Tiempo opcional al finalizar el entrenamiento',
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
          title: 'Repeticiones',
          subtitle: 'Veces que se repiten los intervalos de esta ronda',
          accentColor: '#60A5FA',
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
          title: picker.label || 'Intervalo',
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
      className="flex min-h-dvh flex-col bg-[#09090B] text-[#FAFAFA]"
      onClick={() => openRoundMenuId && setOpenRoundMenuId(null)}
    >
      {/* Fixed Top Bar */}
      <header
        className="sticky top-0 z-30 border-b border-white/8 bg-[#09090B]/95 backdrop-blur-md"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between px-5 pb-3.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-[#121215] text-zinc-300 transition hover:text-white active:scale-95"
            aria-label="Cancelar"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="text-center">
            <h1 className="font-display text-sm font-semibold tracking-tight text-[#FAFAFA]">
              {isEditing ? 'Editar rutina' : 'Nueva rutina'}
            </h1>
            <div className="tabular-nums mt-0.5 text-xs font-medium text-zinc-400">
              Total · {formatTime(totalDuration)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAFAFA] text-[#09090B] transition hover:bg-zinc-200 active:scale-95"
            aria-label="Guardar rutina"
          >
            <Check className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>
      </header>

      <main
        className="flex-1 space-y-4 px-5 pt-5"
        style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Name + Color Dot */}
        <section className="rounded-2xl border border-white/8 bg-[#121215] px-4 py-3.5">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              placeholder="Nombre de la rutina"
              maxLength={40}
              className="font-display min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-tight text-[#FAFAFA] placeholder:text-zinc-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowColorPicker((v) => !v)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#18181B] transition active:scale-90"
              aria-label="Elegir color de etiqueta"
            >
              <span
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: draft.color }}
              />
            </button>
          </div>

          {showColorPicker && (
            <div className="mt-3 flex flex-wrap gap-2.5 border-t border-white/6 pt-3">
              {WORKOUT_PALETTE.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => {
                    setDraft((p) => ({ ...p, color: hex }));
                    setShowColorPicker(false);
                  }}
                  className={`h-7 w-7 rounded-full transition active:scale-90 ${
                    draft.color === hex
                      ? 'ring-2 ring-[#FAFAFA] ring-offset-2 ring-offset-[#121215]'
                      : ''
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
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/8 bg-[#121215] px-4 py-3.5 text-left transition hover:border-white/12 active:bg-[#18181B]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/6 bg-[#18181B] text-[#FBBF24]">
              <Timer className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium text-[#FAFAFA]">Preparación</div>
              <div className="text-xs text-zinc-500">
                Cuenta regresiva inicial
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-zinc-200">
            <span className="font-display tabular-nums text-base font-semibold">
              {draft.prepareSeconds === 0
                ? 'Off'
                : formatCompactTime(draft.prepareSeconds)}
            </span>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </div>
        </button>

        {/* ROUNDS List */}
        <div className="space-y-4">
          {draft.rounds.map((round, roundIdx) => {
            const isMenuOpen = openRoundMenuId === round.id;

            return (
              <section
                key={round.id}
                className="relative overflow-hidden rounded-3xl border border-white/8 bg-[#121215]"
              >
                {/* Round Header */}
                <div className="flex items-center justify-between border-b border-white/6 bg-[#18181B]/60 px-4 py-3">
                  <input
                    type="text"
                    value={round.name ?? `Ronda ${roundIdx + 1}`}
                    onChange={(e) =>
                      updateRound(round.id, (r) => ({ ...r, name: e.target.value }))
                    }
                    className="font-display min-w-0 flex-1 bg-transparent text-xs font-semibold tracking-wide uppercase text-zinc-300 focus:outline-none"
                    aria-label={`Nombre de la ronda ${roundIdx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenRoundMenuId(isMenuOpen ? null : round.id);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/6 hover:text-zinc-200"
                    aria-label="Opciones de la ronda"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>

                  {isMenuOpen && (
                    <div
                      className="absolute top-11 right-4 z-20 w-40 overflow-hidden rounded-2xl border border-white/10 bg-[#18181B] py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setOpenRoundMenuId(null);
                          duplicateRound(round);
                        }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-zinc-200 hover:bg-white/6"
                      >
                        <Copy className="h-3.5 w-3.5 text-zinc-400" />
                        Duplicar ronda
                      </button>
                      {draft.rounds.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenRoundMenuId(null);
                            deleteRound(round.id);
                          }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar ronda
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Intervals */}
                <div className="divide-y divide-white/6">
                  {round.intervals.map((interval, idx) => (
                    <div
                      key={interval.id}
                      className="flex items-center gap-2.5 px-3.5 py-3"
                    >
                      <button
                        type="button"
                        onClick={() => cycleIntervalType(round.id, interval.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/6 bg-[#18181B] transition active:scale-90"
                        title="Cambiar tipo (Trabajo / Descanso / Ejercicio)"
                        aria-label="Cambiar tipo de intervalo"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: PHASE_COLORS[interval.type] }}
                        />
                      </button>

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
                          placeholder="Trabajo"
                          maxLength={28}
                          className="w-full bg-transparent text-sm font-medium text-[#FAFAFA] placeholder:text-zinc-600 focus:outline-none"
                        />
                        <div className="text-[11px] text-zinc-500">
                          {interval.type === 'work'
                            ? 'Actividad'
                            : interval.type === 'rest'
                              ? 'Recuperación'
                              : 'Personalizado'}
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveInterval(round.id, idx, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 enabled:hover:bg-white/6 enabled:hover:text-zinc-200 disabled:opacity-25"
                          aria-label="Subir intervalo"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === round.intervals.length - 1}
                          onClick={() => moveInterval(round.id, idx, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 enabled:hover:bg-white/6 enabled:hover:text-zinc-200 disabled:opacity-25"
                          aria-label="Bajar intervalo"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        {round.intervals.length > 1 && (
                          <button
                            type="button"
                            onClick={() => deleteInterval(round.id, interval.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                            aria-label="Eliminar intervalo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setPicker({
                            kind: 'intervalDuration',
                            roundId: round.id,
                            intervalId: interval.id,
                            label: interval.label,
                            color: PHASE_COLORS[interval.type],
                          })
                        }
                        className="flex shrink-0 items-center gap-0.5 rounded-xl border border-white/6 bg-[#18181B] px-2.5 py-1.5 active:scale-95"
                      >
                        <span className="font-display tabular-nums text-sm font-semibold text-[#FAFAFA]">
                          {formatCompactTime(interval.durationSeconds)}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Interval to Round Row */}
                <div className="flex flex-wrap items-center gap-1.5 border-t border-white/6 bg-[#09090B]/40 px-3.5 py-2.5">
                  <span className="mr-1 text-[11px] font-medium text-zinc-500">
                    Añadir:
                  </span>
                  <button
                    type="button"
                    onClick={() => addIntervalToRound(round.id, 'work')}
                    className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-[#18181B] px-2.5 py-1 text-xs font-medium text-zinc-200 transition hover:bg-white/8 active:scale-95"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                    Trabajo
                  </button>
                  <button
                    type="button"
                    onClick={() => addIntervalToRound(round.id, 'rest')}
                    className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-[#18181B] px-2.5 py-1 text-xs font-medium text-zinc-200 transition hover:bg-white/8 active:scale-95"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F87171]" />
                    Descanso
                  </button>
                  <button
                    type="button"
                    onClick={() => addIntervalToRound(round.id, 'custom')}
                    className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-[#18181B] px-2.5 py-1 text-xs font-medium text-zinc-200 transition hover:bg-white/8 active:scale-95"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#60A5FA]" />
                    Ejercicio
                  </button>
                </div>

                {/* REPEATS Row */}
                <button
                  type="button"
                  onClick={() =>
                    setPicker({ kind: 'roundRepeats', roundId: round.id })
                  }
                  className="flex w-full items-center justify-between gap-3 border-t border-white/6 bg-[#121215] px-4 py-3.5 text-left transition hover:bg-[#18181B]/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/6 bg-[#18181B] text-zinc-300">
                      <Repeat className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#FAFAFA]">
                        Repeticiones
                      </div>
                      <div className="text-xs text-zinc-500">
                        Repeticiones de esta ronda
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[#FAFAFA]">
                    <span className="font-display tabular-nums text-base font-semibold">
                      {round.repeats}
                    </span>
                    <ChevronRight className="h-4 w-4 text-zinc-600" />
                  </div>
                </button>
              </section>
            );
          })}
        </div>

        {/* Parallel Add Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              const lastRound = draft.rounds[draft.rounds.length - 1];
              if (lastRound) addIntervalToRound(lastRound.id, 'work');
            }}
            className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-white/8 bg-[#121215] text-xs font-medium text-zinc-200 transition hover:bg-[#18181B] active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 text-zinc-400" />
            Añadir intervalo
          </button>
          <button
            type="button"
            onClick={addRound}
            className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-white/8 bg-[#121215] text-xs font-medium text-zinc-200 transition hover:bg-[#18181B] active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 text-zinc-400" />
            Añadir ronda
          </button>
        </div>

        {/* Global Bottom Section */}
        <section className="divide-y divide-white/6 overflow-hidden rounded-3xl border border-white/8 bg-[#121215]">
          <button
            type="button"
            onClick={() => setPicker({ kind: 'cycles' })}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-[#18181B]/70"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/6 bg-[#18181B] text-zinc-300">
                <RotateCw className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-[#FAFAFA]">Ciclos</div>
                <div className="text-xs text-zinc-500">
                  Repeticiones de todas las rondas
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[#FAFAFA]">
              <span className="font-display tabular-nums text-base font-semibold">
                {draft.cycles}
              </span>
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPicker({ kind: 'restBetweenCycles' })}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-[#18181B]/70"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/6 bg-[#18181B] text-[#60A5FA]">
                <PauseCircle className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-[#FAFAFA]">
                  Descanso entre ciclos
                </div>
                <div className="text-xs text-zinc-500">
                  Recuperación entre ciclos completos
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[#FAFAFA]">
              <span className="font-display tabular-nums text-base font-semibold">
                {draft.restBetweenCyclesSeconds === 0
                  ? 'Off'
                  : formatCompactTime(draft.restBetweenCyclesSeconds)}
              </span>
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPicker({ kind: 'cooldown' })}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-[#18181B]/70"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/6 bg-[#18181B] text-[#60A5FA]">
                <Snowflake className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-[#FAFAFA]">
                  Enfriamiento
                </div>
                <div className="text-xs text-zinc-500">
                  Estiramiento opcional al finalizar
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[#FAFAFA]">
              <span className="font-display tabular-nums text-base font-semibold">
                {draft.cooldownSeconds === 0
                  ? 'Off'
                  : formatCompactTime(draft.cooldownSeconds)}
              </span>
              <ChevronRight className="h-4 w-4 text-zinc-600" />
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
