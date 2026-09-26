import { progressColor, PROGRESS_COLOR_CLASSES } from "@/lib/progress";

export function ProgressBadge({ percent }: { percent: number }) {
  const color = progressColor(percent);
  return (
    <span
      className={`text-xs rounded-full border px-2 py-0.5 font-medium ${PROGRESS_COLOR_CLASSES[color]}`}
    >
      {Math.round(percent)}%
    </span>
  );
}
