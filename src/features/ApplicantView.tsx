import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, ShieldAlert, CheckCircle, ArrowRight, Sparkles, Compass, Activity, CheckSquare, Coins, Landmark, RefreshCw, Loader2, TrendingUp } from 'lucide-react';
import { MSME, FullMSMEDetails } from '../types';

interface ApplicantViewProps {
  msmes: MSME[];
  onOpenCopilot: (msme: MSME) => void;
}

interface ChecklistItem {
  id: string;
  action: string;
  impact: number;
  timeline: string;
  checked: boolean;
}

export const ApplicantView: React.FC<ApplicantViewProps> = ({ msmes, onOpenCopilot }) => {
  const [selectedId, setSelectedId] = useState<string>(msmes[1]?.id || msmes[0]?.id || '');
  const [details, setDetails] = useState<FullMSMEDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  // Gamified Checklist State
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    if (selectedId) {
      fetchDetails(selectedId);
    }
  }, [selectedId]);

  const fetchDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/msmes/${id}`);
      const data = await response.json();
      if (response.ok) {
        setDetails(data);
        setIsApplied(false); // reset button state

        // Initialize gamified checklist from the MSME recommendations
        if (data.explanation && data.explanation.recommendations) {
          const items = data.explanation.recommendations.map((r: any, idx: number) => ({
            id: `item-${idx}`,
            action: r.action,
            impact: r.expected_impact,
            timeline: r.timeline,
            checked: false
          }));
          setChecklist(items);
        } else {
          setChecklist([]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setIsApplied(true);
    }, 1500);
  };

  const handleCheckToggle = (id: string) => {
    setChecklist(prev =>
      prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
    );
  };

  // Calculate dynamic outputs based on checked gamified checklist items
  const getDynamicOutputs = () => {
    if (!details || !details.score) return { score: 0, grade: 'C', risk: 'Medium', amount: 0 };
    const baseScore = details.score.composite_score;
    const checkedImpact = checklist.filter(c => c.checked).reduce((sum, c) => sum + c.impact, 0);
    const finalScore = Math.min(100, baseScore + checkedImpact);

    let finalGrade = 'B';
    if (finalScore >= 90) finalGrade = 'A+';
    else if (finalScore >= 80) finalGrade = 'A';
    else if (finalScore >= 70) finalGrade = 'B';
    else if (finalScore >= 60) finalGrade = 'C';
    else finalGrade = 'D';

    let finalRisk: 'Low' | 'Medium' | 'High' = 'Medium';
    if (finalScore >= 80) finalRisk = 'Low';
    else if (finalScore >= 60) finalRisk = 'Medium';
    else finalRisk = 'High';

    // Limit adjustments based on score boost
    const baseAmount = details.recommendation?.suggested_amount || 0;
    const multiplier = finalScore / baseScore;
    const finalAmount = baseScore > 0 ? parseFloat((baseAmount * multiplier).toFixed(1)) : 0;

    return {
      score: finalScore,
      grade: finalGrade,
      risk: finalRisk,
      amount: finalAmount
    };
  };

  const dynamicStats = getDynamicOutputs();

  // Cash Runway Calculations (Simulated based on cash flow logs)
  const getRunwayMetrics = () => {
    if (!details || !details.records) return { runway: 'N/A', margin: 'N/A', gap: 'N/A' };
    const aaRecord = details.records.find(r => r.source_type === 'AA');
    if (!aaRecord || !aaRecord.raw_metrics.monthly_data) return { runway: 'N/A', margin: 'N/A', gap: 'N/A' };

    const data = aaRecord.raw_metrics.monthly_data;
    const recentMonth = data[data.length - 1] || { inflow: 10, outflow: 9, value: 1.5 };
    
    // Average Monthly Inflow & Outflow
    const avgIn = data.reduce((sum, d) => sum + (d.inflow || 0), 0) / data.length;
    const avgOut = data.reduce((sum, d) => sum + (d.outflow || 0), 0) / data.length;
    const avgBal = data.reduce((sum, d) => sum + d.value, 0) / data.length;

    const burnRate = avgOut - avgIn;
    let runway = 'Infinite (Cash Surplus)';
    if (burnRate > 0) {
      runway = `${(avgBal / burnRate).toFixed(1)} Months`;
    } else {
      runway = `${Math.min(12, Math.round((avgBal / (avgOut * 0.1)) * 10)) / 10} Months`; // safety runway buffer
    }

    const cashMargin = avgIn > 0 ? ((avgIn - avgOut) / avgIn) * 100 : 5;
    const marginText = `${cashMargin > 0 ? '+' : ''}${cashMargin.toFixed(1)}%`;

    const gap = burnRate > 0 ? `INR ${(burnRate * 3).toFixed(1)}L (90d projection)` : 'Zero Gap (Stable)';

    return {
      runway,
      margin: marginText,
      gap
    };
  };

  const runwayMetrics = getRunwayMetrics();

  // Helper for SVG Gauge Needle
  const getNeedleRotation = (score: number) => {
    const angle = -90 + (180 * score) / 100;
    return `rotate(${angle} 100 100)`;
  };

  return (
    <div className="space-y-6">
      {/* Header and Selector */}
      <div className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            MSME Applicant Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Democratizing credit scores. View indicators, learn how to build creditworthiness, and access pre-approved lines.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold shrink-0">Demo Business:</span>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green-500 flex-1 sm:w-60"
          >
            {msmes.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading || !details ? (
        <div className="flex flex-col items-center justify-center p-12 text-center h-[350px]">
          <Loader2 className="w-8 h-8 text-brand-green-600 animate-spin mb-3" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Retrieving Portal Profile...</h4>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Credit Score details & Interactive Checklist */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Health Score Overview with SVG dial indicator */}
            <div className="glass-card p-6 rounded-2xl space-y-5">
              <h3 className="text-xs font-bold font-display text-slate-900 dark:text-white uppercase tracking-wider">
                Your Credit Health Assessment
              </h3>
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="space-y-2 text-center sm:text-left">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Dynamic Health Score
                  </span>
                  <div className="flex items-baseline justify-center sm:justify-start gap-1.5">
                    <h2 className="text-5xl font-black font-display text-brand-green-600 dark:text-brand-green-400">
                      {dynamicStats.score}
                    </h2>
                    <span className="text-sm text-slate-400">/100</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block ${
                    dynamicStats.risk === 'Low' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' :
                    dynamicStats.risk === 'Medium' ? 'bg-orange-50 text-orange-850 dark:bg-orange-950/20 dark:text-orange-400' :
                    'bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-450'
                  }`}>
                    {dynamicStats.risk} Credit Risk
                  </span>
                </div>

                {/* SVG Gauge Visual dial */}
                <div className="relative w-36 h-20 overflow-hidden shrink-0 scale-95">
                  <svg width="150" height="150" className="mx-auto">
                    <path
                      d="M 15 75 A 60 60 0 0 1 135 75"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 15 75 A 60 60 0 0 1 135 75"
                      fill="none"
                      stroke="#0B6E4F"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${(Math.PI * 60 * dynamicStats.score) / 100} 200`}
                      className="transition-all duration-700 ease-out"
                    />
                    <g transform={getNeedleRotation(dynamicStats.score)}>
                      <line x1="75" y1="75" x2="75" y2="25" stroke="#F26522" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="75" cy="75" r="6" fill="#F26522" />
                    </g>
                  </svg>
                </div>

                <div className="text-center sm:text-right p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Credit Grade</span>
                  <div className="text-4xl font-extrabold font-display text-slate-800 dark:text-white mt-1">
                    {dynamicStats.grade}
                  </div>
                </div>
              </div>

              {/* Indicator bars */}
              {details.score && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium">
                      <span className="text-slate-600 dark:text-slate-400">Revenue Stability</span>
                      <span className="font-bold text-slate-800 dark:text-white">{details.score.dimension_scores.revenue_stability}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <div className="h-full bg-brand-green-600 rounded-full" style={{ width: `${details.score.dimension_scores.revenue_stability}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium">
                      <span className="text-slate-600 dark:text-slate-400">Cash Flow Operations</span>
                      <span className="font-bold text-slate-800 dark:text-white">{details.score.dimension_scores.cash_flow_health}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <div className="h-full bg-brand-green-600 rounded-full" style={{ width: `${details.score.dimension_scores.cash_flow_health}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium">
                      <span className="text-slate-600 dark:text-slate-400">GST & Payroll Compliance</span>
                      <span className="font-bold text-slate-800 dark:text-white">{details.score.dimension_scores.compliance_formalization}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <div className="h-full bg-brand-green-600 rounded-full" style={{ width: `${details.score.dimension_scores.compliance_formalization}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Gamified Score Builder Checklist */}
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="text-xs font-bold font-display text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4.5 h-4.5 text-brand-saffron-500" />
                  Interactive Score builder checklist
                </h3>
                <p className="text-[10px] text-slate-450 mt-1 leading-normal">
                  Check recommendation items below to simulate how implementing these compliance or banking actions increases your credit score and pre-approved limits.
                </p>
              </div>
              
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleCheckToggle(item.id)}
                    className={`p-3 border rounded-xl flex items-start justify-between gap-4 cursor-pointer transition-all ${
                      item.checked
                        ? 'border-brand-green-500 bg-brand-green-50/10 dark:bg-brand-green-950/15'
                        : 'border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 bg-slate-50/10'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => {}} // toggle handled by parent div click
                        className="w-4 h-4 text-brand-green-600 border-slate-350 dark:border-slate-700 rounded focus:ring-brand-green-500 mt-0.5 shrink-0 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-normal">
                          {item.action}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">
                          Target: {item.timeline}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider block ${
                        item.checked
                          ? 'bg-brand-green-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-450'
                      }`}>
                        +{item.impact} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Pre-approved Limits sandbox & Runway Indicators */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Cash Flow Runway and Working Capital metrics */}
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold font-display text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4.5 h-4.5 text-brand-green-600" />
                Working Capital & Cash Runway
              </h3>
              
              <div className="space-y-3.5">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Cash Flow Runway</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{runwayMetrics.runway}</span>
                  </div>
                  <Coins className="w-5 h-5 text-brand-green-600 dark:text-brand-green-450 shrink-0" />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Operating Cash Margin</span>
                    <span className={`font-bold mt-0.5 block ${runwayMetrics.margin.startsWith('+') ? 'text-brand-green-600' : 'text-rose-500'}`}>
                      {runwayMetrics.margin}
                    </span>
                  </div>
                  <TrendingUp className="w-5 h-5 text-brand-green-600 dark:text-brand-green-450 shrink-0" />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Working Capital Gap</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{runwayMetrics.gap}</span>
                  </div>
                  <Landmark className="w-5 h-5 text-brand-saffron-500 shrink-0" />
                </div>
              </div>
            </div>

            {/* Pre-approved Limits sandbox */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white space-y-6 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green-500/10 rounded-full blur-2xl pointer-events-none" />

              <h3 className="text-xs font-bold font-display text-slate-400 uppercase tracking-wider">
                Pre-Approved Funding Sandbox
              </h3>

              {details.recommendation && details.score && dynamicStats.score >= 60 ? (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Maximum Pre-Approved Limit</span>
                    <h2 className="text-4xl font-extrabold font-display text-white mt-1">
                      INR {dynamicStats.amount} Lakhs
                    </h2>
                    <p className="text-[10px] text-brand-green-400 font-medium mt-1">
                      Under Scheme: {details.recommendation.product_type}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-800 py-4">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase">Interest Rate Band</span>
                      <span className="text-xs font-bold text-slate-200">{details.recommendation.suggested_rate_band}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase">Collateral Required</span>
                      <span className="text-xs font-bold text-slate-200">Zero (CGTMSE Covered)</span>
                    </div>
                  </div>

                  {isApplied ? (
                    <div className="p-4 bg-emerald-950/20 border border-emerald-800/20 text-emerald-400 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4.5 h-4.5" />
                      Application Submitted to IDBI RM!
                    </div>
                  ) : (
                    <button
                      onClick={handleApply}
                      disabled={isApplying}
                      className="w-full py-3 px-4 bg-brand-green-600 hover:bg-brand-green-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
                    >
                      {isApplying ? 'Processing Application...' : 'Drawdown Credit Line'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-center py-6">
                  <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-200">Credit Line Currently Blocked</h4>
                  <p className="text-xs text-slate-400 max-w-[220px] mx-auto">
                    Your current score is below the lending threshold (60/100). Take the actions detailed in the guide to unlock limits.
                  </p>
                </div>
              )}
            </div>

            {/* Virtual CFO Floating Card */}
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold font-display text-slate-900 dark:text-white uppercase tracking-wider">
                Your AI CFO Assistant
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Stuck on understanding a compliance term or need a custom plan? Chat directly with the CreditPulse CFO Bot.
              </p>
              <button
                onClick={() => onOpenCopilot(details.msme)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 text-slate-700"
              >
                Launch Virtual CFO Chat
                <Sparkles className="w-3.5 h-3.5 text-brand-saffron-500 animate-pulse" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ApplicantView;


