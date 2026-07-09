import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, FileText, CheckCircle2, RefreshCw, KeyRound, Check, HelpCircle, Loader2, Landmark, Building2, UserPlus, Database, AlertCircle, Sparkles } from 'lucide-react';
import { MSME } from '../types';

interface OnboardingConsentProps {
  onOnboarded: (msme: MSME) => void;
  onCancel: () => void;
}

export const OnboardingConsent: React.FC<OnboardingConsentProps> = ({ onOnboarded, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    name: '',
    PAN: '',
    GSTIN: '',
    sector: 'Manufacturing' as MSME['sector'],
    region: 'North' as MSME['region'],
    vintage_years: 5,
    employee_count: 12,
    compliance_level: 'excellent' as 'excellent' | 'volatile' | 'poor',
  });

  const [consents, setConsents] = useState({
    GSTN: true,
    AA: true,
    EPFO: true,
    UPI: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulated syncing logs
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('');

  const generateMockCredentials = () => {
    if (formData.name.trim() === '') return;
    const nameWords = formData.name.toUpperCase().replace(/[^A-Z ]/g, '').split(' ');
    const firstWord = nameWords[0] || 'MSME';
    const panNum = Math.floor(1000 + Math.random() * 9000);
    const mockPAN = `AAAP${firstWord.substring(0, 2)}${panNum}G`.padEnd(10, 'X').substring(0, 10);
    const stateCode = "27"; // Maharashtra
    const mockGST = `${stateCode}${mockPAN}1Z2`;
    
    setFormData(prev => ({
      ...prev,
      PAN: mockPAN,
      GSTIN: mockGST,
    }));
  };

  const handleConsentToggle = (source: keyof typeof consents) => {
    setConsents(prev => ({ ...prev, [source]: !prev[source] }));
  };

  const startOnboardingSync = async () => {
    if (!formData.name || !formData.PAN || !formData.GSTIN) {
      setError("Please input MSME Trade Name and click 'Generate Mocks' to create credit IDs.");
      return;
    }
    setError(null);
    setStep(2);
    setIsLoading(true);
    
    const logs = [
      'Establishing secure SSL/TLS connection to GSTN Gateway...',
      'Validating GSTR-3B filings (Months M1-M12)... OK',
      'Contacting Sahamati Account Aggregator Node...',
      'Retrieving 12-month transaction flows from primary bank... OK',
      'Scanning employee pension registries via EPFO API...',
      'Computing monthly payroll compliance ratios... OK',
      'Syncing merchant payment invoices via UPI QR logs... OK',
      'Normalizing datasets into multi-dimensional pillars...',
      'Finalizing CreditPulse Composite Rating Engine Score...'
    ];

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    
    for (let i = 0; i < logs.length; i++) {
      setCurrentStatus(logs[i]);
      setSyncLogs(prev => [...prev, logs[i]]);
      await sleep(650);
    }

    try {
      const response = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setIsLoading(false);
        setStep(3);
        setTimeout(() => {
          onOnboarded(data.msme);
        }, 1800);
      } else {
        throw new Error(data.error || "Onboarding failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to onboard MSME. Please try again.");
      setStep(1);
      setIsLoading(false);
      setSyncLogs([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto glass-card rounded-3xl p-6 relative overflow-hidden transition-all duration-300">
      {/* Title block */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-brand-green-600 dark:text-brand-green-500" />
            Digital Consent Onboarding Portal
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            DEPA framework compliant digital ingestion. Safe-key credential synchronization. Zero paperwork.
          </p>
        </div>
        <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full uppercase border border-emerald-500/20 shrink-0">
          ★ IDBI Secure
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Split panel details */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Left Column: Form Info */}
              <div className="md:col-span-6 space-y-4">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  MSME Business Parameters
                </span>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                      MSME Trade Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Balaji Provision Stores"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green-500"
                    />
                  </div>

                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        PAN
                      </label>
                      <input
                        type="text"
                        placeholder="Simulated PAN"
                        readOnly
                        value={formData.PAN}
                        className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={generateMockCredentials}
                        disabled={formData.name.trim() === ''}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 font-bold text-xs rounded-xl disabled:opacity-40 transition-all text-slate-700 dark:text-slate-200 flex items-center gap-1 shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Generate Credentials
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      placeholder="Simulated GSTIN"
                      readOnly
                      value={formData.GSTIN}
                      className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Sector
                      </label>
                      <select
                        value={formData.sector}
                        onChange={e => setFormData({ ...formData, sector: e.target.value as MSME['sector'] })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl focus:outline-none"
                      >
                        <option value="Retail">Retail Trade</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Services">Services</option>
                        <option value="Logistics">Logistics</option>
                        <option value="Food">Food / Beverage</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Region
                      </label>
                      <select
                        value={formData.region}
                        onChange={e => setFormData({ ...formData, region: e.target.value as MSME['region'] })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl focus:outline-none"
                      >
                        <option value="North">North India</option>
                        <option value="South">South India</option>
                        <option value="East">East India</option>
                        <option value="West">West India</option>
                        <option value="Central">Central India</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Vintage (Years)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={formData.vintage_years}
                        onChange={e => setFormData({ ...formData, vintage_years: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Employees count
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={formData.employee_count}
                        onChange={e => setFormData({ ...formData, employee_count: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                      Simulated Risk Category
                    </label>
                    <select
                      value={formData.compliance_level}
                      onChange={e => setFormData({ ...formData, compliance_level: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-950 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green-500"
                    >
                      <option value="excellent">Low Risk (Pristine Cash Flows / Regular GST filings)</option>
                      <option value="volatile">Medium Risk (Volatile monthly cash flows / Minor GST delays)</option>
                      <option value="poor">High Risk (Declining volumes / Bank bounces / High OD usage)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: DEPA Consents */}
              <div className="md:col-span-6 space-y-4">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Data Pipeline Authorizations
                </span>

                <div className="space-y-3">
                  {/* GSTN */}
                  <div
                    onClick={() => handleConsentToggle('GSTN')}
                    className={`p-3 border rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                      consents.GSTN
                        ? 'border-brand-green-500 bg-brand-green-50/10 dark:bg-brand-green-950/15'
                        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${consents.GSTN ? 'bg-brand-green-600/10 text-brand-green-600' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">GSTN Filings Connector</h5>
                        <p className="text-[10px] text-slate-400">Pulls GSTR-3B filing compliance & monthly sales turnover logs.</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      consents.GSTN ? 'bg-brand-green-600 border-brand-green-600 text-white' : 'border-slate-300'
                    }`}>
                      {consents.GSTN && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </div>

                  {/* AA */}
                  <div
                    onClick={() => handleConsentToggle('AA')}
                    className={`p-3 border rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                      consents.AA
                        ? 'border-brand-green-500 bg-brand-green-50/10 dark:bg-brand-green-950/15'
                        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${consents.AA ? 'bg-brand-green-600/10 text-brand-green-600' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">Account Aggregator Portal</h5>
                        <p className="text-[10px] text-slate-400">Consents banking flows, inflows, outflows, and OD limits.</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      consents.AA ? 'bg-brand-green-600 border-brand-green-600 text-white' : 'border-slate-300'
                    }`}>
                      {consents.AA && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </div>

                  {/* EPFO */}
                  <div
                    onClick={() => handleConsentToggle('EPFO')}
                    className={`p-3 border rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                      consents.EPFO
                        ? 'border-brand-green-500 bg-brand-green-50/10 dark:bg-brand-green-950/15'
                        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${consents.EPFO ? 'bg-brand-green-600/10 text-brand-green-600' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                        <Landmark className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">EPFO Employer Registry</h5>
                        <p className="text-[10px] text-slate-400">Checks active headcounts and payroll contribution logs.</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      consents.EPFO ? 'bg-brand-green-600 border-brand-green-600 text-white' : 'border-slate-300'
                    }`}>
                      {consents.EPFO && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </div>

                  {/* UPI */}
                  <div
                    onClick={() => handleConsentToggle('UPI')}
                    className={`p-3 border rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                      consents.UPI
                        ? 'border-brand-green-500 bg-brand-green-50/10 dark:bg-brand-green-950/15'
                        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${consents.UPI ? 'bg-brand-green-600/10 text-brand-green-600' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">UPI QR Payments Connect</h5>
                        <p className="text-[10px] text-slate-400">Syncs merchant payment receipts and QR node consistency.</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      consents.UPI ? 'bg-brand-green-600 border-brand-green-600 text-white' : 'border-slate-300'
                    }`}>
                      {consents.UPI && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 p-3.5 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455 text-xs font-semibold rounded-xl border border-rose-200/25">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Bottom Controls */}
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onCancel}
                className="px-4.5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={startOnboardingSync}
                className="px-5 py-2.5 bg-brand-green-600 hover:bg-brand-green-700 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg shadow-brand-green-500/10 flex items-center gap-1.5"
              >
                Initiate Connect & Score
                <Sparkles className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-10 space-y-6"
          >
            <div className="relative">
              <Loader2 className="w-12 h-12 text-brand-green-600 dark:text-brand-green-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center font-display font-black text-xs text-brand-green-600">
                ⚡
              </div>
            </div>

            <div className="text-center w-full max-w-md">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Authorizing Digital consent pipelines</h4>
              <p className="text-[11px] text-slate-450 mt-1 uppercase font-semibold tracking-wider">
                Connecting under DEPA secure architecture
              </p>
            </div>

            {/* Logs console */}
            <div className="w-full max-w-xl bg-slate-950 border border-slate-800 p-4 rounded-2xl font-mono text-[10px] text-emerald-450 space-y-1 max-h-40 overflow-y-auto leading-relaxed shadow-inner">
              {syncLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-slate-600 select-none">[{new Date().toLocaleTimeString()}]</span>
                  <span>{log}</span>
                </div>
              ))}
              <div className="animate-pulse text-slate-500">&gt; Calculating credit profiles...</div>
            </div>

            <div className="w-64 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-brand-green-600 rounded-full animate-[shimmer_2s_infinite] w-[65%]" />
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 space-y-5 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-md">
              <Check className="w-8 h-8 stroke-[3px]" />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-base font-bold font-display text-slate-900 dark:text-white">Sync Completed Successfully</h4>
              <p className="text-xs text-slate-450 max-w-[280px] mx-auto">
                Consented data pipelines verified, credit health indicators initialized, and profile loaded to Relationship ledger.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 grid grid-cols-2 gap-x-8 gap-y-1 text-left text-xs max-w-sm w-full shadow-inner">
              <div className="text-slate-400">Trade ID Saved:</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 text-right">{formData.PAN}</div>
              <div className="text-slate-400">filing compliance:</div>
              <div className="font-bold text-brand-green-600 dark:text-brand-green-400 text-right">VERIFIED</div>
              <div className="text-slate-400">Bank Statement:</div>
              <div className="font-bold text-brand-green-600 dark:text-brand-green-400 text-right">SYNCED</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default OnboardingConsent;
