import { describe, expect, it } from "vitest";
import { describeNotification } from "@/lib/notifications";

const actor = { name: "Тренер Олена", email: "trainer@example.com" };

describe("describeNotification", () => {
  it("describes a status change with the new status label", () => {
    const text = describeNotification({
      type: "TRAINING_STATUS_CHANGED",
      data: { status: "IN_PROGRESS" },
      actor,
    });
    expect(text).toBe("Тренер Олена змінив(ла) статус тренування на «Виконується»");
  });

  it("describes a training created for the recipient", () => {
    const text = describeNotification({
      type: "TRAINING_CREATED_FOR_YOU",
      data: null,
      actor,
    });
    expect(text).toBe("Тренер Олена створив(ла) для вас тренування");
  });

  it("describes a new comment with its preview", () => {
    const text = describeNotification({
      type: "NEW_COMMENT",
      data: { commentPreview: "Чудова робота!" },
      actor,
    });
    expect(text).toBe("Тренер Олена залишив(ла) коментар: «Чудова робота!»");
  });

  it("describes a viewer invite", () => {
    const text = describeNotification({
      type: "TRAINING_VIEWER_ADDED",
      data: null,
      actor,
    });
    expect(text).toBe("Тренер Олена запросив(ла) вас переглядати тренування");
  });

  it("falls back to email when the actor has no name", () => {
    const text = describeNotification({
      type: "TRAINING_CREATED_FOR_YOU",
      data: null,
      actor: { name: null, email: "athlete@example.com" },
    });
    expect(text).toBe("athlete@example.com створив(ла) для вас тренування");
  });
});
