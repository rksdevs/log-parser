import express from "express";
import { getPlayerSpells } from "../controllers/playerController.js";

const router = express.Router();

router.get(
  "/:logId/encounters/:encounterName/attempts/:startTime/players/:playerName",
  getPlayerSpells
);

export default router;
