import express from "express";
import { getSpellAcrossPlayers } from "../controllers/spellController.js";

const router = express.Router();

router.get(
  "/:logId/encounters/:encounterName/spells/:spellId",
  getSpellAcrossPlayers
);

export default router;
