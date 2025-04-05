import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import { createServer } from "http";
import Redis from "ioredis";
import getPresignedUrl from "./routes/uploadToBBRoute.js";
import uploadMetadata from "./routes/logsMetadataRoute.js";
import getLogs from "./routes/logsRetrieveRoute.js";
import logStatusRoutes from "./routes/logRoutes.js";
import encounterRoutes from "./routes/encountersRoute.js";
import attemptRoutes from "./routes/attemptsRoute.js";
import playerRoutes from "./routes/playersRoute.js";
import spellRoutes from "./routes/spellsRoute.js";
import selectInstance from "./routes/selectInstanceRoute.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
  },
  // pingInterval: 25000, // ✅ Keep WebSocket connection alive longer
  // pingTimeout: 60000, // ✅ Allow 60 seconds before disconnecting inactive clients
});

// Store io instance for access in other files (e.g., workers)
app.set("socketio", io);

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
  })
);
app.use(express.json());
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("This is base route");
});

//Routes
app.use("/api", getPresignedUrl);
app.use("/api/upload-logs", uploadMetadata);
app.get("/api/logs/full-timeline", (req, res) => {
  const filePath = path.join(
    __dirname,
    "./logs/timelines/timeline-292-attempt-2025-02-19_17_46_35.json"
  );
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "File read failed" });
    res.json(JSON.parse(data));
  });
});
// app.get("/api/logs/full-timeline", (req, res) => {
//   const filePath = path.join(__dirname, "./logs/timelines/timeline-full.json");
//   fs.readFile(filePath, "utf8", (err, data) => {
//     if (err) return res.status(500).json({ error: "File read failed" });
//     res.json(JSON.parse(data));
//   });
// });
app.use("/api/logs", getLogs);
app.use("/api/logs", logStatusRoutes);
app.use("/api/logs", attemptRoutes);
app.use("/api/logs", playerRoutes);
app.use("/api/logs", spellRoutes);
app.use("/api/logs", encounterRoutes);
app.use("/api/logs", selectInstance);

const port = process.env.PORT || 8800;
if (process.env.WORKER !== "true") {
  server.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}

const redisSubscriber = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

redisSubscriber.psubscribe("log:*", (err, count) => {
  if (err) {
    console.error("Failed to subscribe to Redis:", err);
  } else {
    console.log(`Subscribed to ${count} Redis channels`);
  }
});

redisSubscriber.on("pmessage", (pattern, channel, message) => {
  if (channel.startsWith("log:")) {
    const data = JSON.parse(message);
    console.log(`📢 WebSocket Event Received from Redis: ${channel}`, data);
    io.emit(channel, data); // ✅ Broadcast to all WebSocket clients
  }
});

// ✅ Log WebSocket Events for Debugging
io.on("connection", (socket) => {
  console.log(`New WebSocket connection: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  socket.onAny((event, ...args) => {
    console.log(`WebSocket Event: ${event}`, args);
  });
});

export { app, io };
