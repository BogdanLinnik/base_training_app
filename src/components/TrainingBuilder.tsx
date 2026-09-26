"use client";

import { useMemo, useState } from "react";
import { ATTRIBUTE_LABELS, type AttributeType } from "@/lib/exercises";
import { VideoButton } from "@/components/VideoButton";
import { ExercisePickerModal } from "@/components/ExercisePickerModal";

type User = { id: string; name: string | null; email: string };
type ChildComponent = {
  id: string;
  childExerciseId: string;
  childExercise: { id: string; name: string; attributeTypes: AttributeType[] };
};
export type BuilderExercise = {
  id: string;
  name: string;
  type: "SIMPLE" | "COMPLEX";
  youtubeUrl: string | null;
  attributeTypes: AttributeType[];
  components: ChildComponent[];
};

type AttrValues = { weight: number | null; time: number | null; reps: number | null };

type SelectedExercise = {
  uid: string;
  exerciseId: string;
  roundsCount: number;
  comment: string;
  planned: AttrValues;
  childValues: Record<string, AttrValues>;
  expanded: boolean;
};

export type TrainingBuilderDefaultValues = {
  forUserId: string;
  expectedDate: string;
  description: string;
  exercises: {
    exerciseId: string;
    roundsCount: number;
    comment: string | null;
    plannedWeight: number | null;
    plannedTime: number | null;
    plannedReps: number | null;
    childValues: Record<
      string,
      { plannedWeight: number | null; plannedTime: number | null; plannedReps: number | null }
    >;
  }[];
};

const EMPTY_ATTRS: AttrValues = { weight: null, time: null, reps: null };

function makeUid() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function TrainingBuilder({
  action,
  users,
  exercises,
  currentUserId,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  users: User[];
  exercises: BuilderExercise[];
  currentUserId: string;
  defaultValues?: TrainingBuilderDefaultValues;
  submitLabel: string;
}) {
  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);

  const [selected, setSelected] = useState<SelectedExercise[]>(() =>
    (defaultValues?.exercises ?? []).map((e) => ({
      uid: makeUid(),
      exerciseId: e.exerciseId,
      roundsCount: e.roundsCount,
      comment: e.comment ?? "",
      planned: { weight: e.plannedWeight, time: e.plannedTime, reps: e.plannedReps },
      childValues: Object.fromEntries(
        Object.entries(e.childValues).map(([childId, v]) => [
          childId,
          { weight: v.plannedWeight, time: v.plannedTime, reps: v.plannedReps },
        ])
      ),
      expanded: true,
    }))
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function addExercise(exerciseId: string) {
    const exercise = exerciseById.get(exerciseId);
    if (!exercise) return;
    setSelected((prev) => [
      ...prev,
      {
        uid: makeUid(),
        exerciseId,
        roundsCount: 1,
        comment: "",
        planned: { ...EMPTY_ATTRS },
        childValues: Object.fromEntries(
          exercise.components.map((c) => [c.childExerciseId, { ...EMPTY_ATTRS }])
        ),
        expanded: true,
      },
    ]);
  }

  function removeExercise(index: number) {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleExpanded(index: number) {
    setSelected((prev) =>
      prev.map((s, i) => (i === index ? { ...s, expanded: !s.expanded } : s))
    );
  }

  function updatePlanned(index: number, key: keyof AttrValues, value: string) {
    const num = value === "" ? null : Number(value);
    setSelected((prev) =>
      prev.map((s, i) => (i === index ? { ...s, planned: { ...s.planned, [key]: num } } : s))
    );
  }

  function updateComment(index: number, value: string) {
    setSelected((prev) => prev.map((s, i) => (i === index ? { ...s, comment: value } : s)));
  }

  function updateRounds(index: number, value: string) {
    const num = value === "" ? 1 : Math.max(1, Number(value) || 1);
    setSelected((prev) => prev.map((s, i) => (i === index ? { ...s, roundsCount: num } : s)));
  }

  function updateChildValue(index: number, childId: string, key: keyof AttrValues, value: string) {
    const num = value === "" ? null : Number(value);
    setSelected((prev) =>
      prev.map((s, i) =>
        i === index
          ? {
              ...s,
              childValues: {
                ...s.childValues,
                [childId]: { ...(s.childValues[childId] ?? EMPTY_ATTRS), [key]: num },
              },
            }
          : s
      )
    );
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    setSelected((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  const payload = selected.map((s) => ({
    exerciseId: s.exerciseId,
    roundsCount: s.roundsCount,
    comment: s.comment,
    planned: s.planned,
    childValues: s.childValues,
  }));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const expectedDate = (form.elements.namedItem("expectedDate") as HTMLInputElement).value;

    if (!expectedDate || expectedDate < today) {
      e.preventDefault();
      setError("Дата не може бути раніше сьогодні");
      return;
    }
    if (selected.length === 0) {
      e.preventDefault();
      setError("Оберіть хоча б одну вправу");
      return;
    }

    for (let i = 0; i < selected.length; i++) {
      const s = selected[i];
      const exercise = exerciseById.get(s.exerciseId);
      if (!exercise) continue;

      if (!s.roundsCount || s.roundsCount < 1) {
        e.preventDefault();
        setSelected((prev) => prev.map((sel, si) => (si === i ? { ...sel, expanded: true } : sel)));
        setError(`Вкажіть кількість кіл для вправи «${exercise.name}»`);
        return;
      }

      const attrsToCheck: AttrValues[] =
        exercise.type === "SIMPLE"
          ? [s.planned]
          : exercise.components.map((c) => s.childValues[c.childExerciseId] ?? EMPTY_ATTRS);
      const declaredAttrs: AttributeType[][] =
        exercise.type === "SIMPLE"
          ? [exercise.attributeTypes]
          : exercise.components.map((c) => c.childExercise.attributeTypes);

      const invalid = attrsToCheck.some((values, idx) =>
        declaredAttrs[idx].some((attr) => {
          const value = values[attr.toLowerCase() as keyof AttrValues];
          return value == null || value < 1;
        })
      );

      if (invalid) {
        e.preventDefault();
        setSelected((prev) => prev.map((sel, si) => (si === i ? { ...sel, expanded: true } : sel)));
        setError(`Заповніть усі значення атрибутів для вправи «${exercise.name}»`);
        return;
      }
    }

    setError(null);
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <input type="hidden" name="exercisesJson" value={JSON.stringify(payload)} />

      {error && (
        <p className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Для кого</label>
          <select
            name="forUserId"
            required
            defaultValue={defaultValues?.forUserId ?? currentUserId}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.id === currentUserId ? "Я" : u.name ?? u.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Очікувана дата <span className="text-red-600">*</span>
          </label>
          <input
            type="date"
            name="expectedDate"
            required
            min={today}
            defaultValue={defaultValues?.expectedDate}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Опис</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={defaultValues?.description}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h2 className="text-sm font-medium">
            Вправи в тренуванні <span className="text-red-600">*</span>{" "}
            {selected.length > 0 && `(${selected.length})`}
          </h2>
          <ExercisePickerModal
            exercises={exercises}
            onAdd={addExercise}
            triggerLabel="Додати вправу"
          />
        </div>
        {selected.length > 0 && (
          <p className="text-xs text-gray-500 mb-2">
            Перетягніть картку, щоб змінити порядок виконання. Одну й ту саму вправу можна
            додати кілька разів.
          </p>
        )}
        <div className="space-y-2">
          {selected.map((s, index) => {
            const exercise = exerciseById.get(s.exerciseId);
            if (!exercise) return null;
            return (
              <div
                key={s.uid}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex != null) reorder(dragIndex, index);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={`rounded-lg border bg-white ${
                  dragIndex === index ? "border-blue-400 opacity-50" : "border-gray-200"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <span className="cursor-grab text-gray-400 select-none" title="Перетягнути">
                    ⠿
                  </span>
                  <span className="text-xs text-gray-400 w-5 shrink-0">{index + 1}.</span>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(index)}
                    className="flex-1 min-w-[8rem] flex items-center gap-2 text-left"
                  >
                    <span className="text-xs text-gray-400">{s.expanded ? "▾" : "▸"}</span>
                    <span className="text-sm font-medium break-words">{exercise.name}</span>
                    <span className="text-xs text-gray-500">
                      ({exercise.type === "SIMPLE" ? "проста" : "комплексна"})
                    </span>
                  </button>
                  {exercise.type === "SIMPLE" && exercise.youtubeUrl && (
                    <VideoButton url={exercise.youtubeUrl} />
                  )}
                  <button
                    type="button"
                    onClick={() => removeExercise(index)}
                    className="text-xs text-red-600 hover:underline shrink-0"
                  >
                    Прибрати
                  </button>
                </div>

                {s.expanded && (
                  <div className="px-3 pb-3 border-t border-gray-100 pt-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">
                        К-сть кіл <span className="text-red-600">*</span>:
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={s.roundsCount}
                        onChange={(e) => updateRounds(index, e.target.value)}
                        className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
                    </div>

                    {exercise.type === "SIMPLE" ? (
                      <div className="flex flex-wrap gap-3">
                        {exercise.attributeTypes.map((attr) => {
                          const key = attr.toLowerCase() as keyof AttrValues;
                          return (
                            <div key={attr}>
                              <label className="block text-xs text-gray-600 mb-1">
                                {ATTRIBUTE_LABELS[attr]} <span className="text-red-600">*</span>
                              </label>
                              <input
                                type="number"
                                step="any"
                                min={1}
                                required
                                value={s.planned[key] ?? ""}
                                onChange={(e) => updatePlanned(index, key, e.target.value)}
                                className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <ol className="space-y-2 list-decimal list-inside">
                        {exercise.components.map((c) => (
                          <li key={c.id} className="text-sm">
                            {c.childExercise.name}
                            <div className="flex flex-wrap gap-3 mt-1 ml-4">
                              {c.childExercise.attributeTypes.map((attr) => {
                                const key = attr.toLowerCase() as keyof AttrValues;
                                const childVal = s.childValues[c.childExerciseId] ?? EMPTY_ATTRS;
                                return (
                                  <div key={attr}>
                                    <label className="block text-xs text-gray-600 mb-1">
                                      {ATTRIBUTE_LABELS[attr]}{" "}
                                      <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                      type="number"
                                      step="any"
                                      min={1}
                                      required
                                      value={childVal[key] ?? ""}
                                      onChange={(e) =>
                                        updateChildValue(index, c.childExerciseId, key, e.target.value)
                                      }
                                      className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Коментар до вправи
                      </label>
                      <textarea
                        rows={2}
                        value={s.comment}
                        onChange={(e) => updateComment(index, e.target.value)}
                        placeholder="Наприклад: слідкувати за технікою, збільшити вагу якщо легко..."
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {selected.length === 0 && (
            <p className="text-sm text-gray-500">
              Ще не обрано жодної вправи — натисніть «Додати вправу».
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={selected.length === 0}
        className="rounded-md bg-blue-600 text-white text-sm px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitLabel}
      </button>
    </form>
  );
}
