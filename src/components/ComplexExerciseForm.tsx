type SimpleExercise = { id: string; name: string };

export function ComplexExerciseForm({
  action,
  simpleExercises,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  simpleExercises: SimpleExercise[];
  defaultValues?: {
    name: string;
    details: string | null;
    order: Record<string, number>;
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
        <label className="block text-sm font-medium mb-2">
          Вправи (вкажіть порядковий номер для кожної обраної; порожнє поле —
          вправа не входить до комплексу)
        </label>
        <div className="space-y-2">
          {simpleExercises.map((ex) => (
            <div key={ex.id} className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                name={`order_${ex.id}`}
                defaultValue={defaultValues?.order[ex.id] ?? ""}
                className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
              />
              <span className="text-sm">{ex.name}</span>
            </div>
          ))}
          {simpleExercises.length === 0 && (
            <p className="text-sm text-gray-500">
              Спочатку створіть хоча б одну просту вправу.
            </p>
          )}
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
