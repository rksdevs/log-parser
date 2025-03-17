import express from "express";
import { getAttemptDetails } from "../controllers/attemptController.js";

const router = express.Router();

router.get(
  "/:logId/encounters/:encounterName/attempts/:startTime",
  getAttemptDetails
);

export default router;
