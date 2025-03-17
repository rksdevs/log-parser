import prisma from "../config/db.js";

/**
 * Get Breakdown of a Spell Used by Different Players in an Encounter
 * GET /api/logs/{logId}/encounters/{encounterName}/spells/{spellId}

 */
export const getSpellAcrossPlayers = async (req, res) => {
  try {
    const { logId, encounterName, spellId } = req.params;

    const spells = await prisma.spellStatistic.findMany({
      where: {
        spellId: parseInt(spellId),
        attempt: {
          boss: {
            encounter: {
              name: decodeURIComponent(encounterName),
              logId: parseInt(logId),
            },
          },
        },
      },
      include: {
        player: true,
      },
    });

    res.json(spells);
  } catch (error) {
    console.error("❌ Error fetching spell usage across players:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
