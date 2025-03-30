import { getLogFromRedis } from "../services/logService.js";
import prisma from "../config/db.js";

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
    // ✅ Fetch log details from LogsMain
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

    // ✅ Convert DB data to Redis-style structured format
    const logData = {};

    for (const encounter of logEntry.log.encounters) {
      if (!logData[encounter.name]) {
        logData[encounter.name] = {};
      }

      for (const boss of encounter.bosses) {
        if (!logData[encounter.name][boss.name]) {
          logData[encounter.name][boss.name] = [];
        }

        for (const attempt of boss.attempts) {
          logData[encounter.name][boss.name].push({
            startTime: attempt.startTime,
            endTime: attempt.endTime,
            players: attempt.AttemptParticipant.map((p) => p.player.name),
            spellStatistics: attempt.spellStats,
          });
        }
      }
    }

    // ✅ Generate Navigation Data (same as Redis structure)
    const navigationData = Object.entries(logData).map(
      ([encounterName, bosses]) => ({
        encounter: encounterName,
        url: `/logs/${logId}/${encodeURIComponent(encounterName)}`,
        isActive: true, // Keep navigation behavior same
        bosses: Object.entries(bosses).map(([bossName, attempts]) => ({
          name: `${bossName} - Heroic`,
          attempts: attempts.map((attempt, index) => ({
            name: `Attempt ${index + 1} - ${attempt.startTime
              .toISOString()
              .replace("T", " ")}`,
            start: formatTimestamp(attempt.startTime),
            end: formatTimestamp(attempt.endTime),
            url: `/logs/${logId}/${encodeURIComponent(
              encounterName
            )}/${formatTimestamp(attempt.startTime)}`,
          })),
        })),
      })
    );

    return res.status(200).json({
      logData,
      navigationData,
    });
  } catch (error) {
    console.error("Error fetching log from DB:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong with fetch logs" });
  }
};
