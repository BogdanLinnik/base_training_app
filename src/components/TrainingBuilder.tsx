"use client";

import { useMemo, useState } from "react";
import { ATTRIBUTE_LABELS, type AttributeType } from "@/lib/exercises";
import { VideoButton } from "@/components/VideoButton";

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
  exerciseId: string;
  roundsCount: number;
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
      exerciseId: e.exerciseId,
      roundsCount: e.roundsCount,
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
  const [query, setQuery] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const available = exercises.filter(
    (e) =>
      !selected.some((s) => s.exerciseId === e.id) &&
      e.name.toLowerCase().includes(query.toLowerCase())
  );

  function addExercise(exerciseId: string) {
    const exercise = exerciseById.get(exerciseId);
    if (!exercise) return;
    setSelected((prev) => [
      ...prev,
      {
        exerciseId,
        roundsCount: 1,
        planned: { ...EMPTY_ATTRS },
        childValues: Object.fromEntries(
          exercise.components.map((c) => [c.childExerciseId, { ...EMPTY_ATTRS }])
        ),
        expanded: true,
      },
    ]);
    setQuery("");
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

  function updateRounds(index: number, value: string) {
    const num = Math.max(1, Number(value) || 1);
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
    planned: s.planned,
    childValues: s.childValues,
  }));

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      <input type="hidden" name="exercisesJson" value={JSON.stringify(payload)} />

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
          <label className="block text-sm font-medium mb-1">Очікувана дата</label>
          <input
            type="date"
            name="expectedDate"
            required
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
        <h2 className="text-sm font-medium mb-2">Додати вправу</h2>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Пошук вправи..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-2"
        />
        <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200 divide-y divide-gray-100 bg-white">
          {available.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => addExercise(e.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50"
            >
              <span>
                {e.name}{" "}
                <span className="text-xs text-gray-500">
                  ({e.type === "SIMPLE" ? "проста" : "комплексна"})
                </span>
              </span>
              <span className="text-blue-600 text-xs">+ Додати</span>
            </button>
          ))}
          {available.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">Нічого не знайдено.</div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium mb-2">
          Вправи в тренуванні {selected.length > 0 && `(${selected.length})`}
        </h2>
        <p className="text-xs text-gray-500 mb-2">
          Перетягніть картку, щоб змінити порядок виконання.
        </p>
        <div className="space-y-2">
          {selected.map((s, index) => {
            const exercise = exerciseById.get(s.exerciseId);
            if (!exercise) return null;
            return (
              <div
                key={s.exerciseId}
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
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="cursor-grab text-gray-400 select-none" title="Перетягнути">
                    ⠿
                  </span>
                  <span className="text-xs text-gray-400 w-5 shrink-0">{index + 1}.</span>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(index)}
                    className="flex-1 flex items-center gap-2 text-left"
                  >
                    <span className="text-xs text-gray-400">{s.expanded ? "▾" : "▸"}</span>
                    <span className="text-sm font-medium">{exercise.name}</span>
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
                  <div className="px-3 pb-3 border-t border-gray-100 pt-3">
                    {exercise.type === "SIMPLE" ? (
                      <div className="flex flex-wrap gap-3">
                        {exercise.attributeTypes.map((attr) => {
                          const key = attr.toLowerCase() as keyof AttrValues;
                          return (
                            <div key={attr}>
                              <label className="block text-xs text-gray-600 mb-1">
                                {ATTRIBUTE_LABELS[attr]}
                              </label>
                              <input
                                type="number"
                                step="any"
                                value={s.planned[key] ?? ""}
                                onChange={(e) => updatePlanned(index, key, e.target.value)}
                                className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600">К-сть раундів:</label>
                          <input
                            type="number"
                            min={1}
                            value={s.roundsCount}
                            onChange={(e) => updateRounds(index, e.target.value)}
                            className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
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
                                        {ATTRIBUTE_LABELS[attr]}
                                      </label>
                                      <input
                                        type="number"
                                        step="any"
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
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {selected.length === 0 && (
            <p className="text-sm text-gray-500">
              Ще не обрано жодної вправи — додайте зі списку вище.
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
