import { Spinner } from "@/components/SubmitButton";

export default function Loading() {
  return (
    <div className="flex justify-center py-16 text-gray-400" role="status" aria-label="Завантаження">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
