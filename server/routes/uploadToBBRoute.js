import expres from "express";
import { getPresignedUrl, upload } from "../controllers/uploadToBB.js";
const route = expres.Router();

route.post("/upload", upload.single("file"), getPresignedUrl);

export default route;
