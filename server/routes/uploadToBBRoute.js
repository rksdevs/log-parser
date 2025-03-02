import expres from "express";
import {
  getPresignedUrl,
  getPresignedUrlS3,
  upload,
} from "../controllers/uploadToBB.js";
const route = expres.Router();

route.post("/upload", upload.single("file"), getPresignedUrl);
route.post("/get-presigned-url-s3", getPresignedUrlS3);

export default route;
