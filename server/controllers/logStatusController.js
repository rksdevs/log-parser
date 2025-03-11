import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getLogStatus = async (req, res) => {
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
