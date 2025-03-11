import express from "express";
import { getLogStatus } from "../controllers/logStatusController.js";

const router = express.Router();

router.get("/logs/status/:logId", getLogStatus);

export default router;
