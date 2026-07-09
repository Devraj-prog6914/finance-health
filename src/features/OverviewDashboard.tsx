import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from 'recharts';
import { Users, TrendingUp, AlertTriangle, ShieldCheck, ArrowRight, UserPlus, Sparkles, Building, BarChart2, Bell, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MSME } from '../types';

interface OverviewDashboardProps {
  msmes: MSME[];
  onOnboardClick: () => void;
  onSelectMSME: (id: string) => void;
}

interface AlertItem {
  id: string;
  type: 'Warning' | 'Opportunity' | 'Alert' | 'Info';
  message: string;
  msme_name: string;
  time: string;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  msmes,
  onOnboardClick,
  onSelectMSME,
}) => {
  const [feedTab, setFeedTab] = useState<'pipeline' | 'insights'>('pipeline');

  // Aggregate Metrics
  const totalMSMEs = msmes.length;
  
  const scoredMsmes = msmes.filter(m => m.score);
  const avgScore = scoredMsmes.length > 0 
    ? Math.round(scoredMsmes.reduce((sum, m) => sum + (m.score?.composite_score || 0), 0) / scoredMsmes.length)
    : 0;

  // Risk distribution
  const lowRiskCount = msmes.filter(m => m.score?.risk_band === 'Low').length;
  const medRiskCount = msmes.filter(m => m.score?.risk_band === 'Medium').length;
  const highRiskCount = msmes.filter(m => m.score?.risk_band === 'High').length;

  const riskData = [
    { name: 'Low Risk', value: lowRiskCount, color: '#0B6E4F' },
    { name: 'Medium Risk', value: medRiskCount, color: '#F26522' },
    { name: 'High Risk', value: highRiskCount, color: '#ef4444' },
  ];

  // NTC (New to Credit) vs NTB (New to Bank)
  const ntcCount = msmes.filter((_, idx) => idx % 2 === 0).length;
  const ntbCount = totalMSMEs - ntcCount;

  // Sector count aggregation
  const sectors = ['Retail', 'Manufacturing', 'Services', 'Logistics', 'Food'];
  const sectorData = sectors.map(sec => ({
    sector: sec,
    MSMEs: msmes.filter(m => m.sector === sec).length,
    AverageScore: Math.round(
      msmes.filter(m => m.sector === sec && m.score)
        .reduce((sum, m) => sum + (m.score?.composite_score || 0), 0) / 
      (msmes.filter(m => m.sector === sec && m.score).length || 1)
    )
  }));

  // Sparkline data
  const sparklineData = [
    { value: 40 }, { value: 45 }, { value: 58 }, { value: 52 }, { value: 68 }, { value: 74 }, { value: 80 }
  ];

  // Monthly onboarding trend (Credit-Invisible to Active)
  const monthlyTrendData = [
    { month: 'Jan', Active: 5, Invisible: 24 },
    { month: 'Feb', Active: 8, Invisible: 21 },
    { month: 'Mar', Active: 12, Invisible: 18 },
    { month: 'Apr', Active: 15, Invisible: 15 },
    { month: 'May', Active: 19, Invisible: 12 },
    { month: 'Jun', Active: 23, Invisible: 9 },
    { month: 'Jul', Active: totalMSMEs, Invisible: 5 },
  ];

  // Recent applications (first 5)
  const recentMsmes = [...msmes].slice(-5).reverse();

  // AI Alerts and Insights Feed mock
  const aiAlerts: AlertItem[] = [
    {
      id: "a1",
      type: "Warning",
      msme_name: "Sai Ram Electronic Retailers",
      message: "Cash Flow Alert: Average balance dropped 25% this month, increasing overdraft limit utilization to 88%.",
      time: "2 Hours ago"
    },
    {
      id: "a2",
      type: "Opportunity",
      msme_name: "Ganesh Sweets & Namkeen",
      message: "Limit Opportunity: Pre-approved smart cash credit eligibility increased by INR 5L due to perfect GSTR-3B filings.",
      time: "4 Hours ago"
    },
    {
      id: "a3",
      type: "Alert",
      msme_name: "Krishna Agro Industries",
      message: "Compliance Alert: EPFO employer payroll payments skipped for the second consecutive month.",
      time: "1 Day ago"
    },
    {
      id: "a4",
      type: "Info",
      msme_name: "Vardhaman Textiles & Garments",
      message: "Sync complete: Consent active. Land registry matched via RBI ULI sandbox console.",
      time: "1 Day ago"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Upper Hero Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-card p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-green-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="z-10">
          <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            Bank Officer Portfolio Summary
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics and tracking of credit-invisible MSMEs transitioning into digital credit lines.
          </p>
        </div>
        <button
          onClick={onOnboardClick}
          className="px-4 py-2.5 bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 shrink-0 z-10"
        >
          <UserPlus className="w-4.5 h-4.5" />
          Onboard New MSME
        </button>
      </div>

      {/* Complex Telemetry Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/40 dark:bg-slate-900/40 border border-slate-200/30 dark:border-slate-800/30 backdrop-blur-md p-3 rounded-2xl text-[10px] font-mono text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 px-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Ingestion Hub: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">ONLINE (128 kb/s)</strong></span>
        </div>
        <div className="flex items-center gap-2 px-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-saffron-500 animate-pulse-uli" />
          <span>ULI Sandbox: <strong className="text-brand-saffron-650 dark:text-brand-saffron-400 font-bold">ACTIVE</strong></span>
        </div>
        <div className="flex items-center gap-2 px-1">
          <span>API Latency: <strong className="text-slate-700 dark:text-slate-350 font-bold">14 ms</strong></span>
        </div>
        <div className="flex items-center gap-2 px-1">
          <span>Decisions Loaded: <strong className="text-brand-green-600 dark:text-brand-green-400 font-bold">SYNCED</strong></span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total MSMEs */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32 transition-all hover:-translate-y-0.5 hover:border-brand-green-500/20 dark:hover:border-brand-green-500/30">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Onboarded MSMEs
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-brand-green-600 dark:text-brand-green-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-3xl font-bold font-display text-slate-900 dark:text-white">
              {totalMSMEs}
            </h3>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              +14% MoM
            </span>
          </div>
          <div className="w-full h-6 shrink-0 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <Area type="monotone" dataKey="value" stroke="#0B6E4F" fill="none" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Average Health Score */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32 transition-all hover:-translate-y-0.5 hover:border-brand-green-500/20 dark:hover:border-brand-green-500/30">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Average Credit Score
            </span>
            <div className="w-7 h-7 rounded-lg bg-brand-green-50 dark:bg-brand-green-950/20 text-brand-green-600 dark:text-brand-green-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-3xl font-bold font-display text-slate-900 dark:text-white">
              {avgScore}
            </h3>
            <span className="text-[10px] text-brand-green-600 font-bold bg-brand-green-50 dark:bg-brand-green-950/40 px-2 py-0.5 rounded-full">
              Stable
            </span>
          </div>
          <div className="w-full h-6 shrink-0 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <Area type="monotone" dataKey="value" stroke="#0B6E4F" fill="none" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: NTC vs NTB Split */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32 transition-all hover:-translate-y-0.5 hover:border-brand-green-500/20 dark:hover:border-brand-green-500/30">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              New-to-Credit Split
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div>
              <h3 className="text-2xl font-bold font-display text-slate-900 dark:text-white inline-block">
                {ntcCount}
              </h3>
              <span className="text-xs text-slate-400 font-semibold ml-1">NTC</span>
              <span className="text-slate-300 dark:text-slate-700 mx-2">/</span>
              <h3 className="text-2xl font-bold font-display text-slate-900 dark:text-white inline-block">
                {ntbCount}
              </h3>
              <span className="text-xs text-slate-400 font-semibold ml-1">NTB</span>
            </div>
          </div>
          <div className="text-[9px] text-slate-400 font-semibold mt-1">
            NTC represents {Math.round((ntcCount / totalMSMEs) * 100)}% of the total cohort.
          </div>
        </div>

        {/* Card 4: Under Review (Decision State) */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32 transition-all hover:-translate-y-0.5 hover:border-brand-green-500/20 dark:hover:border-brand-green-500/30">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Approval Funnel Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-brand-saffron-600 dark:text-brand-saffron-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-3xl font-bold font-display text-slate-900 dark:text-white">
              {Math.round((msmes.filter(m => m.rmAction?.decision === 'Approved').length / totalMSMEs) * 100)}%
            </h3>
            <span className="text-[10px] text-brand-saffron-600 font-bold flex items-center gap-0.5">
              +5% this month
            </span>
          </div>
          <div className="text-[9px] text-slate-400 font-semibold mt-1">
            Total approved lines: {msmes.filter(m => m.rmAction?.decision === 'Approved').length} / {totalMSMEs}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution Donut */}
        <div className="glass-card p-5 rounded-2xl lg:col-span-4 flex flex-col h-[320px]">
          <h4 className="text-xs font-bold font-display text-slate-850 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-brand-green-500" />
            Portfolio Risk Allocation
          </h4>
          <div className="flex-1 min-h-0 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Summary */}
            <div className="absolute text-center">
              <span className="text-[10px] text-slate-450 uppercase font-semibold">Average</span>
              <div className="text-2xl font-bold font-display text-slate-800 dark:text-white">{avgScore}</div>
            </div>
          </div>
          <div className="flex justify-around text-[10px] mt-4 font-semibold text-slate-500">
            {riskData.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                <span>{r.name} ({r.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Trend Area Chart */}
        <div className="glass-card p-5 rounded-2xl lg:col-span-8 flex flex-col h-[320px]">
          <h4 className="text-xs font-bold font-display text-slate-850 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-brand-saffron-500" />
            Credit-Invisible-to-Active Transition Trend
          </h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B6E4F" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#0B6E4F" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInvisible" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Area name="Active MSME Credit Lines" type="monotone" dataKey="Active" stroke="#0B6E4F" fillOpacity={1} fill="url(#colorActive)" strokeWidth={2.5} />
                <Area name="Credit-Invisible MSME Pool" type="monotone" dataKey="Invisible" stroke="#94a3b8" fillOpacity={1} fill="url(#colorInvisible)" strokeWidth={1.5} strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower Row: Sector Breakdown & Recent Logs / Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sector Bar Chart */}
        <div className="glass-card p-5 rounded-2xl lg:col-span-7 flex flex-col h-[320px]">
          <h4 className="text-xs font-bold font-display text-slate-850 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
            Sectoral Penetration & Health Scores
          </h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActiveSec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F26522" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#F26522" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="colorScoreSec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B6E4F" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#0B6E4F" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="sector" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar name="Active Accounts" dataKey="MSMEs" fill="url(#colorActiveSec)" radius={[4, 4, 0, 0]} />
                <Bar name="Avg Credit Score" dataKey="AverageScore" fill="url(#colorScoreSec)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Dual-Tab Feed (Onboarding Pipeline vs AI Insights) */}
        <div className="glass-card p-5 rounded-2xl lg:col-span-5 flex flex-col h-[320px] overflow-hidden">
          {/* Tab Header */}
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
            <div className="flex gap-4 text-xs font-bold font-display uppercase tracking-wider">
              <button
                onClick={() => setFeedTab('pipeline')}
                className={`pb-1 transition-colors ${feedTab === 'pipeline' ? 'border-b-2 border-brand-green-600 text-brand-green-600 dark:text-brand-green-400' : 'text-slate-400 hover:text-slate-650'}`}
              >
                Onboarding
              </button>
              <button
                onClick={() => setFeedTab('insights')}
                className={`pb-1 flex items-center gap-1 transition-colors ${feedTab === 'insights' ? 'border-b-2 border-brand-green-600 text-brand-green-600 dark:text-brand-green-400' : 'text-slate-400 hover:text-slate-650'}`}
              >
                AI Insights Feed
                <Bell className="w-3.5 h-3.5 text-brand-saffron-500 animate-pulse" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <AnimatePresence mode="wait">
              {feedTab === 'pipeline' ? (
                <motion.div
                  key="pipeline"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-3"
                >
                  {recentMsmes.map((item, i) => {
                    const riskColor = item.score?.risk_band === 'Low' ? 'text-brand-green-600 bg-brand-green-50 dark:bg-brand-green-950/20' : item.score?.risk_band === 'Medium' ? 'text-brand-saffron-600 bg-orange-50 dark:bg-orange-950/20' : 'text-rose-600 bg-rose-50 dark:bg-rose-950/20';
                    return (
                      <div
                        key={i}
                        onClick={() => onSelectMSME(item.id)}
                        className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-brand-green-400 dark:hover:border-brand-green-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-all"
                      >
                        <div className="space-y-0.5 max-w-[65%]">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</h5>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">{item.sector} | PAN: {item.PAN}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-bold font-display text-slate-800 dark:text-white">
                              {item.score?.composite_score || 'N/A'}
                            </div>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider block mt-0.5 ${riskColor}`}>
                              {item.score?.risk_band || 'Uncalculated'}
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-3"
                >
                  {aiAlerts.map((alert, i) => {
                    const badgeClass = alert.type === 'Warning' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' :
                                       alert.type === 'Alert' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30' :
                                       alert.type === 'Opportunity' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' :
                                       'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-800';
                    return (
                      <div
                        key={alert.id}
                        className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5 text-xs bg-slate-50/20 dark:bg-slate-900/20"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 dark:text-white truncate max-w-[60%]">{alert.msme_name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase border ${badgeClass}`}>
                            {alert.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                          {alert.message}
                        </p>
                        <div className="text-[9px] text-slate-400 flex justify-between items-center">
                          <span>{alert.time}</span>
                          <button
                            onClick={() => {
                              const matchingMsme = msmes.find(m => m.name === alert.msme_name);
                              if (matchingMsme) {
                                onSelectMSME(matchingMsme.id);
                              }
                            }}
                            className="text-brand-green-600 dark:text-brand-green-400 font-bold hover:underline cursor-pointer"
                          >
                            Inspect File &gt;
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OverviewDashboard;
