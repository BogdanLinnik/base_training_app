export type AttributeType = "WEIGHT" | "TIME" | "REPS";

export const ATTRIBUTE_LABELS: Record<AttributeType, string> = {
  WEIGHT: "Вага (кг)",
  TIME: "Час (сек)",
  REPS: "Повторення",
};

export const ATTRIBUTE_TYPES: AttributeType[] = ["WEIGHT", "TIME", "REPS"];
