export type AttributeValues = {
  weight?: number | null;
  time?: number | null;
  reps?: number | null;
};

export type ProgressUnit = {
  planned: AttributeValues;
  actual: AttributeValues | null;
};

export type ProgressColor = "red" | "yellow" | "green" | "blue";

const ATTRIBUTE_KEYS = ["weight", "time", "reps"] as const;

/**
 * Ratio (0..N) of a single planned/actual pair, averaged across the
 * attributes that were actually planned (weight/time/reps). Attributes that
 * were not planned for this unit are ignored. A planned attribute with no
 * recorded actual value counts as 0 (not performed yet).
 */
export function unitRatio(unit: ProgressUnit): number | null {
  const ratios: number[] = [];
  for (const key of ATTRIBUTE_KEYS) {
    const planned = unit.planned[key];
    if (planned == null || planned === 0) continue;
    const actual = unit.actual?.[key];
    ratios.push((actual ?? 0) / planned);
  }
  if (ratios.length === 0) return null;
  return ratios.reduce((a, b) => a + b, 0) / ratios.length;
}

/**
 * Overall completion percentage across all units of a training (each round
 * of each training exercise, and for complex exercises each round of each
 * child exercise). Returns null when there is nothing planned to measure.
 */
export function overallProgressPercent(units: ProgressUnit[]): number | null {
  const ratios = units.map(unitRatio).filter((r): r is number => r != null);
  if (ratios.length === 0) return null;
  return (ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100;
}

export function progressColor(percent: number): ProgressColor {
  if (percent < 70) return "red";
  if (percent < 90) return "yellow";
  if (percent < 100) return "green";
  return "blue";
}

export const PROGRESS_COLOR_CLASSES: Record<ProgressColor, string> = {
  red: "bg-red-100 text-red-800 border-red-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  green: "bg-green-100 text-green-800 border-green-300",
  blue: "bg-blue-100 text-blue-800 border-blue-300",
};

type ResultRow = {
  roundIndex: number;
  childExerciseId: string | null;
  actualWeight: number | null;
  actualTime: number | null;
  actualReps: number | null;
};

type ChildValueRow = {
  childExerciseId: string;
  plannedWeight: number | null;
  plannedTime: number | null;
  plannedReps: number | null;
};

type TrainingExerciseRow = {
  roundsCount: number;
  plannedWeight: number | null;
  plannedTime: number | null;
  plannedReps: number | null;
  exercise: { type: "SIMPLE" | "COMPLEX" };
  childValues: ChildValueRow[];
  results: ResultRow[];
};

/** Builds the flat list of planned/actual comparison units for a training's exercises. */
export function buildProgressUnits(trainingExercises: TrainingExerciseRow[]): ProgressUnit[] {
  const units: ProgressUnit[] = [];

  for (const te of trainingExercises) {
    for (let round = 0; round < te.roundsCount; round++) {
      if (te.exercise.type === "SIMPLE") {
        const result = te.results.find((r) => r.roundIndex === round && r.childExerciseId == null);
        units.push({
          planned: { weight: te.plannedWeight, time: te.plannedTime, reps: te.plannedReps },
          actual: result
            ? { weight: result.actualWeight, time: result.actualTime, reps: result.actualReps }
            : null,
        });
      } else {
        for (const child of te.childValues) {
          const result = te.results.find(
            (r) => r.roundIndex === round && r.childExerciseId === child.childExerciseId
          );
          units.push({
            planned: {
              weight: child.plannedWeight,
              time: child.plannedTime,
              reps: child.plannedReps,
            },
            actual: result
              ? { weight: result.actualWeight, time: result.actualTime, reps: result.actualReps }
              : null,
          });
        }
      }
    }
  }

  return units;
}
