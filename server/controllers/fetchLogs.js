import { getLogFromRedis } from "../services/logService.js";

//*GET /api/logs/{logId}
//*GET specific log from redis

function formatTimestamp(timestamp) {
  let date = new Date(timestamp);

  let year = date.getFullYear();
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
