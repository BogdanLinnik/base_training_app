"use client";

import { useState } from "react";
import { ATTRIBUTE_LABELS, type AttributeType } from "@/lib/exercises";

type Key = "weight" | "time" | "reps";
type Values = Record<Key, string | number>;

const ATTR_KEY_MAP = { WEIGHT: "weight", TIME: "time", REPS: "reps" } as const;

/**
 * Planned vs. actual values of one round (or one side of a round). While
 * editable, checking "виконано за планом" fills in the planned values and
 * locks the inputs; unchecking unlocks them and keeps whatever is there.
 */
export function ExerciseRoundRow({
  attrs,
  planned,
  editable,
  readonlyValues,
  fieldPrefix,
  values,
}: {
  attrs: AttributeType[];
  planned: { weight: number | null; time: number | null; reps: number | null };
  editable: boolean;
  readonlyValues: boolean;
  fieldPrefix: string;
  values: Values;
}) {
  const shown = attrs
    .map((attr) => ({ attr, key: ATTR_KEY_MAP[attr] }))
    .filter(({ key }) => planned[key] != null);

  // Started out as "done as planned" if the saved values already equal the plan.
  const [asPlanned, setAsPlanned] = useState(
    () =>
      shown.length > 0 &&
      shown.every(({ key }) => values[key] !== "" && Number(values[key]) === planned[key])
  );
  const [typed, setTyped] = useState<Values>(values);

  return (
    <div className="flex flex-wrap items-end gap-4">
      {shown.map(({ attr, key }) => {
        const value = String(typed[key]);
        return (
          <div key={attr} className="text-sm">
            <div className="text-xs text-gray-500 mb-1">
              {ATTRIBUTE_LABELS[attr]} (план: {planned[key]})
            </div>
            {editable ? (
              <>
                <input
                  type="number"
                  step="any"
                  min={0}
                  name={asPlanned ? undefined : `${fieldPrefix}__${key}`}
                  value={value}
                  disabled={asPlanned}
                  onChange={(e) => setTyped((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />
                {/* disabled inputs are not submitted, so send the planned value explicitly */}
                {asPlanned && (
                  <input type="hidden" name={`${fieldPrefix}__${key}`} value={value} />
                )}
              </>
            ) : (
              <div className="w-24">{readonlyValues ? values[key] || "—" : "—"}</div>
            )}
          </div>
        );
      })}
      {editable && shown.length > 0 && (
        <label className="flex items-center gap-2 text-sm pb-1">
          <input
            type="checkbox"
            checked={asPlanned}
            onChange={(e) => {
              setAsPlanned(e.target.checked);
              // checking fills in the plan; unchecking leaves the values as they are
              if (e.target.checked) {
                setTyped((prev) => {
                  const next = { ...prev };
                  for (const { key } of shown) next[key] = String(planned[key]);
                  return next;
                });
              }
            }}
          />
          Виконано за планом
        </label>
      )}
    </div>
  );
}
