import express from "express";
import {
  getAttemptDetails,
  getAttemptSummaryFromDb,
} from "../controllers/attemptController.js";

const router = express.Router();

router.get(
  "/:logId/encounters/:encounterName/attempts/:startTime",
  getAttemptDetails
);

router.get("/attempt-summary/:logId/:startTime", getAttemptSummaryFromDb);

export default router;
