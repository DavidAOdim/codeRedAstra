let clusterState = {
  loadMultiplier: 1,
  status: "normal",
};

export function simulateLoadSpike() {
  clusterState.loadMultiplier = 1.5;
  clusterState.status = "spike";
  setTimeout(() => {
    clusterState.loadMultiplier = 1;
    clusterState.status = "normal";
  }, 10000); // reset after 10s
}

export function getClusterState() {
  return clusterState;
}
