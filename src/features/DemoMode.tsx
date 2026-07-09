import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, SkipForward, CheckCircle2, ShieldCheck, Database, FileText, Cpu, AlertTriangle, Landmark, FileDown, Award } from 'lucide-react';
import { MSME } from '../types';

interface DemoModeProps {
  msmes: MSME[];
  onDemoComplete: (msme: MSME) => void;
}

interface DemoStep {
  title: string;
  narrative: string;
  status: string;
  icon: React.ReactNode;
  delayMs: number;
}

export const DemoMode: React.FC<DemoModeProps> = ({ msmes, onDemoComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [demoMSME, setDemoMSME] = useState<MSME | null>(null);
  
  // Terminal logs
  const [logs, setLogs] = useState<string[]>([]);

  // Choose the 1st MSME (usually excellent or average) for demo
  const targetMsme = msmes[0] || msmes[1];

  const steps: DemoStep[] = [
    {
      title: "GST Connection",
      narrative: "Establishing handshake with GSTN Portal. Pulling 12 months of GSTR-3B filings to verify historical business sales.",
      status: "GSTN Handshake Authenticated... GSTR-3B monthly ledger parsed successfully.",
      icon: <FileText className="w-6 h-6 text-brand-green-500" />,
      delayMs: 3000,
    },
    {
      title: "Account Aggregator Consent",
      narrative: "Triggering DEPA-compliant authorization. Pulling 12 months of primary bank transaction statements via secure digital token.",
      status: "AA Consent token received... Bank statement inflow/outflow parameters extracted.",
      icon: <Landmark className="w-6 h-6 text-brand-green-500" />,
      delayMs: 3000,
    },
    {
      title: "UPI merchant Sync",
      narrative: "Indexing digital QR merchant payment flows. Calculating transaction velocities and average ticket counts.",
      status: "UPI nodes synced... 4 Active QR merchants consolidated.",
      icon: <Database className="w-6 h-6 text-brand-green-500" />,
      delayMs: 2500,
    },
    {
      title: "EPFO Payroll Sync",
      narrative: "Connecting to EPFO registry to pull registered employees payroll details, validating staff retention trends.",
      status: "EPFO credentials synced... Active headcount registry compiled.",
      icon: <ShieldCheck className="w-6 h-6 text-brand-green-500" />,
      delayMs: 2500,
    },
    {
      title: "AI Processing Engine",
      narrative: "Scoring engine applying weighted multi-dimensional evaluations. Pillar scores are normalized to 0-100 scale.",
      status: "Normalizing indicators... Applying 5-pillar weighting matrix.",
      icon: <Cpu className="w-6 h-6 text-brand-saffron-500 animate-spin" />,
      delayMs: 3000,
    },
    {
      title: "Financial Health score Reveal",
      narrative: "CreditPulse score compiled. Composite Score and assessed Credit Grade generated based on alternate files.",
      status: `Score calculated: ${targetMsme?.score?.composite_score}/100 | Grade: ${targetMsme?.score?.grade}`,
      icon: <Award className="w-6 h-6 text-emerald-500" />,
      delayMs: 3500,
    },
    {
      title: "Risk & Flag Assessment",
      narrative: "Explainable AI checking positive and negative credit drivers. Operational risks are isolated.",
      status: "Explainability index finalized. Actionable CFO roadmaps generated.",
      icon: <AlertTriangle className="w-6 h-6 text-brand-saffron-500" />,
      delayMs: 3000,
    },
    {
      title: "Loan Readiness Evaluation",
      narrative: "Underwriting engine assessing credit eligibility limit, suggested pricing bands, and matching government schemes.",
      status: `Pre-approved Amount: INR ${targetMsme?.recommendation?.suggested_amount}L under ${targetMsme?.recommendation?.product_type}`,
      icon: <Landmark className="w-6 h-6 text-emerald-500" />,
      delayMs: 3000,
    },
    {
      title: "Executive Report Compilation",
      narrative: "Ratings report finalized. Digital signatures attached. Executive Credit Health PDF ready for relationship managers.",
      status: "CRISIL/ratings-style report compiled. Demo sequence finalized.",
      icon: <FileDown className="w-6 h-6 text-brand-green-500" />,
      delayMs: 3500,
    },
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && currentStepIdx < steps.length) {
      const currentStep = steps[currentStepIdx];
      
      // Add log
      setLogs(prev => [...prev, `[INFO] ${currentStep.status}`]);

      timer = setTimeout(() => {
        if (currentStepIdx === steps.length - 1) {
          setIsPlaying(false);
          if (targetMsme) onDemoComplete(targetMsme);
        } else {
          setCurrentStepIdx(prev => prev + 1);
        }
      }, currentStep.delayMs);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIdx]);

  const handleStartDemo = () => {
    setIsPlaying(true);
    setCurrentStepIdx(0);
    setLogs([`[SYSTEM] Initializing cinematic demo run for applicant ${targetMsme?.name}...`]);
  };

  const handleSkipNext = () => {
    if (currentStepIdx < steps.length - 1) {
      const nextStep = steps[currentStepIdx + 1];
      setLogs(prev => [...prev, `[SKIP] ${steps[currentStepIdx].title} complete.`, `[INFO] ${nextStep.status}`]);
      setCurrentStepIdx(prev => prev + 1);
    } else {
      setIsPlaying(false);
      if (targetMsme) onDemoComplete(targetMsme);
    }
  };

  const currentStep = steps[currentStepIdx];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Upper Control Bar */}
      <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            ⚡ Cinematic System Presentation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Observe the alternate data ingestion pipelines, compliance connectors, and AI scoring algorithms execute in real-time.
          </p>
        </div>

        {!isPlaying ? (
          <button
            onClick={handleStartDemo}
            className="px-5 py-2.5 bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 shrink-0"
          >
            <Play className="w-4 h-4 fill-white animate-pulse" />
            Launch Live Ingestion
          </button>
        ) : (
          <button
            onClick={handleSkipNext}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
          >
            <SkipForward className="w-4 h-4" />
            Next Step / Ingest
          </button>
        )}
      </div>

      {/* Progress Scale */}
      {isPlaying && (
        <div className="space-y-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold uppercase">
            <span>Pipeline Cycle: Step {currentStepIdx + 1} of {steps.length}</span>
            <span className="text-brand-saffron-500">{currentStep.title}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-full flex-1 transition-all rounded-sm ${
                  idx < currentStepIdx ? 'bg-brand-green-600 shadow-sm' :
                  idx === currentStepIdx ? 'bg-brand-saffron-500 animate-pulse' :
                  'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Screen Visualization */}
      <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 md:p-8 text-white min-h-[420px] flex flex-col relative overflow-hidden shadow-2xl">
        {/* Animated grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
        
        {/* Animated Pulses in background */}
        {isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-[300px] h-[300px] rounded-full border border-brand-green-500/20 animate-[ping_3s_infinite]" />
            <div className="w-[500px] h-[500px] rounded-full border border-brand-green-500/10 animate-[ping_4s_infinite]" />
          </div>
        )}

        {!isPlaying && currentStepIdx === 0 ? (
          <div className="flex flex-col items-center justify-center my-auto space-y-4 py-12 z-10">
            <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl cursor-pointer hover:border-brand-green-500/50 transition-all" onClick={handleStartDemo}>
              <Play className="w-8 h-8 text-brand-green-500 fill-brand-green-500 translate-x-0.5 hover:scale-110 transition-transform" />
            </div>
            <div className="text-center space-y-1.5">
              <h4 className="text-sm font-bold tracking-wider text-slate-200 uppercase font-display">System Underwriting Standby</h4>
              <p className="text-xs text-slate-500 max-w-[340px] mx-auto">
                Trigger the live simulation loop to witness Alternate Data pipelines syncing, calculating risk variables, and generating reports.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch z-10 flex-1">
            
            {/* Visual Node Diagram Column */}
            <div className="lg:col-span-6 flex flex-col justify-center items-center p-4 bg-slate-900/40 border border-slate-900/80 rounded-2xl relative overflow-hidden min-h-[280px]">
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <svg width="100%" height="100%" className="absolute inset-0">
                  <line x1="20%" y1="20%" x2="50%" y2="50%" stroke="#10b981" strokeWidth="2" strokeDasharray="5 5" className={currentStepIdx === 0 ? 'animate-[dash_2s_linear_infinite]' : ''} />
                  <line x1="20%" y1="40%" x2="50%" y2="50%" stroke="#10b981" strokeWidth="2" strokeDasharray="5 5" className={currentStepIdx === 1 ? 'animate-[dash_2s_linear_infinite]' : ''} />
                  <line x1="20%" y1="60%" x2="50%" y2="50%" stroke="#10b981" strokeWidth="2" strokeDasharray="5 5" className={currentStepIdx === 2 ? 'animate-[dash_2s_linear_infinite]' : ''} />
                  <line x1="20%" y1="80%" x2="50%" y2="50%" stroke="#10b981" strokeWidth="2" strokeDasharray="5 5" className={currentStepIdx === 3 ? 'animate-[dash_2s_linear_infinite]' : ''} />
                </svg>
              </div>

              {/* Data Sources Grid */}
              <div className="w-full grid grid-cols-2 gap-4 max-w-sm relative">
                {/* GST Node */}
                <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all duration-300 ${
                  currentStepIdx === 0 ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10 scale-105' :
                  currentStepIdx > 0 ? 'bg-slate-900/60 border-emerald-900/30 opacity-70' :
                  'bg-slate-900/20 border-slate-800 opacity-40'
                }`}>
                  <div className={`p-1.5 rounded-lg ${currentStepIdx >= 0 ? 'bg-emerald-600/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-[10px] truncate leading-tight">
                    <span className="font-bold block text-white">GSTN Connection</span>
                    <span className="text-[8px] text-slate-400">GSTR-3B Filings</span>
                  </div>
                </div>

                {/* AA Node */}
                <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all duration-300 ${
                  currentStepIdx === 1 ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10 scale-105' :
                  currentStepIdx > 1 ? 'bg-slate-900/60 border-emerald-900/30 opacity-70' :
                  'bg-slate-900/20 border-slate-800 opacity-40'
                }`}>
                  <div className={`p-1.5 rounded-lg ${currentStepIdx >= 1 ? 'bg-emerald-600/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div className="text-[10px] truncate leading-tight">
                    <span className="font-bold block text-white">Aggregator Inflow</span>
                    <span className="text-[8px] text-slate-400">Bank Flow Token</span>
                  </div>
                </div>

                {/* UPI Node */}
                <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all duration-300 ${
                  currentStepIdx === 2 ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10 scale-105' :
                  currentStepIdx > 2 ? 'bg-slate-900/60 border-emerald-900/30 opacity-70' :
                  'bg-slate-900/20 border-slate-800 opacity-40'
                }`}>
                  <div className={`p-1.5 rounded-lg ${currentStepIdx >= 2 ? 'bg-emerald-600/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Database className="w-4 h-4" />
                  </div>
                  <div className="text-[10px] truncate leading-tight">
                    <span className="font-bold block text-white">UPI QR Payments</span>
                    <span className="text-[8px] text-slate-400">Merchant Nodes</span>
                  </div>
                </div>

                {/* EPFO Node */}
                <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all duration-300 ${
                  currentStepIdx === 3 ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10 scale-105' :
                  currentStepIdx > 3 ? 'bg-slate-900/60 border-emerald-900/30 opacity-70' :
                  'bg-slate-900/20 border-slate-800 opacity-40'
                }`}>
                  <div className={`p-1.5 rounded-lg ${currentStepIdx >= 3 ? 'bg-emerald-600/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-[10px] truncate leading-tight">
                    <span className="font-bold block text-white">EPFO Registry</span>
                    <span className="text-[8px] text-slate-400">Payroll headcounts</span>
                  </div>
                </div>
              </div>

              {/* Central AI processing Hub */}
              <div className="mt-8 relative flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-500 ${
                  currentStepIdx >= 4 ? 'bg-brand-saffron-500/10 border-brand-saffron-500 glow-saffron shadow-lg' : 'bg-slate-900 border-slate-800'
                }`}>
                  <Cpu className={`w-8 h-8 ${currentStepIdx >= 4 ? 'text-brand-saffron-500 animate-spin-slow' : 'text-slate-600'}`} />
                </div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2 block">
                  CreditPulse Engine
                </span>
                
                {/* Scoring reveal overlay */}
                {currentStepIdx >= 5 && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-[-70px] bg-slate-900/95 border border-brand-green-500/40 p-2.5 rounded-xl text-center shadow-2xl min-w-[130px]"
                  >
                    <span className="text-[8px] text-slate-400 uppercase block font-semibold">Live Score Reveal</span>
                    <div className="text-xl font-black text-brand-green-400 font-display mt-0.5">
                      {targetMsme?.score?.composite_score}/100
                    </div>
                    <span className="text-[8px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase mt-1 inline-block">
                      Grade {targetMsme?.score?.grade}
                    </span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Narrative, Logs & Title Column */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Step Icon and Title */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-lg">
                    {currentStep.icon}
                  </div>
                  <div>
                    <span className="text-[8px] text-brand-saffron-500 uppercase tracking-widest font-bold block">
                      Active Presentation Pipeline
                    </span>
                    <h3 className="text-base font-bold font-display text-white mt-0.5">
                      {currentStep.title}
                    </h3>
                  </div>
                </div>

                {/* Narrative Explanation */}
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {currentStep.narrative}
                  </p>
                </div>
              </div>

              {/* Real-time System Terminal Logs */}
              <div className="space-y-1.5 font-mono text-[9px] text-slate-400 bg-slate-900 border border-slate-900/50 p-4 rounded-xl max-h-36 overflow-y-auto flex-1">
                {logs.map((log, i) => (
                  <div key={i} className={log.startsWith('[SYSTEM]') ? 'text-brand-saffron-400' : log.startsWith('[SKIP]') ? 'text-slate-500' : 'text-emerald-400'}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};
export default DemoMode;
