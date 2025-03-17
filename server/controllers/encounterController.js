import prisma from "../config/db.js";

/**
 * Get all encounters with bosses and attempts (For Navigation)
 GET /api/logs/{logId}/encounters/{encounterName}
 */
export const getEncounterDetails = async (req, res) => {
  try {
    const { logId, encounterName } = req.params;
    console.log(`Fetching encounter: ${encounterName} for log: ${logId}`);

    const encounter = await prisma.encounter.findFirst({
      where: {
        name: decodeURIComponent(encounterName),
        logId: parseInt(logId),
      },
      include: {
        bosses: {
          include: {
            attempts: {
              include: {
                players: {
                  include: { player: true },
                },
              },
            },
          },
        },
      },
    });

    if (!encounter) {
      return res.status(404).json({ error: "Encounter not found" });
    }

    const formattedData = {
      encounterName: encounter.name,
      bosses: encounter.bosses.map((boss) => ({
        bossName: boss.name,
        attempts: boss.attempts.length,
        playersInvolved: new Set(
          boss.attempts.flatMap((attempt) =>
            attempt.players.map((p) => p.player.name)
          )
        ).size,
      })),
    };

    res.status(200).json(formattedData);
  } catch (error) {
    console.error(" Error fetching encounter details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
