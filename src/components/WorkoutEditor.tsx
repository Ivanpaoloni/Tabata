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

interface IntervalSheetTarget {
  roundId: string;
  intervalId: string;
}

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
  const [showColorSheet, setShowColorSheet] = useState(false);
  const [roundSheetId, setRoundSheetId] = useState<string | null>(null);
  const [intervalSheet, setIntervalSheet] = useState<IntervalSheetTarget | null>(
    null
  );
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

  const setIntervalType = (
    roundId: string,
    intervalId: string,
    nextType: IntervalType
  ) => {
    updateRound(roundId, (r) => ({
      ...r,
      intervals: r.intervals.map((inv) => {
        if (inv.id !== intervalId) return inv;
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

  const activeRoundSheet = roundSheetId
    ? draft.rounds.find((r) => r.id === roundSheetId) ?? null
    : null;

  const activeIntervalContext = (() => {
    if (!intervalSheet) return null;
    const round = draft.rounds.find((r) => r.id === intervalSheet.roundId);
    if (!round) return null;
    const index = round.intervals.findIndex(
      (i) => i.id === intervalSheet.intervalId
    );
    if (index === -1) return null;
    return { round, interval: round.intervals[index], index };
  })();

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
    <div className="flex min-h-dvh flex-col bg-[#09090B] text-[#FAFAFA] select-none touch-manipulation">
      {/* Clean Header: Cancel (48px) + Title/Total + Spacer */}
      <header
        className="sticky top-0 z-30 border-b border-white/8 bg-[#09090B]/95 backdrop-blur-md"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between px-4 pb-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-[#121215] text-zinc-300 transition-all duration-100 active:scale-97 active:bg-white/10"
            aria-label="Cancelar"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h1 className="font-display text-base font-semibold tracking-tight text-[#FAFAFA]">
              {isEditing ? 'Editar rutina' : 'Nueva rutina'}
            </h1>
            <div className="tabular-nums mt-0.5 text-xs font-medium text-zinc-400">
              Duración total · {formatTime(totalDuration)}
            </div>
          </div>

          <div className="h-12 w-12" aria-hidden="true" />
        </div>
      </header>

      {/* Grouped iOS-Style Form */}
      <main className="flex-1 space-y-5 px-4 pt-5 pb-6">
        {/* Routine Name & Color */}
        <section className="overflow-hidden rounded-2xl border border-white/8 bg-[#121215]">
          <div className="flex min-h-16 items-center gap-3 px-4 py-2">
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              placeholder="Nombre de la rutina"
              maxLength={40}
              className="font-display min-h-12 min-w-0 flex-1 bg-transparent text-base font-semibold tracking-tight text-[#FAFAFA] placeholder:text-zinc-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowColorSheet(true)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#18181B] transition-all duration-100 active:scale-97 active:bg-white/10"
              aria-label="Elegir color de etiqueta"
            >
              <span
                className="h-5 w-5 rounded-full"
                style={{ backgroundColor: draft.color }}
              />
            </button>
          </div>
        </section>

        {/* PREPARE Row (full-row clickable, min-h-15) */}
        <section className="overflow-hidden rounded-2xl border border-white/8 bg-[#121215]">
          <button
            type="button"
            onClick={() => setPicker({ kind: 'prepare' })}
            className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-all duration-100 active:scale-97 active:bg-white/10"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/6 bg-[#18181B] text-[#FBBF24]">
                <Timer className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-medium text-[#FAFAFA]">
                  Preparación
                </div>
                <div className="text-xs text-zinc-500">
                  Cuenta regresiva inicial
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[#FAFAFA]">
              <span className="font-display tabular-nums text-base font-semibold">
                {draft.prepareSeconds === 0
                  ? 'Off'
                  : formatCompactTime(draft.prepareSeconds)}
              </span>
              <ChevronRight className="h-5 w-5 text-zinc-500" />
            </div>
          </button>
        </section>

        {/* ROUNDS Grouped Cards */}
        <div className="space-y-5">
          {draft.rounds.map((round, roundIdx) => (
            <section
              key={round.id}
              className="overflow-hidden rounded-2xl border border-white/8 bg-[#121215]"
            >
              {/* Round Header */}
              <div className="flex min-h-14 items-center justify-between gap-3 border-b border-white/6 bg-[#18181B]/60 px-4 py-2">
                <input
                  type="text"
                  value={round.name ?? `Ronda ${roundIdx + 1}`}
                  onChange={(e) =>
                    updateRound(round.id, (r) => ({ ...r, name: e.target.value }))
                  }
                  className="font-display min-h-12 min-w-0 flex-1 bg-transparent text-base font-semibold tracking-tight text-zinc-200 focus:outline-none"
                  aria-label={`Nombre de la ronda ${roundIdx + 1}`}
                />
                <button
                  type="button"
                  onClick={() => setRoundSheetId(round.id)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-zinc-400 transition-all duration-100 active:scale-97 active:bg-white/10"
                  aria-label="Opciones de la ronda"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>

              {/* Intervals List (each row min-h-16, full-row clickable for duration + 48px menu) */}
              <div className="divide-y divide-white/6">
                {round.intervals.map((interval) => (
                  <div
                    key={interval.id}
                    className="flex min-h-16 items-center gap-2 pr-2"
                  >
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
                      className="flex min-h-16 min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 text-left transition-all duration-100 active:scale-97 active:bg-white/10"
                    >
                      <div className="flex min-w-0 items-center gap-3.5">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: PHASE_COLORS[interval.type] }}
                        />
                        <div className="min-w-0">
                          <div className="truncate text-base font-medium text-[#FAFAFA]">
                            {interval.label || 'Intervalo'}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {interval.type === 'work'
                              ? 'Actividad'
                              : interval.type === 'rest'
                                ? 'Recuperación'
                                : 'Personalizado'}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1 text-[#FAFAFA]">
                        <span className="font-display tabular-nums text-base font-semibold">
                          {formatCompactTime(interval.durationSeconds)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-zinc-500" />
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setIntervalSheet({
                          roundId: round.id,
                          intervalId: interval.id,
                        })
                      }
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-zinc-400 transition-all duration-100 active:scale-97 active:bg-white/10"
                      aria-label={`Editar opciones de ${interval.label}`}
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Interval to Round (3 big 48px pills, gap-3) */}
              <div className="grid grid-cols-3 gap-2.5 border-t border-white/6 bg-[#09090B]/40 p-3">
                <button
                  type="button"
                  onClick={() => addIntervalToRound(round.id, 'work')}
                  className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-[#18181B] text-xs font-medium text-zinc-200 transition-all duration-100 active:scale-97 active:bg-white/10"
                >
                  <span className="h-2 w-2 rounded-full bg-[#34D399]" />
                  + Trabajo
                </button>
                <button
                  type="button"
                  onClick={() => addIntervalToRound(round.id, 'rest')}
                  className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-[#18181B] text-xs font-medium text-zinc-200 transition-all duration-100 active:scale-97 active:bg-white/10"
                >
                  <span className="h-2 w-2 rounded-full bg-[#F87171]" />
                  + Descanso
                </button>
                <button
                  type="button"
                  onClick={() => addIntervalToRound(round.id, 'custom')}
                  className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-[#18181B] text-xs font-medium text-zinc-200 transition-all duration-100 active:scale-97 active:bg-white/10"
                >
                  <span className="h-2 w-2 rounded-full bg-[#60A5FA]" />
                  + Ejercicio
                </button>
              </div>

              {/* REPEATS Row (full-row clickable, min-h-16) */}
              <button
                type="button"
                onClick={() =>
                  setPicker({ kind: 'roundRepeats', roundId: round.id })
                }
                className="flex min-h-16 w-full items-center justify-between gap-3 border-t border-white/6 px-4 py-3 text-left transition-all duration-100 active:scale-97 active:bg-white/10"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/6 bg-[#18181B] text-zinc-300">
                    <Repeat className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-base font-medium text-[#FAFAFA]">
                      Repeticiones
                    </div>
                    <div className="text-xs text-zinc-500">
                      Repeticiones de esta ronda
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[#FAFAFA]">
                  <span className="font-display tabular-nums text-base font-semibold">
                    {round.repeats}
                  </span>
                  <ChevronRight className="h-5 w-5 text-zinc-500" />
                </div>
              </button>
            </section>
          ))}
        </div>

        {/* Add Round CTA */}
        <button
          type="button"
          onClick={addRound}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-white/8 bg-[#121215] text-sm font-semibold text-zinc-200 transition-all duration-100 active:scale-97 active:bg-white/10"
        >
          <Plus className="h-5 w-5 text-zinc-400" />
          Añadir ronda
        </button>

        {/* Global Grouped List: Cycles, Rest Between Cycles, Cooldown */}
        <section className="divide-y divide-white/6 overflow-hidden rounded-2xl border border-white/8 bg-[#121215]">
          <button
            type="button"
            onClick={() => setPicker({ kind: 'cycles' })}
            className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-all duration-100 active:scale-97 active:bg-white/10"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/6 bg-[#18181B] text-zinc-300">
                <RotateCw className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-medium text-[#FAFAFA]">Ciclos</div>
                <div className="text-xs text-zinc-500">
                  Repeticiones de todas las rondas
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[#FAFAFA]">
              <span className="font-display tabular-nums text-base font-semibold">
                {draft.cycles}
              </span>
              <ChevronRight className="h-5 w-5 text-zinc-500" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPicker({ kind: 'restBetweenCycles' })}
            className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-all duration-100 active:scale-97 active:bg-white/10"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/6 bg-[#18181B] text-[#60A5FA]">
                <PauseCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-medium text-[#FAFAFA]">
                  Descanso entre ciclos
                </div>
                <div className="text-xs text-zinc-500">
                  Recuperación entre ciclos completos
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[#FAFAFA]">
              <span className="font-display tabular-nums text-base font-semibold">
                {draft.restBetweenCyclesSeconds === 0
                  ? 'Off'
                  : formatCompactTime(draft.restBetweenCyclesSeconds)}
              </span>
              <ChevronRight className="h-5 w-5 text-zinc-500" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPicker({ kind: 'cooldown' })}
            className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-all duration-100 active:scale-97 active:bg-white/10"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/6 bg-[#18181B] text-[#60A5FA]">
                <Snowflake className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-medium text-[#FAFAFA]">
                  Enfriamiento
                </div>
                <div className="text-xs text-zinc-500">
                  Estiramiento opcional al finalizar
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[#FAFAFA]">
              <span className="font-display tabular-nums text-base font-semibold">
                {draft.cooldownSeconds === 0
                  ? 'Off'
                  : formatCompactTime(draft.cooldownSeconds)}
              </span>
              <ChevronRight className="h-5 w-5 text-zinc-500" />
            </div>
          </button>
        </section>
      </main>

      {/* Sticky Bottom Save Bar (Thumb Zone) */}
      <div
        className="sticky bottom-0 z-30 border-t border-white/8 bg-[#09090B]/95 px-4 pt-3 backdrop-blur-md"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={handleSave}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#FAFAFA] text-base font-semibold text-[#09090B] transition-all duration-100 active:scale-97 active:bg-zinc-200"
        >
          <Check className="h-5 w-5 stroke-[2.5]" />
          Guardar rutina
        </button>
      </div>

      {/* Color Picker Bottom Sheet */}
      {showColorSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowColorSheet(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Color de etiqueta"
        >
          <div
            className="w-full max-w-md rounded-t-3xl border-t border-white/10 bg-[#121215] px-5 pt-3"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-[#FAFAFA]">
                Color de etiqueta
              </h3>
              <button
                type="button"
                onClick={() => setShowColorSheet(false)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-[#18181B] text-zinc-300 transition-all duration-100 active:scale-97 active:bg-white/10"
                aria-label="Cerrar selector de color"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {WORKOUT_PALETTE.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => {
                    setDraft((p) => ({ ...p, color: hex }));
                    setShowColorSheet(false);
                  }}
                  className={`flex h-14 items-center justify-center rounded-2xl border bg-[#18181B] transition-all duration-100 active:scale-97 ${
                    draft.color === hex
                      ? 'border-[#FAFAFA]'
                      : 'border-white/8'
                  }`}
                  aria-label={`Color ${hex}`}
                >
                  <span
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: hex }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Round Actions Bottom Sheet */}
      {activeRoundSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setRoundSheetId(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Opciones de la ronda"
        >
          <div
            className="w-full max-w-md rounded-t-3xl border-t border-white/10 bg-[#121215] px-5 pt-3"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-[#FAFAFA]">
                {activeRoundSheet.name || 'Ronda'}
              </h3>
              <button
                type="button"
                onClick={() => setRoundSheetId(null)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-[#18181B] text-zinc-300 transition-all duration-100 active:scale-97 active:bg-white/10"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  duplicateRound(activeRoundSheet);
                  setRoundSheetId(null);
                }}
                className="flex h-14 w-full items-center gap-3.5 rounded-2xl border border-white/8 bg-[#18181B] px-4 text-base font-medium text-[#FAFAFA] transition-all duration-100 active:scale-97 active:bg-white/10"
              >
                <Copy className="h-5 w-5 text-zinc-400" />
                Duplicar ronda
              </button>
              {draft.rounds.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    deleteRound(activeRoundSheet.id);
                    setRoundSheetId(null);
                  }}
                  className="flex h-14 w-full items-center gap-3.5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 text-base font-medium text-[#F87171] transition-all duration-100 active:scale-97 active:bg-red-500/20"
                >
                  <Trash2 className="h-5 w-5" />
                  Eliminar ronda
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interval Edit Bottom Sheet */}
      {activeIntervalContext && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setIntervalSheet(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Editar intervalo"
        >
          <div
            className="w-full max-w-md rounded-t-3xl border-t border-white/10 bg-[#121215] px-5 pt-3"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-[#FAFAFA]">
                Editar intervalo
              </h3>
              <button
                type="button"
                onClick={() => setIntervalSheet(null)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-[#18181B] text-zinc-300 transition-all duration-100 active:scale-97 active:bg-white/10"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name Input (text-base >= 16px for iOS Safari) */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Nombre
                </label>
                <input
                  type="text"
                  value={activeIntervalContext.interval.label}
                  onChange={(e) =>
                    updateRound(activeIntervalContext.round.id, (r) => ({
                      ...r,
                      intervals: r.intervals.map((i) =>
                        i.id === activeIntervalContext.interval.id
                          ? { ...i, label: e.target.value }
                          : i
                      ),
                    }))
                  }
                  placeholder="Ej. Burpees, Trabajo, Descanso"
                  maxLength={28}
                  className="h-14 w-full rounded-2xl border border-white/10 bg-[#09090B] px-4 text-base font-medium text-[#FAFAFA] placeholder:text-zinc-600 focus:border-white/25 focus:outline-none"
                />
              </div>

              {/* Type Selector */}
              <div>
                <span className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Tipo de fase
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      { type: 'work', label: 'Trabajo' },
                      { type: 'rest', label: 'Descanso' },
                      { type: 'custom', label: 'Ejercicio' },
                    ] as const
                  ).map((opt) => {
                    const selected =
                      activeIntervalContext.interval.type === opt.type;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() =>
                          setIntervalType(
                            activeIntervalContext.round.id,
                            activeIntervalContext.interval.id,
                            opt.type
                          )
                        }
                        className={`flex h-12 items-center justify-center gap-2 rounded-2xl border text-sm font-medium transition-all duration-100 active:scale-97 ${
                          selected
                            ? 'border-[#FAFAFA] bg-[#FAFAFA] text-[#09090B]'
                            : 'border-white/8 bg-[#18181B] text-zinc-200 active:bg-white/10'
                        }`}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: PHASE_COLORS[opt.type] }}
                        />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reorder Row */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={activeIntervalContext.index === 0}
                  onClick={() =>
                    moveInterval(
                      activeIntervalContext.round.id,
                      activeIntervalContext.index,
                      -1
                    )
                  }
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/8 bg-[#18181B] text-sm font-medium text-zinc-200 transition-all duration-100 active:scale-97 active:bg-white/10 disabled:opacity-35"
                >
                  <ArrowUp className="h-4 w-4" />
                  Subir
                </button>
                <button
                  type="button"
                  disabled={
                    activeIntervalContext.index ===
                    activeIntervalContext.round.intervals.length - 1
                  }
                  onClick={() =>
                    moveInterval(
                      activeIntervalContext.round.id,
                      activeIntervalContext.index,
                      1
                    )
                  }
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/8 bg-[#18181B] text-sm font-medium text-zinc-200 transition-all duration-100 active:scale-97 active:bg-white/10 disabled:opacity-35"
                >
                  <ArrowDown className="h-4 w-4" />
                  Bajar
                </button>
              </div>

              {/* Delete Interval */}
              {activeIntervalContext.round.intervals.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    deleteInterval(
                      activeIntervalContext.round.id,
                      activeIntervalContext.interval.id
                    );
                    setIntervalSheet(null);
                  }}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 text-base font-medium text-[#F87171] transition-all duration-100 active:scale-97 active:bg-red-500/20"
                >
                  <Trash2 className="h-5 w-5" />
                  Eliminar intervalo
                </button>
              )}

              <button
                type="button"
                onClick={() => setIntervalSheet(null)}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#FAFAFA] text-base font-semibold text-[#09090B] transition-all duration-100 active:scale-97 active:bg-zinc-200"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

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
