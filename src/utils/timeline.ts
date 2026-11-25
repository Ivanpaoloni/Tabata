import {
  PHASE_COLORS,
  type Interval,
  type QuickTabataConfig,
  type TimelineStep,
  type Workout,
} from '../types/workout';

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function flattenWorkoutToTimeline(workout: Workout): TimelineStep[] {
  const rawSteps: Omit<TimelineStep, 'index' | 'startOffsetSeconds' | 'upNext'>[] = [];
  const totalCycles = Math.max(1, Math.floor(workout.cycles || 1));
  const rounds = workout.rounds.filter((r) =>
    r.intervals.some((i) => i.durationSeconds > 0)
  );
  const totalRounds = rounds.length;

  if (workout.prepareSeconds > 0) {
    const firstRound = rounds[0];
    rawSteps.push({
      phase: 'prepare',
      label: 'PREPARE',
      color: PHASE_COLORS.prepare,
      durationSeconds: Math.floor(workout.prepareSeconds),
      cycleIndex: 1,
      totalCycles,
      cyclesLeft: totalCycles,
      roundIndex: totalRounds > 0 ? 1 : 0,
      totalRounds,
      roundName: firstRound?.name?.trim() || 'ROUND 1',
      repeatIndex: 1,
      totalRepeats: firstRound ? Math.max(1, Math.floor(firstRound.repeats)) : 1,
      repeatsLeft: firstRound ? Math.max(1, Math.floor(firstRound.repeats)) : 0,
    });
  }

  for (let c = 1; c <= totalCycles; c++) {
    for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
      const round = rounds[rIdx];
      const totalRepeats = Math.max(1, Math.floor(round.repeats || 1));
      const roundName = round.name?.trim() || `ROUND ${rIdx + 1}`;

      for (let rep = 1; rep <= totalRepeats; rep++) {
        for (const interval of round.intervals) {
          const duration = Math.floor(interval.durationSeconds);
          if (duration <= 0) continue;

          const fallbackLabel =
            interval.type === 'work'
              ? 'WORK'
              : interval.type === 'rest'
                ? 'REST'
                : 'CUSTOM';

          rawSteps.push({
            phase: interval.type,
            label: interval.label.trim().toUpperCase() || fallbackLabel,
            color: interval.color || PHASE_COLORS[interval.type],
            durationSeconds: duration,
            cycleIndex: c,
            totalCycles,
            cyclesLeft: totalCycles - c + 1,
            roundIndex: rIdx + 1,
            totalRounds,
            roundName,
            repeatIndex: rep,
            totalRepeats,
            repeatsLeft: totalRepeats - rep + 1,
          });
        }
      }
    }

    if (c < totalCycles && workout.restBetweenCyclesSeconds > 0) {
      rawSteps.push({
        phase: 'rest_between_cycles',
        label: 'CYCLE REST',
        color: PHASE_COLORS.rest_between_cycles,
        durationSeconds: Math.floor(workout.restBetweenCyclesSeconds),
        cycleIndex: c,
        totalCycles,
        cyclesLeft: totalCycles - c,
        roundIndex: totalRounds,
        totalRounds,
        roundName: 'CYCLE REST',
        repeatIndex: 0,
        totalRepeats: 0,
        repeatsLeft: 0,
      });
    }
  }

  if (workout.cooldownSeconds > 0) {
    rawSteps.push({
      phase: 'cooldown',
      label: 'COOLDOWN',
      color: PHASE_COLORS.cooldown,
      durationSeconds: Math.floor(workout.cooldownSeconds),
      cycleIndex: totalCycles,
      totalCycles,
      cyclesLeft: 0,
      roundIndex: totalRounds,
      totalRounds,
      roundName: 'COOLDOWN',
      repeatIndex: 0,
      totalRepeats: 0,
      repeatsLeft: 0,
    });
  }

  let runningOffset = 0;
  return rawSteps.map((step, index) => {
    const next = rawSteps[index + 1];
    const startOffsetSeconds = runningOffset;
    runningOffset += step.durationSeconds;

    return {
      ...step,
      index,
      startOffsetSeconds,
      upNext: next
        ? {
            label: next.label,
            durationSeconds: next.durationSeconds,
            color: next.color,
            phase: next.phase,
          }
        : null,
    };
  });
}

export function getTotalWorkoutDuration(workout: Workout): number {
  const steps = flattenWorkoutToTimeline(workout);
  return steps.reduce((acc, s) => acc + s.durationSeconds, 0);
}

export function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, Math.ceil(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatCompactTime(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  if (clamped < 60) {
    return `:${String(clamped).padStart(2, '0')}`;
  }
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatWorkoutSummary(workout: Workout): string {
  const parts: string[] = [];
  if (workout.cycles > 1) {
    parts.push(`${workout.cycles} ciclos`);
  }
  if (workout.rounds.length > 1) {
    parts.push(`${workout.rounds.length} rounds`);
  } else if (workout.rounds.length === 1) {
    const r = workout.rounds[0];
    parts.push(`${r.repeats} reps`);
    const work = r.intervals.find((i) => i.type === 'work');
    const rest = r.intervals.find((i) => i.type === 'rest');
    if (work && rest) {
      parts.push(`${work.durationSeconds}s/${rest.durationSeconds}s`);
    } else if (work) {
      parts.push(`${work.durationSeconds}s work`);
    } else if (r.intervals.length > 0) {
      parts.push(`${r.intervals.length} intervalos`);
    }
  }
  return parts.join(' · ') || 'Sin intervalos';
}

export function buildQuickTabataWorkout(config: QuickTabataConfig): Workout {
  const now = new Date().toISOString();
  const intervals: Interval[] = [
    {
      id: 'quick-work',
      type: 'work',
      label: 'WORK',
      durationSeconds: Math.max(1, config.workSeconds),
      color: PHASE_COLORS.work,
    },
  ];
  if (config.restSeconds > 0) {
    intervals.push({
      id: 'quick-rest',
      type: 'rest',
      label: 'REST',
      durationSeconds: config.restSeconds,
      color: PHASE_COLORS.rest,
    });
  }

  return {
    id: 'quick-tabata',
    name: 'QUICK TABATA',
    color: PHASE_COLORS.work,
    prepareSeconds: Math.max(0, config.prepareSeconds),
    rounds: [
      {
        id: 'quick-round-1',
        name: 'ROUND 1',
        repeats: Math.max(1, config.repeats),
        intervals,
      },
    ],
    cycles: Math.max(1, config.cycles),
    restBetweenCyclesSeconds: Math.max(0, config.restBetweenCyclesSeconds),
    cooldownSeconds: 0,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Computes high-contrast foreground color (#0A0A0A or #FFFFFF) for any hex background.
 */
export function getContrastTextColor(hexColor: string): '#0A0A0A' | '#FFFFFF' {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#FFFFFF';
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const luminance =
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  return luminance > 0.36 ? '#0A0A0A' : '#FFFFFF';
}
