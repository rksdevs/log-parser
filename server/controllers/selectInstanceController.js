import prisma from "../config/db.js";
import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { postgresQueue } from "../queues/postgresQueue.js";

// const postgresQueue = new Queue("postgres-save-queue-new", {
//   connection: redisConnection,
// });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const selectLogInstance = async (req, res) => {
  const { logId } = req.params;
  const { selectedIndex } = req.body;

  try {
    if (selectedIndex === undefined) {
      res.status(400).json({ error: "Need selected log instance" });
    }

    const redisKey = `log:${logId}:instances`;
    const redisData = await redisConnection.get(redisKey);

    if (!redisData) {
      res.status(404).json({
        error:
          "Selected instance not found: cache expired, try uploading new log again!",
      });
    }

    // console.log(redisData);

    const { instancePaths } = JSON.parse(redisData);
    const filePath = instancePaths[selectedIndex];

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Log instance file not found" });
    }

    // if (selectedIndex < 0 || selectedIndex > instances.length) {
    //   return res
    //     .status(400)
    //     .json({ error: "Invalid selection: incorrect index selected" });
    // }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const selectedInstance = JSON.parse(fileContent);

    // const selectedInstance = instances[selectedIndex];
    console.log(
      "✅ Queuing selected instance with structure:",
      Object.keys(selectedInstance.fights)
    );

    await postgresQueue.add("save-to-postgres", {
      logId: parseInt(logId),
      //   structuredFights: [selectedInstance],
      structuredFights: selectedInstance.fights,
    });

    await prisma.logs.update({
      where: { logId: parseInt(logId) },
      data: { processingStatus: "queued_for_db" },
    });

    // 🧼 Cleanup
    const instanceDir = path.dirname(filePath);
    fs.rmSync(instanceDir, { recursive: true, force: true });

    await redisConnection.del(redisKey);

    return res.status(200).json({
      message:
        "Selected instance queued for DB upload and temp files cleaned up",
    });
  } catch (error) {
    console.error("Error selecting log instance:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
