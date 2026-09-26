import Link from "next/link";
import { StatusBadge, TagBadge } from "@/components/StatusBadge";
import { deriveTrainingTags, type TrainingStatus } from "@/lib/trainings";

export function TrainingCard({
  training,
  currentUserId,
}: {
  training: {
    id: string;
    createdById: string;
    forUserId: string;
    name: string;
    status: TrainingStatus;
    expectedDate: Date;
    description: string | null;
    createdBy: { name: string | null; email: string };
    forUser: { name: string | null; email: string };
  };
  currentUserId: string;
}) {
  const tags = deriveTrainingTags(training);
  const otherParty =
    training.forUserId === currentUserId
      ? training.createdBy
      : training.forUser;
  const otherPartyLabel =
    training.createdById === training.forUserId
      ? null
      : training.forUserId === currentUserId
        ? `Від: ${otherParty.name ?? otherParty.email}`
        : `Для: ${otherParty.name ?? otherParty.email}`;

  return (
    <Link
      href={`/trainings/${training.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300"
    >
      <div className="flex justify-between items-start gap-3">
        <div>
          <div className="font-medium">{training.name}</div>
          <div className="text-sm text-gray-500">
            {training.expectedDate.toLocaleDateString("uk-UA")}
          </div>
          {otherPartyLabel && <div className="text-sm mt-0.5">{otherPartyLabel}</div>}
          {training.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{training.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <StatusBadge status={training.status} />
          <div className="flex gap-1">
            {tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
