import { getLogFromRedis } from "../services/logService.js";

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
      return res.status(200).json(logData);
    }
  } catch (error) {
    console.log(error);
    res.status(500);
    throw new Error("Something went wrong with fetch logs");
  }
};
