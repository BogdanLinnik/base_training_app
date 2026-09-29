import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  canDeleteTraining,
  canEditTraining,
  canEnterResults,
  canManageViewers,
  canTransition,
  canViewTraining,
  deriveTrainingTags,
} from "@/lib/trainings";
import {
  buildProgressUnits,
  overallProgressPercent,
  plannedForRound,
  SIDES,
  type Side,
} from "@/lib/progress";
import { StatusBadge, TagBadge } from "@/components/StatusBadge";
import { ProgressBadge } from "@/components/ProgressBadge";
import type { AttributeType } from "@/lib/exercises";
import {
  addComment,
  addViewer,
  changeTrainingStatus,
  deleteTraining,
  duplicateTraining,
  removeViewer,
  submitTrainingResults,
} from "@/app/actions/trainings";
import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { ExerciseRoundRow } from "@/components/ExerciseRoundRow";

export default async function TrainingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const training = await prisma.training.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      forUser: { select: { id: true, name: true, email: true } },
      viewers: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, email: true } } },
      },
      exercises: {
        orderBy: { order: "asc" },
        include: {
          exercise: true,
          childValues: { include: { childExercise: true } },
          roundValues: true,
          results: true,
        },
      },
    },
  });

  if (!training) notFound();
  if (!canViewTraining(training, userId)) notFound();

  const tags = deriveTrainingTags(training);
  const transition = canTransition(training, userId);
  const editable = canEditTraining(training, userId);
  const deletable = canDeleteTraining(training, userId);
  const resultsEditable = canEnterResults(training, userId);
  const manageViewers = canManageViewers(training, userId);
  const isParty = training.createdById === userId || training.forUserId === userId;
  const showProgress = training.status === "IN_PROGRESS" || training.status === "DONE";
  const percent = showProgress
    ? overallProgressPercent(buildProgressUnits(training.exercises))
    : null;

  const resultValue = (
    teId: string,
    round: number,
    childId: string | null,
    side: Side | null,
    attr: "weight" | "time" | "reps"
  ) => {
    const row = training.exercises
      .find((te) => te.id === teId)
      ?.results.find(
        (r) => r.roundIndex === round && r.childExerciseId === childId && r.side === side
      );
    if (!row) return "";
    const value =
      attr === "weight" ? row.actualWeight : attr === "time" ? row.actualTime : row.actualReps;
    return value ?? "";
  };

  const changeStatusWithId = changeTrainingStatus.bind(null, training.id);
  const submitResultsWithId = submitTrainingResults.bind(null, training.id);
  const addCommentWithId = addComment.bind(null, training.id);
  const duplicateWithId = duplicateTraining.bind(null, training.id);
  const addViewerWithId = addViewer.bind(null, training.id);

  const availableUsers = manageViewers
    ? await prisma.user.findMany({
        where: {
          id: {
            notIn: [
              training.createdById,
              training.forUserId,
              ...training.viewers.map((v) => v.userId),
            ],
          },
        },
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true },
      })
    : [];

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">
              Тренування {training.expectedDate.toLocaleDateString("uk-UA")}
            </h1>
            {training.description && (
              <p className="text-sm text-gray-600 mt-1">{training.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <StatusBadge status={training.status} />
              {percent != null && <ProgressBadge percent={percent} />}
            </div>
            <div className="flex gap-1">
              {tags.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {transition && (
            <form action={changeStatusWithId}>
              <SubmitButton
               
                className="rounded-md bg-blue-600 text-white text-sm px-3 py-1.5 hover:bg-blue-700"
              >
                {transition.label}
              </SubmitButton>
            </form>
          )}
          {isParty && (
            <form action={duplicateWithId}>
              <SubmitButton className="text-sm text-blue-600 hover:underline">
                Дублювати
              </SubmitButton>
            </form>
          )}
          {editable && (
            <Link
              href={`/trainings/${training.id}/edit`}
              className="text-sm text-blue-600 hover:underline"
            >
              Редагувати
            </Link>
          )}
          {deletable && (
            <form
              action={async () => {
                "use server";
                await deleteTraining(training.id);
              }}
            >
              <SubmitButton className="text-sm text-red-600 hover:underline">
                Видалити
              </SubmitButton>
            </form>
          )}
        </div>
      </div>

      {(manageViewers || training.viewers.length > 0) && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Глядачі</h2>
          <ul className="space-y-2 mb-3">
            {training.viewers.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-3 rounded-md bg-white border border-gray-200 px-3 py-2 text-sm"
              >
                <span>{v.user.name ?? v.user.email}</span>
                {manageViewers && (
                  <form
                    action={async () => {
                      "use server";
                      await removeViewer(training.id, v.userId);
                    }}
                  >
                    <SubmitButton className="text-xs text-red-600 hover:underline">
                      Прибрати
                    </SubmitButton>
                  </form>
                )}
              </li>
            ))}
            {training.viewers.length === 0 && (
              <p className="text-sm text-gray-500">Ще немає глядачів.</p>
            )}
          </ul>
          {manageViewers && availableUsers.length > 0 && (
            <form action={addViewerWithId} className="flex gap-2">
              <select
                name="viewerUserId"
                required
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ?? u.email}
                  </option>
                ))}
              </select>
              <SubmitButton
               
                className="rounded-md bg-gray-800 text-white text-sm px-4 py-2 hover:bg-gray-700"
              >
                Додати
              </SubmitButton>
            </form>
          )}
        </div>
      )}

      <form action={submitResultsWithId} className="space-y-4">
        <h2 className="text-sm font-semibold">Вправи</h2>
        {training.exercises.map((te) => (
          // Native <details>: collapsed inputs stay in the DOM, so they are still submitted.
          <details
            key={te.id}
            open
            className="group rounded-lg border border-gray-200 bg-white p-4"
          >
            <summary className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium list-none [&::-webkit-details-marker]:hidden mb-0 group-open:mb-3">
              <span className="text-xs text-gray-400 group-open:hidden">▸</span>
              <span className="text-xs text-gray-400 hidden group-open:inline">▾</span>
              <span>
                {te.exercise.name}{" "}
                <span className="text-xs text-gray-500 font-normal">
                  ({te.exercise.type === "SIMPLE" ? "проста" : "комплексна"}, к-сть кіл:{" "}
                  {te.roundsCount})
                </span>
              </span>
            </summary>

            {te.comment && (
              <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-md px-3 py-2 mb-3">
                {te.comment}
              </p>
            )}

            {te.exercise.type === "SIMPLE" ? (
              <div className="space-y-4">
                {Array.from({ length: te.roundsCount }).map((_, round) => (
                  <div key={round}>
                    {te.roundsCount > 1 && (
                      <div className="text-xs font-medium text-gray-500 mb-2">
                        Коло {round + 1}
                      </div>
                    )}
                    <SidedRoundRows
                      bilateral={te.exercise.bilateral}
                      attrs={te.exercise.attributeTypes as AttributeType[]}
                      planned={plannedForRound(te, round, null)}
                      editable={resultsEditable}
                      readonlyValues={!resultsEditable && training.status === "DONE"}
                      fieldPrefix={`res__${te.id}__${round}__self`}
                      getValue={(side, attr) => resultValue(te.id, round, null, side, attr)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from({ length: te.roundsCount }).map((_, round) => (
                  <div key={round}>
                    <div className="text-xs font-medium text-gray-500 mb-2">
                      Коло {round + 1}
                    </div>
                    <div className="space-y-3 ml-2">
                      {te.childValues.map((cv) => (
                        <div key={cv.id}>
                          <div className="text-sm mb-1">{cv.childExercise.name}</div>
                          <SidedRoundRows
                            bilateral={cv.childExercise.bilateral}
                            attrs={cv.childExercise.attributeTypes as AttributeType[]}
                            planned={plannedForRound(te, round, cv.childExerciseId)}
                            editable={resultsEditable}
                            readonlyValues={!resultsEditable && training.status === "DONE"}
                            fieldPrefix={`res__${te.id}__${round}__${cv.childExerciseId}`}
                            getValue={(side, attr) =>
                              resultValue(te.id, round, cv.childExerciseId, side, attr)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </details>
        ))}
        {resultsEditable && (
          <SubmitButton
           
            className="rounded-md bg-blue-600 text-white text-sm px-4 py-2 hover:bg-blue-700"
          >
            Зберегти фактичні результати
          </SubmitButton>
        )}
      </form>

      <div>
        <h2 className="text-sm font-semibold mb-3">Коментарі</h2>
        <ul className="space-y-3 mb-4">
          {training.comments.map((c) => (
            <li key={c.id} className="rounded-md bg-white border border-gray-200 p-3 text-sm">
              <div className="text-xs text-gray-500 mb-1">
                {c.author.name ?? c.author.email} ·{" "}
                {c.createdAt.toLocaleString("uk-UA")}
              </div>
              {c.text}
            </li>
          ))}
          {training.comments.length === 0 && (
            <p className="text-sm text-gray-500">Ще немає коментарів.</p>
          )}
        </ul>
        <form action={addCommentWithId} className="flex gap-2">
          <input
            name="text"
            required
            placeholder="Ваш коментар..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <SubmitButton
           
            className="rounded-md bg-gray-800 text-white text-sm px-4 py-2 hover:bg-gray-700"
          >
            Надіслати
          </SubmitButton>
        </form>
      </div>

      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← До списку тренувань
      </Link>
    </div>
  );
}

const SIDE_LABELS: Record<Side, string> = { LEFT: "Ліва", RIGHT: "Права" };

/** One row of inputs per side for a bilateral exercise, otherwise a single row. */
function SidedRoundRows({
  bilateral,
  fieldPrefix,
  getValue,
  ...rest
}: {
  bilateral: boolean;
  attrs: AttributeType[];
  planned: { weight: number | null; time: number | null; reps: number | null };
  editable: boolean;
  readonlyValues: boolean;
  fieldPrefix: string;
  getValue: (side: Side | null, attr: "weight" | "time" | "reps") => string | number;
}) {
  const valuesFor = (side: Side | null) => ({
    weight: getValue(side, "weight"),
    time: getValue(side, "time"),
    reps: getValue(side, "reps"),
  });
  if (!bilateral) {
    return (
      <ExerciseRoundRow {...rest} fieldPrefix={fieldPrefix} values={valuesFor(null)} />
    );
  }
  return (
    <div className="space-y-2">
      {SIDES.map((side) => (
        <div key={side} className="flex flex-wrap items-end gap-3">
          <div className="w-14 text-xs font-medium text-gray-500 pb-1.5">{SIDE_LABELS[side]}</div>
          <ExerciseRoundRow
            {...rest}
            fieldPrefix={`${fieldPrefix}__${side.toLowerCase()}`}
            values={valuesFor(side)}
          />
        </div>
      ))}
    </div>
  );
}
