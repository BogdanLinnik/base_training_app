"use client";

import { useMemo, useState } from "react";
import { VideoButton } from "@/components/VideoButton";
import { ExercisePickerModal } from "@/components/ExercisePickerModal";

type SimpleExercise = { id: string; name: string; youtubeUrl: string | null };

type SelectedChild = { uid: string; exerciseId: string };

export type ComplexExerciseDefaultValues = {
  name: string;
  details: string;
  children: string[];
};

function makeUid() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function ComplexExerciseBuilder({
  action,
  simpleExercises,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  simpleExercises: SimpleExercise[];
  defaultValues?: ComplexExerciseDefaultValues;
  submitLabel: string;
}) {
  const exerciseById = useMemo(
    () => new Map(simpleExercises.map((e) => [e.id, e])),
    [simpleExercises]
  );

  const [selected, setSelected] = useState<SelectedChild[]>(() =>
    (defaultValues?.children ?? []).map((exerciseId) => ({ uid: makeUid(), exerciseId }))
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function addChild(exerciseId: string) {
    setSelected((prev) => [...prev, { uid: makeUid(), exerciseId }]);
  }

  function removeChild(index: number) {
    setSelected((prev) => prev.filter((_, i) => i !== index));
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

  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();

    if (!name) {
      e.preventDefault();
      setError("Вкажіть назву вправи");
      return;
    }
    if (selected.length < 2) {
      e.preventDefault();
      setError("Оберіть щонайменше дві вправи");
      return;
    }
    setError(null);
  }

  const payload = selected.map((s) => s.exerciseId);

  return (
    <form action={action} onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <input type="hidden" name="childrenJson" value={JSON.stringify(payload)} />

      {error && (
        <p className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Назва</label>
        <input
          name="name"
          required
          defaultValue={defaultValues?.name}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Опис</label>
        <textarea
          name="details"
          rows={3}
          defaultValue={defaultValues?.details ?? ""}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium">
            Вправи <span className="text-red-600">*</span>{" "}
            {selected.length > 0 && `(${selected.length})`}
          </h2>
          <ExercisePickerModal
            exercises={simpleExercises.map((e) => ({ ...e, type: "SIMPLE" as const }))}
            onAdd={addChild}
            triggerLabel="Додати вправу"
          />
        </div>
        {selected.length > 0 && (
          <p className="text-xs text-gray-500 mb-2">
            Перетягніть картку, щоб змінити порядок. Одну й ту саму вправу можна додати кілька
            разів.
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
                className={`flex items-center gap-2 rounded-lg border bg-white px-3 py-2 ${
                  dragIndex === index ? "border-blue-400 opacity-50" : "border-gray-200"
                }`}
              >
                <span className="cursor-grab text-gray-400 select-none" title="Перетягнути">
                  ⠿
                </span>
                <span className="text-xs text-gray-400 w-5 shrink-0">{index + 1}.</span>
                <span className="flex-1 text-sm">{exercise.name}</span>
                {exercise.youtubeUrl && <VideoButton url={exercise.youtubeUrl} />}
                <button
                  type="button"
                  onClick={() => removeChild(index)}
                  className="text-xs text-red-600 hover:underline shrink-0"
                >
                  Прибрати
                </button>
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
        disabled={selected.length < 2}
        className="rounded-md bg-blue-600 text-white text-sm px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitLabel}
      </button>
    </form>
  );
}
