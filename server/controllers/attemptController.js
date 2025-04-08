import prisma from "../config/db.js";
import { getBossName, getMultiBossName } from "../helpers/bossHelper.js";
import { getPlayerClassFromSpell } from "../helpers/playerClassHelper.js";
import { getSpellIconName } from "../helpers/spellIconHelper.js";

export const getAttemptDetails = async (req, res) => {
  try {
    const { logId, encounterName, startTime } = req.params;

    const attempt = await prisma.attempt.findFirst({
      where: {
        startTime: new Date(decodeURIComponent(startTime)),
        boss: {
          encounter: {
            name: decodeURIComponent(encounterName),
            logId: parseInt(logId),
          },
        },
      },
      include: {
        AttemptParticipant: { include: { player: true } },
      },
    });

    if (!attempt) {
      return res.status(404).json({ error: "Attempt not found" });
    }

    const totalDuration =
      (new Date(attempt.endTime) - new Date(attempt.startTime)) / 1000;

    const players = [];
    const bosses = [];
    const others = [];

    for (const p of attempt.AttemptParticipant) {
      const guid = p.player.guid || "";
      const isBoss = getBossName(guid) || getMultiBossName(guid); // Will return null or boss name
      const isPlayer = (guid) => {
        if (guid?.startsWith("0000000")) {
          return true;
        } else return false;
      };

      const stats = {
        playerName: p.player.name,
        totalDamage: p.damageDone,
        dps: totalDuration ? (p.damageDone / totalDuration).toFixed(2) : 0,
        totalHealing: p.healingDone,
        hps: totalDuration ? (p.healingDone / totalDuration).toFixed(2) : 0,
        class: p.player.class || "Unknown",
        guid,
      };

      if (isBoss) {
        bosses.push(stats);
      } else if (isPlayer(guid)) {
        players.push(stats);
      } else {
        others.push(stats);
      }
    }

    res.json({ players, bosses, others });
  } catch (error) {
    console.error("❌ Error fetching attempt details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// controllers/attemptController.js

export const getAttemptSpellSummary = async (req, res) => {
  try {
    const { logId, startTime } = req.params;

    // Fetch all actors for the attempt based on startTime and logId
    const allActors = await prisma.allActor.findMany({
      where: {
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
      return res
        .status(404)
        .json({ error: "No players found for this attempt." });
    }

    const mergedSpells = {};
    const mergedPetSpells = {};

    for (const actor of allActors) {
      const { spellList = {}, pets = {}, actorName } = actor.data || {};

      for (const [spellName, spellData] of Object.entries(spellList)) {
        if (!mergedSpells[spellName]) {
          mergedSpells[spellName] = {
            ...spellData,
            spellName,
            spellId: spellData.spellId,
            amount: spellData.amount || 0,
            totalCasts: spellData.totalCasts || 0,
            totalHits: spellData.totalHits || 0,
            damageForTable: spellData.damage?.useful || 0,
            healingForTable: spellData.healing?.effective || 0,
          };
        } else {
          mergedSpells[spellName].amount += spellData.amount || 0;
          mergedSpells[spellName].totalCasts += spellData.totalCasts || 0;
          mergedSpells[spellName].totalHits += spellData.totalHits || 0;
          mergedSpells[spellName].damageForTable +=
            spellData.damage?.useful || 0;
          mergedSpells[spellName].healingForTable +=
            spellData.healing?.effective || 0;
        }
      }

      // Same for pets (optional, can remove if not needed in this view)
      for (const [petName, petData] of Object.entries(pets)) {
        if (!petData?.spellList) continue;

        for (const [spellName, spellData] of Object.entries(
          petData.spellList
        )) {
          const key = `${petName}::${spellName}`;
          if (!mergedPetSpells[key]) {
            mergedPetSpells[key] = {
              ...spellData,
              petName,
              spellName,
              spellId: spellData.spellId,
              amount: spellData.amount || 0,
              totalCasts: spellData.totalCasts || 0,
              totalHits: spellData.totalHits || 0,
              damageForTable: spellData.damage?.useful || 0,
              healingForTable: spellData.healing?.effective || 0,
            };
          } else {
            mergedPetSpells[key].amount += spellData.amount || 0;
            mergedPetSpells[key].totalCasts += spellData.totalCasts || 0;
            mergedPetSpells[key].totalHits += spellData.totalHits || 0;
            mergedPetSpells[key].damageForTable +=
              spellData.damage?.useful || 0;
            mergedPetSpells[key].healingForTable +=
              spellData.healing?.effective || 0;
          }
        }
      }
    }

    const playerSpells = Object.values(mergedSpells).map((spell) => ({
      ...spell,
      icon:
        spell.spellName === "Melee" ? "Melee" : getSpellIconName(spell.spellId),
    }));

    const petSpells = Object.values(mergedPetSpells).map((spell) => ({
      ...spell,
      icon:
        spell.spellName === "Melee" ? "Melee" : getSpellIconName(spell.spellId),
    }));

    return res.json({ playerSpells, petSpells });
  } catch (err) {
    console.error("❌ Error in getAttemptSpellSummary:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAttemptSummaryFromDb = async (req, res) => {
  const { logId, startTime } = req.params;

  try {
    const attempt = await prisma.attempt.findFirst({
      where: {
        startTime: new Date(decodeURIComponent(startTime)),
        boss: {
          encounter: {
            logId: parseInt(logId),
          },
        },
      },
      include: {
        AttemptParticipant: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    const start = new Date(attempt.startTime);
    const end = new Date(attempt.endTime);
    const duration = (end - start) / 1000; // seconds

    const playerStats = [];
    const bossStats = [];

    const isPlayer = (guid) => guid?.startsWith("0000000");

    for (const participant of attempt.AttemptParticipant) {
      const guid = participant.player.guid || "";
      const playerName = participant.player.name;
      const playerClass = participant.player.class || "Unknown";
      const totalDamage = participant.damageDone;
      const totalHealing = participant.healingDone;
      const dps = duration ? (totalDamage / duration).toFixed(2) : "0.00";
      const hps = duration ? (totalHealing / duration).toFixed(2) : "0.00";

      const stats = {
        playerName,
        guid,
        class: playerClass,
        totalDamage,
        totalHealing,
        dps,
        hps,
      };

      if (isPlayer(guid)) {
        playerStats.push(stats);
      } else if (getBossName(guid) || getMultiBossName(guid)) {
        bossStats.push(stats);
      }
    }

    return res.status(200).json({ playerStats, bossStats });
  } catch (error) {
    console.error("❌ Error in getAttemptSummaryFromDb:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
