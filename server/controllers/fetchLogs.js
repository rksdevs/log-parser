import { getLogFromRedis } from "../services/logService.js";
import prisma from "../config/db.js";
import {
  getBossName as getBossNameFromGuid,
  getMultiBossName as getMultiBossNameFromGuid,
} from "../helpers/bossHelper.js";

//*GET /api/logs/{logId}
//*GET specific log from redis

function formatTimestamp(timestamp) {
  let date = new Date(timestamp);

  let year = new Date(Date.now()).getFullYear();
  let month = String(date.getMonth() + 1).padStart(2, "0");
  let day = String(date.getDate()).padStart(2, "0");
  let hours = String(date.getHours()).padStart(2, "0");
  let minutes = String(date.getMinutes()).padStart(2, "0");
  let seconds = String(date.getSeconds()).padStart(2, "0");
  let milliseconds = String(date.getMilliseconds())
    .padStart(3, "0")
    .slice(0, 3); // Keep only two digits

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

export const fetchLogs = async (req, res) => {
  const { logId } = req.params;
  console.log(logId, "from controller");
  const userId = "12345";

  try {
    const logData = await getLogFromRedis(userId, logId);
    if (!logData) {
      return res
        .status(400)
        .json({ message: "Something went wrong with log data" });
    } else {
      return res.status(200).json({
        logData,
        navigationData: Object.entries(logData).map(
          ([encounterName, bosses]) => ({
            encounter: encounterName,
            url: `/logs/${logId}/${encodeURIComponent(encounterName)}`,
            isActive: true, //need to work on this setting up active nav dynamically from client side
            bosses: Object.entries(bosses).map(([bossName, attempts]) => ({
              name: `${bossName} - Heroic`,
              attempts: attempts.map((attempt, index) => ({
                name: `Attempt ${index + 1}`,
                start: formatTimestamp(new Date(attempt.startTime)),
                end: formatTimestamp(new Date(attempt.endTime)),
                url: `/logs/${logId}/${encodeURIComponent(
                  encounterName
                )}/${formatTimestamp(new Date(attempt.startTime))}`,
              })),
            })),
          })
        ),
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500);
    throw new Error("Something went wrong with fetch logs");
  }
};

export const fetchAllLogs = async (req, res) => {
  try {
    const logs = await prisma.logsMain.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(
      logs.map((log) => ({
        logId: log.logId,
        date: log.firstEncounter.toISOString(),
        players: JSON.parse(log.playersInvolved),
        uploadStatus: log.uploadStatus,
      }))
    );
  } catch (error) {
    console.error("Error fetching logs:", error);
    return res.status(500).json({ message: "Failed to fetch logs" });
  }
};

export const fetchLogsFromDb = async (req, res) => {
  const { logId } = req.params;
  console.log(`Fetching log from DB: ${logId}`);

  try {
    const logEntry = await prisma.logsMain.findUnique({
      where: { logId: parseInt(logId) },
      include: {
        log: {
          include: {
            encounters: {
              include: {
                bosses: {
                  include: {
                    attempts: {
                      include: {
                        AttemptParticipant: {
                          include: { player: true },
                        },
                        spellStats: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!logEntry) {
      return res.status(404).json({ message: "Log not found in database" });
    }

    const logData = {};
    let totalEncounters = 0;
    let totalAttempts = 0;
    const playerSet = new Set();
    const encounterWiseAttempts = {};

    let totalPlayerDamage = 0;
    let totalPlayerHealing = 0;
    let highestDps = { value: 0, playerName: "", bossName: "" };
    let highestHps = { value: 0, playerName: "", bossName: "" };
    let earliestStart = null;
    let latestEnd = null;

    const playerBreakdown = {};
    const playerTotals = {};
    const bossTotals = {};
    const otherTotals = {};

    const isPlayer = (guid) => guid?.startsWith("0000000");
    const getBossName = getBossNameFromGuid; // placeholder
    const getMultiBossName = getMultiBossNameFromGuid; // placeholder

    for (const encounter of logEntry.log.encounters) {
      if (!logData[encounter.name]) {
        logData[encounter.name] = {};
      }
      totalEncounters++;

      for (const boss of encounter.bosses) {
        if (!logData[encounter.name][boss.name]) {
          logData[encounter.name][boss.name] = [];
        }

        for (const attempt of boss.attempts) {
          totalAttempts++;
          encounterWiseAttempts[encounter.name] =
            (encounterWiseAttempts[encounter.name] || 0) + 1;

          const startTime = new Date(attempt.startTime);
          const endTime = new Date(attempt.endTime);
          const duration = (endTime - startTime) / 1000;

          logData[encounter.name][boss.name].push({
            name: attempt.name,
            type: attempt.type,
            startTime: attempt.startTime,
            endTime: attempt.endTime,
            players: attempt.AttemptParticipant.map((p) => p.player.name),
            spellStatistics: attempt.spellStats,
          });

          if (!earliestStart || startTime < earliestStart) {
            earliestStart = startTime;
          }
          if (!latestEnd || endTime > latestEnd) {
            latestEnd = endTime;
          }

          for (const participant of attempt.AttemptParticipant) {
            const guid = participant.player.guid || "";
            const playerName = participant.player.name;
            const cls = participant.player.class || "Unknown";
            const damage = participant.damageDone;
            const healing = participant.healingDone;
            const dps = duration ? damage / duration : 0;
            const hps = duration ? healing / duration : 0;

            const stats = {
              playerName,
              guid,
              class: cls,
              totalDamage: damage,
              totalHealing: healing,
              dps,
              hps,
            };

            if (isPlayer(guid)) {
              playerSet.add(playerName);
              totalPlayerDamage += damage;
              totalPlayerHealing += healing;

              playerBreakdown[playerName] = playerBreakdown[playerName] || {
                totalDamage: 0,
                totalHealing: 0,
              };
              playerBreakdown[playerName].totalDamage += damage;
              playerBreakdown[playerName].totalHealing += healing;

              if (!playerTotals[guid]) {
                playerTotals[guid] = { ...stats };
              } else {
                playerTotals[guid].totalDamage += damage;
                playerTotals[guid].totalHealing += healing;
              }

              if (dps > highestDps.value) {
                highestDps = { value: dps, playerName, bossName: boss.name };
              }
              if (hps > highestHps.value) {
                highestHps = { value: hps, playerName, bossName: boss.name };
              }
            } else if (getBossName(guid) || getMultiBossName(guid)) {
              if (!bossTotals[guid]) {
                bossTotals[guid] = { ...stats };
              } else {
                bossTotals[guid].totalDamage += damage;
                bossTotals[guid].totalHealing += healing;
              }
            } else {
              if (!otherTotals[guid]) {
                otherTotals[guid] = { ...stats };
              } else {
                otherTotals[guid].totalDamage += damage;
                otherTotals[guid].totalHealing += healing;
              }
            }
          }
        }
      }
    }

    const totalDuration =
      earliestStart && latestEnd ? (latestEnd - earliestStart) / 1000 : 0;

    const formatAggregates = (obj) =>
      Object.values(obj).map((entry) => ({
        ...entry,
        dps: (entry.totalDamage / totalDuration).toFixed(2),
        hps: (entry.totalHealing / totalDuration).toFixed(2),
      }));

    const playerStats = formatAggregates(playerTotals);
    const bossStats = formatAggregates(bossTotals);
    const otherStats = formatAggregates(otherTotals);

    const sortedPlayers = Object.entries(playerBreakdown).sort(
      (a, b) => b[1].totalDamage - a[1].totalDamage
    );

    const top3Dps = sortedPlayers.slice(0, 3).map(([player, stats]) => {
      const entry = Object.values(playerTotals).find(
        (p) => p.playerName === player
      );
      return {
        player,
        value: totalPlayerDamage
          ? Number(((stats.totalDamage / totalPlayerDamage) * 100).toFixed(2))
          : 0,
        class: entry?.class || "Unknown",
      };
    });

    const othersDpsValue = sortedPlayers
      .slice(3)
      .reduce((sum, [, stats]) => sum + stats.totalDamage, 0);

    const othersDpsPercent = totalPlayerDamage
      ? Number(((othersDpsValue / totalPlayerDamage) * 100).toFixed(2))
      : 0;

    const dpsChartData = [
      ...top3Dps,
      { player: "Others", value: othersDpsPercent, class: "Unknown" },
    ];

    //healing chart data
    const sortedHealers = Object.entries(playerBreakdown).sort(
      (a, b) => b[1].totalHealing - a[1].totalHealing
    );
    const top3Hps = sortedHealers.slice(0, 3).map(([player, stats]) => {
      const entry = Object.values(playerTotals).find(
        (p) => p.playerName === player
      );
      return {
        player,
        value: totalPlayerHealing
          ? Number(((stats.totalHealing / totalPlayerHealing) * 100).toFixed(2))
          : 0,
        class: entry?.class || "Unknown",
      };
    });

    const othersHpsValue = sortedHealers
      .slice(3)
      .reduce((sum, [, stats]) => sum + stats.totalHealing, 0);

    const othersHpsPercent = totalPlayerHealing
      ? Number(((othersHpsValue / totalPlayerHealing) * 100).toFixed(2))
      : 0;

    const healingChartData = [
      ...top3Hps,
      { player: "Others", value: othersHpsPercent, class: "Unknown" },
    ];

    const navigationData = Object.entries(logData).map(
      ([encounterName, bosses]) => ({
        encounter: encounterName,
        url: `/logs/${logId}/${encodeURIComponent(encounterName)}`,
        isActive: true,
        bosses: Object.entries(bosses).map(([bossName, attempts]) => ({
          name: `${bossName} - Heroic`,
          attempts: attempts.map((attempt, index) => ({
            name: attempt.name || `Attempt ${index + 1}`,
            type: attempt.type || "unknown",
            start: formatTimestamp(attempt.startTime),
            end: formatTimestamp(attempt.endTime),
            url: `/${logId}/${encodeURIComponent(
              formatTimestamp(attempt.startTime)
            )}`,
          })),
        })),
      })
    );

    const logSummary = {
      logId,
      totalEncounters,
      totalAttempts,
      totalPlayers: playerSet.size,
      encounterWiseAttempts,
      totalPlayerDamage,
      totalPlayerHealing,
      playerBreakdown,
      dpsChartData,
      healingChartData,
      playerStats,
      bossStats,
      otherStats,
      highestDps: {
        player: highestDps.playerName,
        dps: highestDps.value.toFixed(2),
        boss: highestDps.bossName,
      },
      highestHps: {
        player: highestHps.playerName,
        hps: highestHps.value.toFixed(2),
        boss: highestHps.bossName,
      },
      totalDuration: Number(totalDuration.toFixed(2)),
    };

    return res.status(200).json({
      logData,
      navigationData,
      logSummary,
    });
  } catch (error) {
    console.error("Error fetching log from DB:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong with fetch logs" });
  }
};

// export const fetchLogsFromDb = async (req, res) => {
//   const { logId } = req.params;
//   console.log(`Fetching log from DB: ${logId}`);

//   try {
//     const logEntry = await prisma.logsMain.findUnique({
//       where: { logId: parseInt(logId) },
//       include: {
//         log: {
//           include: {
//             encounters: {
//               include: {
//                 bosses: {
//                   include: {
//                     attempts: {
//                       include: {
//                         AttemptParticipant: {
//                           include: { player: true },
//                         },
//                         spellStats: true,
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!logEntry) {
//       return res.status(404).json({ message: "Log not found in database" });
//     }

//     const logData = {};
//     let totalEncounters = 0;
//     let totalAttempts = 0;
//     const playerSet = new Set();
//     const encounterWiseAttempts = {};

//     let totalPlayerDamage = 0;
//     let totalPlayerHealing = 0;
//     let highestDps = { value: 0, playerName: "", bossName: "" };
//     let highestHps = { value: 0, playerName: "", bossName: "" };
//     let earliestStart = null;
//     let latestEnd = null;

//     const playerBreakdown = {};
//     const playerTotals = {};
//     const bossTotals = {};
//     const otherTotals = {};

//     const critTracker = {}; // Track totalHits and crits by playerId/guid

//     const isPlayer = (guid) => guid?.startsWith("0000000");
//     const getBossName = getBossNameFromGuid;
//     const getMultiBossName = getMultiBossNameFromGuid;

//     for (const encounter of logEntry.log.encounters) {
//       if (!logData[encounter.name]) {
//         logData[encounter.name] = {};
//       }
//       totalEncounters++;

//       for (const boss of encounter.bosses) {
//         if (!logData[encounter.name][boss.name]) {
//           logData[encounter.name][boss.name] = [];
//         }

//         for (const attempt of boss.attempts) {
//           totalAttempts++;
//           encounterWiseAttempts[encounter.name] =
//             (encounterWiseAttempts[encounter.name] || 0) + 1;

//           const startTime = new Date(attempt.startTime);
//           const endTime = new Date(attempt.endTime);
//           const duration = (endTime - startTime) / 1000;

//           logData[encounter.name][boss.name].push({
//             name: attempt.name,
//             type: attempt.type,
//             startTime: attempt.startTime,
//             endTime: attempt.endTime,
//             players: attempt.AttemptParticipant.map((p) => p.player.name),
//             spellStatistics: attempt.spellStats,
//           });

//           if (!earliestStart || startTime < earliestStart)
//             earliestStart = startTime;
//           if (!latestEnd || endTime > latestEnd) latestEnd = endTime;

//           for (const stat of attempt.spellStats) {
//             const { playerId, totalHits = 0, crits = 0 } = stat;
//             if (!critTracker[playerId]) {
//               critTracker[playerId] = { hits: 0, crits: 0 };
//             }
//             critTracker[playerId].hits += totalHits;
//             critTracker[playerId].crits += crits;
//           }

//           for (const participant of attempt.AttemptParticipant) {
//             const guid = participant.player.guid || "";
//             const playerName = participant.player.name;
//             const cls = participant.player.class || "Unknown";
//             const damage = participant.damageDone;
//             const healing = participant.healingDone;
//             const dps = duration ? damage / duration : 0;
//             const hps = duration ? healing / duration : 0;

//             const stats = {
//               id: guid,
//               playerName,
//               guid,
//               class: cls,
//               totalDamage: damage,
//               totalHealing: healing,
//               dps,
//               hps,
//             };

//             if (isPlayer(guid)) {
//               playerSet.add(playerName);
//               totalPlayerDamage += damage;
//               totalPlayerHealing += healing;

//               playerBreakdown[playerName] = playerBreakdown[playerName] || {
//                 totalDamage: 0,
//                 totalHealing: 0,
//               };
//               playerBreakdown[playerName].totalDamage += damage;
//               playerBreakdown[playerName].totalHealing += healing;

//               if (!playerTotals[guid]) {
//                 playerTotals[guid] = { ...stats };
//               } else {
//                 playerTotals[guid].totalDamage += damage;
//                 playerTotals[guid].totalHealing += healing;
//               }

//               if (dps > highestDps.value) {
//                 highestDps = { value: dps, playerName, bossName: boss.name };
//               }
//               if (hps > highestHps.value) {
//                 highestHps = { value: hps, playerName, bossName: boss.name };
//               }
//             } else if (getBossName(guid) || getMultiBossName(guid)) {
//               if (!bossTotals[guid]) {
//                 bossTotals[guid] = { ...stats };
//               } else {
//                 bossTotals[guid].totalDamage += damage;
//                 bossTotals[guid].totalHealing += healing;
//               }
//             } else {
//               if (!otherTotals[guid]) {
//                 otherTotals[guid] = { ...stats };
//               } else {
//                 otherTotals[guid].totalDamage += damage;
//                 otherTotals[guid].totalHealing += healing;
//               }
//             }
//           }
//         }
//       }
//     }

//     const totalDuration =
//       earliestStart && latestEnd ? (latestEnd - earliestStart) / 1000 : 0;

//     const formatAggregates = (obj) =>
//       Object.values(obj).map((entry) => {
//         const critData = critTracker[entry.id] || { hits: 0, crits: 0 };
//         const critPercent =
//           critData.hits > 0
//             ? Number(((critData.crits / critData.hits) * 100).toFixed(2))
//             : 0;

//         return {
//           ...entry,
//           dps: (entry.totalDamage / totalDuration).toFixed(2),
//           hps: (entry.totalHealing / totalDuration).toFixed(2),
//           critPercent,
//         };
//       });

//     const playerStats = formatAggregates(playerTotals);
//     const bossStats = formatAggregates(bossTotals);
//     const otherStats = formatAggregates(otherTotals);

//     const sortedPlayers = Object.entries(playerBreakdown).sort(
//       (a, b) => b[1].totalDamage - a[1].totalDamage
//     );

//     const top3Dps = sortedPlayers.slice(0, 3).map(([player, stats]) => ({
//       player,
//       value: Number(((stats.totalDamage / totalPlayerDamage) * 100).toFixed(2)),
//     }));

//     const othersDpsValue = sortedPlayers
//       .slice(3)
//       .reduce((sum, [, stats]) => sum + stats.totalDamage, 0);

//     const othersPercent = Number(
//       ((othersDpsValue / totalPlayerDamage) * 100).toFixed(2)
//     );

//     const dpsChartData = [
//       ...top3Dps,
//       { player: "Others", value: othersPercent },
//     ];

//     const navigationData = Object.entries(logData).map(
//       ([encounterName, bosses]) => ({
//         encounter: encounterName,
//         url: `/logs/${logId}/${encodeURIComponent(encounterName)}`,
//         isActive: true,
//         bosses: Object.entries(bosses).map(([bossName, attempts]) => ({
//           name: `${bossName} - Heroic`,
//           attempts: attempts.map((attempt, index) => ({
//             name: attempt.name || `Attempt ${index + 1}`,
//             type: attempt.type || "unknown",
//             start: formatTimestamp(attempt.startTime),
//             end: formatTimestamp(attempt.endTime),
//             url: `/${logId}/${encodeURIComponent(
//               encounterName
//             )}/${formatTimestamp(attempt.startTime)}`,
//           })),
//         })),
//       })
//     );

//     const logSummary = {
//       logId,
//       totalEncounters,
//       totalAttempts,
//       totalPlayers: playerSet.size,
//       encounterWiseAttempts,
//       totalPlayerDamage,
//       totalPlayerHealing,
//       playerBreakdown,
//       dpsChartData,
//       playerStats,
//       bossStats,
//       otherStats,
//       highestDps: {
//         player: highestDps.playerName,
//         dps: highestDps.value.toFixed(2),
//         boss: highestDps.bossName,
//       },
//       highestHps: {
//         player: highestHps.playerName,
//         hps: highestHps.value.toFixed(2),
//         boss: highestHps.bossName,
//       },
//       totalDuration: Number(totalDuration.toFixed(2)),
//     };

//     return res.status(200).json({
//       logData,
//       navigationData,
//       logSummary,
//     });
//   } catch (error) {
//     console.error("Error fetching log from DB:", error);
//     return res
//       .status(500)
//       .json({ message: "Something went wrong with fetch logs" });
//   }
// };
