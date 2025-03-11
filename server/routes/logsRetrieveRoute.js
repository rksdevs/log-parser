import express from "express";
import { fetchLogs } from "../controllers/fetchLogs.js";
const router = express.Router();

router.get("/:logId", fetchLogs);

export default router;
