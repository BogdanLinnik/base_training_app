import { describe, expect, it } from "vitest";
import {
  overallProgressPercent,
  progressColor,
  unitRatio,
  type ProgressUnit,
} from "@/lib/progress";

describe("unitRatio", () => {
  it("averages ratios across planned attributes only", () => {
    const unit: ProgressUnit = {
      planned: { weight: 20, reps: 10 },
      actual: { weight: 20, reps: 5 },
    };
    // weight ratio 1.0, reps ratio 0.5 -> average 0.75
    expect(unitRatio(unit)).toBeCloseTo(0.75);
  });

  it("treats a missing actual as 0", () => {
    const unit: ProgressUnit = { planned: { weight: 20 }, actual: null };
    expect(unitRatio(unit)).toBe(0);
  });

  it("ignores attributes that were not planned", () => {
    const unit: ProgressUnit = {
      planned: { weight: 20 },
      actual: { weight: 20, time: 999 },
    };
    expect(unitRatio(unit)).toBe(1);
  });

  it("returns null when nothing was planned", () => {
    const unit: ProgressUnit = { planned: {}, actual: { weight: 20 } };
    expect(unitRatio(unit)).toBeNull();
  });

  it("allows exceeding 100% when actual beats planned", () => {
    const unit: ProgressUnit = { planned: { reps: 10 }, actual: { reps: 12 } };
    expect(unitRatio(unit)).toBeCloseTo(1.2);
  });
});

describe("overallProgressPercent", () => {
  it("averages ratios across units and converts to percent", () => {
    const units: ProgressUnit[] = [
      { planned: { reps: 10 }, actual: { reps: 10 } },
      { planned: { reps: 10 }, actual: { reps: 5 } },
    ];
    expect(overallProgressPercent(units)).toBeCloseTo(75);
  });

  it("returns null for an empty list", () => {
    expect(overallProgressPercent([])).toBeNull();
  });
});

describe("progressColor", () => {
  it.each([
    [0, "red"],
    [69.9, "red"],
    [70, "yellow"],
    [89.9, "yellow"],
    [90, "green"],
    [99.9, "green"],
    [100, "blue"],
    [150, "blue"],
  ] as const)("classifies %d%% as %s", (percent, color) => {
    expect(progressColor(percent)).toBe(color);
  });
});
