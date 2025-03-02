import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import AWS from "aws-sdk";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";

dotenv.config();
const prisma = new PrismaClient();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "ap-south-1",
});

// ✅ Define __dirname manually for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logWorker = new Worker(
  "log-processing-queue",
  async (job) => {
    try {
      const { logId, s3FilePath } = job.data;
      console.log(`🚀 Processing log (ID: ${logId})...`);
      console.log(`🔍 Fetching file from S3: ${s3FilePath}`);

      const urlObj = new URL(s3FilePath);
      const s3ObjectKey = urlObj.pathname.substring(1);

      // ✅ Fetch the log file from S3
      //   const s3ObjectKey = s3FilePath.split(".com/")[1]; // Extract object key
      console.log(`📂 Extracted S3 Object Key: ${s3ObjectKey}`);
      const zipFile = await s3
        .getObject({ Bucket: process.env.AWS_BUCKET_NAME, Key: s3ObjectKey })
        .promise();

      if (!zipFile.Body) {
        throw new Error("Log file is empty or inaccessible");
      }

      console.log(`✅ Successfully fetched file from S3`);

      // ✅ Ensure the /tmp/ directory exists (Cross-platform fix)
      const tempDir = path.join(__dirname, "..", "tmp"); // Windows & Linux compatible
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // ✅ Write file to tmp directory
      const tempZipPath = path.join(tempDir, `log-${logId}.zip`);
      fs.writeFileSync(tempZipPath, zipFile.Body);

      console.log(`📄 .zip file saved locally: ${tempZipPath}`);

      // ✅ Extract .zip file
      const extractPath = path.join(tempDir, `log-${logId}`);
      if (!fs.existsSync(extractPath)) {
        fs.mkdirSync(extractPath);
      }

      const zip = new AdmZip(tempZipPath);
      zip.extractAllTo(extractPath, true);

      console.log(`📂 Extracted files to: ${extractPath}`);

      // ✅ Iterate over extracted files
      const extractedFiles = fs.readdirSync(extractPath);
      console.log(`📃 Found ${extractedFiles.length} log files in .zip`);

      for (const fileName of extractedFiles) {
        const filePath = path.join(extractPath, fileName);

        // ✅ Ensure it's a text file before processing
        if (fileName.endsWith(".txt")) {
          console.log(`📑 Processing extracted file: ${fileName}`);

          // ✅ Read file content
          const fileContent = fs.readFileSync(filePath, "utf-8");

          // ✅ Simulate log parsing (Replace with real parsing logic)
          console.log(
            `🔍 First 100 chars of file: ${fileContent.substring(0, 100)}`
          );
        } else {
          throw new Error(
            `❌ Invalid file detected: ${fileName}. Only .txt or .log files are allowed.`
          );
        }
      }

      //update db that the log has been parsed
      await prisma.logs.update({
        where: { logId },
        data: { processingStatus: "completed" },
      });

      console.log(`✅ Processing completed for log ID: ${logId}`);

      // ✅ Cleanup: Delete extracted files and zip
      fs.unlinkSync(tempZipPath);
      fs.rmSync(extractPath, { recursive: true, force: true });

      console.log(`🗑️ Cleaned up temp files.`);
    } catch (error) {
      console.error("❌ Error processing log:", error.message);

      await prisma.logs.update({
        where: { logId: job.data.logId },
        data: { processingStatus: "failed" },
      });
    }
  },
  { connection: redisConnection }
);

console.log("👷 Log processing worker started...");

export default logWorker;
