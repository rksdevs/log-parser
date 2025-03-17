import express from "express";
import { getEncounterDetails } from "../controllers/encounterController.js";

const router = express.Router();

router.get("/:logId/encounters/:encounterName", getEncounterDetails);

export default router;
