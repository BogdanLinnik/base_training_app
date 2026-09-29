import { prisma } from "@/lib/prisma";
import { addExerciseEditor, removeExerciseEditor } from "@/app/actions/exercises";

/** Author-only: lets other users edit this exercise. */
export async function ExerciseEditors({
  exerciseId,
  authorId,
}: {
  exerciseId: string;
  authorId: string;
}) {
  const editors = await prisma.exerciseEditor.findMany({
    where: { exerciseId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  const availableUsers = await prisma.user.findMany({
    where: { id: { notIn: [authorId, ...editors.map((e) => e.userId)] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
  const addWithId = addExerciseEditor.bind(null, exerciseId);

  return (
    <div className="mt-8 max-w-lg">
      <h2 className="text-sm font-semibold mb-3">Можуть редагувати</h2>
      <ul className="space-y-2 mb-3">
        {editors.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between gap-3 rounded-md bg-white border border-gray-200 px-3 py-2 text-sm"
          >
            <span>{e.user.name ?? e.user.email}</span>
            <form
              action={async () => {
                "use server";
                await removeExerciseEditor(exerciseId, e.userId);
              }}
            >
              <button type="submit" className="text-xs text-red-600 hover:underline">
                Прибрати
              </button>
            </form>
          </li>
        ))}
        {editors.length === 0 && <p className="text-sm text-gray-500">Ще немає редакторів.</p>}
      </ul>
      {availableUsers.length > 0 && (
        <form action={addWithId} className="flex gap-2">
          <select
            name="editorUserId"
            required
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? u.email}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-gray-800 text-white text-sm px-4 py-2 hover:bg-gray-700"
          >
            Додати
          </button>
        </form>
      )}
    </div>
  );
}
