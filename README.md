# ThermaMind - AI-Powered Data Center Optimization

A real-time GPU cluster monitoring and optimization platform with integrated AI assistant.

## Features

### 🖥️ Real-Time Monitoring
- **32 GPU Nodes** organized into 4 physical clusters (A, B, C, D)
- **Live WebSocket** connection updating every 2 seconds
- **Heatmap visualization** showing GPU load, temperature, and cooling efficiency
- **Time-series charts** tracking energy usage, cooling efficiency, and workload distribution

### 🧊 Intelligent Cooling System
- **AI-optimized cooling**: 70% of nodes use predictive cooling (GPU load + 5%)
- **Legacy systems**: 30% of nodes still catching up from over-cooling issues
- **Dynamic status indicators**: Active, Idle, or Optimizing based on real metrics

### 🤖 AI Assistant (Gemini + ElevenLabs)
- **Real-time analysis**: Ask the AI to analyze current cluster status
- **Question answering**: Get insights about power consumption, efficiency issues, and workload recommendations
- **Text-to-Speech**: AI responses are spoken using ElevenLabs voice synthesis
- **Context-aware**: The AI has access to live telemetry data, not canned responses

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- [Gemini API Key](https://aistudio.google.com/app/apikey) (for AI assistant)
- [ElevenLabs API Key](https://elevenlabs.io/app/settings/api-keys) (for voice synthesis)

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd codeRedAstra
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Configure environment variables:
```bash
# Copy the example file
cd ../backend
cp .env.example .env

# Edit .env and add your API keys:
# GEMINI_API_KEY=your_key_here
# ELEVENLABS_API_KEY=your_key_here
```

### Running the Application

1. Start the backend server:
```bash
cd backend
node src/server.js
```
The backend will run on `http://localhost:8080`

2. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

3. Open your browser to `http://localhost:5173`

## AI Assistant Usage

### Analyzing Current Status
1. Click the 🤖 floating button in the bottom-right corner
2. Click "📊 Analyze Current Status"
3. Wait for the AI to analyze real-time telemetry
4. Read or listen to the AI's insights

### Asking Questions
Example questions you can ask:
- "Which cluster should I run my next job on?"
- "Why is my power consumption high?"
- "Are there any efficiency issues?"
- "What's happening with Cluster C?"
- "Should I be worried about the cooling on Cluster A?"

### API Costs
- **Gemini API**: ~$0.001-0.005 per request (flash model)
- **ElevenLabs TTS**: ~$0.01 per 1000 characters (~$0.005 per response)
- Total: ~$0.006-0.015 per AI interaction with voice

**Note**: You can disable TTS by removing `withAudio: true` from the WebSocket messages in `AIAssistant.tsx` to reduce costs.

## Architecture

### Backend (`/backend`)
- **Express server**: REST API and static file serving
- **WebSocket server**: Real-time telemetry broadcast (2-second intervals)
- **Simulator**: Generates realistic GPU workload and cooling data
- **AI Assistant**: Gemini integration for telemetry analysis

### Frontend (`/frontend`)
- **React + TypeScript**: Modern component-based UI
- **Chart.js**: Time-series visualization
- **TailwindCSS**: Responsive styling
- **WebSocket hook**: Real-time data connection

### Data Flow
```
Simulator → WebSocket Server → Frontend Components
              ↓
         AI Assistant (on demand)
              ↓
         Gemini API → ElevenLabs TTS
```

## Project Structure
```
backend/
  src/
    server.js          # Express + WebSocket server
    simulator.js       # GPU telemetry generator
    webSocket.js       # WebSocket handlers
    aiAssistant.js     # Gemini + ElevenLabs integration
    
frontend/
  src/
    App.tsx            # Main dashboard
    hooks/
      useTelemetry.ts  # WebSocket connection hook
    components/
      AIAssistant.tsx  # AI chat interface
```

## License
MIT