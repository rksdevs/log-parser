import express from "express";
import {
  getLogStatusPostgres,
  getLogStatusRedis,
} from "../controllers/logStatusController.js";

const router = express.Router();

router.get("/redis/status/:logId", getLogStatusRedis);
router.get("/postgres/status/:logId", getLogStatusPostgres);

export default router;
