import { describe, expect, it } from "vitest";
import {
  canEditTraining,
  canEnterResults,
  canManageViewers,
  canTransition,
  canViewTraining,
  deriveTrainingTags,
  initialStatusFor,
  isViewer,
} from "@/lib/trainings";

const trainer = "trainer-1";
const athlete = "athlete-1";
const spectator = "spectator-1";

describe("initialStatusFor", () => {
  it("skips confirmation for a training created for oneself", () => {
    expect(initialStatusFor(trainer, trainer)).toBe("CREATED");
  });

  it("requires confirmation when created for someone else", () => {
    expect(initialStatusFor(trainer, athlete)).toBe("PENDING_REVIEW");
  });
});

describe("deriveTrainingTags", () => {
  it("tags a self-training as own", () => {
    const t = { createdById: trainer, forUserId: trainer, status: "CREATED" as const };
    expect(deriveTrainingTags(t)).toEqual(["own"]);
  });

  it("tags an unconfirmed assignment as proposed + unconfirmed", () => {
    const t = { createdById: trainer, forUserId: athlete, status: "PENDING_REVIEW" as const };
    expect(deriveTrainingTags(t)).toEqual(["proposed", "unconfirmed"]);
  });

  it("tags a confirmed assignment as accepted regardless of later status", () => {
    for (const status of ["ACCEPTED", "IN_PROGRESS", "DONE"] as const) {
      const t = { createdById: trainer, forUserId: athlete, status };
      expect(deriveTrainingTags(t)).toEqual(["accepted"]);
    }
  });
});

describe("canTransition", () => {
  it("lets the assignee confirm a pending training", () => {
    const t = { createdById: trainer, forUserId: athlete, status: "PENDING_REVIEW" as const };
    expect(canTransition(t, athlete)).toEqual({ to: "ACCEPTED", label: "Підтвердити" });
  });

  it("does not let the creator confirm their own assignment", () => {
    const t = { createdById: trainer, forUserId: athlete, status: "PENDING_REVIEW" as const };
    expect(canTransition(t, trainer)).toBeNull();
  });

  it("has no transition out of DONE", () => {
    const t = { createdById: trainer, forUserId: athlete, status: "DONE" as const };
    expect(canTransition(t, athlete)).toBeNull();
  });
});

describe("canEditTraining", () => {
  it("allows the creator to edit before it starts", () => {
    const t = { createdById: trainer, forUserId: athlete, status: "PENDING_REVIEW" as const };
    expect(canEditTraining(t, trainer)).toBe(true);
  });

  it("blocks editing once in progress, even for the creator", () => {
    const t = { createdById: trainer, forUserId: athlete, status: "IN_PROGRESS" as const };
    expect(canEditTraining(t, trainer)).toBe(false);
  });

  it("blocks the assignee from editing the plan", () => {
    const t = { createdById: trainer, forUserId: athlete, status: "ACCEPTED" as const };
    expect(canEditTraining(t, athlete)).toBe(false);
  });
});

describe("canEnterResults", () => {
  it("allows the assignee to enter results only while in progress", () => {
    const inProgress = { createdById: trainer, forUserId: athlete, status: "IN_PROGRESS" as const };
    const accepted = { createdById: trainer, forUserId: athlete, status: "ACCEPTED" as const };
    expect(canEnterResults(inProgress, athlete)).toBe(true);
    expect(canEnterResults(accepted, athlete)).toBe(false);
    expect(canEnterResults(inProgress, trainer)).toBe(false);
  });
});

describe("isViewer / canViewTraining / canManageViewers", () => {
  const base = {
    createdById: trainer,
    forUserId: athlete,
    status: "ACCEPTED" as const,
    viewers: [{ userId: spectator }],
  };

  it("recognizes an invited viewer who is neither the creator nor the assignee", () => {
    expect(isViewer(base, spectator)).toBe(true);
    expect(isViewer(base, trainer)).toBe(false);
    expect(isViewer(base, athlete)).toBe(false);
  });

  it("lets the creator, the assignee, and viewers view the training", () => {
    expect(canViewTraining(base, trainer)).toBe(true);
    expect(canViewTraining(base, athlete)).toBe(true);
    expect(canViewTraining(base, spectator)).toBe(true);
    expect(canViewTraining(base, "stranger")).toBe(false);
  });

  it("only lets the creator or the assignee manage viewers", () => {
    expect(canManageViewers(base, trainer)).toBe(true);
    expect(canManageViewers(base, athlete)).toBe(true);
    expect(canManageViewers(base, spectator)).toBe(false);
  });
});
