import { PrismaClient } from "@prisma/client";
import logQueue from "../queues/logQueue.js";

const prisma = new PrismaClient();

const uploadMetadata = async (req, res) => {
  let {
    fileName,
    s3FilePath,
    serverName,
    fileSize,
    fileType,
    uploadStatus,
    processingStatus,
  } = req.body;

  try {
    if (!fileName || !s3FilePath || !serverName || !fileSize || !fileType) {
      res.status(400);
      throw new Error("Missing file metadata to upload!");
    }

    // ✅ Normalize ZIP MIME types
    const allowedZipTypes = ["application/zip", "application/x-zip-compressed"];
    if (!allowedZipTypes.includes(fileType)) {
      return res.status(400).json({ error: "❌ Only .zip files are allowed!" });
    }

    fileType = "application/zip";

    console.log(fileName);
    console.log(fileType);

    const newLog = await prisma.logs.create({
      data: {
        fileName,
        s3FilePath,
        serverName,
        fileSize,
        fileType,
        uploadStatus: "completed", // Default to "completed" after successful upload
        processingStatus: "pending", // Initially, processing is "pending"
      },
    });

    //Add a log to the bullmq queue
    await logQueue.add("log-processing-queue", {
      logId: newLog.logId,
      s3FilePath: newLog.s3FilePath,
    });

    console.log("📥 Job enqueued for processing!");
    res.status(200).json({ message: "Log updated successfully", log: newLog });
  } catch (error) {
    console.log(error);
    res.status(500);
    throw new Error(`Error uploading metadata - ${error}`);
  }
};

export { uploadMetadata };
