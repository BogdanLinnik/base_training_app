"use client";

import { useState } from "react";

type PickableExercise = { id: string; name: string; type: "SIMPLE" | "COMPLEX" };

export function ExercisePickerModal({
  exercises,
  onAdd,
  triggerLabel,
}: {
  exercises: PickableExercise[];
  onAdd: (exerciseId: string) => void;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = exercises.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-gray-300 bg-white text-sm px-3 py-1.5 hover:bg-gray-50"
      >
        + {triggerLabel}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white shadow-xl flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-medium">{triggerLabel}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Закрити"
              >
                ✕
              </button>
            </div>
            <div className="px-4 py-3">
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Пошук вправи..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="overflow-y-auto divide-y divide-gray-100 border-t border-gray-100">
              {filtered.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onAdd(e.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-gray-50"
                >
                  <span className="min-w-0 break-words">
                    {e.name}{" "}
                    <span className="text-xs text-gray-500">
                      ({e.type === "SIMPLE" ? "проста" : "комплексна"})
                    </span>
                  </span>
                  <span className="text-blue-600 text-xs shrink-0">+ Додати</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500">Нічого не знайдено.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
