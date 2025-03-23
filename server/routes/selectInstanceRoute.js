import express from "express";
import { selectLogInstance } from "../controllers/selectInstanceController.js";

const router = express.Router();

router.post("/:logId/select-instance", selectLogInstance);

export default router;
