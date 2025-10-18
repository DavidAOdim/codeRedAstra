// src/simulator.js

function generateSingleTelemetry(id) {
  const now = new Date().toLocaleTimeString();

  // 1️⃣ Baseline profile per cluster (some hotter or cooler)
  const baseline = {
    gpuBias: Math.random() * 20 - 10, // some clusters naturally run higher/lower load
    tempBias: Math.random() * 4 - 2, // temperature variance per cluster
  };

  // 2️⃣ Generate dynamic values based on bias
  const gpuLoad = Math.min(
    100,
    Math.max(0, Math.floor(50 + baseline.gpuBias + Math.random() * 40))
  );
  const cooling = gpuLoad + Math.floor(Math.random() * 10 - 5);
  const temperature = 20 + gpuLoad * 0.2 + baseline.tempBias;

  // 3️⃣ Add metadata (locations + fault chance)
  const locations = ["Houston", "Dallas", "Austin"];
  const location = locations[Math.floor(Math.random() * locations.length)];
  const status = Math.random() < 0.05 ? "offline" : "online"; // 5% chance offline

  // 4️⃣ If offline, drop metrics to zero
  const safeGpu = status === "offline" ? 0 : gpuLoad;
  const safeCooling = status === "offline" ? 0 : cooling;
  const safeTemp = status === "offline" ? 0 : temperature;

  return {
    id,
    location,
    status,
    time: now,
    gpuLoad: safeGpu,
    cooling: safeCooling,
    temperature: safeTemp,
    powerUsage: Math.round((safeGpu * 1.5 + safeCooling * 0.8) / 10),
  };
}

// 🧩 Generates telemetry for N clusters (default = 32)
export function generateTelemetry(numClusters = 32) {
  const clusters = [];
  for (let i = 1; i <= numClusters; i++) {
    clusters.push(generateSingleTelemetry(`cluster_${i}`));
  }
  return clusters;
}
