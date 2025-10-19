// src/webSocket.js
import { generateTelemetry } from "./simulator.js";
import { getClusterState, simulateLoadSpike } from "./stateMachine.js";
import { appendLog } from "./utils/logger.js";


// 📊 Summarize live telemetry into dashboard metrics
function calculateDashboardMetrics(clusters) {
  // Current power draw (MW)
  const currentPowerDraw = clusters.reduce((sum, c) => sum + c.powerUsage, 0) / 1000;

  // Cooling efficiency (PUE)
  const totalPower = clusters.reduce((sum, c) => sum + c.powerUsage + c.cooling, 0);
  const itPower = clusters.reduce((sum, c) => sum + c.powerUsage, 0);
  const PUE = (totalPower / itPower).toFixed(2);

  // Energy savings vs baseline
  const baselinePower = 2.77; // MW (adjust this as your "normal" baseline)
  const energySavings = (((baselinePower - currentPowerDraw) / baselinePower) * 100).toFixed(1);
  const lastHourChange = (Math.random() * 5).toFixed(1); // Simulate delta

  // CO₂ offset
  const CO2_PER_MW_HOUR = 278;
  const co2Offset = (currentPowerDraw * CO2_PER_MW_HOUR).toFixed(0);
  const treesEquivalent = Math.round(co2Offset / 22);

  return {
    energy: { percent: energySavings, change: lastHourChange },
    co2: { kg: co2Offset, trees: treesEquivalent },
    power: { current: currentPowerDraw.toFixed(2), target: 1.94 },
    cooling: { pue: PUE, optimized: (Math.random() * 0.2).toFixed(2) },
  };
}


export function startTelemetry(wss) {
  console.log("📡 WebSocket server started");

  wss.on("connection", (ws) => {
    console.log("✅ Client connected");

    // Telemetry every 2s
    setInterval(() => {
      const allTelemetry = generateTelemetry(32);
      ws.send(JSON.stringify({ type: "telemetry", data: allTelemetry }));

      // Log telemetry
      appendLog("telemetry", allTelemetry);
    }, 2000);

    // Dashboard every 1 minute
    setInterval(() => {
      const allTelemetry = generateTelemetry(32);
      const dashboardData = calculateDashboardMetrics(allTelemetry);
      ws.send(JSON.stringify({ type: "dashboard", data: dashboardData }));

      // Log dashboard snapshot
      appendLog("dashboard", dashboardData);
    }, 60000);

    ws.on("message", (msg) => {
      const data = JSON.parse(msg);
      if (data.type === "ping") {
        ws.send(
          JSON.stringify({ type: "pong", time: new Date().toISOString() })
        );
      } else if (payload.type === "dashboard") {
        console.log("📈 Dashboard metrics:", payload.data);
      }
    });

    ws.on("close", () => {
      console.log("❌ Client disconnected");
      clearInterval(interval);
    });
  });
}
