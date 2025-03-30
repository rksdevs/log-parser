import prisma from "../config/db.js";

/**
 * Get all encounters with bosses and attempts (For Navigation)
 GET /api/logs/{logId}/encounters/{encounterName}
 */
export const getEncounterDetails = async (req, res) => {
  try {
    const { logId, encounterName } = req.params;
    console.log(`Fetching encounter: ${encounterName} for log: ${logId}`);
    const decodedName = decodeURIComponent(encounterName);

    // const encounter = await prisma.encounter.findFirst({
    //   where: {
    //     name: decodeURIComponent(encounterName),
    //     logId: parseInt(logId),
    //   },
    //   include: {
    //     bosses: {
    //       include: {
    //         attempts: {
    //           include: {
    //             AttemptParticipant: {
    //               include: { player: true },
    //             },
    //           },
    //         },
    //       },
    //     },
    //   },
    // });

    const encounters = await prisma.encounter.findMany({
      where: {
        logId: parseInt(logId),
        name: decodedName,
      },
      include: {
        bosses: {
          include: {
            attempts: {
              include: {
                AttemptParticipant: {
                  include: { player: true },
                },
              },
            },
          },
        },
      },
    });

    if (!encounters || encounters.length === 0) {
      return res.status(404).json({ error: "Encounter not found" });
    }

    // const formattedData = {
    //   encounterName: encounter.name,
    //   bosses: encounter.bosses.map((boss) => ({
    //     bossName: boss.name,
    //     attempts: boss.attempts.length,
    //     playersInvolved: new Set(
    //       boss.attempts.flatMap((attempt) =>
    //         attempt.players.map((p) => p.player.name)
    //       )
    //     ).size,
    //   })),
    // };

    const formattedData = encounters.map((encounter) => ({
      encounterName: encounter.name,
      bosses: encounter.bosses.map((boss) => {
        const allPlayers = new Set();

        boss.attempts.forEach((attempt) => {
          attempt.AttemptParticipant.forEach((p) =>
            allPlayers.add(p.player.name)
          );
        });

        return {
          bossName: boss.name,
          attempts: boss.attempts.length,
          playersInvolved: allPlayers.size,
        };
      }),
    }));

    return res
      .status(200)
      .json(formattedData.length === 1 ? formattedData[0] : formattedData);

    // res.status(200).json(formattedData);
  } catch (error) {
    console.error(" Error fetching encounter details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
