"use client";

import { useState } from "react";
import { ATTRIBUTE_LABELS, ATTRIBUTE_TYPES, type AttributeType } from "@/lib/exercises";

export function SimpleExerciseForm({
  action,
  defaultValues,
  otherExerciseNames,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaultValues?: {
    name: string;
    details: string | null;
    youtubeUrl: string | null;
    attributeTypes: AttributeType[];
  };
  otherExerciseNames: string[];
  submitLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const takenNames = new Set(otherExerciseNames.map((n) => n.toLowerCase()));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const hasAttribute = ATTRIBUTE_TYPES.some(
      (attr) => (form.elements.namedItem(`attr_${attr}`) as HTMLInputElement)?.checked
    );

    if (!name) {
      e.preventDefault();
      setError("Вкажіть назву вправи");
      return;
    }
    if (takenNames.has(name.toLowerCase())) {
      e.preventDefault();
      setError("Вправа з такою назвою вже існує");
      return;
    }
    if (!hasAttribute) {
      e.preventDefault();
      setError("Оберіть хоча б один атрибут");
      return;
    }
    setError(null);
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {error && (
        <p className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error}
        </p>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">
          Назва <span className="text-red-600">*</span>
        </label>
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
        <label className="block text-sm font-medium mb-1">Посилання на відео YouTube</label>
        <input
          name="youtubeUrl"
          type="url"
          placeholder="https://youtube.com/..."
          defaultValue={defaultValues?.youtubeUrl ?? ""}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Атрибути <span className="text-red-600">*</span>
        </label>
        <div className="flex gap-4">
          {ATTRIBUTE_TYPES.map((attr) => (
            <label key={attr} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={`attr_${attr}`}
                defaultChecked={defaultValues?.attributeTypes.includes(attr)}
              />
              {ATTRIBUTE_LABELS[attr]}
            </label>
          ))}
        </div>
      </div>
      <button
        type="submit"
        className="rounded-md bg-blue-600 text-white text-sm px-4 py-2 hover:bg-blue-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
