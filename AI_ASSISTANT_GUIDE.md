# AI Assistant Setup Guide

## Quick Start

### 1. Get API Keys

#### Gemini API Key (Required)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

#### ElevenLabs API Key (Required for voice)
1. Go to [ElevenLabs Settings](https://elevenlabs.io/app/settings/api-keys)
2. Sign up or log in
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key

### 2. Configure Environment

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your keys:
```env
GEMINI_API_KEY=AIzaSy...your_actual_key_here
ELEVENLABS_API_KEY=sk_...your_actual_key_here
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL  # Optional: Bella voice (default)
```

### 3. Test the Connection

Start the backend:
```bash
cd backend
node src/server.js
```

You should see:
```
🚀 Server running on port 8080
✅ AI Assistant: Gemini API configured
✅ AI Assistant: ElevenLabs TTS configured
📡 WebSocket server started
```

If you see ⚠️ warnings, check your API keys in `.env`.

## Using the AI Assistant

### In the UI

1. **Open the dashboard**: http://localhost:5173
2. **Wait for connection**: Green "Live Data Connected" badge appears
3. **Click the robot icon** 🤖 in the bottom-right corner
4. **Analyze**: Click "📊 Analyze Current Status"
5. **Ask questions**: Type in the question box or use quick questions

### Via WebSocket (Programmatic)

You can also interact with the AI directly via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  // Request analysis
  ws.send(JSON.stringify({
    type: 'ask_ai',
    withAudio: true  // Set to false to skip TTS
  }));
  
  // Or ask a specific question
  ws.send(JSON.stringify({
    type: 'ask_question',
    question: 'Why is power consumption high?',
    withAudio: true
  }));
};

ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  
  if (response.type === 'ai_response') {
    console.log('AI Analysis:', response.text);
    // response.audio contains base64 encoded MP3 (if withAudio: true)
  }
  
  if (response.type === 'ai_answer') {
    console.log('AI Answer:', response.answer);
    // response.audio contains base64 encoded MP3 (if withAudio: true)
  }
  
  if (response.type === 'ai_error') {
    console.error('AI Error:', response.error);
  }
};
```

## Customization

### Change the Voice

Browse [ElevenLabs Voice Library](https://elevenlabs.io/app/voice-library) and copy a voice ID:

```env
# Example: Use different voice
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM  # Rachel
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB  # Adam
```

### Disable TTS (Save Costs)

Edit `frontend/src/components/AIAssistant.tsx`:

```typescript
// Line ~75 and ~87: Change withAudio to false
ws.send(JSON.stringify({ 
  type: 'ask_ai',
  withAudio: false  // ← Change this
}));
```

### Adjust AI Prompts

Edit `backend/src/aiAssistant.js`:

- **Line ~16-35**: Modify the system prompt for `analyzeClusterData()`
- **Line ~86-105**: Modify the system prompt for `askQuestion()`

Example: Make the AI more technical:
```javascript
const systemPrompt = `You are ThermaMind, an AI assistant for data center optimization.
You are EXTREMELY technical and provide detailed explanations with metrics.
Use precise terminology. Reference specific GPU load percentages, power draw in MW, and cooling PUE values.
Current telemetry snapshot: ${JSON.stringify(telemetrySnapshot, null, 2)}`;
```

## Troubleshooting

### "AI Assistant: Gemini API not configured"
- Check that `GEMINI_API_KEY` is set in `backend/.env`
- Verify the key is valid at [Google AI Studio](https://aistudio.google.com/app/apikey)
- Restart the backend server after changing `.env`

### "AI Assistant: ElevenLabs API not configured"
- Check that `ELEVENLABS_API_KEY` is set in `backend/.env`
- Verify the key at [ElevenLabs Settings](https://elevenlabs.io/app/settings/api-keys)
- Note: Voice will still work without this, just no TTS audio

### AI button disabled/grayed out
- Ensure backend server is running: `node src/server.js`
- Check WebSocket connection in browser console
- Verify the frontend shows "Live Data Connected" badge

### Audio doesn't play
- Check browser console for audio playback errors
- Verify `ELEVENLABS_API_KEY` is correct
- Try clicking the page first (some browsers block auto-play)
- Check browser audio permissions

### "Rate limit exceeded" error
- Gemini free tier: 15 requests/minute
- ElevenLabs free tier: 10,000 characters/month
- Consider adding rate limiting to `aiAssistant.js`

## Cost Estimation

### Free Tier Limits
- **Gemini API**: 15 requests/minute, 1500 requests/day (free)
- **ElevenLabs**: 10,000 characters/month (free tier)

### Typical Usage
- Analysis request: ~500 characters → $0.005 TTS cost
- Question answer: ~300 characters → $0.003 TTS cost
- 20 interactions/day = ~$0.15/day = $4.50/month

**Recommendation**: The free tiers are generous enough for development and demos. For production, consider batch analysis or caching common questions.

## Advanced Features

### Add More AI Capabilities

You can extend `aiAssistant.js` to add:
- **Anomaly detection**: Compare current metrics to historical patterns
- **Predictive alerts**: Warn before issues occur
- **Optimization suggestions**: Recommend workload redistribution
- **Natural language queries**: "Show me GPU usage for the last hour"

### Multi-language Support

ElevenLabs supports multiple languages. Add language detection:
```javascript
// In aiAssistant.js
const language = detectLanguage(question); // Implement this
const voice = language === 'es' ? 'spanish_voice_id' : defaultVoice;
```

### Integrate with Other Services

The same pattern can be used with:
- **OpenAI GPT-4** instead of Gemini
- **Azure Speech Services** instead of ElevenLabs
- **Local LLMs** (Ollama, llama.cpp) for privacy
- **AWS Polly** for cheaper TTS

Just modify the API calls in `aiAssistant.js`.