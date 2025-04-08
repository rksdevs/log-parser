import prisma from "../config/db.js";
import { getPlayerClassFromSpell } from "../helpers/playerClassHelper.js";
import { getSpellIconName } from "../helpers/spellIconHelper.js";

/**
 * Get Spell Breakdown for a Player in an Attempt (User Action Breakdown Table)
 * GET /api/logs/{logId}/encounters/{encounterName}/attempts/{startTime}/players/{playerId}
 */
export const getPlayerSpells = async (req, res) => {
  try {
    const { logId, encounterName, startTime, playerName } = req.params;
    const startDate = new Date(decodeURIComponent(startTime));

    // 🧠 Fetch allActor data (includes spellList + pets)
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

    if (!allActor) {
      return res
        .status(404)
        .json({ error: "Player not found in this attempt." });
    }

    const { spellList = {}, pets = {} } = allActor.data || {};

    // 🔁 Transform player spellList into flat array
    const playerSpells = Object.entries(spellList).map(
      ([spellName, spellData]) => ({
        spellName,
        ...spellData,
        icon:
          spellName === "Melee" ? "Melee" : getSpellIconName(spellData.spellId),
      })
    );

    // 🐾 Transform pet spells if present
    const petSpells = [];
    for (const [petName, petData] of Object.entries(pets)) {
      if (!petData?.spellList) continue;
      for (const [spellName, spellData] of Object.entries(petData.spellList)) {
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

    res.json({
      playerSpells,
      petSpells,
    });
  } catch (error) {
    console.error("❌ Error fetching player spells:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Get All Spells Breakdown for a Player in an log id
 * GET /:logId/player/:playerName/spells
 */
export const getPlayerSpellsFromLog = async (req, res) => {
  try {
    const { logId, playerName } = req.params;
    let inferredClass = undefined;

    // Get all AllActor entries for this player in the entire log
    const allActors = await prisma.allActor.findMany({
      where: {
        actorName: playerName,
        attempt: {
          boss: {
            encounter: {
              logId: parseInt(logId),
            },
          },
        },
      },
    });

    if (!allActors.length) {
      return res
        .status(404)
        .json({ error: "Player not found in any attempts of this log." });
    }

    const mergedSpells = {};
    const mergedPetSpells = {};

    for (const actor of allActors) {
      const { spellList = {}, pets = {} } = actor.data || {};

      // Merge player spells
      for (const [spellName, spellData] of Object.entries(spellList)) {
        if (!mergedSpells[spellName]) {
          mergedSpells[spellName] = { ...spellData };
        } else {
          mergedSpells[spellName].totalCasts += spellData.totalCasts || 0;
          mergedSpells[spellName].totalHits += spellData.totalHits || 0;
          mergedSpells[spellName].amount += spellData.amount || 0;

          for (const type of ["damage", "healing", "damageTaken"]) {
            if (spellData[type]) {
              mergedSpells[spellName][type] =
                mergedSpells[spellName][type] || {};
              for (const key in spellData[type]) {
                mergedSpells[spellName][type][key] =
                  (mergedSpells[spellName][type][key] || 0) +
                  (spellData[type][key] || 0);
              }
            }
          }
        }

        mergedSpells[spellName].spellName = spellName;
        mergedSpells[spellName].spellId = spellData.spellId; // ✅ Ensure spellId is preserved
      }

      // Merge pet spells
      for (const [petName, petData] of Object.entries(pets)) {
        if (!petData?.spellList) continue;

        for (const [spellName, spellData] of Object.entries(
          petData.spellList
        )) {
          const key = `${petName}::${spellName}`;
          if (!mergedPetSpells[key]) {
            mergedPetSpells[key] = { ...spellData, petName, spellName };
          } else {
            mergedPetSpells[key].totalCasts += spellData.totalCasts || 0;
            mergedPetSpells[key].totalHits += spellData.totalHits || 0;
            mergedPetSpells[key].amount += spellData.amount || 0;

            for (const type of ["damage", "healing", "damageTaken"]) {
              if (spellData[type]) {
                mergedPetSpells[key][type] = mergedPetSpells[key][type] || {};
                for (const key2 in spellData[type]) {
                  mergedPetSpells[key][type][key2] =
                    (mergedPetSpells[key][type][key2] || 0) +
                    (spellData[type][key2] || 0);
                }
              }
            }
          }
        }
      }
    }

    // Infer player class from first valid non-Melee spell
    for (const spell of Object.values(mergedSpells)) {
      const id = spell.spellId;

      // Skip if spellId is missing or spell is "Melee"
      if (!id || spell.spellName === "Melee") continue;

      // Try to get class using the helper
      const cls = getPlayerClassFromSpell(Number(id));
      if (cls && cls !== "Unknown") {
        inferredClass = cls;
        break;
      }
    }
    // Fallback
    if (!inferredClass) {
      inferredClass = "Unknown";
    }

    const playerSpells = Object.values(mergedSpells).map((spell) => {
      const damage = spell.damage?.useful ?? 0;
      const healing = spell.healing?.effective ?? 0;

      return {
        ...spell,
        damageForTable: damage,
        healingForTable: healing,
        icon:
          spell.spellName === "Melee"
            ? "Melee"
            : getSpellIconName(spell.spellId),
      };
    });

    const petSpells = Object.values(mergedPetSpells).map((spell) => {
      const damage = spell.damage?.useful ?? 0;
      const healing = spell.healing?.effective ?? 0;

      return {
        ...spell,
        damageForTable: damage,
        healingForTable: healing,
        icon:
          spell.spellName === "Melee"
            ? "Melee"
            : getSpellIconName(spell.spellId),
      };
    });

    res.json({
      playerSpells,
      petSpells,
      playerClass: inferredClass || "Unknown",
    });
  } catch (error) {
    console.error("❌ Error fetching log-wide player spells:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Get All Spells Breakdown for a Player in an attempt
 * GET :logId/attempts/:startTime/player/:playerName
 */

export const getPlayerSpellsFromAttempt = async (req, res) => {
  try {
    const { logId, startTime, playerName } = req.params;
    // const parsedStartTime = new Date(decodeURIComponent(startTime));
    let inferredClass = undefined;

    const allActors = await prisma.allActor.findMany({
      where: {
        actorName: playerName,
        attempt: {
          startTime: new Date(decodeURIComponent(startTime)),
          boss: {
            encounter: {
              logId: parseInt(logId),
            },
          },
        },
      },
    });

    if (!allActors.length) {
      return res.status(404).json({
        error: "Player not found in this attempt.",
      });
    }

    const mergedSpells = {};
    const mergedPetSpells = {};

    for (const actor of allActors) {
      const { spellList = {}, pets = {} } = actor.data || {};

      // Merge player spells
      for (const [spellName, spellData] of Object.entries(spellList)) {
        if (!mergedSpells[spellName]) {
          mergedSpells[spellName] = { ...spellData };
        } else {
          mergedSpells[spellName].totalCasts += spellData.totalCasts || 0;
          mergedSpells[spellName].totalHits += spellData.totalHits || 0;
          mergedSpells[spellName].amount += spellData.amount || 0;

          for (const type of ["damage", "healing", "damageTaken"]) {
            if (spellData[type]) {
              mergedSpells[spellName][type] =
                mergedSpells[spellName][type] || {};
              for (const key in spellData[type]) {
                mergedSpells[spellName][type][key] =
                  (mergedSpells[spellName][type][key] || 0) +
                  (spellData[type][key] || 0);
              }
            }
          }
        }

        mergedSpells[spellName].spellName = spellName;
        mergedSpells[spellName].spellId = spellData.spellId;
      }

      // Merge pet spells
      for (const [petName, petData] of Object.entries(pets)) {
        if (!petData?.spellList) continue;

        for (const [spellName, spellData] of Object.entries(
          petData.spellList
        )) {
          const key = `${petName}::${spellName}`;
          if (!mergedPetSpells[key]) {
            mergedPetSpells[key] = { ...spellData, petName, spellName };
          } else {
            mergedPetSpells[key].totalCasts += spellData.totalCasts || 0;
            mergedPetSpells[key].totalHits += spellData.totalHits || 0;
            mergedPetSpells[key].amount += spellData.amount || 0;

            for (const type of ["damage", "healing", "damageTaken"]) {
              if (spellData[type]) {
                mergedPetSpells[key][type] = mergedPetSpells[key][type] || {};
                for (const key2 in spellData[type]) {
                  mergedPetSpells[key][type][key2] =
                    (mergedPetSpells[key][type][key2] || 0) +
                    (spellData[type][key2] || 0);
                }
              }
            }
          }
        }
      }
    }

    // Infer player class
    for (const spell of Object.values(mergedSpells)) {
      const id = spell.spellId;
      if (!id || spell.spellName === "Melee") continue;
      const cls = getPlayerClassFromSpell(Number(id));
      if (cls && cls !== "Unknown") {
        inferredClass = cls;
        break;
      }
    }

    if (!inferredClass) {
      inferredClass = "Unknown";
    }

    const playerSpells = Object.values(mergedSpells).map((spell) => ({
      ...spell,
      damageForTable: spell.damage?.useful ?? 0,
      healingForTable: spell.healing?.effective ?? 0,
      icon:
        spell.spellName === "Melee" ? "Melee" : getSpellIconName(spell.spellId),
    }));

    const petSpells = Object.values(mergedPetSpells).map((spell) => ({
      ...spell,
      damageForTable: spell.damage?.useful ?? 0,
      healingForTable: spell.healing?.effective ?? 0,
      icon:
        spell.spellName === "Melee" ? "Melee" : getSpellIconName(spell.spellId),
    }));

    res.json({
      playerSpells,
      petSpells,
      playerClass: inferredClass,
    });
  } catch (error) {
    console.error("❌ Error fetching attempt-wide player spells:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
