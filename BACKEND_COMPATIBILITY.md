# Backend Compatibility Checklist for ThermaMind Frontend

## Critical Requirements (Frontend WILL break without these)

### ✅ WebSocket Endpoint
- [ ] **WebSocket server running at `/ws`**
- [ ] Accepts WebSocket connections (upgrade from HTTP)
- [ ] No authentication required (or frontend updated with auth logic)

### ✅ WebSocket Message Format
Messages MUST match this exact structure:

```json
{
  "type": "telemetry",
  "payload": {
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
        {
          "label": "GPU Utilization %",
          "data": [60.1, 62.3, ...]
        },
        {
          "label": "Cooling Power %",
          "data": [72.0, 70.5, ...]
        },
        {
          "label": "Energy Savings %",
          "data": [25.3, 26.2, ...]
        }
      ]
    },
    "clusters": [
      {
        "name": "Cluster A",
        "status": "active",
        "gpu": 87,
        "cooling": 82,
        "power": 456
      }
    ],
    "nodes": [
      {
        "id": 1,
        "label": "Cluster A • Node 1",
        "state": "active"
      }
    ]
  }
}
```

**Critical Field Names** (case-sensitive!):
- `type` must equal `"telemetry"`
- `payload` object contains all data
- `stats.energySavings` (camelCase, not snake_case)
- `stats.co2OffsetKg`
- `stats.powerDrawMW`
- `stats.coolingPUE`
- `clusters[].status` must be one of: `"active"`, `"idle"`, `"optimizing"`
- `nodes[].state` must be one of: `"active"`, `"hot"`, `"idle"`

---

## Data Requirements

### Stats Object
```typescript
{
  energySavings: number,      // 0-100 (percentage)
  co2OffsetKg: number,        // integer (kg of CO2)
  powerDrawMW: number,        // float (megawatts)
  coolingPUE: number          // float (1.0 - 3.0 typically)
}
```

### Chart Object
```typescript
{
  labels: string[],           // Array of 20 time labels (e.g., "0m", "1m", ...)
  datasets: [
    {
      label: string,          // "GPU Utilization %", "Cooling Power %", "Energy Savings %"
      data: number[]          // Array of 20 numbers matching labels
    }
  ]
}
```
**Note**: Frontend expects exactly 3 datasets in this order:
1. GPU Utilization %
2. Cooling Power %
3. Energy Savings %

### Clusters Array
```typescript
[
  {
    name: string,             // "Cluster A", "Cluster B", etc.
    status: "active" | "idle" | "optimizing",
    gpu: number,              // 0-100 (percentage)
    cooling: number,          // 0-100 (percentage)
    power: number             // integer (kilowatts)
  }
]
```
**Expected**: 7 clusters (but frontend will render any number)

### Nodes Array
```typescript
[
  {
    id: number,               // 1-32 (or any unique identifier)
    label: string,            // "Cluster A • Node 1"
    state: "active" | "hot" | "idle"
  }
]
```
**Expected**: 32 nodes (frontend will render any number)

---

## Common Breaking Issues

### ❌ Wrong Message Structure
```json
// WRONG - no "type" and "payload" wrapper
{
  "stats": { ... },
  "clusters": [ ... ]
}

// CORRECT
{
  "type": "telemetry",
  "payload": {
    "stats": { ... },
    "clusters": [ ... ]
  }
}
```

### ❌ Snake Case Instead of Camel Case
```json
// WRONG
{
  "energy_savings": 32.4,
  "co2_offset_kg": 847,
  "power_draw_mw": 2.34
}

// CORRECT
{
  "energySavings": 32.4,
  "co2OffsetKg": 847,
  "powerDrawMW": 2.34
}
```

### ❌ Missing Required Fields
Frontend will show zeros or errors if these are missing:
- `payload.stats`
- `payload.clusters`
- `payload.nodes`
- `payload.chart`

### ❌ Wrong Enum Values
```json
// WRONG
{ "status": "running" }  // not recognized
{ "state": "busy" }      // not recognized

// CORRECT
{ "status": "active" }   // or "idle" or "optimizing"
{ "state": "hot" }       // or "active" or "idle"
```

---

## Optional (Won't Break Frontend, But Nice to Have)

### REST Endpoint (Fallback)
- `GET /telemetry` - Returns same payload structure
- Used for initial snapshot or if WebSocket fails

### CORS Headers
If backend is on different port/domain:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## Frontend Configuration

### WebSocket URL
Current default in `frontend/src/App.tsx`:
```typescript
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
```

To change the backend URL:

**Option 1**: Set environment variable
```bash
# Create frontend/.env
VITE_WS_URL=ws://your-backend-host:port/ws
```

**Option 2**: Edit `frontend/src/App.tsx` directly
```typescript
const WS_URL = 'ws://new-backend.com:3000/ws';
```

---

## Testing the New Backend

### Quick Test Script
```bash
# Test WebSocket connection
npm install -g wscat
wscat -c ws://localhost:8080/ws

# Should receive messages like:
# { "type": "telemetry", "payload": { ... } }
```

### Test with Frontend
1. Update frontend WS_URL if needed
2. Start new backend
3. Start frontend: `cd frontend && npm run dev`
4. Open browser console (F12)
5. Look for:
   - ✅ "WebSocket connected" log
   - ✅ No parsing errors
   - ✅ Dashboard updates with data
6. Check header for green "Live Data Connected" badge

### Validate Payload Structure
```javascript
// Paste this in browser console after connecting
// Should see no errors if structure is correct
const payload = telemetry; // from React DevTools or console log
console.assert(payload.stats.energySavings !== undefined, "Missing energySavings");
console.assert(payload.stats.co2OffsetKg !== undefined, "Missing co2OffsetKg");
console.assert(payload.stats.powerDrawMW !== undefined, "Missing powerDrawMW");
console.assert(payload.stats.coolingPUE !== undefined, "Missing coolingPUE");
console.assert(Array.isArray(payload.clusters), "Clusters not an array");
console.assert(Array.isArray(payload.nodes), "Nodes not an array");
console.assert(payload.chart.labels.length > 0, "Chart labels empty");
console.assert(payload.chart.datasets.length === 3, "Expected 3 chart datasets");
```

---

## Migration Steps

1. **Verify new backend implements WebSocket at `/ws`**
2. **Test message format** using wscat or browser console
3. **Check field names** (camelCase, not snake_case)
4. **Verify enum values** (status, state fields)
5. **Update frontend WS_URL** if backend is on different port
6. **Test connection** in browser
7. **Monitor browser console** for errors
8. **Verify dashboard updates** every 3 seconds

---

## Quick Fix if Backend Uses Different Format

If your friend's backend uses snake_case or different structure, you can add a **data adapter** in the frontend:

**Edit `frontend/src/hooks/useTelemetry.ts`**:
```typescript
ws.onmessage = (event) => {
  if (isCleanedUp) return;
  try {
    const message = JSON.parse(event.data);
    
    // Add adapter here if needed
    const adapted = adaptPayload(message);
    
    if (adapted.type === 'telemetry' && adapted.payload) {
      setTelemetry(adapted.payload);
    }
  } catch (e) {
    console.error('Failed to parse telemetry message', e);
  }
};

// Adapter function
function adaptPayload(raw: any) {
  // Example: convert snake_case to camelCase
  return {
    type: raw.type || 'telemetry',
    payload: {
      timestamp: raw.timestamp || Date.now(),
      stats: {
        energySavings: raw.stats?.energy_savings ?? raw.stats?.energySavings ?? 0,
        co2OffsetKg: raw.stats?.co2_offset_kg ?? raw.stats?.co2OffsetKg ?? 0,
        powerDrawMW: raw.stats?.power_draw_mw ?? raw.stats?.powerDrawMW ?? 0,
        coolingPUE: raw.stats?.cooling_pue ?? raw.stats?.coolingPUE ?? 1.0,
      },
      // ... map other fields
    }
  };
}
```

---

## Summary

**Will the frontend break?**
- ✅ **NO** - if new backend matches the exact message format above
- ⚠️ **MAYBE** - if field names are slightly different (easy to fix with adapter)
- ❌ **YES** - if WebSocket endpoint is missing or message structure is completely different

**Fastest way to check**: Run `wscat -c ws://new-backend/ws` and compare output to the JSON structure in this document.
