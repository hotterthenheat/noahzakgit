import React, { useState, useMemo } from 'react';
import { 
  Users, 
  BookOpen, 
  MessagesSquare, 
  HelpCircle, 
  FileText, 
  Tv, 
  Lightbulb, 
  Calendar, 
  ExternalLink, 
  ArrowUpRight, 
  MessageSquarePlus, 
  CheckCircle,
  Clock,
  Compass,
  GraduationCap,
  Sparkles,
  Bookmark
} from 'lucide-react';

export default function ArborCapital() {
  const [activeChannel, setActiveChannel] = useState<'research' | 'education' | 'community' | 'support'>('research');
  
  // Feature requests state
  const [userRequests, setUserRequests] = useState([
    { id: 'req-1', title: 'Imbalance sweep trigger audio alerts', type: 'Feature Request', votes: 24, status: 'Completed' },
    { id: 'req-2', title: 'Vanna squeeze speed accelerator coefficients', type: 'Research suggestion', votes: 11, status: 'In Review' },
    { id: 'req-3', title: 'Gamma Flip levels overlays in standard indices charts', type: 'Feature Request', votes: 19, status: 'Scheduled' }
  ]);
  const [newRequestTitle, setNewRequestTitle] = useState('');
  const [newRequestType, setNewRequestType] = useState('Feature Request');
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const handleAddRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestTitle.trim()) return;

    setUserRequests([
      {
        id: `req-${Date.now()}`,
        title: newRequestTitle,
        type: newRequestType,
        votes: 1,
        status: 'Open'
      },
      ...userRequests
    ]);
    setNewRequestTitle('');
    setRequestSubmitted(true);
    setTimeout(() => setRequestSubmitted(false), 3000);
  };

  const handleVote = (id: string) => {
    setUserRequests(prev => prev.map(r => r.id === id ? { ...r, votes: r.votes + 1 } : r));
  };

  // Static mock data for the selected channel content
  const researchArticles = [
    {
      title: 'Deep-Exhaustion Volatility Spikes: Dealer Dynamic Gamma Rebalancing Strategy',
      tag: 'Dealer Flow Analysis',
      date: 'June 08, 2026',
      summary: 'An empirical breakdown of spot price velocity as market makers hit deep negative gamma thresholds. Historical win rate for buyer options spikes counts at 72.4% inside critical 90m gaps.',
      readTime: '8 min read',
      isPremium: true
    },
    {
      title: 'Structural Imbalances: Overbought RSI Cascade Divergences on Index Futures',
      tag: 'Market Research',
      date: 'June 07, 2026',
      summary: 'Analyzing the statistical reliability of standard deviation reversion overlays. When combined with net orderblock sweeps, historical drawdown levels decline by over 14%.',
      readTime: '6 min read',
      isPremium: false
    },
    {
      title: 'Weekly Institutional Outlook: Core Index Flip Parameters and Vanna Targets',
      tag: 'Macro Analysis',
      date: 'June 05, 2026',
      summary: 'Critical Call Wall & Put Wall placements mapped for SPX, NDX, and RUT. Spot price clustering dictates an imminent volatility compression, which represents optimal setup for Calendars.',
      readTime: '12 min read',
      isPremium: true
    }
  ];

  const educationModules = [
    {
      title: 'Institutional Options Greeks & Inventory Decoupled',
      level: 'CORE LESSON 1',
      desc: 'Understand exactly how GEX (Gamma), DEX (Delta), and VEX (Vanna) dictate the dynamic hedging constraints of market makers. Never guess the dealer boundaries again.',
      progress: '100% COMPLETED',
      icon: GraduationCap,
      color: 'text-indigo-400'
    },
    {
      title: 'Orderblock & VWAP Space Trajectory Architecture',
      level: 'CORE LESSON 2',
      desc: 'Master the art of locating major displacement zones. Understand how structure breaks (BOS) act as magnet boundaries for short-dated premiums.',
      progress: '80% COMPLETED',
      icon: BookOpen,
      color: 'text-emerald-400'
    },
    {
      title: 'Option Risk Management: Mitigating Mathematical Ruin Profiles',
      level: 'ADVANCED METRIC 3',
      desc: 'A complete framework addressing expected value, probability calibration, and drawdown models to maintain terminal equity paths in multi-volatility environments.',
      progress: 'NOT STARTED',
      icon: Compass,
      color: 'text-amber-400'
    }
  ];

  const communityDiscussions = [
    { id: 1, user: 'VolTrader_41', avatar: '🛡️', msg: 'SPX GEX wall just held beautifully at 5180. Dealers pushed it straight back into equilibrium. Standard compression protocol played out on target.', time: '12m ago' },
    { id: 2, user: 'QuantDelta', avatar: '🔬', msg: 'Fascinating looking at the Vanna curve on QQQ right now. Implied Volatility decline is triggering automatic passive buyback flows.', time: '28m ago' },
    { id: 3, user: 'ArborAlpha_007', avatar: '🌲', msg: 'Has anyone tested the V8 live tracker outcomes vs the expected range bounds? My target 1 outcomes this morning hit with extreme accuracy.', time: '1h ago' }
  ];

  return (
    <div className="bg-[#0E0E10] border border-[#2A2A2D] rounded-sm p-5 flex flex-col gap-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#2A2A2D] pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-[10px] tracking-[0.25em] font-black uppercase font-mono">ARBOR CAPITAL INTEL HUB</span>
          </div>
          <h2 className="text-xl font-bold tracking-wider text-white font-mono flex items-center gap-2">
            🌲 ARBOR CAPITAL: THE COMMUNITY & EDUCATION LAYER
          </h2>
          <p className="text-xs text-zinc-400 font-sans mt-1">
            Where institutional software meets high-conviction collaboration. Proving what works, educating options traders, and sharing trade reviews.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#17171A] p-2 border border-[#2A2A2D] rounded-sm">
          <span className="text-[9px] text-[#888888] font-mono tracking-wider uppercase block">CORE TAGLINE</span>
          <div className="h-5 w-px bg-[#2A2A2D] mx-1"></div>
          <span className="text-xs font-bold text-emerald-400 font-mono italic">"Where Intelligence Becomes Community."</span>
        </div>
      </div>

      {/* Main Structural Information Cards regarding "Not a Discord, Not an alert service" */}
      <div className="bg-gradient-to-r from-emerald-950/20 to-indigo-950/10 border border-[#2A2A2D] p-5 rounded-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-24 h-24 text-emerald-400 shrink-0" />
        </div>
        <div className="relative">
          <h3 className="text-xs font-black tracking-widest text-[#E0E0E0] uppercase font-mono mb-2">Ecosystem Philosophy</h3>
          <p className="text-xs md:text-sm text-zinc-300 leading-relaxed font-sans max-w-3xl">
            Slayer.trade is a financial technology company — <span className="font-bold text-emerald-400">Arbor Capital is not a signal group or standard Discord alert room</span>. We believe in software that helps traders make better decisions using measurable data. The community exists to support the software and build elite accountability. The software does not exist to support the community.
          </p>
          <div className="flex flex-wrap gap-4 mt-4 text-[10px] text-zinc-400 font-mono uppercase">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>100% Software First</span>
            </div>
            <div className="h-4 w-px bg-zinc-800"></div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Measurable Accountability</span>
            </div>
            <div className="h-4 w-px bg-zinc-800"></div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Institutional Frameworks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Arbor Interactive Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Sidebar Navigation */}
        <div className="col-span-1 flex flex-col gap-2">
          
          <button
            onClick={() => setActiveChannel('research')}
            className={`flex items-center gap-3 p-3 px-4 rounded-sm text-left font-mono text-xs font-bold transition-all border ${
              activeChannel === 'research'
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60'
                : 'bg-[#121214] border-[#2A2A2D] hover:border-zinc-700 text-[#888888] hover:text-zinc-200'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
            <div className="flex flex-col">
              <span>RESEARCH CHANNELS</span>
              <span className="text-[9px] text-zinc-500 font-normal">Flow & Macro Analysis</span>
            </div>
          </button>

          <button
            onClick={() => setActiveChannel('education')}
            className={`flex items-center gap-3 p-3 px-4 rounded-sm text-left font-mono text-xs font-bold transition-all border ${
              activeChannel === 'education'
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60'
                : 'bg-[#121214] border-[#2A2A2D] hover:border-zinc-700 text-[#888888] hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <div className="flex flex-col">
              <span>EDUCATIONAL CONTENT</span>
              <span className="text-[9px] text-zinc-500 font-normal">Interactive options school</span>
            </div>
          </button>

          <button
            onClick={() => setActiveChannel('community')}
            className={`flex items-center gap-3 p-3 px-4 rounded-sm text-left font-mono text-xs font-bold transition-all border ${
              activeChannel === 'community'
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60'
                : 'bg-[#121214] border-[#2A2A2D] hover:border-zinc-700 text-[#888888] hover:text-zinc-200'
            }`}
          >
            <MessagesSquare className="w-4 h-4 shrink-0" />
            <div className="flex flex-col">
              <span>COMMUNITY FEED</span>
              <span className="text-[9px] text-zinc-500 font-normal">Trade journaling logs</span>
            </div>
          </button>

          <button
            onClick={() => setActiveChannel('support')}
            className={`flex items-center gap-3 p-3 px-4 rounded-sm text-left font-mono text-xs font-bold transition-all border ${
              activeChannel === 'support'
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60'
                : 'bg-[#121214] border-[#2A2A2D] hover:border-zinc-700 text-[#888888] hover:text-zinc-200'
            }`}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            <div className="flex flex-col">
              <span>PRODUCT SUPPORT</span>
              <span className="text-[9px] text-zinc-500 font-normal">Feedback and suggestion box</span>
            </div>
          </button>

          {/* Event Timeline Display Widget */}
          <div className="bg-[#121214] border border-[#2A2A2D] rounded-sm p-4.5 mt-2 flex flex-col font-mono text-xs gap-3">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Upcoming Live Events Calendar
            </span>

            <div className="space-y-3">
              <div className="border-l-2 border-emerald-800 pl-3">
                <span className="text-[9px] text-emerald-400 block font-bold uppercase tracking-wider">TODAY 15:30 UTC</span>
                <span className="font-bold text-zinc-200 block">Intraday Dealer Flow Audit Review</span>
                <span className="text-[10px] text-zinc-500">Live platform screening with V8 systems experts</span>
              </div>
              
              <div className="border-l-2 border-zinc-800 pl-3 text-[#888888]">
                <span className="text-[9px] block uppercase tracking-wider">WEDNESDAY 19:15 UTC</span>
                <span className="font-bold text-zinc-400 block">Volatility Squeeze Macro Panel</span>
                <span className="text-[10px] text-zinc-600">Educational theory detailing Vanna/Charm overlays</span>
              </div>
            </div>
          </div>

        </div>

        {/* Content Dynamic Area */}
        <div className="col-span-1 lg:col-span-3 bg-[#121214] border border-[#2A2A2D] rounded-sm p-5">
          
          {/* Channel 1: Research Articles */}
          {activeChannel === 'research' && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-1.5">
                  <FileText className="w-4.5 h-4.5 text-emerald-400" />
                  Active Market Research & Flow Reports
                </h3>
                <span className="text-[9px] text-zinc-550 font-mono">PUBLISHED BY ARBOR CAP QUANT DESK</span>
              </div>

              <div className="space-y-4">
                {researchArticles.map((article, idx) => (
                  <div key={idx} className="bg-[#0A0A0B]/40 hover:bg-[#0A0A0B]/80 border border-zinc-900 hover:border-emerald-900/40 p-4 rounded-sm transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[9.5px] font-bold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 border border-emerald-900/30 font-mono rounded-sm text-center">
                          {article.tag}
                        </span>
                        <div className="flex items-center gap-3 text-[10.5px] text-zinc-500 font-mono">
                          <span>{article.date}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">{article.readTime}</span>
                        </div>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-zinc-100 hover:text-emerald-400 transition-colors font-mono tracking-tight leading-tight cursor-pointer flex items-center gap-1.5">
                        {article.title}
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      </h4>
                      <p className="text-zinc-400 font-sans text-xs mt-2 ml-0.5 leading-relaxed">
                        {article.summary}
                      </p>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-zinc-900/60 flex items-center justify-between text-[10.5px] font-mono select-none">
                      <span className="text-zinc-500">Author: Senior Portfolio Strategist</span>
                      <button className="text-emerald-400 hover:underline flex items-center gap-1 bg-[#121214] px-2 py-0.5 border border-zinc-800 rounded-sm cursor-pointer">
                        <span>EXPAND ENTIRE REPORT</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Channel 2: Educational Content */}
          {activeChannel === 'education' && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-1.5">
                  <GraduationCap className="w-4.5 h-4.5 text-emerald-400" />
                  Options Education & Risk Management Academy
                </h3>
                <span className="text-[9px] text-zinc-550 font-mono">3 / 5 MODULES COMPLETED</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {educationModules.map((module, idx) => {
                  const IconComp = module.icon;
                  return (
                    <div key={idx} className="bg-[#0A0A0B]/40 border border-zinc-900 p-4 rounded-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[9px] text-[#888888] font-mono leading-none tracking-wider uppercase block">{module.level}</span>
                          <span className={`text-[9.5px] font-bold font-mono px-1.5 py-0.5 border rounded-sm ${
                            module.progress.startsWith('100') 
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' 
                              : module.progress.startsWith('NOT')
                              ? 'bg-zinc-950 text-zinc-650 border-transparent'
                              : 'bg-amber-950/40 text-amber-500 border-amber-900/50'
                          }`}>
                            {module.progress}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <IconComp className={`w-5 h-5 shrink-0 ${module.color}`} />
                          <h4 className="text-[12.5px] font-extrabold text-zinc-200 mt-0.5 tracking-tight font-mono leading-none">{module.title}</h4>
                        </div>
                        <p className="text-zinc-400 font-sans text-xs mt-2.5 leading-relaxed">
                          {module.desc}
                        </p>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-zinc-900/60">
                        <button className="w-full text-center py-1.5 bg-[#17171A] hover:bg-zinc-800 text-zinc-200 hover:text-white font-mono text-[10.5px] uppercase border border-zinc-800 rounded-sm cursor-pointer transition-colors">
                          {module.progress.startsWith('100') ? 'REVIEW MODULE CONTENT' : 'LAUNCH WORKBOOK'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-4 bg-[#0A0A0B]/60 border border-zinc-900 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-950 text-emerald-400 rounded-full shrink-0">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block font-mono">🎓 ARBOR WEEKLY CLASSROOM INTERACTIVE REPLAY</span>
                    <span className="text-[11px] text-zinc-400 font-sans">Full visual breakdown of expected value systems & calibration buckets.</span>
                  </div>
                </div>
                <button className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs font-mono uppercase rounded-sm border border-emerald-400 transition-colors shadow-sm cursor-pointer whitespace-nowrap">
                  PLAY ARCHIVE (1h 14m)
                </button>
              </div>
            </div>
          )}

          {/* Channel 3: Community Discussions Feed */}
          {activeChannel === 'community' && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-1.5">
                  <MessagesSquare className="w-4.5 h-4.5 text-emerald-400" />
                  Intra-Session Member Trade Journals & Flow Discussions
                </h3>
                <span className="text-[9px] text-zinc-550 font-mono">148 MEMBERS LIVE ONLINE</span>
              </div>

              {/* Feed List */}
              <div className="space-y-3.5">
                {communityDiscussions.map((d) => (
                  <div key={d.id} className="bg-[#0A0A0B]/40 border border-zinc-900 p-3.5 rounded-sm flex items-start gap-3.5 font-sans">
                    <div className="w-8 h-8 rounded-full bg-[#17171A] border border-zinc-800 flex items-center justify-center text-sm shrink-0 select-none">
                      {d.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                        <span className="font-bold text-emerald-400">{d.user}</span>
                        <span className="text-[#888888] tracking-tighter italic font-sans">{d.time}</span>
                      </div>
                      <p className="text-zinc-300 text-xs leading-normal">
                        {d.msg}
                      </p>
                      <div className="flex items-center gap-3.5 font-mono text-[10.5px] text-zinc-500 mt-2 hover:text-zinc-400">
                        <button className="hover:underline flex items-center gap-1 cursor-pointer">
                          <span>❤️ Agree (14)</span>
                        </button>
                        <span>•</span>
                        <button className="hover:underline flex items-center gap-1 cursor-pointer">
                          <span>💬 Reply</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input placeholder bar */}
              <div className="mt-3 p-1.5 bg-[#0A0A0B] border border-zinc-900 rounded-sm flex items-center justify-between gap-3 font-mono">
                <input 
                  type="text" 
                  placeholder="Share journals commentary, critical pivot breakouts, or platform trades..."
                  className="bg-transparent border-0 text-xs text-zinc-300 placeholder-zinc-550 focus:outline-hidden flex-1 px-2 py-1"
                  readOnly
                />
                <button 
                  onClick={() => alert('Arbor Capital journals require system authentication verified options logs.')}
                  className="px-3 py-1.5 bg-[#17171A] text-zinc-400 hover:text-white border border-zinc-800 text-[10px] font-bold uppercase rounded-sm cursor-pointer whitespace-nowrap"
                >
                  SEND ENTRY
                </button>
              </div>
            </div>
          )}

          {/* Channel 4: Product Support & Feedback Box */}
          {activeChannel === 'support' && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-1.5">
                  <HelpCircle className="w-4.5 h-4.5 text-emerald-400" />
                  Ecosystem Support & Dynamic Platform Proposals
                </h3>
                <span className="text-[9px] text-zinc-550 font-mono">SLAYER ECOSYSTEM ROADMAP</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                
                {/* Submit suggestion */}
                <div className="bg-[#0A0A0B]/40 border border-zinc-900 p-4 rounded-sm flex flex-col justify-between font-mono">
                  <div>
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 mb-2.5">
                      <MessageSquarePlus className="w-4 h-4 text-emerald-400" />
                      Propose Platform Improvements
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed mb-4">
                      Submit and review feature pipeline requests representing SkyVision decisions index modules, or Pinpoint AI positioning telemetry models.
                    </p>

                    {requestSubmitted ? (
                      <div className="bg-emerald-950/55 text-emerald-400 border border-emerald-900/60 p-3.5 rounded-sm flex items-start gap-2 mb-4 font-sans text-xs">
                        <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                        <div>
                          <span className="font-bold font-mono block">Proposal Lodged Successfully</span>
                          We have recorded your suggestions for quantitative options triggers review.
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleAddRequest} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9.5px] text-[#888888] uppercase font-bold block">PROPOSAL TITLE</label>
                          <input 
                            type="text" 
                            value={newRequestTitle}
                            onChange={(e) => setNewRequestTitle(e.target.value)}
                            placeholder="e.g. VEX option IV compression indicators..."
                            className="w-full bg-[#17171A] border border-[#2A2A2D] p-2 text-xs rounded-sm text-zinc-200"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9.5px] text-[#888888] uppercase font-bold block">CATEGORY</label>
                          <select 
                            value={newRequestType}
                            onChange={(e) => setNewRequestType(e.target.value)}
                            className="w-full bg-[#17171A] border border-[#2A2A2D] p-1.5 text-xs rounded-sm text-zinc-300 font-mono"
                          >
                            <option value="Feature Request">Platform Feature Request</option>
                            <option value="Technical Bug">Technical Bug Report</option>
                            <option value="Research Suggestion">Quantitative Research Suggestion</option>
                          </select>
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase text-[10.5px] rounded-sm transition-all shadow-md cursor-pointer pointer-events-auto"
                        >
                          SUBMIT COMMITTED PROPOSAL
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Grid list of registered user requests */}
                <div className="bg-[#0A0A0B]/40 border border-zinc-900 p-4 rounded-sm flex flex-col font-mono text-xs">
                  <h4 className="text-xs font-black text-zinc-300 uppercase tracking-widest flex items-center gap-1 mb-3 pb-1 border-b border-zinc-900">
                    <Bookmark className="w-4 h-4 text-emerald-400" />
                    Latest Member Proposals Map
                  </h4>

                  <div className="space-y-2.5 overflow-y-auto max-h-[220px] flex-1">
                    {userRequests.map((req) => (
                      <div key={req.id} className="p-3 bg-[#111] border border-zinc-900 rounded-sm flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[9px] mb-1">
                            <span className="text-emerald-400 font-bold uppercase tracking-tighter">{req.type}</span>
                            <span className="text-zinc-650">•</span>
                            <span className={`px-1 rounded-sm uppercase tracking-tighter ${
                              req.status === 'Completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' :
                              req.status === 'In Review' ? 'bg-amber-950 text-amber-500 border border-amber-900/50' :
                              req.status === 'Scheduled' ? 'bg-indigo-950 text-indigo-300 border border-indigo-900/50' :
                              'bg-zinc-800 text-zinc-400 border-transparent'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <span className="font-bold text-zinc-200 block truncate leading-tight">{req.title}</span>
                        </div>

                        <button
                          onClick={() => handleVote(req.id)}
                          className="bg-[#1C1C20] hover:bg-emerald-950/40 p-1.5 px-2.5 border border-zinc-800 rounded-sm font-bold text-center flex flex-col text-[10px] shrink-0 hover:text-emerald-400 hover:border-emerald-900 transition-all cursor-pointer pointer-events-auto"
                        >
                          <span>▲</span>
                          <span>{req.votes}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
