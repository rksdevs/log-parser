import express from "express";
import {
  fetchAllLogs,
  fetchLogs,
  fetchLogsFromDb,
} from "../controllers/fetchLogs.js";
const router = express.Router();

router.get("/all-logs", fetchAllLogs);
router.get("/:logId", fetchLogsFromDb);

export default router;
