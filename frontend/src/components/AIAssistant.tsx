// frontend/src/components/AIAssistant.tsx
import { useState, useRef, useEffect } from 'react';

type AIAssistantProps = {
  ws: WebSocket | null;
  connectionStatus: string;
};

export function AIAssistant({ ws, connectionStatus }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [question, setQuestion] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        
        if (msg.type === 'ai_response' || msg.type === 'ai_answer') {
          setResponse(msg.text || msg.answer);
          setIsAnalyzing(false);
          
          // Play audio if available
          if (msg.audio && audioRef.current) {
            const audioBlob = base64ToBlob(msg.audio, 'audio/mpeg');
            const audioUrl = URL.createObjectURL(audioBlob);
            audioRef.current.src = audioUrl;
            audioRef.current.play();
            setIsPlaying(true);
          }
        }
        
        if (msg.type === 'ai_error') {
          setResponse('❌ Error: ' + msg.error);
          setIsAnalyzing(false);
          setIsPlaying(false);
        }
      } catch (e) {
        console.error('Failed to parse AI message:', e);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const analyzeNow = () => {
    if (!ws || connectionStatus !== 'connected') return;
    
    setIsAnalyzing(true);
    setResponse('');
    ws.send(JSON.stringify({ 
      type: 'ask_ai',
      withAudio: true // Enable TTS
    }));
  };

  const askAI = () => {
    if (!ws || connectionStatus !== 'connected' || !question.trim()) return;
    
    setIsAnalyzing(true);
    setResponse('');
    ws.send(JSON.stringify({ 
      type: 'ask_question',
      question: question.trim(),
      withAudio: true
    }));
    setQuestion('');
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={connectionStatus !== 'connected'}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-slate-800 border-2 border-cyan-400' 
            : 'bg-gradient-to-br from-cyan-400 to-emerald-400 hover:scale-110'
        } ${connectionStatus !== 'connected' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? (
          <span className="text-2xl">✕</span>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <span className="text-2xl">🤖</span>
            {isPlaying && <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 tm-pulse mt-1" />}
          </div>
        )}
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 tm-glass border border-cyan-400/30 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧠</span>
              <div className="flex-1">
                <div className="font-semibold">ThermaMind AI Assistant</div>
                <div className="text-xs text-slate-400">Powered by Gemini + ElevenLabs</div>
              </div>
              {isPlaying && (
                <div className="tm-badge tm-badge-green text-xs">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 tm-pulse" />
                  Speaking
                </div>
              )}
            </div>
          </div>

          <div className="p-4 max-h-[400px] overflow-y-auto">
            {/* Quick Analysis Button */}
            <button
              onClick={analyzeNow}
              disabled={isAnalyzing}
              className="w-full px-4 py-3 mb-4 rounded-lg font-semibold bg-gradient-to-br from-cyan-400 to-emerald-400 text-slate-900 disabled:opacity-50 hover:shadow-lg transition"
            >
              {isAnalyzing ? '🔄 Analyzing...' : '📊 Analyze Current Status'}
            </button>

            {/* Response Display */}
            {response && (
              <div className="mb-4 p-4 bg-slate-900/50 rounded-lg border border-cyan-400/20">
                <div className="text-sm leading-relaxed whitespace-pre-line">{response}</div>
              </div>
            )}

            {/* Ask Question */}
            <div className="mt-4 pt-4 border-t border-cyan-400/20">
              <div className="text-xs font-semibold text-slate-400 mb-2">Ask a Question</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && askAI()}
                  placeholder="e.g., Why is power high?"
                  disabled={isAnalyzing}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-900/50 border border-cyan-400/30 text-sm focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={askAI}
                  disabled={isAnalyzing || !question.trim()}
                  className="px-4 py-2 rounded-lg bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400/30 disabled:opacity-50 transition"
                >
                  Ask
                </button>
              </div>
            </div>

            {/* Example Questions */}
            <div className="mt-3 space-y-1">
              <div className="text-xs text-slate-500 mb-1">Quick questions:</div>
              {[
                'Which cluster should I run my next job on?',
                'Why is my power consumption high?',
                'Are there any efficiency issues?'
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setQuestion(q)}
                  className="w-full text-left text-xs px-2 py-1.5 rounded bg-slate-800/50 hover:bg-slate-800 text-slate-300 transition"
                >
                  💬 {q}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Player (hidden) */}
          <audio 
            ref={audioRef}
            onEnded={() => setIsPlaying(false)}
            onError={() => setIsPlaying(false)}
          />
        </div>
      )}
    </>
  );
}
