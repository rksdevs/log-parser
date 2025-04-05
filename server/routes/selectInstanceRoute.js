import express from "express";
// import { selectLogInstance } from "../controllers/selectInstanceController.js";
// import { selectRawLogInstance } from "../controllers/selectInstanceController.js";
import { selectLogInstance } from "../controllers/instanceSelect.js";

const router = express.Router();

// router.post("/:logId/select-instance", selectLogInstance);
router.post("/:logId/select-instance", selectLogInstance);

export default router;
