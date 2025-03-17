import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

//Checks the status of the log uploading in Redis storage

export const getLogStatusRedis = async (req, res) => {
  try {
    let { logId } = req.params;

    logId = Number(logId);

    const logEntry = await prisma.logs.findUnique({
      where: { logId },
      select: { processingStatus: true, processedAt: true },
    });

    if (!logEntry) {
      return res.status(404).json({ message: "Log not found" });
    }

    return res.json({
      logId,
      status: logEntry.processingStatus,
      processedAt: logEntry.processedAt,
    });
  } catch (error) {
    console.error("Error fetching log status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//Checks the status of the log uploading in Redis storage

export const getLogStatusPostgres = async (req, res) => {
  try {
    let { logId } = req.params;

    logId = Number(logId);

    const logEntry = await prisma.logs.findUnique({
      where: { logId },
      select: { uploadStatus: true, dbUploadCompleteAt: true },
    });

    if (!logEntry) {
      return res.status(404).json({ message: "Log not found" });
    }

    if (logEntry.uploadStatus === "failed") {
      return res.status(400).json({ message: "Log uplod to db failed" });
    }

    return res.json({
      logId,
      status: logEntry.uploadStatus,
      uploadCompletedAt: logEntry.dbUploadCompleteAt,
    });
  } catch (error) {
    console.error("Error fetching log status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
