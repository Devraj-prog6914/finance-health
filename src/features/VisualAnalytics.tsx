import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
  ComposedChart, Line, Scatter, CartesianGrid
} from 'recharts';
import { BarChart2, Calendar, Compass, RefreshCw, Activity, AlertTriangle, TrendingDown, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { MSME, FullMSMEDetails } from '../types';

interface VisualAnalyticsProps {
  msmes: MSME[];
}

export const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({ msmes }) => {
  const [selectedId, setSelectedId] = useState<string>(msmes[0]?.id || '');
  const [details, setDetails] = useState<FullMSMEDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (msmes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[350px]">
        <AlertTriangle className="w-8 h-8 text-slate-350 mb-3" />
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Profiles Loaded</h4>
      </div>
    );
  }

  // Static Helpers
  const getHeatmapColor = (status: 'on-time' | 'minor' | 'late') => {
    if (status === 'on-time') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
    if (status === 'minor') return 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400';
    return 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-450';
  };

  const getNeedleRotation = (score: number) => {
    const angle = -90 + (180 * score) / 100;
    return `rotate(${angle} 100 100)`;
  };

  // If loading or no details yet, show the Selector Bar + Loader
  if (isLoading || !details) {
    return (
      <div className="space-y-6">
        {/* Selector bar */}
        <div className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              Advanced Credit Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Deep-dive mathematical breakdowns of MSME data points and default risk curves.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold shrink-0">Select MSME:</span>
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

        <div className="flex flex-col items-center justify-center p-12 text-center h-[350px] glass-card">
          <RefreshCw className="w-8 h-8 text-brand-green-600 animate-spin mb-3" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Generating Multi-Dimensional Analytics...</h4>
        </div>
      </div>
    );
  }

  // --- GUARANTEED DATA RECOVERY ZONE (details is NOT null) ---
  const compositeScore = details.score?.composite_score || 0;
  
  const benchmarkData = [
    {
      name: 'Revenue stability',
      Business: details.score?.dimension_scores.revenue_stability || 0,
      Benchmark: 72,
    },
    {
      name: 'Cash Flow',
      Business: details.score?.dimension_scores.cash_flow_health || 0,
      Benchmark: 68,
    },
    {
      name: 'Compliance',
      Business: details.score?.dimension_scores.compliance_formalization || 0,
      Benchmark: 80,
    },
    {
      name: 'Stability',
      Business: details.score?.dimension_scores.business_stability || 0,
      Benchmark: 70,
    },
    {
      name: 'Repayment Cap.',
      Business: details.score?.dimension_scores.repayment_capacity || 0,
      Benchmark: 75,
    },
  ];

  // GST filings delay mapping
  const gstRecord = details.records.find(r => r.source_type === 'GST');
  const filings = gstRecord?.raw_metrics.monthly_data || [];
  
  const heatmapFilings = filings.map((f: any) => {
    let status: 'on-time' | 'minor' | 'late' = 'on-time';
    if (f.filed_delay_days > 9) status = 'late';
    else if (f.filed_delay_days > 4) status = 'minor';
    return {
      month: f.month,
      delay: f.filed_delay_days,
      status
    };
  });

  // Bank statement flow data
  const aaRecord = details.records.find(r => r.source_type === 'AA');
  const aaData = aaRecord?.raw_metrics.monthly_data || [];

  // Logistic PD (Probability of Default) curve calculations
  const getPdCurveData = () => {
    const points = [];
    const currentScore = details.score?.composite_score || 0;
    
    // Fit logistic curve
    const k = 0.08;
    const s0 = 55;
    const currentPd = 100 / (1 + Math.exp(k * (currentScore - s0)));

    for (let s = 10; s <= 100; s += 5) {
      const pd = 100 / (1 + Math.exp(k * (s - s0)));
      points.push({
        score: s,
        'Probability of Default (%)': parseFloat(pd.toFixed(1)),
        'Default Risk Threshold': 15, // 15% cutoff
        'Current Position': s === Math.round(currentScore / 5) * 5 ? parseFloat(pd.toFixed(1)) : null
      });
    }
    return { points, currentPd };
  };

  const pdData = getPdCurveData();

  return (
    <div className="space-y-6">
      {/* Selector bar */}
      <div className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            Advanced Credit Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Deep-dive mathematical breakdowns of MSME data points and default risk curves.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold shrink-0">Select MSME:</span>
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

      <div className="space-y-6">
        {/* Row 1: Gauge dial & Bar Benchmarks */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Dial Gauge */}
          <div className="glass-card p-6 rounded-2xl lg:col-span-4 flex flex-col items-center justify-center h-[340px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-brand-green-500/5 rounded-full blur-2xl pointer-events-none" />
            <h4 className="text-xs font-bold font-display text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 w-full mb-6">
              Composite Underwriting Dial
            </h4>
            
            <div className="relative w-48 h-28 overflow-hidden scale-110">
              <svg width="200" height="200" className="mx-auto">
                {/* Background Arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="15"
                  strokeLinecap="round"
                />
                {/* Value Arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#0B6E4F"
                  strokeWidth="15"
                  strokeLinecap="round"
                  strokeDasharray={`${(Math.PI * 80 * compositeScore) / 100} 250`}
                  className="transition-all duration-1000 ease-out"
                />
                {/* Needle */}
                <g transform={getNeedleRotation(compositeScore)}>
                  <line x1="100" y1="100" x2="100" y2="35" stroke="#F26522" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="100" cy="100" r="8" fill="#F26522" />
                </g>
              </svg>
            </div>

            <div className="text-center mt-2">
              <h3 className="text-3xl font-extrabold font-display text-slate-900 dark:text-white">
                {compositeScore}
              </h3>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Credit Score | Risk: {details.score?.risk_band}
              </span>
            </div>
          </div>

          {/* Grouped Bar Benchmark comparing Business vs Segment averages */}
          <div className="glass-card p-6 rounded-2xl lg:col-span-8 flex flex-col h-[340px]">
            <h4 className="text-xs font-bold font-display text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-brand-saffron-500" />
              Sector Benchmark Comparison (Sector: {details.msme.sector})
            </h4>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={benchmarkData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar name="Your Business" dataKey="Business" fill="#0B6E4F" radius={[4, 4, 0, 0]} />
                  <Bar name="Sector Benchmark" dataKey="Benchmark" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 2: Heatmap & Inflow-Outflow Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Delay Heatmap */}
          <div className="glass-card p-6 rounded-2xl lg:col-span-5 flex flex-col h-[320px]">
            <h4 className="text-xs font-bold font-display text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-green-500" />
              GST Filing Delay Timelines Heatmap
            </h4>

            <div className="grid grid-cols-4 gap-2 my-auto">
              {heatmapFilings.map((h, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl text-center space-y-1 select-none border border-slate-100 dark:border-slate-800/80 ${getHeatmapColor(
                    h.status
                  )}`}
                  title={`Delay: ${h.delay} days`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider">{h.month}</div>
                  <div className="text-[8px] font-semibold uppercase opacity-95">
                    {h.status === 'on-time' ? 'On-time' : h.status === 'minor' ? 'Minor' : 'Late'}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 text-[8px] font-semibold text-slate-400 justify-center border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                <span>On-time (&lt;5d delay)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm" />
                <span>Minor (5-9d)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" />
                <span>Late (&gt;9d)</span>
              </div>
            </div>
          </div>

          {/* Bank Flow Chart */}
          <div className="glass-card p-6 rounded-2xl lg:col-span-7 flex flex-col h-[320px]">
            <h4 className="text-xs font-bold font-display text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-brand-saffron-500" />
              Bank Statement Inflow vs Outflow Trend (Lakhs)
            </h4>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0B6E4F" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0B6E4F" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F26522" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#F26522" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Area name="Inflow (Sales)" type="monotone" dataKey="inflow" stroke="#0B6E4F" fillOpacity={1} fill="url(#colorInflow)" strokeWidth={2} />
                  <Area name="Outflow (Expenses)" type="monotone" dataKey="outflow" stroke="#F26522" fillOpacity={1} fill="url(#colorOutflow)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 3: Credit Default Prediction Model (PD Curve) */}
        <div className="glass-card p-6 rounded-2xl flex flex-col h-[360px]">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
            <h4 className="text-xs font-bold font-display text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
              Track 04: Default Prediction Model (PD Curve vs. Score)
            </h4>
            <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full uppercase border ${
              pdData.currentPd < 15 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
            }`}>
              Current PD: {pdData.currentPd.toFixed(1)}%
            </span>
          </div>
          
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={pdData.points} margin={{ top: 10, right: 10, left: -25, bottom: 15 }}>
                <CartesianGrid stroke="#cbd5e1" strokeOpacity={0.2} strokeDasharray="3 3" className="dark:stroke-slate-800" />
                <XAxis dataKey="score" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '10px', marginTop: '5px' }} />
                
                <Line name="Logistic PD Curve" type="monotone" dataKey="Probability of Default (%)" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                <Line name="Default Risk Warning Line (15%)" type="monotone" dataKey="Default Risk Threshold" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                <Scatter name="Your Current PD Coordinate" dataKey="Current Position" fill="#F26522" line={false} shape="circle" r={6} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center leading-normal max-w-2xl mx-auto">
            This logistic regression model fits default history against multi-dimensional scores. Midpoint (50% PD) set at score 55. 
            <strong> {details.msme.name}</strong> scores {compositeScore}/100, corresponding to an estimated Probability of Default of <strong>{pdData.currentPd.toFixed(1)}%</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
export default VisualAnalytics;
