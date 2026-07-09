import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { FileDown, Sparkles, AlertTriangle, CheckCircle, Search, SlidersHorizontal, BookOpen, AlertCircle, RefreshCw, Layers, ShieldCheck, MapPin, Loader2, Landmark, X } from 'lucide-react';
import { MSME, FullMSMEDetails } from '../types';
import ExplainabilityCard from '../components/ExplainabilityCard';

interface RMDashboardProps {
  msmes: MSME[];
  onRefresh: () => void;
  onOpenCopilot: (msme: MSME) => void;
  initialSelectedId?: string;
}

export const RMDashboard: React.FC<RMDashboardProps> = ({
  msmes,
  onRefresh,
  onOpenCopilot,
  initialSelectedId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  
  // Selection States
  const [selectedMSME, setSelectedMSME] = useState<MSME | null>(() => {
    if (initialSelectedId) {
      return msmes.find(m => m.id === initialSelectedId) || null;
    }
    return null;
  });

  useEffect(() => {
    if (initialSelectedId) {
      const found = msmes.find(m => m.id === initialSelectedId);
      if (found) {
        setSelectedMSME(found);
      }
    }
  }, [initialSelectedId, msmes]);

  const [activeDetails, setActiveDetails] = useState<FullMSMEDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'GST' | 'AA' | 'EPFO' | 'UPI'>('GST');

  // RBI ULI Integration State (Simulated)
  const [uliStatus, setUliStatus] = useState<'idle' | 'verifying' | 'connected'>('idle');
  const [uliLogs, setUliLogs] = useState<string>('');

  // Compare mode
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Decision inputs
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Explainability card controls
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainMetric, setExplainMetric] = useState('Overall Health Card');
  const [explainScore, setExplainScore] = useState<number | undefined>(undefined);

  // Fetch full details when an MSME is selected
  useEffect(() => {
    if (selectedMSME) {
      fetchMSMEDetails(selectedMSME.id);
      // Reset ULI status when switching MSMEs
      setUliStatus('idle');
      setUliLogs('');
    } else {
      setActiveDetails(null);
    }
  }, [selectedMSME]);

  const fetchMSMEDetails = async (id: string) => {
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`/api/msmes/${id}`);
      const data = await response.json();
      if (response.ok) {
        setActiveDetails(data);
        setDecisionNotes(data.rmAction?.notes || '');
      }
    } catch (err) {
      console.error("Error fetching MSME details:", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSyncData = async () => {
    if (!selectedMSME) return;
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`/api/msmes/${selectedMSME.id}/sync`, { method: 'POST' });
      if (response.ok) {
        await fetchMSMEDetails(selectedMSME.id);
        onRefresh(); // refresh main list
      }
    } catch (err) {
      console.error("Error syncing data:", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleULIVerify = () => {
    setUliStatus('verifying');
    setUliLogs('Pinging RBI ULI Gateway...');
    
    setTimeout(() => {
      setUliLogs('Verifying Bhulekh Land Ownership registry via State API...');
    }, 1000);

    setTimeout(() => {
      setUliLogs('Property identified: Survey No. 402, 2.4 Hectares. Value: INR 35L. Asset verified.');
      setUliStatus('connected');
    }, 2200);
  };

  const submitRMDecision = async (decision: 'Approved' | 'Rejected' | 'Under Review') => {
    if (!selectedMSME) return;
    setIsSubmittingDecision(true);
    try {
      const response = await fetch(`/api/msmes/${selectedMSME.id}/rm-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes: decisionNotes }),
      });
      if (response.ok) {
        await fetchMSMEDetails(selectedMSME.id);
        onRefresh();
      }
    } catch (err) {
      console.error("Error saving decision:", err);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id].slice(0, 3) // cap at 3 profiles
    );
  };

  // Filtered ledger list
  const filteredMsmes = msmes.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.PAN.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sectorFilter === 'All' || m.sector === sectorFilter;
    const matchesRisk = riskFilter === 'All' || m.score?.risk_band === riskFilter;
    return matchesSearch && matchesSector && matchesRisk;
  });

  // Math/Details for Overlay Radar Chart comparison
  const compareMSMEs = msmes.filter(m => compareIds.includes(m.id) && m.score);
  
  const getCompareRadarData = () => {
    const keys = [
      { key: 'revenue_stability', label: 'Revenue Stability' },
      { key: 'cash_flow_health', label: 'Cash Flow' },
      { key: 'compliance_formalization', label: 'Compliance' },
      { key: 'business_stability', label: 'Stability' },
      { key: 'repayment_capacity', label: 'Repayment' },
    ];
    return keys.map(k => {
      const item: any = { subject: k.label };
      compareMSMEs.forEach(m => {
        item[m.name] = (m.score?.dimension_scores as any)[k.key];
      });
      return item;
    });
  };

  const openExplainability = (name: string, val?: number) => {
    setExplainMetric(name);
    setExplainScore(val);
    setExplainOpen(true);
  };

  const getRiskBandBadge = (band?: string) => {
    if (band === 'Low') return 'text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30';
    if (band === 'Medium') return 'text-amber-700 bg-amber-50 border border-amber-200 dark:bg-orange-950/20 dark:border-orange-900/30';
    return 'text-rose-700 bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30';
  };

  // Dynamically recalculate details based on ULI connection state
  const getDynamicScore = () => {
    if (!activeDetails || !activeDetails.score) return { score: 0, grade: 'C', stability: 0 };
    const originalScore = activeDetails.score.composite_score;
    const originalStability = activeDetails.score.dimension_scores.business_stability;

    if (uliStatus !== 'connected') {
      return {
        score: originalScore,
        grade: activeDetails.score.grade,
        stability: originalStability
      };
    }

    const newStability = Math.min(100, originalStability + 10);
    // Recalculate composite: stability is 15% weight, adding 10 stability points adds +1.5 points to composite
    const newScore = Math.min(100, Math.round(originalScore + 2));
    
    let newGrade = 'B';
    if (newScore >= 90) newGrade = 'A+';
    else if (newScore >= 80) newGrade = 'A';
    else if (newScore >= 70) newGrade = 'B';
    else if (newScore >= 60) newGrade = 'C';
    else newGrade = 'D';

    return {
      score: newScore,
      grade: newGrade,
      stability: newStability
    };
  };

  const dynamicStats = getDynamicScore();

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-[280px]">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search MSME by trade name or PAN..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <select
            value={sectorFilter}
            onChange={e => setSectorFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl focus:outline-none"
          >
            <option value="All" className="dark:bg-slate-800">All Sectors</option>
            <option value="Retail" className="dark:bg-slate-800">Retail</option>
            <option value="Manufacturing" className="dark:bg-slate-800">Manufacturing</option>
            <option value="Services" className="dark:bg-slate-800">Services</option>
            <option value="Logistics" className="dark:bg-slate-800">Logistics</option>
            <option value="Food" className="dark:bg-slate-800">Food</option>
          </select>

          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl focus:outline-none"
          >
            <option value="All" className="dark:bg-slate-800">All Risks</option>
            <option value="Low" className="dark:bg-slate-800">Low Risk</option>
            <option value="Medium" className="dark:bg-slate-800">Medium Risk</option>
            <option value="High" className="dark:bg-slate-800">High Risk</option>
          </select>

          {compareIds.length > 0 && (
            <button
              onClick={() => setIsCompareOpen(true)}
              className="px-4 py-2 bg-brand-saffron-500 hover:bg-brand-saffron-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 animate-pulse-uli"
            >
              <Layers className="w-3.5 h-3.5" />
              Compare ({compareIds.length})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: MSME Ledger list */}
        <div className="lg:col-span-5 glass-card overflow-hidden flex flex-col min-h-[480px]">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-900/10">
            <h3 className="text-xs font-bold font-display text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              MSME Credit Ledger
            </h3>
          </div>
          <div className="overflow-y-auto flex-1 max-h-[600px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/20 dark:bg-slate-900/10">
                  <th className="px-4 py-3 text-center">Compare</th>
                  <th className="px-4 py-3">Trade Name / Sector</th>
                  <th className="px-4 py-3 text-center">Score</th>
                  <th className="px-4 py-3 text-center">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-105 dark:divide-slate-800/80">
                {filteredMsmes.map((m) => {
                  const isSelected = selectedMSME?.id === m.id;
                  const isCompareChecked = compareIds.includes(m.id);
                  const decision = m.rmAction?.decision || 'Pending';
                  
                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-all cursor-pointer ${
                        isSelected ? 'bg-brand-green-50/20 dark:bg-brand-green-950/10 border-l-4 border-l-brand-green-600' : ''
                      }`}
                      onClick={() => setSelectedMSME(m)}
                    >
                      <td
                        className="px-4 py-3 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompare(m.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isCompareChecked}
                          readOnly
                          className="w-3.5 h-3.5 text-brand-green-600 border-slate-350 dark:border-slate-700 rounded focus:ring-brand-green-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white leading-snug">{m.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{m.sector} • PAN: {m.PAN}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-bold font-display text-slate-800 dark:text-white text-sm">
                          {m.score?.composite_score || 'N/A'}
                        </div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider inline-block mt-0.5 ${getRiskBandBadge(m.score?.risk_band)}`}>
                          {m.score?.risk_band || 'Uncalculated'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase inline-block ${
                          decision === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                          decision === 'Rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450' :
                          decision === 'Under Review' ? 'bg-orange-50 text-amber-700 dark:bg-orange-950/20 dark:text-orange-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {decision}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Single Credit File Drilldown */}
        <div className="lg:col-span-7 glass-card min-h-[480px]">
          {!selectedMSME ? (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[480px]">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-800 mb-3" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display uppercase tracking-wider">Select a Credit File</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                Click on any applicant MSME on the ledger to drill down into alternate datasets, indicators, and AI approvals.
              </p>
            </div>
          ) : isLoadingDetails || !activeDetails ? (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[480px]">
              <Loader2 className="w-8 h-8 text-brand-green-600 animate-spin mb-3" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Retrieving Connected Data...</h4>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Header Title */}
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h4 className="text-base font-bold font-display text-slate-900 dark:text-white leading-tight">{activeDetails.msme.name}</h4>
                  <p className="text-[10px] text-slate-405 font-semibold uppercase mt-0.5">
                    GSTIN: {activeDetails.msme.GSTIN} | Vintage: {activeDetails.msme.vintage_years} Years
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSyncData}
                    className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl transition-all shadow-xs"
                    title="Sync Sources"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={`/api/msmes/${activeDetails.msme.id}/report`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-brand-green-600 hover:bg-brand-green-700 text-white rounded-xl transition-all shadow-md shadow-brand-green-500/10 flex items-center gap-1.5 text-[10px] font-bold"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Report PDF
                  </a>
                </div>
              </div>

              {/* Score Display Row */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Composite Credit Score
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <h2 className="text-4xl font-extrabold font-display text-slate-900 dark:text-white">
                      {dynamicStats.score}
                    </h2>
                    <span className="text-xs text-slate-400">/100</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-1.5 inline-block ${getRiskBandBadge(activeDetails.score?.risk_band)}`}>
                    {activeDetails.score?.risk_band} Risk
                  </span>
                </div>
                
                <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-6">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Assessed Credit Grade
                  </span>
                  <div className="text-4xl font-extrabold font-display text-brand-green-600 dark:text-brand-green-400 mt-0.5">
                    {dynamicStats.grade}
                  </div>
                  <button
                    onClick={() => openExplainability("Overall Health Card")}
                    className="text-[10px] text-brand-saffron-500 hover:underline font-semibold block mt-1"
                  >
                    Explain Score &gt;
                  </button>
                </div>
              </div>

              {/* Radar spokes and links */}
              {activeDetails.score && (
                <div className="space-y-3">
                  <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider block">
                    Pillar Breakdown (Click spoke for detail)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <button
                      onClick={() => openExplainability("Revenue Stability Pillar", activeDetails.score?.dimension_scores.revenue_stability)}
                      className="p-3 border border-slate-200 hover:border-brand-green-400 dark:border-slate-800 dark:hover:border-brand-green-500 bg-slate-50/20 dark:bg-slate-900/30 rounded-xl text-left transition-all"
                    >
                      <span className="text-[9px] text-slate-400 block font-medium">Revenue Stability</span>
                      <span className="text-sm font-bold font-display text-slate-800 dark:text-white mt-1 block">
                        {activeDetails.score.dimension_scores.revenue_stability}/100
                      </span>
                    </button>
                    <button
                      onClick={() => openExplainability("Cash Flow Health Pillar", activeDetails.score?.dimension_scores.cash_flow_health)}
                      className="p-3 border border-slate-200 hover:border-brand-green-400 dark:border-slate-800 dark:hover:border-brand-green-500 bg-slate-50/20 dark:bg-slate-900/30 rounded-xl text-left transition-all"
                    >
                      <span className="text-[9px] text-slate-400 block font-medium">Cash Flow Health</span>
                      <span className="text-sm font-bold font-display text-slate-800 dark:text-white mt-1 block">
                        {activeDetails.score.dimension_scores.cash_flow_health}/100
                      </span>
                    </button>
                    <button
                      onClick={() => openExplainability("Compliance & Formalization Pillar", activeDetails.score?.dimension_scores.compliance_formalization)}
                      className="p-3 border border-slate-200 hover:border-brand-green-400 dark:border-slate-800 dark:hover:border-brand-green-500 bg-slate-50/20 dark:bg-slate-900/30 rounded-xl text-left transition-all"
                    >
                      <span className="text-[9px] text-slate-400 block font-medium">Compliance</span>
                      <span className="text-sm font-bold font-display text-slate-800 dark:text-white mt-1 block">
                        {activeDetails.score.dimension_scores.compliance_formalization}/100
                      </span>
                    </button>
                    <button
                      onClick={() => openExplainability("Business Stability Pillar", dynamicStats.stability)}
                      className="p-3 border border-slate-200 hover:border-brand-green-400 dark:border-slate-800 dark:hover:border-brand-green-500 bg-slate-50/20 dark:bg-slate-900/30 rounded-xl text-left transition-all"
                    >
                      <span className="text-[9px] text-slate-400 block font-medium">Business Stability</span>
                      <span className="text-sm font-bold font-display text-slate-800 dark:text-white mt-1 block">
                        {dynamicStats.stability}/100
                      </span>
                    </button>
                    <button
                      onClick={() => openExplainability("Repayment Capacity Pillar", activeDetails.score?.dimension_scores.repayment_capacity)}
                      className="p-3 border border-slate-200 hover:border-brand-green-400 dark:border-slate-800 dark:hover:border-brand-green-500 bg-slate-50/20 dark:bg-slate-900/30 rounded-xl text-left transition-all"
                    >
                      <span className="text-[9px] text-slate-400 block font-medium">Repayment Capacity</span>
                      <span className="text-sm font-bold font-display text-slate-800 dark:text-white mt-1 block">
                        {activeDetails.score.dimension_scores.repayment_capacity}/100
                      </span>
                    </button>
                    <button
                      onClick={() => onOpenCopilot(activeDetails.msme)}
                      className="p-3 border border-brand-saffron-100 hover:border-brand-saffron-300 dark:border-brand-saffron-900 bg-orange-50/10 dark:bg-orange-950/10 rounded-xl text-left transition-all flex flex-col justify-between"
                    >
                      <span className="text-[9px] text-brand-saffron-500 font-bold uppercase tracking-wider block">Ask Copilot AI</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 block flex items-center gap-1">
                        CFO Chat <Sparkles className="w-3.5 h-3.5 text-brand-saffron-500 animate-pulse" />
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Data Sources Tabs */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-850 pt-4">
                <div className="flex border-b border-slate-100 dark:border-slate-850 text-[10px] font-semibold uppercase">
                  {(['GST', 'AA', 'EPFO', 'UPI'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-2 px-4 transition-colors ${
                        activeTab === tab
                          ? 'border-b-2 border-brand-green-600 text-brand-green-600 dark:text-brand-green-400'
                          : 'text-slate-400 hover:text-slate-650'
                      }`}
                    >
                      {tab} Data
                    </button>
                  ))}
                </div>

                {/* Tab content renders dynamic Recharts data */}
                <div className="h-44">
                  {activeTab === 'GST' && (
                    <div className="space-y-2 h-full">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>GSTIN GSTR-3B filings (Last 12 Mo)</span>
                        <span>Filing Consistency: {activeDetails.records.find(r => r.source_type === 'GST')?.raw_metrics.filing_regularity_pct}%</span>
                      </div>
                      <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={activeDetails.records.find(r => r.source_type === 'GST')?.raw_metrics.monthly_data}>
                          <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                          <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                          <Tooltip contentStyle={{ fontSize: '10px' }} />
                          <Area type="monotone" dataKey="value" stroke="#0B6E4F" fill="#0B6E4F" fillOpacity={0.15} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {activeTab === 'AA' && (
                    <div className="space-y-2 h-full">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Consented Accounts Bank Flow</span>
                        <span className="text-rose-500 font-semibold">
                          Bounces: {activeDetails.records.find(r => r.source_type === 'AA')?.raw_metrics.monthly_data.reduce((sum: number, d: any) => sum + d.bounce_count, 0)}
                        </span>
                      </div>
                      <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={activeDetails.records.find(r => r.source_type === 'AA')?.raw_metrics.monthly_data}>
                          <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                          <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                          <Tooltip contentStyle={{ fontSize: '10px' }} />
                          <Area name="Average Balance" type="monotone" dataKey="value" stroke="#0B6E4F" fill="#0B6E4F" fillOpacity={0.1} strokeWidth={1.5} />
                          <Area name="Inflow" type="monotone" dataKey="inflow" stroke="#F26522" fill="none" strokeWidth={1.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {activeTab === 'EPFO' && (
                    <div className="space-y-2 h-full">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Active EPFO headcount registry</span>
                        <span>Consistency: {activeDetails.records.find(r => r.source_type === 'EPFO')?.raw_metrics.payroll_consistency_pct}%</span>
                      </div>
                      <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={activeDetails.records.find(r => r.source_type === 'EPFO')?.raw_metrics.monthly_data}>
                          <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                          <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                          <Tooltip contentStyle={{ fontSize: '10px' }} />
                          <Area name="Registered Employees" type="stepAfter" dataKey="value" stroke="#0B6E4F" fill="#0B6E4F" fillOpacity={0.15} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {activeTab === 'UPI' && (
                    <div className="space-y-2 h-full">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>UPI Merchant transaction volumes (Lakhs)</span>
                        <span>Active QR Nodes: {activeDetails.records.find(r => r.source_type === 'UPI')?.raw_metrics.active_qr_count}</span>
                      </div>
                      <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={activeDetails.records.find(r => r.source_type === 'UPI')?.raw_metrics.monthly_data}>
                          <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                          <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                          <Tooltip contentStyle={{ fontSize: '10px' }} />
                          <Area type="monotone" dataKey="value" stroke="#F26522" fill="#F26522" fillOpacity={0.1} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* RBI ULI Integration Section */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-850 pt-4 p-4 bg-orange-50/15 border border-brand-saffron-100/30 rounded-2xl">
                <div className="flex items-center gap-1.5 text-brand-saffron-700 dark:text-brand-saffron-450 font-bold text-xs uppercase tracking-wide">
                  <Landmark className="w-4 h-4" />
                  RBI Unified Lending Interface (ULI) Sandbox
                </div>
                
                {uliStatus === 'idle' && (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <p className="text-[10px] text-slate-450 leading-relaxed max-w-[340px]">
                      Trigger simulated pull of land holdings and digital property registries to enhance collateral-free scoring under RBI guidelines.
                    </p>
                    <button
                      onClick={handleULIVerify}
                      className="px-3.5 py-2 bg-brand-saffron-500 hover:bg-brand-saffron-600 text-white rounded-xl text-[10px] font-bold shadow-md shrink-0 self-end sm:self-auto"
                    >
                      Verify Land Records via ULI
                    </button>
                  </div>
                )}

                {uliStatus === 'verifying' && (
                  <div className="flex items-center gap-3 py-2 text-xs text-brand-saffron-600 dark:text-brand-saffron-400 font-semibold font-mono animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{uliLogs}</span>
                  </div>
                )}

                {uliStatus === 'connected' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                      <CheckCircle className="w-4 h-4" />
                      <span>Registry Verified (ULI-402-BHULEKH)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-500 bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-orange-200/20">
                      <div>
                        <span className="font-semibold block text-slate-400 uppercase">Property Extracted</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-0.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          Survey No. 402, 2.4 Hectares
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold block text-slate-400 uppercase">Assessed Valuation</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">INR 35.0 Lakhs</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wider animate-pulse">
                      ★ stability Pillar boosted by +10 points | Composite score +2 points!
                    </p>
                  </div>
                )}
              </div>

              {/* Recommendation and Decision Box */}
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-2xl">
                <div className="flex items-center gap-1.5 text-brand-green-600 dark:text-brand-green-400 font-bold text-xs uppercase tracking-wide">
                  <AlertCircle className="w-4.5 h-4.5 text-brand-saffron-500" />
                  AI Lending Recommendation
                </div>
                {activeDetails.recommendation && (
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-405 block font-medium">Lending Status</span>
                      <span className={`font-bold ${
                        activeDetails.recommendation.status === 'Eligible' || dynamicStats.score >= 60 ? 'text-brand-green-600 dark:text-brand-green-400' : 'text-orange-500'
                      }`}>
                        {dynamicStats.score >= 80 ? 'Eligible (Pre-Approved)' : dynamicStats.score >= 60 ? 'Borderline (RM Review)' : 'Ineligible'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-405 block font-medium">Pre-approved Amount</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        INR {uliStatus === 'connected' ? (activeDetails.recommendation.suggested_amount * 1.15).toFixed(1) : activeDetails.recommendation.suggested_amount} Lakhs
                      </span>
                    </div>
                  </div>
                )}

                {/* RM Workflow Form */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider">
                    Relationship Manager Action Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter approval review commentary or credit covenant terms..."
                    value={decisionNotes}
                    onChange={e => setDecisionNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitRMDecision('Approved')}
                      disabled={isSubmittingDecision}
                      className="px-3.5 py-2 bg-brand-green-600 hover:bg-brand-green-700 text-white rounded-xl font-bold text-xs shadow-md"
                    >
                      Approve Credit
                    </button>
                    <button
                      onClick={() => submitRMDecision('Under Review')}
                      disabled={isSubmittingDecision}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-md"
                    >
                      Under Review
                    </button>
                    <button
                      onClick={() => submitRMDecision('Rejected')}
                      disabled={isSubmittingDecision}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md"
                    >
                      Reject File
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Select Comparison Modal */}
      {isCompareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4.5 h-4.5 text-brand-saffron-500" />
                Credit Comparative Overlay ({compareMSMEs.length} MSMEs)
              </h3>
              <button
                onClick={() => setIsCompareOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Radar Chart Overlay */}
              <div className="md:col-span-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getCompareRadarData()}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 600, fill: '#475569' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                    {compareMSMEs.map((m, idx) => {
                      const colors = ['#0B6E4F', '#F26522', '#3b82f6'];
                      return (
                        <Radar
                          key={m.id}
                          name={m.name}
                          dataKey={m.name}
                          stroke={colors[idx % colors.length]}
                          fill={colors[idx % colors.length]}
                          fillOpacity={0.15}
                        />
                      );
                    })}
                    <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Stats Grid Comparison */}
              <div className="md:col-span-6 space-y-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-450 font-semibold uppercase">
                      <th className="pb-2">Metric</th>
                      {compareMSMEs.map(m => (
                        <th key={m.id} className="pb-2 text-right truncate max-w-[120px]" title={m.name}>
                          {m.name.split(' ')[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="py-2 font-medium">Credit Score</td>
                      {compareMSMEs.map(m => (
                        <td key={m.id} className="py-2 text-right font-bold text-slate-900 dark:text-white">
                          {m.score?.composite_score}/100
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Credit Grade</td>
                      {compareMSMEs.map(m => (
                        <td key={m.id} className="py-2 text-right font-bold text-brand-green-600 dark:text-brand-green-400">
                          {m.score?.grade}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Suggested Amount</td>
                      {compareMSMEs.map(m => (
                        <td key={m.id} className="py-2 text-right text-slate-700 dark:text-slate-300">
                          {m.recommendation ? `INR ${m.recommendation.suggested_amount}L` : 'N/A'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Interest Rate</td>
                      {compareMSMEs.map(m => (
                        <td key={m.id} className="py-2 text-right text-slate-700 dark:text-slate-300">
                          {m.recommendation?.suggested_rate_band}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Vintage Years</td>
                      {compareMSMEs.map(m => (
                        <td key={m.id} className="py-2 text-right text-slate-700 dark:text-slate-300">
                          {m.vintage_years} Yrs
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Embedded Components */}
      <ExplainabilityCard
        isOpen={explainOpen}
        onClose={() => setExplainOpen(false)}
        explanation={activeDetails?.explanation || null}
        metricName={explainMetric}
        metricScore={explainScore}
      />
    </div>
  );
};
export default RMDashboard;
