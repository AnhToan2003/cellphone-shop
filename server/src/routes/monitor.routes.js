import { Router } from "express";

import {
  addActivityLog,
  clearActivityLogs,
  getActivityLogs,
} from "../services/activityMonitor.service.js";

const router = Router();

router.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Methods",
    "GET,POST,DELETE,OPTIONS"
  );
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, x-activity-ingest"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
});

router.get("/activity", (req, res) => {
  res.json({ success: true, data: getActivityLogs() });
});

router.post("/activity", (req, res) => {
  addActivityLog(req.body);
  res.json({ success: true });
});

router.delete("/activity", (req, res) => {
  clearActivityLogs();
  res.json({ success: true });
});

export default router;
