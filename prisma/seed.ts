import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const trainer = await prisma.user.upsert({
    where: { email: "trainer@example.com" },
    update: {},
    create: { email: "trainer@example.com", name: "Тренер Олена" },
  });

  const athlete = await prisma.user.upsert({
    where: { email: "athlete@example.com" },
    update: {},
    create: { email: "athlete@example.com", name: "Спортсмен Ігор" },
  });

  const squat = await prisma.exercise.upsert({
    where: { id: "seed-squat" },
    update: {},
    create: {
      id: "seed-squat",
      type: "SIMPLE",
      name: "Присідання зі штангою",
      details: "Класичні присідання, спина рівна, коліна не заходять за носки.",
      youtubeUrl: "https://www.youtube.com/watch?v=example-squat",
      attributeTypes: ["WEIGHT", "REPS"],
      createdById: trainer.id,
    },
  });

  const plank = await prisma.exercise.upsert({
    where: { id: "seed-plank" },
    update: {},
    create: {
      id: "seed-plank",
      type: "SIMPLE",
      name: "Планка",
      details: "Утримання положення на передпліччях.",
      attributeTypes: ["TIME"],
      createdById: trainer.id,
    },
  });

  const pushups = await prisma.exercise.upsert({
    where: { id: "seed-pushups" },
    update: {},
    create: {
      id: "seed-pushups",
      type: "SIMPLE",
      name: "Віджимання",
      attributeTypes: ["REPS"],
      createdById: trainer.id,
    },
  });

  await prisma.exercise.upsert({
    where: { id: "seed-circuit" },
    update: {},
    create: {
      id: "seed-circuit",
      type: "COMPLEX",
      name: "Коло: віджимання + планка",
      details: "Два підходи поспіль без відпочинку.",
      createdById: trainer.id,
      components: {
        create: [
          { childExerciseId: pushups.id, order: 0 },
          { childExerciseId: plank.id, order: 1 },
        ],
      },
    },
  });

  const training = await prisma.training.upsert({
    where: { id: "seed-training-1" },
    update: {},
    create: {
      id: "seed-training-1",
      createdById: trainer.id,
      forUserId: athlete.id,
      name: "Силове тренування на все тіло",
      expectedDate: new Date(),
      description: "Базове силове тренування на все тіло.",
      status: "PENDING_REVIEW",
      exercises: {
        create: [
          {
            exerciseId: squat.id,
            order: 0,
            roundsCount: 1,
            plannedWeight: 60,
            plannedReps: 10,
          },
        ],
      },
    },
  });

  console.log({ trainer: trainer.email, athlete: athlete.email, training: training.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
