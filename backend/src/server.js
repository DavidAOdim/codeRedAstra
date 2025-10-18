// src/server.js
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { startTelemetry } from "./webSocket.js";
import simulateRouter from "./routes/simulate.js";
import optimizeRouter from "./routes/optimize.js";
import dashboardRouter from "./routes/dashboard.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use("/api/simulate-load-spike", simulateRouter);
app.use("/api/optimize", optimizeRouter);
app.use("/api/dashboard", dashboardRouter);


const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Create **one** WebSocket server attached to the same port
const wss = new WebSocketServer({ server });

// Start the telemetry broadcaster once
startTelemetry(wss);
