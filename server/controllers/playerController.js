import prisma from "../config/db.js";
import { getSpellIconName } from "../helpers/spellIconHelper.js";

/**
 * Get Spell Breakdown for a Player in an Attempt (User Action Breakdown Table)
 * GET /api/logs/{logId}/encounters/{encounterName}/attempts/{startTime}/players/{playerId}

 */

export const getPlayerSpells = async (req, res) => {
  try {
    const { logId, encounterName, startTime, playerName } = req.params;

    const startDate = new Date(decodeURIComponent(startTime));

    // 1. Fetch player spells from spellStatistic
    const spells = await prisma.spellStatistic.findMany({
      where: {
        attempt: {
          startTime: startDate,
          boss: {
            encounter: {
              name: decodeURIComponent(encounterName),
              logId: parseInt(logId),
            },
          },
        },
        playerName: playerName,
      },
    });

    // 2. Fetch allActor data for the same player (includes pets)
    const allActor = await prisma.allActor.findFirst({
      where: {
        attempt: {
          startTime: startDate,
          boss: {
            encounter: {
              name: decodeURIComponent(encounterName),
              logId: parseInt(logId),
            },
          },
        },
        actorName: playerName,
      },
    });

    let petSpells = [];

    if (allActor?.data?.pets) {
      for (const [petName, petData] of Object.entries(allActor.data.pets)) {
        console.log(petName);
        if (petData.spellList) {
          for (const [spellName, spellData] of Object.entries(
            petData.spellList
          )) {
            petSpells.push({
              petName,
              spellName,
              ...spellData,
              icon:
                spellName === "Melee"
                  ? "Melee"
                  : getSpellIconName(spellData.spellId),
            });
          }
        }
      }
    }

    res.json({
      playerSpells: spells,
      petSpells: petSpells,
    });
  } catch (error) {
    console.error("❌ Error fetching player spells:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
