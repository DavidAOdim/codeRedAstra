import { useEffect, useMemo, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useTelemetry } from './hooks/useTelemetry';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

type Cluster = { name: string; status: 'active' | 'idle' | 'optimizing'; gpu: number; cooling: number; power: number };

function Header({ connectionStatus }: { connectionStatus: string }) {
  const statusColors = {
    connected: 'bg-emerald-400',
    connecting: 'bg-amber-400',
    disconnected: 'bg-red-400',
    error: 'bg-red-500',
  };
  const statusLabels = {
    connected: 'Live Data Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
    error: 'Connection Error',
  };
  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 border-b border-cyan-400/50 backdrop-blur">
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold bg-gradient-to-br from-cyan-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-2">
          <span>🧊</span> ThermaMind
        </div>
        <div className="flex gap-3 items-center">
          <div className={`tm-badge ${connectionStatus === 'connected' ? 'tm-badge-green' : connectionStatus === 'connecting' ? 'bg-amber-400/20 text-amber-300' : 'bg-red-400/20 text-red-300'}`}>
            <span className={`inline-block h-2 w-2 rounded-full ${statusColors[connectionStatus as keyof typeof statusColors] || 'bg-slate-400'} ${connectionStatus === 'connected' || connectionStatus === 'connecting' ? 'tm-pulse' : ''}`} />
            {statusLabels[connectionStatus as keyof typeof statusLabels] || 'Unknown'}
          </div>
          <div className="tm-badge tm-badge-green">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 tm-pulse" />
            AI Optimization Active
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroStats({ stats }: { stats: { energySavings: number; co2OffsetKg: number; powerDrawMW: number; coolingPUE: number } | null }) {
  const card = 'tm-glass p-6 hover:translate-y-[-2px] transition-transform border-cyan-400/30 hover:border-cyan-400/60';
  const energySavings = stats?.energySavings ?? 0;
  const co2Offset = stats?.co2OffsetKg ?? 0;
  const powerDraw = stats?.powerDrawMW ?? 0;
  const coolingPUE = stats?.coolingPUE ?? 0;
  return (
    <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-6">
      <div className={card}>
        <div className="uppercase tracking-wider text-slate-400 text-xs">Energy Savings</div>
        <div className="text-4xl font-bold bg-gradient-to-br from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          <span id="energySavings">{energySavings.toFixed(1)}</span>%
        </div>
        <div className="text-emerald-400 text-sm">↑ <span id="savingsChange">4.2</span>% from last hour</div>
      </div>
      <div className={card}>
        <div className="uppercase tracking-wider text-slate-400 text-xs">CO₂ Offset Today</div>
        <div className="text-4xl font-bold text-emerald-400">
          <span id="co2Offset">{co2Offset}</span>
          <span className="text-lg"> kg</span>
        </div>
        <div className="text-emerald-400 text-sm">Equivalent to <span id="treesPlanted">{Math.round(co2Offset / 22)}</span> trees</div>
      </div>
      <div className={card}>
        <div className="uppercase tracking-wider text-slate-400 text-xs">Current Power Draw</div>
        <div className="text-4xl font-bold text-cyan-400">
          <span id="powerDraw">{powerDraw.toFixed(2)}</span>
          <span className="text-lg"> MW</span>
        </div>
        <div className="text-amber-400 text-sm"><span id="powerTarget">Target: {(powerDraw * 0.9).toFixed(2)} MW</span></div>
      </div>
      <div className={card}>
        <div className="uppercase tracking-wider text-slate-400 text-xs">Cooling Efficiency</div>
        <div className="text-4xl font-bold text-amber-400">
          <span id="coolingEff">{coolingPUE.toFixed(2)}</span>
          <span className="text-lg"> PUE</span>
        </div>
        <div className="text-emerald-400 text-sm">↓ 0.18 optimized by AI</div>
      </div>
    </section>
  );
}

function AiInsights() {
  return (
    <section className="tm-glass p-6 border border-indigo-400/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 mb-6 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold flex items-center gap-2">🤖 AI Recommendations <span className="tm-badge tm-ai text-xs font-semibold">Powered by Gemini</span></div>
      </div>
      <div className="space-y-3">
        {[
          { icon: '🌡️', title: 'Cooling Optimization Detected', text: 'GPU Cluster B is running at 60% capacity but cooling is set for 95%. Reducing CRAC unit output by 28% to save 124 kW.' },
          { icon: '⚡', title: 'Workload Reallocation Suggested', text: 'Cluster D has been idle for 23 minutes. Migrating training jobs from Cluster A to utilize existing thermal headroom.' },
          { icon: '📈', title: 'Load Spike Predicted', text: 'Forecasting 40% increase in GPU demand in next 15 minutes. Pre-cooling initiated to maintain efficiency.' },
        ].map((i, idx) => (
          <div key={idx} className="flex items-start gap-3 p-4 bg-black/20 rounded-lg">
            <div className="text-xl">{i.icon}</div>
            <div className="flex-1">
              <div className="font-semibold text-cyan-400">{i.title}</div>
              <div className="text-sm text-slate-300 leading-relaxed">{i.text}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function useChartData(chartData?: { labels: string[]; datasets: { label: string; data: number[] }[] }) {
  const data = useMemo(() => {
    if (!chartData || !chartData.labels || !chartData.datasets) {
      return {
        labels: [],
        datasets: [
          { label: 'GPU Utilization %', data: [], borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.1)', tension: 0.4, fill: true },
          { label: 'Cooling Power %', data: [], borderColor: '#ffa500', backgroundColor: 'rgba(255,165,0,0.1)', tension: 0.4, fill: true },
          { label: 'Energy Savings %', data: [], borderColor: '#00ffaa', backgroundColor: 'rgba(0,255,170,0.1)', tension: 0.4, fill: true },
        ],
      };
    }
    return {
      labels: chartData.labels,
      datasets: chartData.datasets.map((ds, idx) => {
        const colors = ['#00d4ff', '#ffa500', '#00ffaa'];
        const bgColors = ['rgba(0,212,255,0.1)', 'rgba(255,165,0,0.1)', 'rgba(0,255,170,0.1)'];
        return {
          label: ds.label,
          data: ds.data,
          borderColor: colors[idx] || '#00d4ff',
          backgroundColor: bgColors[idx] || 'rgba(0,212,255,0.1)',
          tension: 0.4,
          fill: true,
        };
      }),
    };
  }, [chartData]);

  const options = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#e0e6ed' } } },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { color: '#8b95a5' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      x: { ticks: { color: '#8b95a5' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  }), []);

  return { data, options };
}

function GPUGrid({ nodes }: { nodes: { id: number; label: string; state: 'active' | 'hot' | 'idle' }[] }) {
  const counts = useMemo(() => {
    let active = 0, hot = 0, idle = 0;
    nodes.forEach(n => {
      if (n.state === 'active') active++;
      else if (n.state === 'hot') hot++;
      else if (n.state === 'idle') idle++;
    });
    return { active, hot, idle };
  }, [nodes]);

  return (
    <div className="mt-6">
      <div className="grid grid-cols-8 gap-1.5">
        {nodes.map(n => (
          <div key={n.id} className={`gpu-node ${n.state === 'idle' ? 'gpu-idle' : n.state === 'hot' ? 'gpu-hot' : 'gpu-active'}`} data-label={n.label} title={`${n.label}: ${n.state === 'hot' ? 'High Load' : n.state.charAt(0).toUpperCase() + n.state.slice(1)}`} />
        ))}
      </div>
      <div className="flex gap-6 justify-center mt-4 flex-wrap text-sm">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Active (<span id="activeCount">{counts.active}</span>)</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Hot (<span id="hotCount">{counts.hot}</span>)</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-slate-500 inline-block" /> Idle (<span id="idleCount">{counts.idle}</span>)</div>
      </div>
    </div>
  );
}

function ClusterList({ clusters }: { clusters: Cluster[] }) {
  return (
    <div className="flex-1 overflow-y-auto pr-1.5 space-y-3">
      {clusters.map((cluster) => (
        <div key={cluster.name} className="bg-slate-900/50 rounded-lg border-l-4 border-cyan-400 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">{cluster.name}</div>
            <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cluster.status === 'active' ? 'bg-emerald-400/20 text-emerald-300' : cluster.status === 'idle' ? 'bg-amber-400/20 text-amber-300' : 'bg-cyan-400/20 text-cyan-300'}`}>
              {cluster.status.toUpperCase()}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-slate-400 text-xs">GPU Load</div>
              <div className="font-semibold">{Math.round(cluster.gpu)}%</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Cooling</div>
              <div className="font-semibold">{Math.round(cluster.cooling)}%</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Power</div>
              <div className="font-semibold">{cluster.power}kW</div>
            </div>
          </div>
          <div className="h-1.5 bg-white/10 rounded mt-2">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded" style={{ width: `${Math.round(cluster.gpu)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

type Message = { text: string; type: 'ai' | 'action'; timestamp: string };

function VoiceAssistant() {
  const scripts = useRef<string[]>([
    "Current data center status: We're operating at 2.34 megawatts with 32% energy savings compared to traditional cooling. GPU Cluster B is running at 60% capacity, but I've detected that cooling is still set for 95% load. I'm reducing CRAC unit output by 28%, which will save approximately 124 kilowatts. Cluster D has been idle for 23 minutes, so I'm reallocating workloads to maximize efficiency. Overall, we've offset 847 kilograms of CO2 today—that's equivalent to planting 38 trees.",
    "Load spike detected and managed. I predicted a 40% increase in GPU demand 15 minutes in advance, so I pre-cooled the system to maintain our 1.42 PUE rating. All clusters are now optimally balanced. Energy savings holding steady at 32%, and we're on track to save over 1 megawatt-hour by end of day.",
    "Optimization cycle complete. I've migrated training workloads from over-utilized clusters to those with thermal headroom. Cooling systems adjusted dynamically across all four clusters. This coordination reduced peak power draw by 240 kilowatts while maintaining performance SLAs. The system is now operating 28% more efficiently than it would under manual control.",
  ]);
  
  const [isOpen, setIsOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "AI Assistant initialized. Ready to optimize your data center.", type: 'ai', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (text: string, type: 'ai' | 'action') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { text, type, timestamp }]);
  };

  const onExplain = () => {
    setSpeaking(true);
    const script = scripts.current[Math.floor(Math.random() * scripts.current.length)];
    addMessage(script, 'ai');
    setTimeout(() => { setSpeaking(false); }, 8000);
  };

  const onOptimize = () => {
    setOptimizing(true);
    addMessage("Running optimization cycle across all clusters...", 'action');
    setTimeout(() => { 
      setOptimizing(false);
      addMessage("Optimization complete! Reduced power draw by 18% while maintaining performance targets.", 'ai');
    }, 3000);
  };

  const onSimulate = () => {
    setSpeaking(true);
    addMessage("Simulating 40% load spike on Cluster A...", 'action');
    setTimeout(() => {
      setSpeaking(false);
      addMessage("Load spike handled successfully. Pre-cooling protocols activated. System stability maintained.", 'ai');
    }, 3000);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`tm-assistant-button ${isOpen ? 'open' : ''}`}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? (
          <span className="text-2xl">✕</span>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <span className="text-2xl mb-1">🤖</span>
            {speaking && <span className="tm-pulse inline-block h-2 w-2 rounded-full bg-emerald-400" />}
          </div>
        )}
      </button>

      {/* Expanded Chat Panel */}
      <div className={`tm-assistant-panel ${isOpen ? 'open' : ''}`}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-cyan-400/30">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗣️</span>
            <div>
              <div className="font-semibold">AI Voice Assistant</div>
              <div className="text-xs text-slate-400">Powered by Gemini & ElevenLabs</div>
            </div>
          </div>
          {speaking && (
            <div className="tm-badge tm-badge-green text-xs">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 tm-pulse" />
              Speaking
            </div>
          )}
        </div>

        {/* Voice Visualizer */}
        <div className={`voice-visualizer ${speaking ? 'active' : ''} flex items-center justify-center gap-1 h-16 mb-4 bg-black/20 rounded-lg`}>
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="bar" style={{ animationDelay: `${Math.abs(4 - i) * 50}ms` }} />)}
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2" style={{ maxHeight: '300px' }}>
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.type === 'ai' ? 'message-ai' : 'message-action'}`}>
              <div className="flex items-start gap-2">
                <span className="text-lg">{msg.type === 'ai' ? '🤖' : '⚡'}</span>
                <div className="flex-1">
                  <div className="text-sm leading-relaxed">{msg.text}</div>
                  <div className="text-xs text-slate-500 mt-1">{msg.timestamp}</div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-3 border-t border-cyan-400/20">
          <button 
            onClick={onExplain} 
            disabled={speaking} 
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold bg-gradient-to-br from-cyan-400 to-emerald-400 text-slate-900 disabled:opacity-50 hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            🎤 Explain Current Status
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={onOptimize} 
              disabled={optimizing} 
              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold text-sm border border-cyan-400/30 text-slate-200 hover:bg-cyan-400/10 disabled:opacity-50 transition"
            >
              {optimizing ? '⚙️ Running...' : '⚡ Optimize'}
            </button>
            <button 
              onClick={onSimulate} 
              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-semibold text-sm border border-amber-400/30 text-slate-200 hover:bg-amber-400/10 transition"
            >
              🔥 Spike Test
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function App() {
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
  const { telemetry, status } = useTelemetry(WS_URL);
  const { data, options } = useChartData(telemetry?.chart);

  return (
    <div className="min-h-dvh">
      <Header connectionStatus={status} />
      <main className="max-w-[1400px] mx-auto p-6 pb-24">
        <HeroStats stats={telemetry?.stats || null} />
        <AiInsights />

        <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-6">
          <div className="tm-panel">
            <div className="tm-divider">
              <div className="text-lg font-semibold">📊 Real-Time Energy &amp; Workload</div>
            </div>
            <div className="relative h-[300px]">
              <Line data={data} options={options} />
            </div>
            <div className="mt-6 pt-6 border-t border-cyan-400/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">🖥️ GPU Cluster Status (32 Nodes)</h3>
              </div>
              <GPUGrid nodes={telemetry?.nodes || []} />
            </div>
          </div>
          <div className="tm-panel">
            <div className="tm-divider">
              <div className="text-lg font-semibold">🖥️ GPU Clusters</div>
            </div>
            <ClusterList clusters={telemetry?.clusters || []} />
          </div>
        </section>
      </main>

      {/* Floating Voice Assistant */}
      <VoiceAssistant />
    </div>
  );
}

export default App;
