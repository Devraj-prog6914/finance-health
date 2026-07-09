import { MSME, DataSourceRecord, HealthScore, ScoreExplanation, CreditRecommendation, RMAction } from './db.js';

// Weight configuration
export const SCORE_WEIGHTS = {
  revenue_stability: 0.25,
  cash_flow_health: 0.25,
  compliance_formalization: 0.20,
  business_stability: 0.15,
  repayment_capacity: 0.15,
};

// Calculate scoring details for an MSME
export function computeMSMEScore(
  msme: MSME,
  records: DataSourceRecord[]
): {
  score: HealthScore;
  explanation: ScoreExplanation;
  recommendation: CreditRecommendation;
} {
  const gstRecord = records.find(r => r.msme_id === msme.id && r.source_type === 'GST');
  const upiRecord = records.find(r => r.msme_id === msme.id && r.source_type === 'UPI');
  const aaRecord = records.find(r => r.msme_id === msme.id && r.source_type === 'AA');
  const epfoRecord = records.find(r => r.msme_id === msme.id && r.source_type === 'EPFO');

  // Indicators available counter
  let parsedSignals = 0;
  let totalSignals = 8;
  if (gstRecord) parsedSignals += 2;
  if (upiRecord) parsedSignals += 2;
  if (aaRecord) parsedSignals += 2;
  if (epfoRecord) parsedSignals += 2;
  const confidence = Math.round((parsedSignals / totalSignals) * 100);

  // ----------------------------------------------------
  // 1. Revenue Stability (25% Weight)
  // ----------------------------------------------------
  let revScore = 70; // baseline
  let revVolScore = 70;
  let revGrowthScore = 70;
  const positive_contributors: ScoreExplanation['positive_contributors'] = [];
  const negative_contributors: ScoreExplanation['negative_contributors'] = [];
  const strengths: string[] = [];
  const risks: string[] = [];

  if (gstRecord && gstRecord.raw_metrics.monthly_data) {
    const data = gstRecord.raw_metrics.monthly_data;
    const values = data.map(d => d.value);
    
    // Growth: compare last 3 months average to first 3 months average
    const first3Avg = (values[0] + values[1] + values[2]) / 3;
    const last3Avg = (values[9] + values[10] + values[11]) / 3;
    const growthRate = first3Avg > 0 ? (last3Avg - first3Avg) / first3Avg : 0;
    
    // Normalization growth (-30% to +30% -> 0 to 100)
    revGrowthScore = Math.max(10, Math.min(100, Math.round(50 + growthRate * 100)));

    // Volatility: standard deviation / mean
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0; // coefficient of variation

    // Normalization cv (0 to 0.5 -> 100 to 0)
    revVolScore = Math.max(10, Math.min(100, Math.round(100 - cv * 150)));

    revScore = Math.round(revGrowthScore * 0.4 + revVolScore * 0.6);

    if (growthRate > 0.08) {
      positive_contributors.push({
        name: "Revenue Growth Trend",
        impact: Math.round(growthRate * 15),
        explanation: `Strong upward turnover trend of +${Math.round(growthRate * 100)}% over 12 months.`
      });
      strengths.push("Consistent year-over-year revenue expansion");
    } else if (growthRate < -0.1) {
      negative_contributors.push({
        name: "Declining Revenue Trend",
        impact: Math.round(growthRate * 15),
        explanation: `Revenue declined by ${Math.round(Math.abs(growthRate) * 100)}% comparing recent months.`
      });
      risks.push("Short-term contraction in monthly revenues");
    }

    if (cv < 0.15) {
      positive_contributors.push({
        name: "Low Turnover Volatility",
        impact: 8,
        explanation: "Extremely stable monthly GST filings with low seasonality."
      });
      strengths.push("Stable and highly predictable billing patterns");
    } else if (cv > 0.35) {
      negative_contributors.push({
        name: "High Turnover Volatility",
        impact: -10,
        explanation: "Highly cyclical or volatile monthly billings."
      });
      risks.push("Susceptible to seasonality and market cash crunches");
    }
  }

  // ----------------------------------------------------
  // 2. Cash Flow Health (25% Weight)
  // ----------------------------------------------------
  let cashScore = 65; // baseline
  let inflowOutflowScore = 60;
  let odUtilScore = 70;
  let bounceScore = 100;

  if (aaRecord && aaRecord.raw_metrics.monthly_data) {
    const data = aaRecord.raw_metrics.monthly_data;
    
    // Inflow / Outflow ratio
    const totalInflow = data.reduce((sum, d) => sum + (d.inflow || 0), 0);
    const totalOutflow = data.reduce((sum, d) => sum + (d.outflow || 0), 0);
    const ioRatio = totalOutflow > 0 ? totalInflow / totalOutflow : 1.0;
    
    // Normalization ratio (0.9 to 1.3 -> 0 to 100)
    inflowOutflowScore = Math.max(10, Math.min(100, Math.round(((ioRatio - 0.9) / 0.4) * 100)));

    // OD utilization
    const avgODUtil = data.reduce((sum, d) => sum + (d.overdraft_utilization_pct || 0), 0) / data.length;
    odUtilScore = Math.max(0, 100 - avgODUtil);

    // Bounces
    const totalBounces = data.reduce((sum, d) => sum + (d.bounce_count || 0), 0);
    bounceScore = Math.max(0, 100 - totalBounces * 15);

    cashScore = Math.round(inflowOutflowScore * 0.3 + odUtilScore * 0.3 + bounceScore * 0.4);

    if (totalBounces === 0) {
      positive_contributors.push({
        name: "Zero Cheque/ECS Bounces",
        impact: 10,
        explanation: "Perfect bank repayment discipline with no transactions bounced in 12 months."
      });
      strengths.push("Excellent banking hygiene with zero bounce flags");
    } else {
      negative_contributors.push({
        name: "Cheque/ECS Bounces Recorded",
        impact: -Math.min(30, totalBounces * 10),
        explanation: `Found ${totalBounces} payment bounce(s) in Bank Account Aggregator records.`
      });
      risks.push(`Recent bank payment bounces indicate cash shortages`);
    }

    if (avgODUtil > 75) {
      negative_contributors.push({
        name: "High Overdraft Utilization",
        impact: -8,
        explanation: `Overdraft facility utilization averages ${Math.round(avgODUtil)}%, leaving minimal emergency buffer.`
      });
      risks.push("Constantly stretched working capital lines");
    } else if (avgODUtil < 25 && aaRecord.raw_metrics.overdraft_limit_lakhs > 0) {
      positive_contributors.push({
        name: "Healthy Working Capital Buffer",
        impact: 6,
        explanation: "Keeps average overdraft utilization below 25%."
      });
      strengths.push("Under-utilized credit lines (strong cash buffer)");
    }
  }

  // ----------------------------------------------------
  // 3. Compliance & Formalization (20% Weight)
  // ----------------------------------------------------
  let compScore = 70; // baseline
  if (gstRecord && epfoRecord) {
    const gstReg = gstRecord.raw_metrics.filing_regularity_pct || 90;
    const epfoReg = epfoRecord.raw_metrics.payroll_consistency_pct || 90;

    // Calculate delay impact from GST
    const monthlyData = gstRecord.raw_metrics.monthly_data;
    const avgDelay = monthlyData.reduce((sum, d) => sum + (d.filed_delay_days || 0), 0) / monthlyData.length;
    const delayScore = Math.max(0, 100 - avgDelay * 4);

    compScore = Math.round(gstReg * 0.3 + epfoReg * 0.3 + delayScore * 0.4);

    if (gstReg >= 95 && avgDelay < 3) {
      positive_contributors.push({
        name: "Punctual GST Filings",
        impact: 7,
        explanation: `GST GSTR-3B filings are submitted with a minimal average delay of ${avgDelay.toFixed(1)} days.`
      });
      strengths.push("Impeccable GST compliance history");
    } else if (avgDelay > 10) {
      negative_contributors.push({
        name: "GST Filing Delays",
        impact: -9,
        explanation: `Significant GST delays averaging ${avgDelay.toFixed(1)} days late.`
      });
      risks.push("GST filing non-compliance flags");
    }

    if (epfoReg >= 95) {
      positive_contributors.push({
        name: "Consistent EPFO Contribution",
        impact: 5,
        explanation: "100% payroll compliance indicating organized business operations."
      });
    } else if (epfoReg < 70) {
      negative_contributors.push({
        name: "Volatile Payroll Records",
        impact: -6,
        explanation: "Irregular employer EPFO filings indicating labor/liquidity struggles."
      });
      risks.push("EPFO payment irregularity");
    }
  }

  // ----------------------------------------------------
  // 4. Business Stability (15% Weight)
  // ----------------------------------------------------
  let stabilityScore = 50; // baseline
  const vintageScore = Math.min(100, msme.vintage_years * 10); // 10 years = 100

  let empTrendScore = 70;
  if (epfoRecord && epfoRecord.raw_metrics.monthly_data) {
    const epfData = epfoRecord.raw_metrics.monthly_data;
    const startEmp = epfData[0]?.value || msme.employee_count;
    const endEmp = epfData[epfData.length - 1]?.value || msme.employee_count;
    const empChange = endEmp - startEmp;
    
    // growth score mapping
    empTrendScore = Math.max(20, Math.min(100, 70 + empChange * 5));
  }

  stabilityScore = Math.round(vintageScore * 0.6 + empTrendScore * 0.4);

  if (msme.vintage_years >= 8) {
    positive_contributors.push({
      name: "Established Business Vintage",
      impact: 8,
      explanation: `Operational for ${msme.vintage_years} years, surviving cycles and displaying long-term maturity.`
    });
    strengths.push(`Proven vintage of ${msme.vintage_years} years`);
  } else if (msme.vintage_years < 3) {
    negative_contributors.push({
      name: "Early-Stage Business Vintage",
      impact: -5,
      explanation: "Less than 3 years of operations increases default risk."
    });
    risks.push("Young operational track record");
  }

  // ----------------------------------------------------
  // 5. Repayment Capacity (15% Weight)
  // ----------------------------------------------------
  let repayScore = 60; // baseline
  if (aaRecord && aaRecord.raw_metrics.monthly_data) {
    const data = aaRecord.raw_metrics.monthly_data;
    
    // Average Monthly Inflow
    const avgMonthlyInflow = data.reduce((sum, d) => sum + (d.inflow || 0), 0) / data.length;
    // Average Monthly Outflow
    const avgMonthlyOutflow = data.reduce((sum, d) => sum + (d.outflow || 0), 0) / data.length;
    const surplus = avgMonthlyInflow - avgMonthlyOutflow;
    const surplusRatio = avgMonthlyInflow > 0 ? surplus / avgMonthlyInflow : 0.05;

    const surplusScore = Math.max(10, Math.min(100, Math.round(surplusRatio * 400))); // 20% surplus = 80 score

    // Debt servicing
    const emi = aaRecord.raw_metrics.emi_obligations_lakhs || 0;
    const debtToSurplus = surplus > 0 ? emi / surplus : 1.5;
    
    // normalise emi burden (higher emi compared to surplus = lower score)
    const emiScore = Math.max(10, Math.min(100, Math.round(100 - debtToSurplus * 50)));

    repayScore = Math.round(surplusScore * 0.5 + emiScore * 0.5);

    if (surplusRatio > 0.15) {
      positive_contributors.push({
        name: "Healthy Cash Surplus",
        impact: 6,
        explanation: `Maintains a disposable cash flow surplus of ${Math.round(surplusRatio * 100)}% over expenses.`
      });
      strengths.push("Strong operating margins with surplus reserve");
    } else if (surplusRatio < 0.05) {
      negative_contributors.push({
        name: "Tight Operating Margin",
        impact: -10,
        explanation: "Highly squeezed margins with minimal free cash reserves."
      });
      risks.push("Thin margins make cash flow vulnerable to interruptions");
    }

    if (emi > 0 && debtToSurplus > 0.6) {
      negative_contributors.push({
        name: "High Existing Debt Burden",
        impact: -8,
        explanation: `Existing EMI commitments utilize ${Math.round(debtToSurplus * 100)}% of net operating surplus.`
      });
      risks.push("High leverage reduces capacity for additional debt");
    }
  }

  // ----------------------------------------------------
  // Composite Calculation
  // ----------------------------------------------------
  const composite_score = Math.round(
    revScore * SCORE_WEIGHTS.revenue_stability +
    cashScore * SCORE_WEIGHTS.cash_flow_health +
    compScore * SCORE_WEIGHTS.compliance_formalization +
    stabilityScore * SCORE_WEIGHTS.business_stability +
    repayScore * SCORE_WEIGHTS.repayment_capacity
  );

  // Grade mapping
  let grade = 'B';
  if (composite_score >= 90) grade = 'A+';
  else if (composite_score >= 80) grade = 'A';
  else if (composite_score >= 70) grade = 'B';
  else if (composite_score >= 60) grade = 'C';
  else grade = 'D';

  // Risk Band mapping
  let risk_band: 'Low' | 'Medium' | 'High' = 'Medium';
  if (composite_score >= 80) risk_band = 'Low';
  else if (composite_score >= 60) risk_band = 'Medium';
  else risk_band = 'High';

  const scoreObj: HealthScore = {
    id: `score-${msme.id}`,
    msme_id: msme.id,
    composite_score,
    grade,
    risk_band,
    dimension_scores: {
      revenue_stability: revScore,
      cash_flow_health: cashScore,
      compliance_formalization: compScore,
      business_stability: stabilityScore,
      repayment_capacity: repayScore,
    },
    computed_at: new Date().toISOString(),
  };

  // Generate actionable, point-quantified recommendations
  const recommendations: ScoreExplanation['recommendations'] = [];
  
  if (cashScore < 75) {
    if (aaRecord && aaRecord.raw_metrics.monthly_data.some(d => (d.bounce_count || 0) > 0)) {
      recommendations.push({
        action: "Establish automated auto-debit triggers 2 days prior to EMIs to avoid banking bounces",
        expected_impact: 12,
        timeline: "30 Days"
      });
    }
    recommendations.push({
      action: "De-leverage active overdraft limit below 50% utilization to restore working capital buffer",
      expected_impact: 8,
      timeline: "60 Days"
    });
  }

  if (compScore < 80) {
    recommendations.push({
      action: "Automate GST filing submission by GSTR-3B deadline via GSTN API integration",
      expected_impact: 6,
      timeline: "30 Days"
    });
  }

  if (repayScore < 70) {
    recommendations.push({
      action: "Restructure short-term high-interest credit lines into structured 36-month term loans",
      expected_impact: 10,
      timeline: "90 Days"
    });
  }

  // Fallback recommendations if scores are already high
  if (recommendations.length === 0) {
    recommendations.push({
      action: "Pre-pay high-cost outstanding short-term equipment finance early to release collateral",
      expected_impact: 3,
      timeline: "90 Days"
    });
    recommendations.push({
      action: "Add secondary banking accounts to Account Aggregator to consolidate overall deposit footprint",
      expected_impact: 2,
      timeline: "30 Days"
    });
  }

  const explanationObj: ScoreExplanation = {
    score_id: scoreObj.id,
    confidence,
    strengths: strengths.slice(0, 3),
    risks: risks.slice(0, 3),
    positive_contributors: positive_contributors.slice(0, 4),
    negative_contributors: negative_contributors.slice(0, 4),
    recommendations,
  };

  // Credit Recommendations
  // Suggested Amount: Manufacturing (15-60L), Retail/Food (5-20L), Services (3-15L)
  let baseAmount = 15;
  if (msme.sector === 'Manufacturing') baseAmount = 45;
  else if (msme.sector === 'Logistics') baseAmount = 30;
  else if (msme.sector === 'Services') baseAmount = 10;

  // Modify by score performance
  const multiplier = composite_score / 75;
  let suggested_amount = parseFloat((baseAmount * multiplier).toFixed(1));

  let status: CreditRecommendation['status'] = 'Borderline';
  let suggested_rate_band = '11.5% - 13.0%';
  if (composite_score >= 80) {
    status = 'Eligible';
    suggested_rate_band = '9.2% - 10.8%';
  } else if (composite_score < 60) {
    status = 'Ineligible';
    suggested_amount = 0;
    suggested_rate_band = 'N/A';
  }

  const recObj: CreditRecommendation = {
    msme_id: msme.id,
    product_type: msme.sector === 'Manufacturing' ? "IDBI Prime Machinery Term Loan" : "IDBI MSME Smart Cash Credit",
    suggested_amount,
    suggested_rate_band,
    status,
  };

  return {
    score: scoreObj,
    explanation: explanationObj,
    recommendation: recObj,
  };
}
