import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const uploadMetadata = async (req, res) => {
  const {
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
    res.status(200).json({ message: "Log updated successfully", log: newLog });
  } catch (error) {
    console.log(error);
    res.status(500);
    throw new Error(`Error uploading metadata - ${error}`);
  }
};

export { uploadMetadata };
