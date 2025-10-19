// src/simulator.js

// �️ Cooling state tracker (simulates physical cooling system lag)
const coolingState = {
  A: { current: 50, target: 50, lastGpuLoad: 50 },
  B: { current: 35, target: 35, lastGpuLoad: 35 },
  C: { current: 50, target: 50, lastGpuLoad: 50 },
  D: { current: 35, target: 35, lastGpuLoad: 35 }
};

// �🏢 Generate a single GPU cluster (a group of 8 GPU nodes)
function generateCluster(clusterName, clusterIndex) {
  const now = new Date().toLocaleTimeString();
  
  // Each cluster has different characteristics
  const clusterProfiles = [
    { name: 'A', gpuBias: 20, location: 'Houston', workload: 'Training' },    // High load cluster
    { name: 'B', gpuBias: -15, location: 'Dallas', workload: 'Inference' },   // Low load cluster
    { name: 'C', gpuBias: 5, location: 'Austin', workload: 'Training' },      // Medium cluster
    { name: 'D', gpuBias: -20, location: 'Houston', workload: 'Development' } // Idle cluster
  ];
  
  const profile = clusterProfiles[clusterIndex] || clusterProfiles[0];
  const clusterCooling = coolingState[profile.name];
  
  // Generate 8 GPU nodes for this cluster
  const nodes = [];
  let totalGpu = 0;
  let totalCooling = 0;
  let totalPower = 0;
  
  for (let i = 0; i < 8; i++) {
    const nodeId = clusterIndex * 8 + i + 1; // Global node ID (1-32)
    const nodeLabel = `${profile.name}${i + 1}`; // e.g., A1, A2, ..., B1, B2, etc.
    
    // Each node in the cluster has similar but slightly varied stats
    const gpuLoad = Math.min(100, Math.max(0, 
      Math.floor(50 + profile.gpuBias + (Math.random() * 30 - 15))
    ));
    
    // 🌡️ REALISTIC COOLING CALCULATION
    // In real world: Cooling responds to GPU load, but with lag and inefficiency
    
    // Calculate what cooling SHOULD be (ideal with AI optimization)
    const idealCooling = gpuLoad + 5; // Need slightly more cooling than load (thermal headroom)
    
    // Traditional data centers over-cool by 15-30% (wasteful but "safe")
    const traditionalOverCooling = Math.random() > 0.7 ? 25 : 15; // Sometimes way over-cooled
    
    // AI optimization: Gradually adjust cooling toward ideal
    // But not instantly - physical systems have inertia
    let nodeCooling;
    if (Math.random() > 0.3) {
      // 70% of time: AI-optimized cooling (closer to ideal)
      nodeCooling = idealCooling + Math.floor(Math.random() * 10 - 5); // Within ±5% of ideal
    } else {
      // 30% of time: Still adjusting from over-cooling (system catching up)
      nodeCooling = gpuLoad + traditionalOverCooling;
    }
    
    nodeCooling = Math.min(100, Math.max(0, nodeCooling));
    
    const temperature = 20 + gpuLoad * 0.2 + (Math.random() * 4 - 2);
    const powerUsage = Math.round((gpuLoad * 1.5 + nodeCooling * 0.8) / 10);
    
    // 2% chance any individual node is offline
    const status = Math.random() < 0.02 ? "offline" : "online";
    
    nodes.push({
      id: nodeId,
      label: nodeLabel,
      clusterName: profile.name,
      gpuLoad: status === "offline" ? 0 : gpuLoad,
      cooling: status === "offline" ? 0 : nodeCooling,
      temperature: status === "offline" ? 0 : temperature,
      powerUsage: status === "offline" ? 0 : powerUsage,
      status
    });
    
    totalGpu += nodes[i].gpuLoad;
    totalCooling += nodes[i].cooling;
    totalPower += nodes[i].powerUsage;
  }
  
  // Cluster-level aggregated stats
  const avgGpu = Math.round(totalGpu / 8);
  const avgCooling = Math.round(totalCooling / 8);
  const clusterStatus = nodes.every(n => n.status === "offline") ? "offline" : "online";
  
  return {
    id: `cluster_${profile.name}`,
    name: `Cluster ${profile.name}`,
    location: profile.location,
    workload: profile.workload,
    status: clusterStatus,
    time: now,
    // Aggregate stats for the whole cluster
    gpuLoad: avgGpu,
    cooling: avgCooling,
    temperature: 20 + avgGpu * 0.2,
    powerUsage: totalPower,
    nodeCount: 8,
    activeNodes: nodes.filter(n => n.status === "online").length,
    // Individual node data
    nodes
  };
}

// 🧩 Generates telemetry for 4 main clusters (32 total GPU nodes)
export function generateTelemetry() {
  const clusters = [];
  for (let i = 0; i < 4; i++) {
    clusters.push(generateCluster(['A', 'B', 'C', 'D'][i], i));
  }
  return clusters;
}
