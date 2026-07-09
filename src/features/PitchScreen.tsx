import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, TrendingUp, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';

interface PitchScreenProps {
  onEnter: () => void;
}

export const PitchScreen: React.FC<PitchScreenProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-8 relative overflow-hidden grid-bg">
      {/* Background radial glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-brand-green-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-saffron-500/10 blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-green-500 flex items-center justify-center font-display text-white font-bold text-lg shadow-lg shadow-brand-green-500/20">
            ⚡
          </div>
          <div>
            <span className="font-display font-bold text-base tracking-tight text-white">CreditPulse</span>
            <span className="text-[10px] block text-brand-green-400 font-semibold uppercase tracking-wider mt-[-2px]">
              IDBI Hackathon 2026
            </span>
          </div>
        </div>
        <div className="px-3 py-1 bg-slate-800 border border-slate-700/80 rounded-full text-xs text-slate-300 font-semibold flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-brand-saffron-500" />
          Track 03: Financial Health Score
        </div>
      </div>

      {/* Body Core */}
      <div className="max-w-5xl mx-auto my-auto z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full py-8">
        {/* Left column: Hook & Problem */}
        <div className="lg:col-span-7 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-green-500/10 border border-brand-green-500/20 text-brand-green-400 text-xs font-semibold rounded-full"
          >
            <Sparkles className="w-3 h-3 text-brand-saffron-500" />
            AI-Powered MSME Underwriting
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl lg:text-5xl font-extrabold font-display leading-[1.1] tracking-tight text-white"
          >
            Unlocking MSME Credit via <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green-400 to-brand-saffron-400">Alternate Data</span> Intelligence
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm text-slate-400 leading-relaxed"
          >
            Traditional lending relies heavily on audited balance sheets, credit history, and tax returns. Over 80% of Indian MSMEs are "New-to-Credit" (NTC) or "New-to-Bank" (NTB) — leaving them credit-invisible. CreditPulse bridges this gap by converting real-time operational signals into loan decisions.
          </motion.p>

          {/* Problem vs. Solution Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" />
                The Core Friction
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Absence of collateral, poor bookkeeping, high interest informal debt, and manual RM-led appraisal cycles taking 15+ days.
              </p>
            </div>

            <div className="p-4 bg-brand-green-950/20 border border-brand-green-800/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-brand-green-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle className="w-4 h-4" />
                The CreditPulse Solution
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                A dynamic 5-pillar Credit Health Card aggregating consented GSTIN, UPI QRs, Account Aggregator, and EPFO data.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right column: Impact Numbers & CTA */}
        <div className="lg:col-span-5 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="p-6 bg-slate-850/80 border border-slate-800 rounded-2xl space-y-6 shadow-2xl relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green-500/5 rounded-full blur-2xl" />

            <h3 className="text-base font-bold font-display text-white border-b border-slate-800 pb-3">
              Targeted Presentation Metrics
            </h3>

            {/* Metrics */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Credit invisible reach
                  </span>
                  <div className="text-sm font-semibold text-slate-200">Financial Inclusion</div>
                </div>
                <div className="text-2xl font-bold font-display text-brand-green-400">+45%</div>
              </div>

              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Appraisal Lead Time
                  </span>
                  <div className="text-sm font-semibold text-slate-200">From 14 Days to Real-Time</div>
                </div>
                <div className="text-2xl font-bold font-display text-brand-green-400">-90%</div>
              </div>

              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Portfolio Quality
                  </span>
                  <div className="text-sm font-semibold text-slate-200">Default Risk Mitigation</div>
                </div>
                <div className="text-2xl font-bold font-display text-brand-saffron-500">-25%</div>
              </div>
            </div>

            {/* Enter Button */}
            <button
              onClick={onEnter}
              className="w-full py-3.5 px-4 bg-brand-green-600 hover:bg-brand-green-700 text-white rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 group shadow-lg shadow-brand-green-500/10"
            >
              Enter Interactive Platform
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 border-t border-slate-800/80 pt-6 z-10">
        <div>
          © 2026 CreditPulse — Designed & built for IDBI Bank Innovation Challenge.
        </div>
        <div className="flex gap-4">
          <span>Unified Lending Interface (ULI) Ready</span>
          <span>Account Aggregator (AA) Compatible</span>
          <span>OCEN Compliant</span>
        </div>
      </div>
    </div>
  );
};
export default PitchScreen;
