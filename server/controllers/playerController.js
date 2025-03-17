import prisma from "../config/db.js";

/**
 * Get Spell Breakdown for a Player in an Attempt (User Action Breakdown Table)
 * GET /api/logs/{logId}/encounters/{encounterName}/attempts/{startTime}/players/{playerId}

 */

export const getPlayerSpells = async (req, res) => {
  try {
    const { logId, encounterName, startTime, playerId } = req.params;

    const spells = await prisma.spellStatistic.findMany({
      where: {
        attempt: {
          startTime: new Date(decodeURIComponent(startTime)),
          boss: {
            encounter: {
              name: decodeURIComponent(encounterName),
              logId: parseInt(logId),
            },
          },
        },
        playerId: parseInt(playerId),
      },
    });

    res.json(spells);
  } catch (error) {
    console.error("❌ Error fetching player spells:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
