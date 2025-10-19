# Code Red Astra - ThermaMind Setup Guide

## Project Overview

**ThermaMind** is a real-time telemetry dashboard for data center operators to monitor and optimize GPU cluster energy efficiency, cooling, and workload management.

### Business Context

- **Product**: AI-powered data center operations dashboard
- **Target Users**:
  - Data Center Operators (monitor conditions, validate AI suggestions)
  - Site Reliability Engineers (track metrics, trigger mitigations)
  - Sustainability/Capacity Planners (energy savings, CO₂ tracking)
  - ML/Training Teams (GPU availability monitoring)

- **Value Proposition**:
  - Reduce energy costs through dynamic cooling/workload optimization
  - Improve reliability by surfacing hotspots and predicted load spikes
  - Track sustainability metrics (CO₂ offset, PUE)
  - AI-driven recommendations with explainable actions

### Architecture

```
Frontend (React + Vite + Tailwind CSS)
    ↓ WebSocket (ws://localhost:8080/ws)
Backend (Node.js + Express + ws)
    ↓ Persists to
Data (JSONL file: backend/data/telemetry.jsonl)
```

## Quick Start

### Prerequisites
- Node.js (v18+)
- npm

### 1. Start the Backend

```powershell
cd backend
npm install
npm start
```

Backend runs on **http://localhost:8080**

Endpoints:
- `GET /telemetry` - Current snapshot
- `GET /clusters` - List of clusters
- `GET /history?limit=20&since=timestamp` - Historical snapshots
- `ws://localhost:8080/ws` - WebSocket stream (pushes every 3s)

### 2. Start the Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5174** (or 5173 if available)

### 3. Open the Dashboard

Open your browser to the URL shown in the terminal (usually http://localhost:5174)

You should see:
- **Connection Status** indicator in the header (green "Live Data Connected")
- Real-time updating metrics (Energy Savings, CO₂ Offset, Power Draw, PUE)
- Live chart showing GPU Utilization, Cooling Power, and Energy Savings trends
- GPU node grid (32 nodes with active/hot/idle states)
- Cluster list with real-time metrics
- AI recommendations panel
- Voice assistant (click the robot button in bottom-right)

## How It Works

### Frontend
- Built with React + TypeScript + Vite
- Tailwind CSS v4 for styling
- Chart.js for real-time graphs
- Custom `useTelemetry` hook connects to backend WebSocket
- Automatically reconnects with exponential backoff if connection drops

### Backend
- Express server with CORS enabled
- WebSocket server (using `ws` library)
- Generates mock telemetry data every 3 seconds
- Persists all snapshots to `backend/data/telemetry.jsonl` for replay/analysis

### Data Persistence
- All telemetry snapshots are appended to `backend/data/telemetry.jsonl`
- Each line is a complete JSON snapshot
- Use for:
  - Demo replay
  - Historical analysis
  - Testing forecasting models
  - Debugging sessions

### Data Shape

```json
{
  "timestamp": 1729280123456,
  "stats": {
    "energySavings": 32.4,
    "co2OffsetKg": 847,
    "powerDrawMW": 2.34,
    "coolingPUE": 1.42
  },
  "chart": {
    "labels": ["0m", "1m", "2m", ...],
    "datasets": [
      { "label": "GPU Utilization %", "data": [60.1, 62.3, ...] },
      { "label": "Cooling Power %", "data": [72.0, 70.5, ...] },
      { "label": "Energy Savings %", "data": [25.3, 26.2, ...] }
    ]
  },
  "clusters": [
    { "name": "Cluster A", "status": "active", "gpu": 87, "cooling": 82, "power": 456 },
    ...
  ],
  "nodes": [
    { "id": 1, "label": "Cluster A • Node 1", "state": "active" },
    ...
  ]
}
```

## Configuration

### Frontend WebSocket URL
Edit `frontend/src/App.tsx` or set environment variable:
```typescript
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
```

### Backend Port
Set environment variable:
```powershell
$env:PORT = "3000"; npm start
```

## Troubleshooting

### Frontend shows "Disconnected" or "Connection Error"
- Ensure backend is running on port 8080
- Check browser console for WebSocket errors
- Verify no firewall blocking WebSocket connections

### PostCSS errors
- Fixed: Tailwind CSS v4 uses Vite plugin, not PostCSS plugin
- PostCSS configs now only include `autoprefixer`

### Port already in use
- Backend: Change `PORT` environment variable
- Frontend: Vite will automatically try next available port (5174, 5175, etc.)

## Next Steps for Production

- Add authentication (JWT tokens for WebSocket upgrade)
- Implement user/tenant isolation
- Add Redis pub/sub for horizontal scaling
- Use proper time-series database (InfluxDB, TimescaleDB)
- Add rate limiting and backpressure handling
- Implement delta updates (only send changed data)
- Add TLS/SSL for WebSocket connections
- Implement proper error boundaries in React
- Add unit tests for telemetry generator
- Add Dockerfile for containerization

## Real-World Use Case

In a production environment, companies would:
1. **Replace mock generator** with real telemetry ingestion (SNMP, APIs from cooling/power systems, GPU metrics)
2. **Use message bus** (Kafka/NATS) to distribute telemetry to multiple consumers
3. **Add ML/AI layer** for predictive analytics and optimization recommendations
4. **Integrate with DCIM** (Data Center Infrastructure Management) systems
5. **Add alerting** (PagerDuty, Slack) for critical thresholds
6. **Implement audit logging** for all optimization actions

## Files Structure

```
codeRedAstra/
├── backend/
│   ├── index.js              # Express + WebSocket server
│   ├── package.json
│   ├── data/
│   │   └── telemetry.jsonl   # Persisted snapshots
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main dashboard UI
│   │   ├── hooks/
│   │   │   └── useTelemetry.ts  # WebSocket hook
│   │   ├── App.css
│   │   └── index.css         # Tailwind styles
│   ├── package.json
│   └── vite.config.ts        # Vite + Tailwind v4
└── SETUP.md                  # This file
```

## Demo Script

1. Start both servers
2. Open dashboard in browser
3. Watch real-time updates (every 3 seconds)
4. Click AI assistant button (bottom-right robot icon)
5. Click "Explain Current Status" to hear voice summary
6. Click "Optimize" to simulate optimization cycle
7. Watch cluster metrics and GPU grid update live
8. Check `backend/data/telemetry.jsonl` to see persisted data

## Questions?

This is a hackathon-ready prototype demonstrating:
- Real-time WebSocket streaming
- Modern React patterns (hooks, TypeScript)
- Tailwind CSS v4
- Simple persistence (JSONL)
- Production-ready architecture patterns (at prototype scale)

For production scaling, see "Next Steps for Production" above.
