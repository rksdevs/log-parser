import express from "express";
import {
  getPlayerSpells,
  getPlayerSpellsFromAttempt,
  getPlayerSpellsFromLog,
} from "../controllers/playerController.js";

const router = express.Router();

router.get(
  "/:logId/encounters/:encounterName/attempts/:startTime/players/:playerName",
  getPlayerSpells
);
router.get("/:logId/player/:playerName/spells", getPlayerSpellsFromLog);

// router.get(
//   "/:logId/attempts/:startTime/player/:playerName",
//   getPlayerSpellsFromAttempt
// );
console.log("✅ Loaded playerRoutes");
router.get("/:logId/:startTime/player/:playerName", getPlayerSpellsFromAttempt);

export default router;
