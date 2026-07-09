import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, HelpCircle, ArrowUpRight, TrendingUp } from 'lucide-react';
import { ScoreExplanation } from '../types';

interface ExplainabilityCardProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: ScoreExplanation | null;
  metricName: string;
  metricScore?: number;
}

export const ExplainabilityCard: React.FC<ExplainabilityCardProps> = ({
  isOpen,
  onClose,
  explanation,
  metricName,
  metricScore,
}) => {
  if (!isOpen || !explanation) return null;

  // Filter contributors based on clicked metric if relevant
  // For overall summary, we display everything.
  const filterContributors = (list: any[]) => {
    if (metricName === "Overall Health Card") return list;
    const term = metricName.split(' ')[0].toLowerCase(); // e.g., "Revenue", "Cash", "Compliance"
    return list.filter(c => c.name.toLowerCase().includes(term) || c.explanation.toLowerCase().includes(term));
  };

  const positives = filterContributors(explanation.positive_contributors);
  const negatives = filterContributors(explanation.negative_contributors);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl overflow-hidden bg-white border border-slate-200 shadow-2xl rounded-2xl dark:bg-slate-900 dark:border-slate-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider text-brand-green-600 dark:text-brand-green-400 uppercase">
                  Explainable AI
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-full">
                  Confidence: {explanation.confidence}%
                </span>
              </div>
              <h3 className="mt-1 text-xl font-bold font-display text-slate-900 dark:text-white">
                {metricName} Analysis
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
            {/* Metric Score Indicator */}
            {metricScore !== undefined && (
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Current Score Pillar Rating</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-display text-brand-green-600 dark:text-brand-green-400">
                    {metricScore}
                  </span>
                  <span className="text-sm text-slate-400">/100</span>
                </div>
              </div>
            )}

            {/* Drivers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Positive Contributors */}
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-sm uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                  Positive Drivers
                </div>
                {positives.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No significant positive drivers flagged for this dimension.</p>
                ) : (
                  <div className="space-y-3">
                    {positives.map((item, i) => (
                      <div key={i} className="text-xs">
                        <div className="flex items-center justify-between font-semibold text-emerald-900 dark:text-emerald-300">
                          <span>{item.name}</span>
                          <span className="font-bold">+{item.impact} pts</span>
                        </div>
                        <p className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed">
                          {item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Negative Contributors */}
              <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400 font-bold text-sm uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-500" />
                  Risk Factors
                </div>
                {negatives.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No major credit risk factors flagged for this dimension.</p>
                ) : (
                  <div className="space-y-3">
                    {negatives.map((item, i) => (
                      <div key={i} className="text-xs">
                        <div className="flex items-center justify-between font-semibold text-rose-950 dark:text-rose-300">
                          <span>{item.name}</span>
                          <span className="font-bold">{item.impact} pts</span>
                        </div>
                        <p className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed">
                          {item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actionable Recommendations */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold font-display text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-brand-saffron-500" />
                CFO Corrective Action Roadmap
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/30 dark:bg-slate-900/20">
                {explanation.recommendations.map((rec, i) => (
                  <div key={i} className="p-4 flex justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                        {rec.action}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold uppercase">
                        <span>Target: {rec.timeline}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 justify-center">
                      <span className="text-brand-green-600 dark:text-brand-green-400 font-bold flex items-center gap-0.5 text-sm">
                        +{rec.expected_impact}
                        <span className="text-[10px] font-normal text-slate-400">pts</span>
                      </span>
                      <span className="text-[9px] text-slate-400">Est. Impact</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-brand-green-600 text-white hover:bg-brand-green-700 dark:bg-brand-green-700 dark:hover:bg-brand-green-800 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              Acknowledge & Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default ExplainabilityCard;
