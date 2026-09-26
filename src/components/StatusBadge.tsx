import { STATUS_LABELS, TAG_LABELS, type TrainingStatus, type TrainingTag } from "@/lib/trainings";

const STATUS_CLASSES: Record<TrainingStatus, string> = {
  CREATED: "bg-gray-100 text-gray-700",
  PENDING_REVIEW: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-sky-100 text-sky-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  DONE: "bg-emerald-100 text-emerald-800",
};

export function StatusBadge({ status }: { status: TrainingStatus }) {
  return (
    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${STATUS_CLASSES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

const TAG_CLASSES: Record<TrainingTag, string> = {
  own: "bg-gray-100 text-gray-600",
  proposed: "bg-indigo-100 text-indigo-700",
  accepted: "bg-teal-100 text-teal-700",
  unconfirmed: "bg-orange-100 text-orange-700",
};

export function TagBadge({ tag }: { tag: TrainingTag }) {
  return (
    <span className={`text-xs rounded-full px-2 py-0.5 ${TAG_CLASSES[tag]}`}>
      {TAG_LABELS[tag]}
    </span>
  );
}
