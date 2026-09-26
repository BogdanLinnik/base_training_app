import { ATTRIBUTE_LABELS, ATTRIBUTE_TYPES, type AttributeType } from "@/lib/exercises";

export function SimpleExerciseForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaultValues?: {
    name: string;
    details: string | null;
    youtubeUrl: string | null;
    attributeTypes: AttributeType[];
  };
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4 max-w-lg">
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
        <label className="block text-sm font-medium mb-2">Атрибути</label>
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
