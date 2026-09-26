import { createSimpleExercise } from "@/app/actions/exercises";
import { SimpleExerciseForm } from "@/components/SimpleExerciseForm";

export default function NewSimpleExercisePage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Нова проста вправа</h1>
      <SimpleExerciseForm action={createSimpleExercise} submitLabel="Створити" />
    </div>
  );
}
