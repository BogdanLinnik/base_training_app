import { ATTRIBUTE_LABELS, type AttributeType } from "@/lib/exercises";

type User = { id: string; name: string | null; email: string };
type ChildComponent = {
  id: string;
  childExerciseId: string;
  childExercise: { id: string; name: string; attributeTypes: AttributeType[] };
};
type Exercise = {
  id: string;
  name: string;
  type: "SIMPLE" | "COMPLEX";
  attributeTypes: AttributeType[];
  components: ChildComponent[];
};

export type TrainingDefaultValues = {
  forUserId: string;
  expectedDate: string;
  description: string;
  exercises: Record<
    string,
    {
      order: number;
      roundsCount: number;
      plannedWeight: number | null;
      plannedTime: number | null;
      plannedReps: number | null;
      childValues: Record<
        string,
        { plannedWeight: number | null; plannedTime: number | null; plannedReps: number | null }
      >;
    }
  >;
};

export function TrainingForm({
  action,
  users,
  exercises,
  currentUserId,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  users: User[];
  exercises: Exercise[];
  currentUserId: string;
  defaultValues?: TrainingDefaultValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-6 max-w-2xl">
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
        <h2 className="text-sm font-medium mb-2">
          Вправи (вкажіть порядковий номер для кожної обраної вправи)
        </h2>
        <div className="space-y-3">
          {exercises.map((exercise) => {
            const existing = defaultValues?.exercises[exercise.id];
            return (
              <fieldset
                key={exercise.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <legend className="px-1 text-sm font-medium">
                  {exercise.name}{" "}
                  <span className="text-xs text-gray-500">
                    ({exercise.type === "SIMPLE" ? "проста" : "комплексна"})
                  </span>
                </legend>

                <div className="flex items-center gap-2 mb-3">
                  <label className="text-xs text-gray-600">Порядок у тренуванні:</label>
                  <input
                    type="number"
                    min={1}
                    name={`order_${exercise.id}`}
                    defaultValue={existing?.order != null ? existing.order + 1 : undefined}
                    className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>

                {exercise.type === "SIMPLE" ? (
                  <div className="flex flex-wrap gap-3">
                    {exercise.attributeTypes.map((attr) => (
                      <div key={attr}>
                        <label className="block text-xs text-gray-600 mb-1">
                          {ATTRIBUTE_LABELS[attr]}
                        </label>
                        <input
                          type="number"
                          step="any"
                          name={`${attr.toLowerCase()}_${exercise.id}`}
                          defaultValue={
                            existing
                              ? attr === "WEIGHT"
                                ? (existing.plannedWeight ?? undefined)
                                : attr === "TIME"
                                  ? (existing.plannedTime ?? undefined)
                                  : (existing.plannedReps ?? undefined)
                              : undefined
                          }
                          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">К-сть раундів:</label>
                      <input
                        type="number"
                        min={1}
                        defaultValue={existing?.roundsCount ?? 1}
                        name={`rounds_${exercise.id}`}
                        className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
                    </div>
                    <ol className="space-y-2 list-decimal list-inside">
                      {exercise.components.map((c) => {
                        const existingChild = existing?.childValues[c.childExerciseId];
                        return (
                          <li key={c.id} className="text-sm">
                            {c.childExercise.name}
                            <div className="flex flex-wrap gap-3 mt-1 ml-4">
                              {c.childExercise.attributeTypes.map((attr) => (
                                <div key={attr}>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    {ATTRIBUTE_LABELS[attr]}
                                  </label>
                                  <input
                                    type="number"
                                    step="any"
                                    name={`child${attr.toLowerCase()}_${exercise.id}__${c.childExerciseId}`}
                                    defaultValue={
                                      existingChild
                                        ? attr === "WEIGHT"
                                          ? (existingChild.plannedWeight ?? undefined)
                                          : attr === "TIME"
                                            ? (existingChild.plannedTime ?? undefined)
                                            : (existingChild.plannedReps ?? undefined)
                                        : undefined
                                    }
                                    className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </fieldset>
            );
          })}
          {exercises.length === 0 && (
            <p className="text-sm text-gray-500">
              Спочатку створіть хоча б одну вправу у вкладці «Вправи».
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
