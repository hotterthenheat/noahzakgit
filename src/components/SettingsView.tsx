import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HelpCircle, ShieldCheck, Pocket, Layers, RefreshCw, Key } from 'lucide-react';

export function SettingsView() {
  const [strictCompliance, setStrictCompliance] = useState(true);
  const [streamDampener, setStreamDampener] = useState(false);
  const [latencyLimit, setLatencyLimit] = useState(true);
  const [sandboxMode, setSandboxMode] = useState(true);

  return (
    <div className="w-full text-zinc-300 flex flex-col font-mono select-none antialiased space-y-6">
      
      {/* 1. HEADER (CONFIGS HEADER) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#050505] border border-zinc-900 p-4 rounded-sm gap-2">
        <div className="flex gap-2 items-center">
          <Key className="w-4 h-4 text-zinc-400" />
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">
            SLAYER CONFIG SYSTEM SETTINGS // RECENT SESSION
          </span>
        </div>
        <div className="text-[8.5px] text-[#00ff88] uppercase tracking-widest bg-black border border-zinc-900 px-2 py-0.5 font-black">
          CLIENT STATE LOCAL VALIDATED
        </div>
      </div>

      {/* 2. PRIMARY HERO CARD (Apple-level aesthetic, enormous spacing, minimal controls) */}
      <div className="w-full flex justify-center animate-fadeIn">
        <div className="max-w-3xl w-full bg-[#050505] border-2 border-white rounded-sm p-4 sm:p-10 relative overflow-hidden shadow-2xl flex flex-col justify-between">
          
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-white" />

          {/* Settings title */}
          <div className="border-b border-zinc-900/40 pb-6 mb-6">
            <span className="text-[8px] text-zinc-550 tracking-[0.25em] font-black block uppercase">PREFERENCES HUB</span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase leading-none font-sans">
              SYSTEM CONFIGURATIONS
            </h2>
          </div>

          {/* Highly generous negative space control rows */}
          <div className="space-y-8 text-left my-2">
            
            {/* Control index 1 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-950 pb-5">
              <div className="space-y-1 max-w-md">
                <span className="text-[11px] font-black text-white uppercase tracking-wider block">
                  Model Strict Compliance mode
                </span>
                <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                  When active, execution recommendations strictly mandate both high htfAgreement and positive dealer GEX shielding. Neutral signals remain gated inside standard buffers.
                </p>
              </div>

              {/* Minimal toggle switch */}
              <button 
                onClick={() => setStrictCompliance(!strictCompliance)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none relative self-start sm:self-center cursor-pointer ${strictCompliance ? 'bg-white' : 'bg-zinc-900 border border-zinc-850'}`}
              >
                <div className={`w-5 h-5 rounded-full transition-transform duration-200 transform shadow-md ${strictCompliance ? 'translate-x-5 bg-black' : 'translate-x-0 bg-zinc-650'}`} />
              </button>
            </div>

            {/* Control index 2 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-950 pb-5">
              <div className="space-y-1 max-w-md">
                <span className="text-[11px] font-black text-white uppercase tracking-wider block">
                  CME Stream Dampener frequency
                </span>
                <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                  Smooth volatility updates by pooling consecutive SSE intervals. Throttles rendering calculations from 0.8s loops to 1.6s locks, reducing browser pipeline CPU overhead.
                </p>
              </div>

              <button 
                onClick={() => setStreamDampener(!streamDampener)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none relative self-start sm:self-center cursor-pointer ${streamDampener ? 'bg-white' : 'bg-zinc-900 border border-zinc-850'}`}
              >
                <div className={`w-5 h-5 rounded-full transition-transform duration-200 transform shadow-md ${streamDampener ? 'translate-x-5 bg-black' : 'translate-x-0 bg-zinc-650'}`} />
              </button>
            </div>

            {/* Control index 3 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-950 pb-5">
              <div className="space-y-1 max-w-md">
                <span className="text-[11px] font-black text-white uppercase tracking-wider block">
                  High Performance Latency limit
                </span>
                <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                  Enforces strict 200ms roundtrip timeout constraints on cloud-node calculations, falling back immediately to local calculations if network congestion swells.
                </p>
              </div>

              <button 
                onClick={() => setLatencyLimit(!latencyLimit)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none relative self-start sm:self-center cursor-pointer ${latencyLimit ? 'bg-white' : 'bg-zinc-900 border border-zinc-850'}`}
              >
                <div className={`w-5 h-5 rounded-full transition-transform duration-200 transform shadow-md ${latencyLimit ? 'translate-x-5 bg-black' : 'translate-x-0 bg-zinc-650'}`} />
              </button>
            </div>

            {/* Control index 4 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-md">
                <span className="text-[11px] font-black text-white uppercase tracking-wider block">
                  Simulated Sandbox engine
                </span>
                <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                  Enables mock terminal trading records and offline caching regimes. When disabled, the system attempts direct real-time portfolio integration checks.
                </p>
              </div>

              <button 
                onClick={() => setSandboxMode(!sandboxMode)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none relative self-start sm:self-center cursor-pointer ${sandboxMode ? 'bg-white' : 'bg-zinc-900 border border-zinc-850'}`}
              >
                <div className={`w-5 h-5 rounded-full transition-transform duration-200 transform shadow-md ${sandboxMode ? 'translate-x-5 bg-black' : 'translate-x-0 bg-zinc-650'}`} />
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* 3. SECONDARY ANALYSIS CARDS (Credentials/Handshake API variables blocks) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        
        {/* API Credentials */}
        <div className="bg-[#050505] p-5 border border-zinc-900 rounded-sm flex flex-col justify-between text-left space-y-4">
          <div className="space-y-2">
            <span className="text-[8px] text-zinc-550 block uppercase font-bold tracking-widest">TELECOM WEBHOOK CHANNELS</span>
            <h4 className="text-xs font-black text-white uppercase">TWILIO INTEGRATION CREDENTIALS</h4>
            <p className="text-[10px] text-zinc-500 font-sans leading-relaxed uppercase">
              SMS dispatch channels route through a default client-side simulation. Real keys reside safely on standard server environment maps.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-black border border-zinc-900 rounded-xs flex justify-between items-center">
              <span className="text-zinc-600 block uppercase text-[8px]">ACCOUNT SID</span>
              <span className="text-zinc-400 font-mono text-[10px]">AC****************************4f11</span>
            </div>
            <div className="p-3 bg-black border border-zinc-900 rounded-xs flex justify-between items-center">
              <span className="text-zinc-600 block uppercase text-[8px]">AUTH TIMEOUT</span>
              <span className="text-[#00ff88] font-bold font-mono text-[10px]">15.0 SECONDS</span>
            </div>
          </div>
        </div>

        {/* System parameters logs view */}
        <div className="bg-[#050505] p-5 border border-zinc-900 rounded-sm flex flex-col justify-between text-left space-y-4">
          <div className="space-y-2">
            <span className="text-[8px] text-zinc-550 block uppercase font-bold tracking-widest">CUSTODY SYSTEM METRIC DECK</span>
            <h4 className="text-xs font-black text-white uppercase">CALIBRATOR ATTRIBUTES</h4>
            <p className="text-[10px] text-zinc-500 font-sans leading-relaxed uppercase">
              Verify local browser storage cache status, software build numbers, and system diagnostic integrity bounds.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-black border border-zinc-900 rounded-xs flex justify-between items-center">
              <span className="text-zinc-600 block uppercase text-[8px]">LOCAL STORAGE CHRONOLOGY</span>
              <span className="text-white font-mono text-[10px]">ACTIVE CACHED (68.4 KB)</span>
            </div>
            <div className="p-3 bg-black border border-zinc-900 rounded-xs flex justify-between items-center">
              <span className="text-zinc-600 block uppercase text-[8px]">VERSION BUILD ID</span>
              <span className="text-zinc-450 font-mono text-[10px]">ARBORS-V11.2.9S-W1</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. SUPPORTING INFORMATION */}
      <div className="bg-[#050505] border border-zinc-900 p-5 rounded-sm p-4.5 text-left space-y-3">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
          <Layers className="w-3.5 h-3.5 text-zinc-550" />
          <h4 className="text-[10.5px] font-black text-white uppercase tracking-wider block">
            End-User License Agreement Boundary Notes
          </h4>
        </div>
        <div className="text-[11px] leading-relaxed text-zinc-455 font-sans space-y-2">
          <p>
            Configurations set above affect local browser runtime behaviors exclusively. All underlying data streams, telemetry records, and GEX calculations are compiled on secure backend server nodes and remain unaffected by client modifications.
          </p>
          <p>
            For safety and custody standards, do not attempt to bypass strict compliance gates during high-imbalance markets, as rapid volatility expansion sequences can impair outcome probability models.
          </p>
        </div>
      </div>

      {/* 5. STATUS BAR */}
      <div className="border border-zinc-900 bg-black min-h-[30px] p-2 pr-3 rounded-xs flex items-center justify-between text-[8px] text-zinc-550 uppercase tracking-widest pl-3 font-black">
        <span>PREFERENCES SUCCESSFULLY WRITTEN AND COMMITTED LOCALLY</span>
        <div className="flex items-center gap-1.5 text-white">
          <span className="h-1.5 w-1.5 bg-[#CCCCCC] rounded-full animate-pulse" />
          <span>PREFS WRITTEN</span>
        </div>
      </div>

    </div>
  );
}
