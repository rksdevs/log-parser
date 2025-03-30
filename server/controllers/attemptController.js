// // GET /api/attempts/:attemptId
// import prisma from "../config/db.js";
// import { getBossName } from "../helpers/bossHelper.js";

// /**
//  * Get Player Stats for an Attempt (Attempt Breakdown Table)
//  * GET /api/logs/{logId}/encounters/{encounterName}/attempts/{startTime}
//  */
// export const getAttemptDetails = async (req, res) => {
//   try {
//     const { logId, encounterName, startTime } = req.params;
//     // console.log(decodeURIComponent(startTime), "from start time");

//     const attempt = await prisma.attempt.findFirst({
//       where: {
//         startTime: new Date(decodeURIComponent(startTime)),
//         boss: {
//           encounter: {
//             name: decodeURIComponent(encounterName),
//             logId: parseInt(logId),
//           },
//         },
//       },
//       include: {
//         AttemptParticipant: { include: { player: true } },
//       },
//     });

//     if (!attempt) {
//       return res.status(404).json({ error: "Attempt not found" });
//     }

//     // console.log("❌ Participants From controller ", attempt.AttemptParticipant);

//     const totalDuration =
//       (new Date(attempt.endTime) - new Date(attempt.startTime)) / 1000;

//     const formattedData = attempt.AttemptParticipant.map((p) => ({
//       playerName: p.player.name,
//       totalDamage: p.damageDone,
//       dps: totalDuration ? (p.damageDone / totalDuration).toFixed(2) : 0,
//       totalHealing: p.healingDone,
//       hps: totalDuration ? (p.healingDone / totalDuration).toFixed(2) : 0,
//       class: p.player.class || "Unknown",
//       guid: p.player.guid || "",
//     }));

//     res.json(formattedData);
//   } catch (error) {
//     console.error("❌ Error fetching attempt details:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

import prisma from "../config/db.js";
import { getBossName, getMultiBossName } from "../helpers/bossHelper.js";

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
