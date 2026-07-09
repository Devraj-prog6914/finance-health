import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sliders, RefreshCw, Landmark, AlertCircle, Award, Sparkles, TrendingUp, Save } from 'lucide-react';
import { MSME } from '../types';

interface WhatIfSimulatorProps {
  msmes: MSME[];
}

interface SimulatorState {
  revenue: number;
  gstDelay: number;
  inflowOutflow: number;
  bounces: number;
  odUtil: number;
  vintage: number;
  employees: number;
}

interface SavedScenario extends SimulatorState {
  name: string;
  score: number;
  grade: string;
  risk: string;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ msmes }) => {
  const [selectedMsmeId, setSelectedMsmeId] = useState<string>('');
  
  // Sliders Initial State (Defaults)
  const [sliders, setSliders] = useState<SimulatorState>({
    revenue: 30,
    gstDelay: 2,
    inflowOutflow: 1.15,
    bounces: 0,
    odUtil: 30,
    vintage: 5,
    employees: 12,
  });

  // Outputs
  const [computedScore, setComputedScore] = useState(72);
  const [computedGrade, setComputedGrade] = useState('B');
  const [computedRisk, setComputedRisk] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [loanEligibility, setLoanEligibility] = useState(25);
  const [rateBand, setRateBand] = useState('11.5% - 13.0%');
  const [cfoInsight, setCfoInsight] = useState('');

  // Scenarios list
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [scenarioNameInput, setScenarioNameInput] = useState('');

  // When selected MSME changes, load its actual metrics
  useEffect(() => {
    if (selectedMsmeId) {
      loadActualMsmeData(selectedMsmeId);
    }
  }, [selectedMsmeId]);

  const loadActualMsmeData = async (id: string) => {
    try {
      const response = await fetch(`/api/msmes/${id}`);
      const data = await response.json();
      if (response.ok) {
        const gst = data.records.find((r: any) => r.source_type === 'GST');
        const aa = data.records.find((r: any) => r.source_type === 'AA');
        const epfo = data.records.find((r: any) => r.source_type === 'EPFO');

        const monthlyGst = gst?.raw_metrics?.monthly_data || [];
        const monthlyAa = aa?.raw_metrics?.monthly_data || [];

        const avgRev = monthlyGst.reduce((sum: number, d: any) => sum + d.value, 0) / (monthlyGst.length || 1);
        const avgDelay = monthlyGst.reduce((sum: number, d: any) => sum + (d.filed_delay_days || 0), 0) / (monthlyGst.length || 1);
        
        const totalIn = monthlyAa.reduce((sum: number, d: any) => sum + (d.inflow || 0), 0);
        const totalOut = monthlyAa.reduce((sum: number, d: any) => sum + (d.outflow || 0), 0);
        const io = totalOut > 0 ? totalIn / totalOut : 1.1;

        const bouncesCount = monthlyAa.reduce((sum: number, d: any) => sum + (d.bounce_count || 0), 0);
        const avgOD = monthlyAa.reduce((sum: number, d: any) => sum + (d.overdraft_utilization_pct || 0), 0) / (monthlyAa.length || 1);

        setSliders({
          revenue: Math.round(avgRev),
          gstDelay: Math.round(avgDelay),
          inflowOutflow: parseFloat(io.toFixed(2)),
          bounces: bouncesCount,
          odUtil: Math.round(avgOD),
          vintage: data.msme.vintage_years,
          employees: data.msme.employee_count,
        });
      }
    } catch (err) {
      console.error("Error loading actual MSME data into simulator:", err);
    }
  };

  // Recompute score whenever sliders change
  useEffect(() => {
    calculateScore();
  }, [sliders]);

  const calculateScore = () => {
    // 1. Revenue subscore (growth proxy + scale)
    const revScale = Math.min(100, 40 + sliders.revenue * 0.8);
    const revVol = Math.max(10, 100 - sliders.gstDelay * 2.5);
    const revenueScore = Math.round(revScale * 0.4 + revVol * 0.6);

    // 2. Cash Flow health
    const ioScore = Math.max(10, Math.min(100, Math.round(((sliders.inflowOutflow - 0.8) / 0.7) * 100)));
    const odScore = 100 - sliders.odUtil;
    const bounceScore = Math.max(0, 100 - sliders.bounces * 15);
    const cashFlowScore = Math.round(ioScore * 0.3 + odScore * 0.3 + bounceScore * 0.4);

    // 3. Compliance
    const gstDelayScore = Math.max(10, 100 - sliders.gstDelay * 3);
    const epfoScore = sliders.employees > 10 ? 95 : 75;
    const complianceScore = Math.round(gstDelayScore * 0.7 + epfoScore * 0.3);

    // 4. Stability
    const vintageScore = Math.min(100, sliders.vintage * 10);
    const empTrend = Math.min(100, 50 + sliders.employees * 1.5);
    const stabilityScore = Math.round(vintageScore * 0.6 + empTrend * 0.4);

    // 5. Repayment Capacity
    const surplusRatio = sliders.inflowOutflow - 1.0;
    const surplusScore = Math.max(10, Math.min(100, Math.round((surplusRatio + 0.1) * 300)));
    const repayScore = Math.round(surplusScore * 0.7 + (100 - sliders.odUtil * 0.3) * 0.3);

    // Composite math
    const composite = Math.round(
      revenueScore * 0.25 +
      cashFlowScore * 0.25 +
      complianceScore * 0.20 +
      stabilityScore * 0.15 +
      repayScore * 0.15
    );

    setComputedScore(composite);

    // Grade and risk mappings
    let grade = 'B';
    if (composite >= 90) grade = 'A+';
    else if (composite >= 80) grade = 'A';
    else if (composite >= 70) grade = 'B';
    else if (composite >= 60) grade = 'C';
    else grade = 'D';
    setComputedGrade(grade);

    let band: 'Low' | 'Medium' | 'High' = 'Medium';
    if (composite >= 80) band = 'Low';
    else if (composite >= 60) band = 'Medium';
    else band = 'High';
    setComputedRisk(band);

    // Loan eligibility suggested limit
    const eligibilityMultiplier = composite / 75;
    const baseLimit = sliders.revenue * 0.65;
    const computedLimit = Math.max(0, parseFloat((baseLimit * eligibilityMultiplier).toFixed(1)));
    setLoanEligibility(composite >= 60 ? computedLimit : 0);

    // Rates
    if (composite >= 80) setRateBand('9.2% - 10.5%');
    else if (composite >= 60) setRateBand('11.5% - 13.0%');
    else setRateBand('N/A');

    // Dynamic CFO advice text
    let insight = '';
    if (sliders.bounces > 0) {
      insight = `⚠️ **Cheque Bounces Detected**: The ${sliders.bounces} ECS bounce(s) impose a severe bank penalty, cutting cash flow sub-metrics. Clear balances 2 days prior to debit dates.`;
    } else if (sliders.odUtil > 75) {
      insight = `⚠️ **High OD Drag**: Overdraft usage at ${sliders.odUtil}% leaves no working capital reserve. Reduce utilization below 50% to recover +8 points in Cash Flow Health.`;
    } else if (sliders.gstDelay > 8) {
      insight = `⚠️ **Compliance Drag**: Filing GST GSTR-3B with an average of ${sliders.gstDelay} days delay drags compliance score down. Automate filings to gain +6 points.`;
    } else if (composite >= 80) {
      insight = `✨ **Superb Health Indicators**: Low OD utilization, perfect payment tracks, and steady revenues position the MSME for prime banking interest rates.`;
    } else {
      insight = `👍 **Moderate Profile**: Working capital and revenues are steady. Consider consolidating secondary bank statements to increase repayment capacity calculations.`;
    }
    setCfoInsight(insight);
  };

  const saveScenario = () => {
    if (!scenarioNameInput.trim()) return;
    const newScenario: SavedScenario = {
      ...sliders,
      name: scenarioNameInput,
      score: computedScore,
      grade: computedGrade,
      risk: computedRisk,
    };
    setSavedScenarios(prev => [...prev, newScenario].slice(-3)); // limit to 3 saved scenarios
    setScenarioNameInput('');
  };

  const loadScenario = (s: SavedScenario) => {
    setSliders({
      revenue: s.revenue,
      gstDelay: s.gstDelay,
      inflowOutflow: s.inflowOutflow,
      bounces: s.bounces,
      odUtil: s.odUtil,
      vintage: s.vintage,
      employees: s.employees,
    });
  };

  const resetToActual = () => {
    setSelectedMsmeId('');
    setSliders({
      revenue: 30,
      gstDelay: 2,
      inflowOutflow: 1.15,
      bounces: 0,
      odUtil: 30,
      vintage: 5,
      employees: 12,
    });
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-5 rounded-2xl">
        <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-brand-green-600 dark:text-brand-green-500" />
          Interactive What-If Score Simulator
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Tweak alternate operational data inputs and witness how the credit evaluation score and pre-approved limits dynamically shift.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sliders */}
        <div className="lg:col-span-6 glass-card p-6 rounded-2xl space-y-6">
          {/* MSME selector to load actual values */}
          <div className="flex gap-4 items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <select
              value={selectedMsmeId}
              onChange={e => setSelectedMsmeId(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green-500"
            >
              <option value="" className="text-slate-500 dark:text-slate-400">-- Load Actual MSME Ledger Data --</option>
              {msmes.map(m => (
                <option key={m.id} value={m.id} className="text-slate-800 dark:text-slate-200 dark:bg-slate-800">{m.name}</option>
              ))}
            </select>
            {(selectedMsmeId || sliders.revenue !== 30) && (
              <button
                onClick={resetToActual}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Slider 1: Revenue */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-650">
                <span className="text-slate-700 dark:text-slate-350">Avg Monthly Turnover (GST)</span>
                <span className="font-bold text-slate-900 dark:text-white">INR {sliders.revenue} Lakhs</span>
              </div>
              <input
                type="range"
                min={1}
                max={150}
                value={sliders.revenue}
                onChange={e => setSliders({ ...sliders, revenue: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-green-600"
              />
            </div>

            {/* Slider 2: GST Delay */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-650">
                <span className="text-slate-700 dark:text-slate-350">Average GST filing delay</span>
                <span className="font-bold text-slate-900 dark:text-white">{sliders.gstDelay} Days Late</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={sliders.gstDelay}
                onChange={e => setSliders({ ...sliders, gstDelay: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-green-600"
              />
            </div>

            {/* Slider 3: Inflow/Outflow ratio */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-650">
                <span className="text-slate-700 dark:text-slate-350">Bank Statement Inflow / Outflow Ratio</span>
                <span className="font-bold text-slate-900 dark:text-white">{sliders.inflowOutflow}x</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.5}
                step={0.05}
                value={sliders.inflowOutflow}
                onChange={e => setSliders({ ...sliders, inflowOutflow: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-green-600"
              />
            </div>

            {/* Slider 4: ECS Bounces */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-650">
                <span className="text-slate-700 dark:text-slate-350">ECS / Cheque Bounces (12 Mo)</span>
                <span className="font-bold text-slate-900 dark:text-white">{sliders.bounces} Bounces</span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                value={sliders.bounces}
                onChange={e => setSliders({ ...sliders, bounces: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-green-600"
              />
            </div>

            {/* Slider 5: OD Util */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-650">
                <span className="text-slate-700 dark:text-slate-350">Average Overdraft Utilization</span>
                <span className="font-bold text-slate-900 dark:text-white">{sliders.odUtil}% Used</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={sliders.odUtil}
                onChange={e => setSliders({ ...sliders, odUtil: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-green-600"
              />
            </div>

            {/* Slider 6: Vintage */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-650">
                <span className="text-slate-700 dark:text-slate-350">Operational Vintage Years</span>
                <span className="font-bold text-slate-900 dark:text-white">{sliders.vintage} Years</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={sliders.vintage}
                onChange={e => setSliders({ ...sliders, vintage: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-green-600"
              />
            </div>

            {/* Slider 7: Employees */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-650">
                <span className="text-slate-700 dark:text-slate-350">Active Employees registered</span>
                <span className="font-bold text-slate-900 dark:text-white">{sliders.employees} Pax</span>
              </div>
              <input
                type="range"
                min={1}
                max={60}
                value={sliders.employees}
                onChange={e => setSliders({ ...sliders, employees: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-green-600"
              />
            </div>
          </div>

          {/* Scenario Saving Panel */}
          <div className="border-t border-slate-150 dark:border-slate-800 pt-4 flex gap-2">
            <input
              type="text"
              placeholder="Scenario Name (e.g. 10% Growth)"
              value={scenarioNameInput}
              onChange={e => setScenarioNameInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green-500"
            />
            <button
              onClick={saveScenario}
              disabled={!scenarioNameInput.trim()}
              className="px-4 py-2 bg-brand-green-600 hover:bg-brand-green-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1 shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              Save Scenario
            </button>
          </div>
        </div>

        {/* Right Column: Live Output Indicators */}
        <div className="lg:col-span-6 space-y-6">
          {/* Main output scorecard */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Simulated Health Card
                </span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <h2 className="text-5xl font-extrabold font-display text-brand-green-400">
                    {computedScore}
                  </h2>
                  <span className="text-sm text-slate-500">/100</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-3 inline-block ${
                  computedRisk === 'Low' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                  computedRisk === 'Medium' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                  'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {computedRisk} Risk Level
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Credit Grade
                </span>
                <div className="text-6xl font-black font-display text-white mt-1">
                  {computedGrade}
                </div>
              </div>
            </div>

            {/* Loan Readiness Segmented Bar */}
            <div className="space-y-2 border-t border-slate-800 pt-4">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-400">Pre-approved Borrowing Capacity</span>
                <span className="font-bold text-white">
                  {loanEligibility > 0 ? `INR ${loanEligibility} Lakhs` : 'Not Eligible'}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                <div className={`h-full rounded-l-full transition-all ${
                  computedScore >= 60 ? 'bg-brand-green-500' : 'bg-slate-700'
                }`} style={{ width: `${Math.min(100, (loanEligibility / 50) * 100)}%` }} />
              </div>
              <div className="flex justify-between items-baseline text-[9px] text-slate-500">
                <span>Interest Band: {rateBand}</span>
                <span>Max Capacity Limit: 100L</span>
              </div>
            </div>

            {/* CFO Real-time Insight */}
            <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl space-y-2 flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-brand-saffron-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="text-[9px] font-bold text-brand-saffron-500 uppercase tracking-wider block">
                  AI CFO Real-Time Feedback
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans mt-0.5">
                  {cfoInsight.replace(/\*\*/g, '').replace(/`/g, '')}
                </p>
              </div>
            </div>
          </div>

          {/* Saved Scenarios Comparison */}
          {savedScenarios.length > 0 && (
            <div className="glass-card p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold font-display text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-brand-green-500" />
                Scenario Comparison ledger (Max 3)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {savedScenarios.map((sc, i) => (
                  <div
                    key={i}
                    onClick={() => loadScenario(sc)}
                    className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 hover:border-brand-green-400 dark:hover:border-brand-green-500 rounded-xl cursor-pointer transition-all space-y-2 relative"
                  >
                    <div className="text-[10px] font-bold text-slate-900 dark:text-white truncate pr-4">
                      {sc.name}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold font-display text-brand-green-600 dark:text-brand-green-400">
                        {sc.score}
                      </span>
                      <span className="text-[9px] text-slate-400">({sc.grade})</span>
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase font-semibold">
                      {sc.risk} Risk
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default WhatIfSimulator;
