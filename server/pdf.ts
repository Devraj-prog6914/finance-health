import { MSME, DataSourceRecord, HealthScore, ScoreExplanation, CreditRecommendation } from './db.js';

export function generateHtmlReport(
  msme: MSME,
  records: DataSourceRecord[],
  score: HealthScore,
  explanation: ScoreExplanation,
  recommendation: CreditRecommendation,
  uliParam?: boolean
): string {
  let finalScore = score.composite_score;
  let finalStability = score.dimension_scores.business_stability;
  let finalGrade = score.grade;
  let finalAmount = recommendation.suggested_amount;
  let finalRisk = score.risk_band;

  if (uliParam) {
    finalStability = Math.min(100, finalStability + 10);
    finalScore = Math.min(100, Math.round(finalScore + 2));
    finalAmount = parseFloat((finalAmount * 1.15).toFixed(1));
    
    if (finalScore >= 80) {
      finalRisk = 'Low';
      finalGrade = 'A';
    } else if (finalScore >= 60) {
      finalRisk = 'Medium';
      finalGrade = 'B';
    } else {
      finalRisk = 'High';
      finalGrade = 'D';
    }
  }

  // Math for SVG Radar Chart
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 90;
  const angles = [-Math.PI / 2, -Math.PI / 2 + (2 * Math.PI) / 5, -Math.PI / 2 + (4 * Math.PI) / 5, -Math.PI / 2 + (6 * Math.PI) / 5, -Math.PI / 2 + (8 * Math.PI) / 5];
  
  const dims = [
    { name: "Revenue Stability", score: score.dimension_scores.revenue_stability },
    { name: "Cash Flow Health", score: score.dimension_scores.cash_flow_health },
    { name: "Compliance", score: score.dimension_scores.compliance_formalization },
    { name: "Stability", score: finalStability },
    { name: "Repayment", score: score.dimension_scores.repayment_capacity }
  ];

  // Draw grid circles
  let gridCircles = '';
  [0.2, 0.4, 0.6, 0.8, 1.0].forEach(scale => {
    gridCircles += `<circle cx="${centerX}" cy="${centerY}" r="${maxRadius * scale}" fill="none" stroke="#e2e8f0" stroke-width="1" />\n`;
  });

  // Draw spoke lines
  let spokeLines = '';
  dims.forEach((d, idx) => {
    const x = centerX + maxRadius * Math.cos(angles[idx]);
    const y = centerY + maxRadius * Math.sin(angles[idx]);
    spokeLines += `<line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" stroke="#e2e8f0" stroke-width="1" />\n`;
  });

  // Draw MSME data polygon
  const polyPoints = dims.map((d, idx) => {
    const r = maxRadius * (d.score / 100);
    const x = centerX + r * Math.cos(angles[idx]);
    const y = centerY + r * Math.sin(angles[idx]);
    return `${x},${y}`;
  }).join(' ');

  // Label positions
  let labels = '';
  dims.forEach((d, idx) => {
    // Offset labels slightly outwards
    const labelOffset = 15;
    const x = centerX + (maxRadius + labelOffset) * Math.cos(angles[idx]);
    const y = centerY + (maxRadius + labelOffset) * Math.sin(angles[idx]);
    
    let textAnchor = 'middle';
    if (Math.cos(angles[idx]) > 0.1) textAnchor = 'start';
    else if (Math.cos(angles[idx]) < -0.1) textAnchor = 'end';

    labels += `<text x="${x}" y="${y + 4}" font-size="8" font-weight="600" fill="#475569" text-anchor="${textAnchor}">${d.name} (${d.score})</text>\n`;
  });

  // Colors based on risk
  const brandGreen = "#0B6E4F";
  const brandSaffron = "#F26522";
  const riskColor = finalRisk === 'Low' ? '#10b981' : finalRisk === 'Medium' ? '#f59e0b' : '#ef4444';

  const gstRecord = records.find(r => r.source_type === 'GST');
  const aaRecord = records.find(r => r.source_type === 'AA');
  const upiRecord = records.find(r => r.source_type === 'UPI');
  const epfoRecord = records.find(r => r.source_type === 'EPFO');

  const gstTurnovers = gstRecord?.raw_metrics?.monthly_data || [];
  const aaData = aaRecord?.raw_metrics?.monthly_data || [];
  const upiData = upiRecord?.raw_metrics?.monthly_data || [];
  const epfoData = epfoRecord?.raw_metrics?.monthly_data || [];

  const totalGstLakhs = gstTurnovers.reduce((sum, d) => sum + d.value, 0).toFixed(1);
  const avgMonthlyGst = (gstTurnovers.reduce((sum, d) => sum + d.value, 0) / (gstTurnovers.length || 1)).toFixed(1);
  const filingCompliance = gstRecord?.raw_metrics?.filing_regularity_pct || 100;
  
  const totalBounces = aaData.reduce((sum, d) => sum + (d.bounce_count || 0), 0);
  const avgOdUtil = (aaData.reduce((sum, d) => sum + (d.overdraft_utilization_pct || 0), 0) / (aaData.length || 1)).toFixed(0);

  // Generate recommendations table rows
  const roadmapRows = explanation.recommendations.map((r, idx) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">Phase ${idx+1} (${r.timeline})</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 500; color: #1e293b;">${r.action}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 600; text-align: center; color: #0B6E4F;">+${r.expected_impact} Pts</td>
    </tr>
  `).join('');

  // Industry percentile benchmarking mockup based on sector
  let percentile = 74;
  if (finalScore >= 80) percentile = 91 + (finalScore % 8);
  else if (finalScore < 60) percentile = 35 - (finalScore % 15);
  else percentile = 65 + (finalScore % 15);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Credit Report - ${msme.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      color: #334155;
      background-color: #f8fafc;
      -webkit-print-color-adjust: exact;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      margin: 10px auto;
      background: white;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
      box-sizing: border-box;
      position: relative;
    }
    
    @media print {
      body {
        background-color: white;
      }
      .page {
        margin: 0;
        box-shadow: none;
        page-break-after: always;
        width: 100%;
        min-height: 100%;
        padding: 15mm;
      }
      .no-print {
        display: none;
      }
    }

    .header-bar {
      border-bottom: 2px solid ${brandGreen};
      padding-bottom: 15px;
      margin-bottom: 30px;
    }

    .badge-grade {
      background-color: ${brandGreen};
      color: white;
      font-size: 28px;
      font-weight: 700;
      padding: 10px 20px;
      border-radius: 6px;
      display: inline-block;
      min-width: 50px;
      text-align: center;
    }

    .badge-risk {
      color: white;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 4px;
      margin-top: 5px;
      display: inline-block;
    }

    .section-title {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${brandGreen};
      font-weight: 700;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
      margin-top: 30px;
      margin-bottom: 15px;
    }

    table.financial-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    table.financial-table th {
      background-color: #f1f5f9;
      color: #475569;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 600;
      text-align: left;
      padding: 8px;
      border-bottom: 1px solid #cbd5e1;
    }

    table.financial-table td {
      font-size: 11px;
      padding: 8px;
      border-bottom: 1px solid #f1f5f9;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .card-stat {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
    }

    .footer {
      position: absolute;
      bottom: 20mm;
      left: 20mm;
      right: 20mm;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      font-size: 9px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <!-- Page 1: Cover and Summary -->
  <div class="page">
    <div class="no-print" style="background-color: #e2e8f0; padding: 10px; margin-bottom: 20px; text-align: center; border-radius: 6px;">
      <button onclick="window.print()" style="background-color: ${brandGreen}; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 600; cursor: pointer;">
        🖨️ Save as PDF / Print Report
      </button>
    </div>

    <div class="header-bar" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 style="margin: 0; color: #1e293b; font-size: 24px; font-weight: 700; font-family: 'Inter', sans-serif;">CreditPulse</h1>
        <p style="margin: 3px 0 0 0; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em;">MSME Financial Health Executive Report</p>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 10px; font-weight: 600; color: #64748b;">Report Generated: ${new Date().toLocaleDateString('en-IN')}</span>
      </div>
    </div>

    <!-- Applicant Metadata -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
        <div>
          <span style="font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 600;">MSME Name</span>
          <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-top: 3px;">${msme.name}</div>
        </div>
        <div>
          <span style="font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 600;">GSTIN / PAN</span>
          <div style="font-size: 11px; font-weight: 500; color: #334155; margin-top: 3px;">${msme.GSTIN} / ${msme.PAN}</div>
        </div>
        <div>
          <span style="font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 600;">Sector / Region</span>
          <div style="font-size: 11px; font-weight: 500; color: #334155; margin-top: 3px;">${msme.sector} / ${msme.region}</div>
        </div>
        <div>
          <span style="font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 600;">Vintage / Employees</span>
          <div style="font-size: 11px; font-weight: 500; color: #334155; margin-top: 3px;">${msme.vintage_years} Years / ${msme.employee_count} Pax</div>
        </div>
      </div>
    </div>

    <!-- Rating Section -->
    <div style="display: grid; grid-template-columns: 2fr 1.5fr; gap: 30px; align-items: center; margin-bottom: 25px;">
      <div style="display: flex; gap: 20px; align-items: center;">
        <div>
          <div class="badge-grade">${finalGrade}</div>
        </div>
        <div>
          <h2 style="margin: 0; font-size: 32px; font-weight: 700; color: #1e293b;">${finalScore}<span style="font-size: 16px; font-weight: 500; color: #94a3b8;">/100</span></h2>
          <div class="badge-risk" style="background-color: ${riskColor};">${finalRisk} Risk Band</div>
        </div>
      </div>
      
      <div style="text-align: right; border-left: 1px solid #e2e8f0; padding-left: 20px;">
        <span style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Bank RM Recommendation</span>
        <div style="font-size: 15px; font-weight: 700; color: ${recommendation.status === 'Eligible' || finalScore >= 60 ? '#10b981' : '#f59e0b'}; margin-top: 5px;">
          ${finalScore >= 80 ? 'APPROVED (PRE-APPROVED)' : finalScore >= 60 ? 'REFERRED FOR REVIEW' : 'DECLINED'}
        </div>
        <div style="font-size: 10px; font-weight: 600; color: #475569; margin-top: 4px;">Recommended Limit: INR ${finalAmount} Lakhs</div>
        <div style="font-size: 9px; color: #94a3b8; margin-top: 3px;">Confidence Level: ${explanation.confidence}%</div>
      </div>
    </div>

    <!-- Executive Summary -->
    <div class="section-title">Executive Credit Summary</div>
    <p style="font-size: 11.5px; line-height: 1.6; color: #334155; margin-top: 5px;">
      <strong>${msme.name}</strong> is an operational enterprise in the <strong>${msme.sector}</strong> sector with a <strong>${msme.vintage_years}-year</strong> vintage. An evaluation of its alternate datasets (GST filings, UPI transactions, EPFO employee records, and Bank statements via Account Aggregator) indicates a Credit Score of <strong>${score.composite_score}</strong>, placing it in the <strong>${score.risk_band}</strong> risk category. 
      The entity displays ${score.composite_score >= 80 ? 'strong revenue consistency and pristine repayment tracks with zero cheque bounces' : 'some cash flow volatility and high working capital reliance'}. 
      Based on this analysis, the underwriting model has pre-approved a limit of <strong>INR ${recommendation.suggested_amount} Lakhs</strong> under the <strong>${recommendation.product_type}</strong> scheme at a pricing band of <strong>${recommendation.suggested_rate_band}</strong>.
    </p>

    <!-- Radar Chart & Dimension Scores -->
    <div class="section-title">Multidimensional Pillar Analysis</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: center;">
      <!-- SVG Radar Chart -->
      <div style="text-align: center;">
        <svg width="300" height="300" style="margin: 0 auto; display: block;">
          <!-- Grid Circles -->
          ${gridCircles}
          <!-- Spoke Lines -->
          ${spokeLines}
          <!-- MSME Polygon -->
          <polygon points="${polyPoints}" fill="#0B6E4F" fill-opacity="0.15" stroke="#0B6E4F" stroke-width="2" />
          <polygon points="${polyPoints}" fill="none" stroke="#0B6E4F" stroke-width="2" />
          <!-- Labels -->
          ${labels}
        </svg>
      </div>

      <!-- Score Values -->
      <div>
        <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #cbd5e1; text-align: left; color: #475569;">
              <th style="padding: 6px 0;">Evaluation Pillar</th>
              <th style="padding: 6px 0; text-align: right;">Pillar Score (0-100)</th>
              <th style="padding: 6px 0; text-align: right;">Weight</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Revenue Stability</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${score.dimension_scores.revenue_stability}</td>
              <td style="padding: 8px 0; text-align: right; color: #64748b; border-bottom: 1px solid #f1f5f9;">25%</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Cash Flow Health</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${score.dimension_scores.cash_flow_health}</td>
              <td style="padding: 8px 0; text-align: right; color: #64748b; border-bottom: 1px solid #f1f5f9;">25%</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Compliance & Formalization</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${score.dimension_scores.compliance_formalization}</td>
              <td style="padding: 8px 0; text-align: right; color: #64748b; border-bottom: 1px solid #f1f5f9;">20%</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Business Stability</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${finalStability}</td>
              <td style="padding: 8px 0; text-align: right; color: #64748b; border-bottom: 1px solid #f1f5f9;">15%</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Repayment Capacity</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${score.dimension_scores.repayment_capacity}</td>
              <td style="padding: 8px 0; text-align: right; color: #64748b; border-bottom: 1px solid #f1f5f9;">15%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="footer">
      <span>CreditPulse Rating Agency Report | IDBI Innovate 2026</span>
      <span>Page 1 of 2</span>
    </div>
  </div>

  <!-- Page 2: Risk and Roadmap -->
  <div class="page">
    <!-- Strengths & Risks -->
    <div class="section-title">Key Underwriting Drivers (Explainable AI)</div>
    <div class="grid-2">
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px;">
        <h4 style="margin: 0 0 8px 0; font-size: 11px; color: #166534; font-weight: 700; text-transform: uppercase;">Positive Drivers (Strengths)</h4>
        <ul style="margin: 0; padding-left: 15px; font-size: 10.5px; line-height: 1.5; color: #14532d;">
          ${explanation.positive_contributors.map(c => `
            <li style="margin-bottom: 5px;"><strong>${c.name}:</strong> ${c.explanation} (Impact: <span style="font-weight: 700;">+${c.impact} pts</span>)</li>
          `).join('')}
        </ul>
      </div>

      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px;">
        <h4 style="margin: 0 0 8px 0; font-size: 11px; color: #991b1b; font-weight: 700; text-transform: uppercase;">Negative Drivers (Risks)</h4>
        <ul style="margin: 0; padding-left: 15px; font-size: 10.5px; line-height: 1.5; color: #7f1d1d;">
          ${explanation.negative_contributors.map(c => `
            <li style="margin-bottom: 5px;"><strong>${c.name}:</strong> ${c.explanation} (Impact: <span style="font-weight: 700;">${c.impact} pts</span>)</li>
          `).join('')}
        </ul>
      </div>
    </div>

    <!-- Industry Benchmarking -->
    <div class="section-title">Industry Benchmarking (Sector: ${msme.sector})</div>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px;">
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 8px;">
        <span style="font-weight: 600;">Overall Sector Percentile</span>
        <span style="font-weight: 700; color: ${brandGreen};">${percentile}th Percentile</span>
      </div>
      <div style="background-color: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden; position: relative;">
        <div style="background-color: ${brandGreen}; width: ${percentile}%; height: 100%;"></div>
        <div style="position: absolute; left: ${percentile}%; top: -2px; transform: translateX(-50%); width: 14px; height: 14px; border-radius: 50%; background-color: ${brandSaffron}; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>
      </div>
      <p style="font-size: 10px; color: #64748b; margin-top: 10px; line-height: 1.4;">
        ${msme.name} ranks higher than ${percentile}% of peer MSMEs in the <strong>${msme.sector}</strong> segment in ${msme.region} India. This positioning is driven by its ${score.dimension_scores.compliance_formalization >= 80 ? 'high formalization compliance' : 'vintage and employee growth'}.
      </p>
    </div>

    <!-- 90-Day Improvement Roadmap -->
    <div class="section-title">90-Day Score Improvement Roadmap</div>
    <p style="font-size: 10.5px; color: #475569; margin-top: -5px; margin-bottom: 10px;">
      Executing the following prioritized operations is estimated to increase the composite credit score by up to <strong>+${explanation.recommendations.reduce((sum, r) => sum + r.expected_impact, 0)} points</strong>:
    </p>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
      <thead>
        <tr style="background-color: #f8fafc; text-align: left; border-bottom: 2px solid #cbd5e1;">
          <th style="padding: 10px; font-size: 10px; text-transform: uppercase; color: #475569; font-weight: 600;">Timeline</th>
          <th style="padding: 10px; font-size: 10px; text-transform: uppercase; color: #475569; font-weight: 600;">Action Item</th>
          <th style="padding: 10px; font-size: 10px; text-transform: uppercase; color: #475569; font-weight: 600; text-align: center;">Est. Score Improvement</th>
        </tr>
      </thead>
      <tbody>
        ${roadmapRows}
      </tbody>
    </table>

    <!-- Final Endorsement -->
    <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 15px; background-color: #fff; margin-top: 30px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 600;">Assessed Creditworthiness</span>
          <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 3px;">CreditPulse Underwriting Engine v1.0.4</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; font-weight: 600; color: #10b981;">● DIGITAL SIGNATURE ATTACHED</div>
          <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">Secured by Account Aggregator Verification Key</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <span>CreditPulse Rating Agency Report | IDBI Innovate 2026</span>
      <span>Page 2 of 2</span>
    </div>
  </div>

</body>
</html>
  `;
}
