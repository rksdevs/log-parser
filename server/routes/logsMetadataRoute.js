import express from "express";
import { uploadMetadata } from "../controllers/logsMetadata.js";
const route = express.Router();

route.post("/upload-metadata", uploadMetadata);

export default route;
